// Cobertura de caja blanca del JavaScript del navegador durante un recorrido completo.
import { chromium } from 'playwright';
import v8toIstanbul from 'v8-to-istanbul';
import path from 'node:path'; import fs from 'node:fs';
import { startServer } from './helpers/server.mjs';
import { wireApi, fillLead } from './helpers/browser.mjs';
import { SITE } from './helpers/browser-data.mjs';
const { srv, url } = await startServer();
const b = await chromium.launch();
const all = [];
async function session(fn, opts = {}) {
  const ctx = await b.newContext({ locale: opts.locale || 'es-UY', viewport: opts.viewport || { width: 1280, height: 900 }, colorScheme: opts.scheme || 'light' });
  const p = await ctx.newPage();
  await p.coverage.startJSCoverage({ resetOnNavigation: false });
  if (opts.api) await wireApi(p, opts.api);
  if (opts.init) await p.addInitScript(opts.init);
  await p.goto(url + (opts.path || '/'));
  await fn(p);
  all.push(...await p.coverage.stopJSCoverage());
  await ctx.close();
}
await session(async p => {
  await p.click('.lang__b[data-lang="pt"]'); await p.click('.lang__b[data-lang="es"]');
  await p.click('#themeBtn'); await p.click('#themeBtn');
  for (const f of ['servers', 'dev', 'sec', 'auto', 'net', 'all']) await p.click(`.chip[data-filter="${f}"]`);
  await p.click('[data-project="utu"]'); await p.keyboard.press('Escape');
  await p.click('[data-project="freeshop-bot"]'); await p.click('#caseClose');
  await p.click('[data-project="dmz"]'); await p.mouse.click(5, 5);
  await p.click('#tab-access'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('End'); await p.keyboard.press('Home'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowRight');
  await p.click('#nextBtn');
  await p.click('#svc-sec .svc__cta'); await p.waitForTimeout(600);
  await p.click('#nextBtn');
  await p.check('input[name="d_estado"][value="incidente"]', { force: true });
  await p.check('input[name="d_proteger"][value="red"]', { force: true });
  await p.fill('#f-desc', 'corto'); await p.click('#nextBtn'); await p.fill('#f-desc', 'Descripción suficientemente larga del incidente.');
  await p.press('#f-desc', 'Tab');
  await p.click('#nextBtn'); await p.click('#backBtn'); await p.click('#nextBtn');
  await p.check('input[name="location"][value="abroad"]', { force: true }); await p.check('input[name="client"][value="pro"]', { force: true });
  await p.selectOption('#f-budget', '3'); await p.click('#nextBtn');
  await p.click('#nextBtn');
  await p.fill('#f-name', 'Ana Souza'); await p.press('#f-name', 'Enter');
  await p.fill('#f-email', 'ana@x.com'); await p.check('input[name="channel"][value="call"]', { force: true }); await p.click('#nextBtn');
  await p.fill('#f-phone', '099123456'); await p.check('#f-consent'); await p.selectOption('#f-time', 'morning');
  await p.click('.lang__b[data-lang="en"]');
  await p.click('#nextBtn'); await p.click('#review [data-goto="2"]'); await p.click('#nextBtn'); await p.click('#nextBtn'); await p.click('#nextBtn');
  await p.waitForTimeout(4500);
  await p.click('#sendBtn'); await p.waitForSelector('#done:not([hidden])');
  await p.click('#newBtn');
}, { api: {} });
await session(async p => { await p.click('#menuBtn'); await p.click('#nav a[href="#servicios"]'); await p.click('#menuBtn'); await p.keyboard.press('Escape'); await p.evaluate(() => window.scrollTo(0, 99999)); await p.waitForTimeout(300); }, { viewport: { width: 390, height: 844 } });
await session(async p => { await fillLead(p); await p.click('#nextBtn'); await p.click('#sendBtn'); await p.waitForSelector('#done:not([hidden])'); }, {});
await session(async p => { await fillLead(p); await p.click('#nextBtn'); await p.click('#sendBtn'); await p.waitForSelector('#err-send:not(:empty)'); }, { api: { down: true } });
await session(async p => { await p.waitForTimeout(300); }, { init: `localStorage.setItem('rdm-draft-v1', JSON.stringify({service:'auto',details:{tarea:['correos','x'],horas:'2-5'},desc:'Clasificar correos de clientes todos los días',step:2,savedAt:Date.now()}))`, scheme: 'dark' });
await session(async p => { await p.waitForTimeout(300); }, { init: `localStorage.setItem('rdm-draft-v1', '{bad'); localStorage.setItem('rdm-draft-v1x','1')` });
await session(async p => { await p.waitForTimeout(300); }, { init: `localStorage.setItem('rdm-draft-v1', JSON.stringify({service:'dev',savedAt:1}))` });
await session(async p => { await p.waitForTimeout(200); }, { path: '/?lang=pt', locale: 'en-US' });

const report = {};
for (const f of ['logic.js', 'app.js', 'form.js', 'theme-init.js']) {
  const entries = all.filter(e => e.url.endsWith('/assets/js/' + f));
  const file = path.join(SITE, 'assets/js', f);
  let data = null;
  for (const e of entries) {
    const conv = v8toIstanbul(file, 0, { source: fs.readFileSync(file, 'utf8') });
    await conv.load(); conv.applyCoverage(e.functions);
    const d = conv.toIstanbul()[file];
    if (!data) { data = d; continue; }
    for (const k of Object.keys(d.s)) data.s[k] = Math.max(data.s[k], d.s[k]);
    for (const k of Object.keys(d.f)) data.f[k] = Math.max(data.f[k], d.f[k]);
    for (const k of Object.keys(d.b)) data.b[k] = data.b[k].map((v, i) => Math.max(v, d.b[k][i]));
  }
  const pct = (o) => { const v = Object.values(o).flat(); return v.length ? Math.round(100 * v.filter(x => x > 0).length / v.length) : 100; };
  report[f] = { lines_statements: pct(data.s), functions: pct(data.f), branches: pct(data.b) };
}
console.log(JSON.stringify(report, null, 1));
fs.writeFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), 'coverage-browser.json'), JSON.stringify(report, null, 1));
await b.close(); srv.close();
