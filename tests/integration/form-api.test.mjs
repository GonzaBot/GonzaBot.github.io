// Integración de punta a punta: navegador real → fetch → Code.gs (ejecutado en Node) → planilla y correos simulados.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../helpers/server.mjs';
import { launch, open, fillLead, API } from '../helpers/browser.mjs';

let server, browser;
before(async () => { server = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); server.srv.close(); });

async function submitFull(p, o) {
  await fillLead(p, o);
  await p.waitForTimeout(o && o.fast ? 0 : 4300); // tiempo humano mínimo
  await p.click('#nextBtn');
  await p.click('#sendBtn');
}

test('envío completo: número de seguimiento, fila en la planilla y dos correos', async () => {
  const p = await open(browser, server.url, { api: true });
  await submitFull(p, { phone: '099 123 456', channel: 'whatsapp' });
  await p.waitForSelector('#done:not([hidden])');
  const id = (await p.textContent('#leadId')).trim();
  assert.match(id, /^RDM-\d{4}-0001$/);
  assert.equal(await p.isVisible('#demoNote'), false);
  const rows = p.gas.sheets.Contactos.rows;
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r[1], id); assert.equal(r[2], 'Nuevo'); assert.equal(r[6], 'Servidores e infraestructura');
  assert.match(r[5], /^Escribir por WhatsApp antes del/);
  assert.equal(r[13], 'María Pereira'); assert.equal(r[16], '099 123 456'); assert.equal(r[19], 'Español'); assert.equal(r[20], '');
  assert.equal(p.gas.mail.length, 2);
  assert.equal(p.gas.mail[1].to, 'maria@empresa.com.uy');
  const drafts = await p.evaluate(() => localStorage.getItem('rdm-draft-v1'));
  assert.equal(drafts, null, 'el borrador se borra al enviar');
  await p.context().close();
});

test('la petición es simple: text/plain, sin credenciales, sin preflight', async () => {
  const p = await open(browser, server.url, { api: true });
  await submitFull(p, { fast: true });
  await p.waitForSelector('#done:not([hidden])');
  const posts = p.apiCalls.filter(c => c.method === 'POST');
  assert.equal(posts.length, 1);
  assert.match(posts[0].headers['content-type'] || '', /^text\/plain/);
  assert.equal(posts[0].headers.cookie, undefined);
  assert.equal(p.apiCalls.filter(c => c.method === 'OPTIONS').length, 0);
  const body = JSON.parse(posts[0].body);
  assert.equal(body.v, 1); assert.equal(body.lang, 'es'); assert.equal(body.website, '');
  assert.deepEqual(Object.keys(body).sort(), ['budget', 'channel', 'client', 'company', 'consent', 'desc', 'details', 'elapsed', 'email', 'lang', 'location', 'name', 'origin', 'phone', 'service', 't', 'time', 'urgency', 'v', 'website'].sort());
  assert.match(body.t, /^\d{10,13}\.[\w-]{20,}$/, 'token firmado incluido');
  await p.context().close();
});

test('envío en portugués: la planilla registra el idioma y el cliente recibe el correo en portugués', async () => {
  const p = await open(browser, server.url, { api: true, path: '/?lang=pt' });
  await submitFull(p);
  await p.waitForSelector('#done:not([hidden])');
  assert.equal(p.gas.sheets.Contactos.rows[0][19], 'Português');
  assert.match(p.gas.mail[1].subject, /^Recebi seu pedido/);
  assert.match(await p.textContent('#done h3'), /Pedido recebido/);
  await p.context().close();
});

test('límite de envíos: el cuarto pedido seguido muestra un mensaje claro', async () => {
  const p = await open(browser, server.url, { api: true });
  for (let i = 0; i < 3; i++) {
    await submitFull(p, { fast: true, desc: 'Pedido número ' + i + ' para montar un servidor nuevo.' });
    await p.waitForSelector('#done:not([hidden])');
    await p.click('#newBtn');
  }
  await submitFull(p, { fast: true, desc: 'Cuarto pedido distinto para probar el límite.' });
  await p.waitForSelector('#err-send:not(:empty)');
  assert.match(await p.textContent('#err-send'), /varios pedidos seguidos/);
  assert.ok(await p.isVisible('#step5'), 'no pierde lo escrito');
  await p.context().close();
});

test('servidor caído: mensaje de conexión y el botón vuelve a habilitarse', async () => {
  const p = await open(browser, server.url, { api: { down: true } });
  await submitFull(p, { fast: true });
  await p.waitForSelector('#err-send:not(:empty)');
  assert.match(await p.textContent('#err-send'), /conexión/);
  assert.equal(await p.isDisabled('#sendBtn'), false);
  await p.context().close();
});

test('respuesta del servidor sin número válido no se da por enviada', async () => {
  const p = await open(browser, server.url, { api: true });
  await p.route(API + '**', r => r.request().method() === 'POST'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, id: '<img src=x onerror=alert(1)>' }) })
    : r.fulfill({ status: 200, contentType: 'application/json', body: '{"available":true}' }));
  await submitFull(p, { fast: true });
  await p.waitForSelector('#err-send:not(:empty)');
  assert.equal(await p.isVisible('#done'), false);
  await p.context().close();
});

test('servidor lento: corta a los TIMEOUT_MS y avisa', async () => {
  const p = await open(browser, server.url, { api: true });
  await p.route(API + '**', async r => { if (r.request().method() === 'POST') { await new Promise(res => setTimeout(res, 6000)); try { await r.abort(); } catch {} } else r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  const req = p.waitForRequest(r => r.method() === 'POST', { timeout: 10000 });
  await submitFull(p, { fast: true });
  await req; const t0 = Date.now();
  await p.waitForSelector('#err-send:not(:empty)', { timeout: 8000 });
  assert.ok(Date.now() - t0 < 5000, 'corta a los 4 s configurados');
  assert.equal(await p.isDisabled('#sendBtn'), false);
  await p.context().close();
});

test('doble clic en Enviar genera un solo pedido', async () => {
  const p = await open(browser, server.url, { api: true });
  await fillLead(p); await p.click('#nextBtn');
  await p.evaluate(() => { const b = document.getElementById('sendBtn'); b.click(); b.click(); b.click(); });
  await p.waitForSelector('#done:not([hidden])');
  assert.equal(p.apiCalls.filter(c => c.method === 'POST').length, 1);
  await p.context().close();
});

test('disponibilidad: la hoja Config apaga el cartel de disponible', async () => {
  const p = await open(browser, server.url, { api: true, init: undefined });
  p.gas.ss.insertSheet('Config').rows = [['clave', 'valor'], ['disponible', false]];
  p.gas.cache.clear();
  await p.reload();
  await p.waitForFunction(() => document.getElementById('avail').getAttribute('data-state') === 'off');
  assert.match(await p.textContent('#availText'), /Agenda completa/);
  await p.context().close();
});

test('bot que completa el campo oculto: recibe éxito falso y nada se guarda', async () => {
  const p = await open(browser, server.url, { api: true });
  await fillLead(p);
  await p.evaluate(() => { document.getElementById('f-website').value = 'http://spam.example'; });
  await p.click('#nextBtn'); await p.click('#sendBtn');
  await p.waitForSelector('#done:not([hidden])');
  assert.equal(p.gas.sheets.Contactos.rows.length, 0);
  assert.equal(p.gas.mail.length, 0);
  await p.context().close();
});
