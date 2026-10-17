// Utilidades de Playwright para las pruebas de navegador.
import { chromium } from 'playwright';
import { loadGas } from './gas.mjs';
export const API = 'https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';

export async function launch() { return chromium.launch(); }

/* Abre una página que registra errores de consola, de página y violaciones de CSP. */
export async function open(browser, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, locale: opts.locale || 'es-UY', colorScheme: opts.colorScheme || 'light', reducedMotion: opts.reducedMotion || 'no-preference', hasTouch: !!opts.hasTouch, isMobile: !!opts.isMobile });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
  if (opts.api) await wireApi(page, opts.api === true ? {} : opts.api);
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(url + (opts.path || '/'));
  return page;
}

/* Conecta el formulario a Code.gs ejecutado en Node: integración real de punta a punta. */
export async function wireApi(page, gasOpts) {
  const env = loadGas(gasOpts);
  page.gas = env; page.apiCalls = [];
  await page.route('**/assets/js/config.js', route => route.fulfill({ contentType: 'text/javascript', body: `window.RDM_CONFIG = Object.freeze({ API_URL: "${API}", TIMEOUT_MS: 4000 });` }));
  await page.route(API + '**', async route => {
    const req = route.request();
    page.apiCalls.push({ method: req.method(), body: req.postData(), headers: req.headers() });
    if (gasOpts && gasOpts.down) return route.abort('connectionrefused');
    let out;
    if (req.method() === 'POST') out = env.ctx.doPost({ postData: { contents: req.postData() || '' } });
    else out = env.ctx.doGet({ parameter: Object.fromEntries(new URL(req.url()).searchParams) });
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: out.getContent() });
  });
  return env;
}

export async function fillLead(page, o = {}) {
  await page.click('label[for="svc-opt-' + (o.service || 'infra') + '"]');
  await page.click('#nextBtn');
  if ((o.service || 'infra') === 'infra') {
    await page.check('input[name="d_situacion"][value="nuevo"]', { force: true });
    await page.check('input[name="d_donde"][value="nube"]', { force: true });
    await page.check('input[name="d_uso"][value="web"]', { force: true });
  }
  await page.fill('#f-desc', o.desc || 'Necesitamos montar un servidor para la web y la base de datos.');
  await page.click('#nextBtn');
  await page.check('input[name="urgency"][value="' + (o.urgency || 'month') + '"]', { force: true });
  await page.check('input[name="location"][value="rivera"]', { force: true });
  await page.check('input[name="client"][value="company"]', { force: true });
  await page.click('#nextBtn');
  await page.fill('#f-name', o.name || 'María Pereira');
  await page.fill('#f-company', o.company || 'Comercial del Norte');
  await page.fill('#f-email', o.email || 'maria@empresa.com.uy');
  if (o.phone) await page.fill('#f-phone', o.phone);
  await page.check('input[name="channel"][value="' + (o.channel || 'email') + '"]', { force: true });
  await page.check('#f-consent');
}
