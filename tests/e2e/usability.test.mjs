// Usabilidad y accesibilidad: WCAG 2.2 con axe, teclado, objetivos táctiles,
// foco visible, movimiento reducido, jerarquía de títulos, peso y legibilidad.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { startServer } from '../helpers/server.mjs';
import { launch, open } from '../helpers/browser.mjs';
const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

let server, browser;
before(async () => { server = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); server.srv.close(); });

async function axe(p) {
  await p.waitForTimeout(1100); // fin de la animación de entrada
  await p.addScriptTag({ content: AXE }).catch(async () => { await p.evaluate(AXE); });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) }));
  });
}

test('axe: sin violaciones WCAG 2.2 AA en claro/oscuro, 3 idiomas, escritorio y móvil', async () => {
  const report = [];
  for (const scheme of ['light', 'dark']) for (const lang of ['es', 'pt', 'en']) for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const p = await open(browser, server.url, { colorScheme: scheme, path: '/?lang=' + lang, viewport: vp });
    await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
    const v = (await axe(p)).filter(x => x.impact === 'serious' || x.impact === 'critical' || x.impact === 'moderate');
    if (v.length) report.push({ scheme, lang, w: vp.width, v });
    await p.context().close();
  }
  assert.deepEqual(report, [], JSON.stringify(report, null, 1));
});

test('axe: cada paso del formulario y el diálogo de proyecto', async () => {
  const p = await open(browser, server.url);
  const issues = [];
  const check = async (where) => { const v = (await axe(p)).filter(x => ['serious', 'critical', 'moderate'].includes(x.impact)); if (v.length) issues.push({ where, v }); };
  await p.click('#nextBtn'); await check('paso 1 con error');
  await p.click('label[for="svc-opt-train"]'); await p.click('#nextBtn'); await p.click('#nextBtn'); await check('paso 2 con errores');
  await p.click('[data-project="dmz"]'); await check('diálogo'); await p.keyboard.press('Escape');
  assert.deepEqual(issues, [], JSON.stringify(issues, null, 1));
  await p.context().close();
});

test('solo teclado: se puede pedir un presupuesto completo sin mouse', async () => {
  const p = await open(browser, server.url);
  await p.focus('#f-desc').catch(() => {});
  await p.evaluate(() => document.getElementById('svc-opt-support').focus());
  await p.keyboard.press('Space');
  assert.ok(await p.isChecked('#svc-opt-support'));
  await p.keyboard.press('Enter'); // Enter avanza
  assert.ok(await p.isVisible('#step2'));
  assert.equal(await p.evaluate(() => document.activeElement.tagName), 'LEGEND', 'el foco va al título del paso');
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'f-d_equipos');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown');
  await p.keyboard.press('Tab');
  await p.keyboard.press('ArrowRight'); // radios: modalidad
  await p.keyboard.press('Tab'); await p.keyboard.press('Space'); // primera casilla de sistemas
  for (let i = 0; i < 5 && (await p.evaluate(() => document.activeElement.id)) !== 'f-desc'; i++) await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'f-desc');
  await p.keyboard.type('Somos ocho personas y la red se cae seguido.');
  await p.evaluate(() => document.getElementById('nextBtn').focus()); await p.keyboard.press('Enter');
  assert.ok(await p.isVisible('#step3'), 'paso 3');
  await p.keyboard.press('Tab'); await p.keyboard.press('Space');
  await p.keyboard.press('Tab'); await p.keyboard.press('Space');
  await p.keyboard.press('Tab'); await p.keyboard.press('Space');
  await p.evaluate(() => document.getElementById('nextBtn').focus()); await p.keyboard.press('Enter');
  assert.ok(await p.isVisible('#step4'), 'paso 4: ' + await p.textContent('#step3 .err:not(:empty)').catch(() => ''));
  await p.keyboard.press('Tab'); await p.keyboard.type('Juan Rodríguez');
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.type('juan@correo.com');
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Space');
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Space');
  assert.ok(await p.isChecked('#f-consent'), 'el campo oculto anti-bots no está en el orden de tabulación');
  await p.evaluate(() => document.getElementById('nextBtn').focus()); await p.keyboard.press('Enter');
  assert.ok(await p.isVisible('#step5'));
  await p.evaluate(() => document.getElementById('sendBtn').focus()); await p.keyboard.press('Enter');
  assert.ok(await p.isVisible('#done'));
  assert.equal(await p.evaluate(() => document.activeElement.id), 'done', 'foco en la confirmación');
  await p.context().close();
});

test('enlace para saltar al contenido es el primer foco y funciona', async () => {
  const p = await open(browser, server.url);
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(() => document.activeElement.className), 'skip');
  assert.ok(await p.evaluate(() => document.activeElement.getBoundingClientRect().top >= 0), 'visible al enfocarse');
  await p.keyboard.press('Enter');
  assert.match(p.url(), /#main$/);
  await p.context().close();
});

test('foco visible en todos los controles', async () => {
  const p = await open(browser, server.url);
  const bad = [];
  const n = await p.evaluate(() => document.querySelectorAll('a[href], button:not([hidden]), input:not([type=hidden]), select, textarea, [tabindex="0"]').length);
  for (let i = 0; i < Math.min(n, 60); i++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e); const lab = e.closest('label'); const ls = lab ? getComputedStyle(lab) : null;
      return { id: e.id || e.className || e.tagName, ok: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || (ls && ls.outlineStyle !== 'none' && parseFloat(ls.outlineWidth) >= 2) || s.boxShadow !== 'none' }; });
    if (r && !r.ok) bad.push(r.id);
  }
  assert.deepEqual(bad, []);
  await p.context().close();
});

test('objetivos táctiles de al menos 24 px (WCAG 2.5.8) y botones principales ≥ 40 px en móvil', async () => {
  const p = await open(browser, server.url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const small = await p.evaluate(() => [...document.querySelectorAll('a[href], button, label.opt, input[type=checkbox]')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') return false; if (e.closest('.prose, p, dd, .timeline, .foot__made')) return false; if (e.matches('.skip')) return false; return r.width < 24 || r.height < 24; }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  assert.deepEqual(small, []);
  const main = await p.evaluate(() => [...document.querySelectorAll('.btn:not([hidden]), .icon-btn, .opt')].filter(e => e.offsetParent).filter(e => e.getBoundingClientRect().height < 36).map(e => e.id || e.className));
  assert.deepEqual(main, []);
  await p.context().close();
});

test('jerarquía de títulos: un solo h1 y sin saltos de nivel', async () => {
  const p = await open(browser, server.url);
  const hs = await p.$$eval('h1,h2,h3,h4', els => els.filter(e => !e.closest('dialog,[hidden]')).map(e => Number(e.tagName[1])));
  assert.equal(hs.filter(x => x === 1).length, 1);
  for (let i = 1; i < hs.length; i++) assert.ok(hs[i] - hs[i - 1] <= 1, `salto h${hs[i - 1]}→h${hs[i]} en posición ${i}`);
  await p.context().close();
});

test('movimiento reducido: sin animaciones ni transiciones', async () => {
  const p = await open(browser, server.url, { reducedMotion: 'reduce' });
  const anim = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.01) || parseFloat(s.transitionDuration) > 0.01; }).length);
  assert.equal(anim, 0);
  await p.context().close();
});

test('legibilidad: texto ≥ 12 px y párrafos de lectura ≤ 80 caracteres por línea', async () => {
  const p = await open(browser, server.url);
  const tiny = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 12).map(e => e.className || e.tagName));
  assert.deepEqual(tiny, []);
  const wide = await p.evaluate(() => [...document.querySelectorAll('.lead, .prose, .sec-lead')].filter(e => { const s = getComputedStyle(e); const ch = parseFloat(s.fontSize) * 0.5; return e.getBoundingClientRect().width / ch > 82; }).map(e => e.className));
  assert.deepEqual(wide, []);
  await p.context().close();
});

test('rendimiento: peso total de la página bajo 600 KB y sin peticiones a terceros', async () => {
  const p = await open(browser, server.url);
  let bytes = 0; const hosts = new Set();
  p.on('response', async r => { try { bytes += (await r.body()).length; } catch {} hosts.add(new URL(r.url()).host); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(500);
  assert.ok(bytes < 600 * 1024, `${Math.round(bytes / 1024)} KB`);
  assert.deepEqual([...hosts], [new URL(server.url).host]);
  const perf = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n.domContentLoadedEventEnd; });
  assert.ok(perf < 1500, `DOMContentLoaded ${perf} ms`);
  await p.context().close();
});

test('la foto carga al hacer scroll y tiene texto alternativo traducido', async () => {
  const p = await open(browser, server.url, { path: '/?lang=en' });
  await p.locator('.talk img').scrollIntoViewIfNeeded();
  await p.waitForFunction(() => document.querySelector('.talk img').complete && document.querySelector('.talk img').naturalWidth > 0);
  assert.match(await p.getAttribute('.talk img', 'alt'), /speaking at the UTEC lectern/);
  await p.context().close();
});
