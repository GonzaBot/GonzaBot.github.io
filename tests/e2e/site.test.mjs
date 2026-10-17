// Pruebas de caja negra: se usa el sitio como lo haría una persona, sin mirar el código.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launch, open, fillLead } from '../helpers/browser.mjs';

let server, browser;
before(async () => { server = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); server.srv.close(); });

test('carga sin errores y con el idioma del navegador', async () => {
  for (const [locale, word, lang] of [['es-UY', 'Pedir presupuesto', 'es'], ['pt-BR', 'Pedir orçamento', 'pt'], ['en-US', 'Get a quote', 'en'], ['de-DE', 'Pedir presupuesto', 'es']]) {
    const p = await open(browser, server.url, { locale });
    assert.equal(await p.getAttribute('html', 'lang'), lang, locale);
    assert.equal((await p.textContent('.top__cta')).trim(), word);
    assert.deepEqual(p.errors, []);
    await p.context().close();
  }
});

test('cambiar idioma traduce todo, actualiza la URL y se recuerda', async () => {
  const p = await open(browser, server.url);
  await p.click('.lang__b[data-lang="pt"]');
  assert.equal(await p.getAttribute('html', 'lang'), 'pt');
  assert.match(p.url(), /\?lang=pt/);
  assert.equal(await p.textContent('#services-title'), 'O que posso resolver na sua empresa');
  assert.equal(await p.getAttribute('.lang__b[data-lang="pt"]', 'aria-pressed'), 'true');
  assert.match(await p.title(), /Servidores, desenvolvimento/);
  const untranslated = await p.$$eval('[data-i18n]', els => els.filter(e => !e.textContent.trim()).length);
  assert.equal(untranslated, 0);
  await p.goto(server.url + '/');
  assert.equal(await p.getAttribute('html', 'lang'), 'pt', 'se recuerda');
  await p.goto(server.url + '/?lang=en');
  assert.equal(await p.getAttribute('html', 'lang'), 'en', 'la URL manda');
  await p.context().close();
});

test('tema claro/oscuro: alterna y persiste', async () => {
  const p = await open(browser, server.url, { colorScheme: 'light' });
  const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await p.click('#themeBtn');
  assert.equal(await p.getAttribute('html', 'data-theme'), 'dark');
  assert.notEqual(await bg(), light);
  await p.reload();
  assert.equal(await p.getAttribute('html', 'data-theme'), 'dark');
  await p.click('#themeBtn');
  assert.equal(await p.getAttribute('html', 'data-theme'), 'light');
  await p.context().close();
});

test('respeta el modo oscuro del sistema sin elección guardada', async () => {
  const p = await open(browser, server.url, { colorScheme: 'dark' });
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(bg, 'rgb(11, 18, 32)');
  await p.context().close();
});

test('secciones dinámicas completas', async () => {
  const p = await open(browser, server.url);
  assert.equal(await p.locator('.svc').count(), 6);
  assert.equal(await p.locator('.layer').count(), 5);
  assert.equal(await p.locator('.devcard').count(), 3);
  assert.equal(await p.locator('.proj').count(), 15);
  assert.equal(await p.locator('#timeline li').count(), 8);
  assert.equal(await p.locator('#stats div').count(), 4);
  assert.ok(await p.locator('#certs li').count() >= 10);
  await p.context().close();
});

test('capas del servidor: clic y teclado (flechas, Inicio, Fin)', async () => {
  const p = await open(browser, server.url);
  await p.click('#tab-access');
  assert.equal(await p.getAttribute('#tab-access', 'aria-selected'), 'true');
  assert.match(await p.textContent('#layerPanel h3'), /Acceso seguro/);
  await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'tab-apps');
  await p.keyboard.press('End');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'tab-watch');
  await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'tab-edge', 'vuelve al inicio');
  await p.keyboard.press('ArrowUp');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'tab-watch');
  await p.keyboard.press('Home');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'tab-edge');
  assert.equal(await p.locator('.layer[tabindex="0"]').count(), 1, 'roving tabindex');
  await p.context().close();
});

test('filtros de proyectos', async () => {
  const p = await open(browser, server.url);
  const counts = {};
  for (const f of ['servers', 'dev', 'sec', 'auto', 'net', 'all']) {
    await p.click(`.chip[data-filter="${f}"]`);
    counts[f] = await p.locator('.proj').count();
    assert.equal(await p.getAttribute(`.chip[data-filter="${f}"]`, 'aria-pressed'), 'true');
    assert.ok(counts[f] > 0, f);
  }
  assert.equal(counts.all, 15);
  assert.ok(counts.auto < counts.all);
  assert.match(await p.textContent('#filterStatus'), /^15 · /);
  await p.context().close();
});

test('detalle de proyecto: abre, muestra enlaces seguros, cierra con Esc y devuelve el foco', async () => {
  const p = await open(browser, server.url);
  await p.click('[data-project="utu"]');
  assert.ok(await p.isVisible('#caseDialog'));
  assert.match(await p.textContent('#caseTitle'), /UTU Tranqueras/);
  const links = await p.$$eval('#caseLinks a', as => as.map(a => [a.href, a.target, a.rel]));
  assert.equal(links.length, 2);
  for (const [href, target, rel] of links) { assert.match(href, /^https:/); assert.equal(target, '_blank'); assert.match(rel, /noopener/); assert.match(rel, /noreferrer/); }
  await p.keyboard.press('Escape');
  assert.equal(await p.isVisible('#caseDialog'), false);
  assert.equal(await p.evaluate(() => document.activeElement.getAttribute('data-project')), 'utu');
  await p.click('[data-project="freeshop-bot"]');
  assert.match(await p.textContent('#caseLinks'), /privado/i);
  await p.click('#caseClose');
  assert.equal(await p.isVisible('#caseDialog'), false);
  await p.context().close();
});

test('el free shop no se nombra y la app de taxis no aparece por su nombre', async () => {
  const p = await open(browser, server.url);
  const text = await p.evaluate(() => document.body.innerText);
  assert.match(text, /free shop de Rivera/);
  assert.doesNotMatch(text, /M[oó]vilY[aá]/i);
  await p.context().close();
});

test('menú móvil abre, navega y se cierra con Escape', async () => {
  const p = await open(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  assert.equal(await p.isVisible('#nav'), false);
  await p.click('#menuBtn');
  assert.equal(await p.getAttribute('#menuBtn', 'aria-expanded'), 'true');
  assert.ok(await p.isVisible('#nav'));
  await p.click('#nav a[href="#proyectos"]');
  assert.equal(await p.getAttribute('#menuBtn', 'aria-expanded'), 'false');
  await p.click('#menuBtn'); await p.keyboard.press('Escape');
  assert.equal(await p.isVisible('#nav'), false);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'menuBtn');
  await p.context().close();
});

test('sin desborde horizontal en 320, 390, 768, 1024 y 1440 px', async () => {
  for (const w of [320, 390, 768, 1024, 1440]) {
    const p = await open(browser, server.url, { viewport: { width: w, height: 800 } });
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(ov <= 0, `${w}px desborda ${ov}px`);
    await p.context().close();
  }
});

test('formulario: no avanza sin completar y muestra errores accesibles', async () => {
  const p = await open(browser, server.url);
  await p.click('#nextBtn');
  assert.match(await p.textContent('#err-service'), /Elegí/);
  await p.click('label[for="svc-opt-sec"]');
  assert.equal(await p.textContent('#err-service'), '', 'el error se limpia al corregir');
  await p.click('#nextBtn');
  assert.ok(await p.isVisible('#step2'));
  await p.click('#nextBtn');
  assert.match(await p.textContent('#err-d_estado'), /Elegí/);
  assert.match(await p.textContent('#err-desc'), /mínimo 20/);
  assert.equal(await p.getAttribute('#f-desc', 'aria-invalid'), 'true');
  await p.check('input[name="d_estado"][value="incidente"]', { force: true });
  assert.ok(await p.isVisible('#incidentNote'), 'aviso de incidente');
  await p.check('input[name="d_proteger"][value="correo"]', { force: true });
  await p.fill('#f-desc', 'Un correo raro y la computadora anda lenta desde ayer.');
  await p.click('#nextBtn');
  assert.equal(await p.isChecked('input[name="urgency"][value="now"]'), true, 'urgencia sugerida');
  await p.context().close();
});

test('formulario: teléfono obligatorio solo con WhatsApp o llamada', async () => {
  const p = await open(browser, server.url);
  await fillLead(p, { channel: 'whatsapp' });
  assert.equal(await p.isVisible('#phoneOpt'), false, 'deja de decir opcional');
  await p.click('#nextBtn');
  assert.match(await p.textContent('#err-phone'), /número/);
  await p.fill('#f-phone', '099 123 456');
  await p.click('#nextBtn');
  assert.ok(await p.isVisible('#step5'));
  await p.context().close();
});

test('formulario: revisión muestra todo y permite editar cada parte', async () => {
  const p = await open(browser, server.url);
  await fillLead(p);
  await p.click('#nextBtn');
  const review = await p.textContent('#review');
  for (const s of ['Servidores e infraestructura', 'Necesitamos montar', 'Dentro de este mes', 'Rivera', 'María Pereira', 'maria@empresa.com.uy']) assert.ok(review.includes(s), s);
  await p.click('#review [data-goto="3"]');
  assert.ok(await p.isVisible('#step3'));
  assert.equal(await p.evaluate(() => document.activeElement.tagName), 'LEGEND');
  await p.context().close();
});

test('formulario: botón de servicio preselecciona y salta a detalles', async () => {
  const p = await open(browser, server.url);
  await p.click('#svc-auto .svc__cta');
  await p.waitForSelector('#step2:not([hidden])');
  assert.ok(await p.isChecked('#svc-opt-auto'));
  assert.ok(await p.locator('input[name="d_tarea"]').count() > 0);
  await p.context().close();
});

test('formulario: el borrador sobrevive a recargar la página', async () => {
  const p = await open(browser, server.url);
  await p.click('label[for="svc-opt-dev"]');
  await p.click('#nextBtn');
  await p.fill('#f-desc', 'Una app de pedidos para nuestros clientes del interior.');
  await p.waitForTimeout(400);
  await p.reload();
  assert.ok(await p.isVisible('#draftNote'));
  assert.ok(await p.isVisible('#step2'));
  assert.equal(await p.inputValue('#f-desc'), 'Una app de pedidos para nuestros clientes del interior.');
  await p.context().close();
});

test('formulario: cambiar de idioma en medio del formulario conserva lo escrito', async () => {
  const p = await open(browser, server.url);
  await fillLead(p);
  await p.click('.lang__b[data-lang="en"]');
  assert.equal(await p.inputValue('#f-name'), 'María Pereira');
  assert.ok(await p.isVisible('#step4'));
  assert.match(await p.textContent('#stepCount'), /Step 4 of 5/);
  await p.context().close();
});

test('formulario sin API configurada: modo vista previa avisa que no se envió', async () => {
  const p = await open(browser, server.url);
  await fillLead(p);
  await p.click('#nextBtn');
  await p.click('#sendBtn');
  assert.ok(await p.isVisible('#done'));
  assert.ok(await p.isVisible('#demoNote'));
  assert.match(await p.textContent('#leadId'), /^DEMO-/);
  await p.click('#newBtn');
  assert.ok(await p.isVisible('#step1'));
  assert.equal(await p.isChecked('#svc-opt-infra'), false);
  await p.context().close();
});

test('páginas de soporte: 404, security.txt, robots y manifiesto', async () => {
  const p = await open(browser, server.url, { path: '/no-existe' });
  assert.match(await p.textContent('h1'), /no existe/);
  for (const [path, re] of [['/.well-known/security.txt', /Contact: .*Expires: 2027/s], ['/robots.txt', /Sitemap:/], ['/site.webmanifest', /"short_name"/], ['/sitemap.xml', /hreflang="pt"/]]) {
    const r = await p.request.get(server.url + path);
    assert.equal(r.status(), 200, path);
    assert.match(await r.text(), re, path);
  }
  await p.context().close();
});
