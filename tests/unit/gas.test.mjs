// Pruebas de caja blanca de Code.gs: cada rama de validación, puntaje, límites,
// numeración, guardado, avisos, configuración, instalación y recordatorio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGas, post, validLead } from '../helpers/gas.mjs';

const plain = (x) => JSON.parse(JSON.stringify(x));

test('helpers: clean_, cell_, esc_, isEmail_, isPhone_, hash_', () => {
  const { ctx } = loadGas();
  assert.equal(ctx.clean_('  a\u0007b  ', 10), 'a b');
  assert.equal(ctx.clean_(undefined, 5), '');
  assert.equal(ctx.clean_('a\n\n\n\nb', 10, true), 'a\n\nb');
  for (const f of ['=1+1', '+1', '-1', '@SUM(A1)', '\tx', '|x', '%x']) assert.equal(ctx.cell_(f)[0], "'", f);
  assert.equal(ctx.cell_('normal'), 'normal');
  assert.equal(ctx.cell_(null), '');
  assert.equal(ctx.esc_('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(ctx.esc_(undefined), '');
  assert.ok(ctx.isEmail_('a@b.co')); assert.ok(!ctx.isEmail_('a@b')); assert.ok(!ctx.isEmail_('x'.repeat(300)));
  assert.ok(ctx.isPhone_('+598 99 123 456')); assert.ok(!ctx.isPhone_('12')); assert.ok(!ctx.isPhone_(''));
  assert.match(ctx.hash_('x'), /^[0-9a-f]{32}$/);
  assert.equal(ctx.hash_('a'), ctx.hash_('a')); assert.notEqual(ctx.hash_('a'), ctx.hash_('b'));
});

test('validate_: pedido válido de cada servicio', () => {
  const { ctx } = loadGas();
  const cases = {
    infra: { situacion: 'mejorar', donde: 'local', uso: ['gestion'] },
    dev: { plataforma: ['iphone'], etapa: 'existe' },
    support: { equipos: '6-15', modalidad: 'mensual', sistemas: ['pos'] },
    auto: { tarea: ['consultas'], herramientas: ['whatsapp'], horas: '10+' },
    sec: { estado: 'incidente', proteger: ['datos'] },
    train: { tema: ['ia'], personas: '6-15', formato: 'virtual' },
    other: {}
  };
  for (const [service, details] of Object.entries(cases)) {
    const r = ctx.validate_(validLead({ service, details }));
    assert.equal(r.ok, true, service + ' ' + JSON.stringify(r.errors));
    assert.deepEqual(plain(r.lead.details), details, service);
  }
});

test('validate_: cada campo inválido produce su error', () => {
  const { ctx } = loadGas();
  const errs = (over) => plain(ctx.validate_(validLead(over)).errors || []);
  assert.deepEqual(plain(ctx.validate_(null).errors), ['body']);
  assert.deepEqual(plain(ctx.validate_([]).errors), ['body']);
  assert.ok(errs({ v: 2 }).includes('version'));
  assert.ok(errs({ service: 'hack' }).includes('service'));
  assert.ok(errs({ details: { situacion: 'nuevo', donde: 'nube', uso: ['web'], extra: 'x' } }).includes('detail:extra'));
  assert.ok(errs({ details: { situacion: 'nuevo', donde: 'nube', uso: ['web', 'bad'] } }).includes('detail:uso'));
  assert.ok(errs({ details: { situacion: 'nuevo', donde: 'nube', uso: [] } }).includes('detail:uso'));
  assert.ok(errs({ details: { situacion: 'x', donde: 'nube', uso: ['web'] } }).includes('detail:situacion'));
  assert.ok(errs({ details: { donde: 'nube', uso: ['web'] } }).includes('detail:situacion'));
  assert.ok(errs({ details: { situacion: 'nuevo', donde: 'nube', uso: ['web'], usuarios: 'mil' } }).includes('detail:usuarios'));
  assert.deepEqual(errs({ details: { situacion: 'nuevo', donde: 'nube', uso: ['web'], usuarios: '' } }), []);
  for (const k of ['urgency', 'location', 'budget', 'client', 'channel', 'time', 'lang']) assert.ok(errs({ [k]: 'zzz' }).includes(k), k);
  assert.ok(errs({ desc: 'corto' }).includes('desc'));
  assert.ok(errs({ name: 'A' }).includes('name'));
  assert.ok(errs({ email: 'no' }).includes('email'));
  assert.ok(errs({ channel: 'whatsapp', phone: '' }).includes('phone'));
  assert.ok(errs({ channel: 'email', phone: 'abc' }).includes('phone'));
  assert.ok(errs({ consent: 'true' }).includes('consent'));
  assert.ok(errs({ consent: 1 }).includes('consent'));
  assert.deepEqual(errs({ budget: undefined, time: undefined }), [], 'por defecto unknown / any');
});

test('validate_: deduplica casillas, limpia origen y acota segundos', () => {
  const { ctx } = loadGas();
  const r = ctx.validate_(validLead({ details: { situacion: 'nuevo', donde: 'nube', uso: ['web', 'web', 'bd'] }, origin: 'he<ro>!', elapsed: -9 }));
  assert.deepEqual(plain(r.lead.details.uso), ['web', 'bd']);
  assert.equal(r.lead.origin, 'hero');
  assert.equal(r.lead.elapsed, 0);
  assert.equal(ctx.validate_(validLead({ elapsed: 'abc' })).lead.elapsed, 0);
  assert.equal(ctx.validate_(validLead({ elapsed: 1e12 })).lead.elapsed, 86400);
  assert.equal(ctx.validate_(validLead({ email: 'MARIA@Empresa.COM.UY' })).lead.email, 'maria@empresa.com.uy');
});

test('score_: puntajes y etiquetas en los extremos', () => {
  const { ctx } = loadGas();
  const v = (o) => ctx.validate_(validLead(o)).lead;
  const top = ctx.score_(v({ service: 'sec', details: { estado: 'incidente', proteger: ['red'] }, urgency: 'now', budget: '4', client: 'company', location: 'rivera' }));
  assert.equal(top.label, 'Alta'); assert.equal(top.score, 100);
  const low = ctx.score_(v({ service: 'other', details: {}, urgency: 'info', budget: '1', client: 'person', location: 'abroad' }));
  assert.equal(low.label, 'Baja'); assert.equal(low.score, 12);
  const mid = ctx.score_(v({ urgency: 'month', budget: 'unknown', client: 'pro', location: 'uy' }));
  assert.equal(mid.label, 'Media'); assert.equal(mid.score, 25 + 8 + 6 + 5 + 4);
  const sup = ctx.score_(v({ service: 'support', details: { equipos: '1-5', modalidad: 'mensual' } }));
  const sup2 = ctx.score_(v({ service: 'support', details: { equipos: '1-5', modalidad: 'puntual' } }));
  assert.equal(sup.score - sup2.score, 8, 'mantenimiento mensual suma');
  assert.equal(ctx.score_({ urgency: 'x', budget: 'x', client: 'x', location: 'x', service: 'x', details: {} }).score, 0);
});

test('nextAction_: plazo según incidente, urgencia y canal', () => {
  const { ctx } = loadGas();
  const now = new Date('2026-10-17T12:00:00-03:00');
  const v = (o) => ctx.validate_(validLead(o)).lead;
  assert.equal(ctx.nextAction_(v({ urgency: 'now' }), now), 'Responder por correo antes del 17/10 16:00');
  assert.equal(ctx.nextAction_(v({ service: 'sec', details: { estado: 'incidente', proteger: ['red'] }, urgency: 'info' }), now), 'Responder por correo antes del 17/10 14:00');
  assert.equal(ctx.nextAction_(v({ urgency: 'month', channel: 'whatsapp', phone: '099123456' }), now), 'Escribir por WhatsApp antes del 18/10 12:00');
  assert.equal(ctx.nextAction_(v({ urgency: 'quarter', channel: 'call', phone: '099123456' }), now), 'Llamar antes del 19/10 12:00');
  assert.equal(ctx.nextAction_(v({ urgency: 'info' }), now), 'Responder por correo antes del 20/10 12:00');
  assert.equal(ctx.nextAction_({ urgency: 'x', channel: 'x', service: 'x', details: {} }, now), 'Responder antes del 19/10 12:00');
});

test('summary_: texto legible en español', () => {
  const { ctx } = loadGas();
  const lead = ctx.validate_(validLead()).lead;
  assert.equal(ctx.summary_(lead), 'Servidores e infraestructura · Situación: No tiene servidor · Dónde: Nube · Uso: Web, Base de datos · Usuarios: 6–20');
  assert.equal(ctx.summary_(ctx.validate_(validLead({ service: 'other', details: {} })).lead), 'Otra cosa');
});

test('doPost: flujo completo guarda fila, numera y avisa', () => {
  const env = loadGas();
  const r = post(env, validLead());
  assert.equal(r.ok, true);
  assert.match(r.id, /^RDM-\d{4}-0001$/);
  const r2 = post(env, validLead({ email: 'otro@x.com' }));
  assert.match(r2.id, /-0002$/);
  const rows = env.sheets.Contactos.rows;
  assert.equal(rows.length, 2);
  const row = rows[0];
  assert.equal(row.length, env.ctx.HEADERS.length);
  assert.equal(row[1], r.id); assert.equal(row[2], 'Nuevo'); assert.ok(row[0] instanceof Date);
  assert.equal(typeof row[4], 'number'); assert.equal(typeof row[21], 'number');
  assert.equal(row[15], 'maria@empresa.com.uy');
  assert.equal(env.mail.length, 4, 'dueño + cliente por cada pedido');
  const owner = env.mail[0]; const client = env.mail[1];
  assert.equal(owner.to, 'owner@example.com'); assert.equal(owner.replyTo, 'maria@empresa.com.uy');
  assert.match(owner.subject, /^\[(Alta|Media|Baja)\] RDM-/);
  assert.equal(client.to, 'maria@empresa.com.uy'); assert.equal(client.replyTo, 'owner@example.com');
  assert.match(client.subject, /^Recibí tu pedido · RDM-/);
  assert.equal(env.lockWaits, 2);
});

test('doPost: confirmación al cliente en portugués e inglés', () => {
  const env = loadGas();
  post(env, validLead({ lang: 'pt' }));
  post(env, validLead({ lang: 'en', email: 'b@c.com' }));
  assert.match(env.mail[1].subject, /^Recebi seu pedido/);
  assert.match(env.mail[1].body, /Servidores e infraestrutura/);
  assert.match(env.mail[3].subject, /^I got your request/);
  assert.match(env.mail[3].body, /Servers and infrastructure/);
});

test('doPost: asunto marca INCIDENTE', () => {
  const env = loadGas();
  post(env, validLead({ service: 'sec', details: { estado: 'incidente', proteger: ['pcs'] }, urgency: 'now' }));
  assert.match(env.mail[0].subject, /^\[INCIDENTE\]/);
});

test('doPost: cuerpo vacío, enorme, JSON roto, arreglo o null → invalid', () => {
  const env = loadGas();
  assert.deepEqual(plain(JSON.parse(env.ctx.doPost({}).getContent())), { ok: false, error: 'invalid' });
  assert.deepEqual(plain(JSON.parse(env.ctx.doPost(undefined).getContent())), { ok: false, error: 'invalid' });
  for (const body of ['', '{', 'x'.repeat(20001), '[]', 'null', '"s"', '42']) {
    assert.equal(post(env, body).error, 'invalid', body.slice(0, 10));
  }
  assert.equal(env.sheets.Contactos.rows.length, 0);
});

test('doPost: datos inválidos devuelven campos sin guardar', () => {
  const env = loadGas();
  const r = post(env, validLead({ email: 'no', consent: false }));
  assert.equal(r.ok, false); assert.deepEqual(r.fields.sort(), ['consent', 'email']);
  assert.equal(env.sheets.Contactos.rows.length, 0); assert.equal(env.mail.length, 0);
});

test('doPost: trampa de bots no guarda ni envía', () => {
  const env = loadGas();
  const r = post(env, validLead({ website: 'http://spam' }));
  assert.equal(r.ok, true);
  assert.equal(env.sheets.Contactos.rows.length, 0); assert.equal(env.mail.length, 0);
});

test('doPost: envío demasiado rápido queda para revisar y no avisa', () => {
  const env = loadGas();
  const r = post(env, validLead({ elapsed: 1 }));
  assert.equal(r.ok, true);
  assert.equal(env.sheets.Contactos.rows[0][2], 'Revisar (posible spam)');
  assert.equal(env.mail.length, 0);
});

test('doPost: límite por correo y por hora', () => {
  const env = loadGas();
  for (let i = 0; i < 3; i++) assert.equal(post(env, validLead({ desc: 'Pedido número ' + i + ' con texto suficiente' })).ok, true);
  assert.equal(post(env, validLead({ desc: 'Otro pedido distinto con texto suficiente' })).error, 'rate');
  assert.equal(post(env, validLead({ email: 'MARIA@empresa.com.uy', desc: 'Uno más con texto suficiente aquí' })).error, 'rate', 'mayúsculas no esquivan el límite');
  const env2 = loadGas();
  let last;
  for (let i = 0; i < env2.ctx.CONFIG.MAX_PER_HOUR + 1; i++) last = post(env2, validLead({ email: `u${i}@x.com` }));
  assert.equal(last.error, 'rate');
});

test('doPost: errores internos responden server sin filtrar detalles', () => {
  const env = loadGas({ noSheet: true });
  const r = post(env, validLead());
  assert.deepEqual(r, { ok: false, error: 'server' });
  assert.ok(env.logs.some(l => l[0] === 'error'));
  const env2 = loadGas({ lockFails: true });
  assert.deepEqual(post(env2, validLead()), { ok: false, error: 'server' });
});

test('doPost: el candado se libera aunque falle el guardado', () => {
  const env = loadGas();
  env.sheets.Contactos.appendRow = () => { throw new Error('disk'); };
  assert.equal(post(env, validLead()).error, 'server');
  env.sheets.Contactos.appendRow = function (r) { this.rows.push(r); };
  assert.equal(post(env, validLead({ email: 'z@z.com' })).ok, true, 'no quedó bloqueado');
});

test('numeración: reinicia cada mes y rellena con ceros', () => {
  const env = loadGas({ props: { seq_2601: '41' } });
  assert.equal(env.ctx.nextId_(new Date('2026-01-15T12:00:00-03:00')), 'RDM-2601-0042');
  assert.equal(env.ctx.nextId_(new Date('2026-02-15T12:00:00-03:00')), 'RDM-2602-0001');
});

test('Telegram: solo si está configurado, texto plano y recortado', () => {
  const env = loadGas();
  post(env, validLead());
  assert.equal(env.fetches.length, 0);
  const env2 = loadGas({ props: { TELEGRAM_TOKEN: '123:abc', TELEGRAM_CHAT_ID: '99' } });
  post(env2, validLead({ desc: 'x'.repeat(1999) }));
  assert.equal(env2.fetches.length, 1);
  const f = env2.fetches[0];
  assert.equal(f.u, 'https://api.telegram.org/bot123%3Aabc/sendMessage');
  assert.equal(f.o.payload.parse_mode, undefined, 'sin HTML ni Markdown');
  assert.ok(f.o.payload.text.length <= 3500);
  assert.equal(f.o.muteHttpExceptions, true);
});

test('doGet y readConfig_: disponibilidad desde la hoja Config con caché', () => {
  const env = loadGas();
  assert.deepEqual(plain(JSON.parse(env.ctx.doGet({ parameter: {} }).getContent())), { ok: true });
  assert.deepEqual(plain(JSON.parse(env.ctx.doGet(undefined).getContent())), { ok: true });
  const c = JSON.parse(env.ctx.doGet({ parameter: { action: 'config' } }).getContent());
  assert.equal(c.available, true); assert.match(c.t, /^\d+\.[\w-]+$/); assert.deepEqual(Object.keys(c).sort(), ['available', 't']);
  const env2 = loadGas();
  const cfg = env2.ss.insertSheet('Config'); cfg.rows = [['clave', 'valor'], ['disponible', false]];
  assert.equal(JSON.parse(env2.ctx.doGet({ parameter: { action: 'config' } }).getContent()).available, false);
  cfg.rows[1][1] = true;
  assert.equal(JSON.parse(env2.ctx.doGet({ parameter: { action: 'config' } }).getContent()).available, false, 'sale de caché 5 min');
  const env3 = loadGas(); const c3 = env3.ss.insertSheet('Config'); c3.rows = [['disponible', 'NO']];
  assert.equal(env3.ctx.readConfig_().available, false);
});

test('setup(): crea hojas, encabezados, panel y un único recordatorio', () => {
  const env = loadGas({ noSheet: true });
  env.ctx.setup(); env.ctx.setup();
  assert.ok(env.sheets.Contactos && env.sheets.Config && env.sheets.Panel);
  assert.deepEqual(plain(env.sheets.Contactos.rows[0]), plain(env.ctx.HEADERS));
  assert.equal(env.triggers.length, 1, 'no duplica el disparador');
  assert.equal(env.triggers[0].getHandlerFunction(), 'recordatorioDiario');
  assert.ok(env.sheets.Panel.rows.length > 10);
  assert.equal(env.sheets.Contactos.cf.length, 5);
});

test('recordatorioDiario: avisa solo pedidos Nuevo con más de 24 h', () => {
  const env = loadGas();
  env.ctx.recordatorioDiario();
  assert.equal(env.mail.length, 0, 'hoja vacía');
  const sh = env.sheets.Contactos;
  const old = new Date(Date.now() - 30 * 3600 * 1000); const fresh = new Date();
  const mk = (d, id, st) => { const r = new Array(23).fill(''); r[0] = d; r[1] = id; r[2] = st; return r; };
  sh.rows = [env.ctx.HEADERS.slice(), mk(old, 'RDM-1', 'Nuevo'), mk(fresh, 'RDM-2', 'Nuevo'), mk(old, 'RDM-3', 'Contactado')];
  env.ctx.recordatorioDiario();
  assert.equal(env.mail.length, 1);
  assert.match(env.mail[0].subject, /^Pendientes: 1/);
  assert.match(env.mail[0].body, /RDM-1/); assert.doesNotMatch(env.mail[0].body, /RDM-2|RDM-3/);
  sh.rows = [env.ctx.HEADERS.slice(), mk(fresh, 'RDM-4', 'Nuevo')];
  env.ctx.recordatorioDiario();
  assert.equal(env.mail.length, 1, 'nada vencido, no envía');
});

test('pruebaManual(): genera un pedido de ejemplo', () => {
  const env = loadGas();
  env.ctx.pruebaManual();
  assert.equal(env.sheets.Contactos.rows.length, 1);
  assert.ok(env.logs.some(l => l[0] === 'logger' && /"ok":true/.test(l[1])));
});

test('normEmail_, firstName_ y secret_', () => {
  const { ctx, props } = loadGas();
  assert.equal(ctx.normEmail_('A.N.A+x@GoogleMail.com'), 'ana@gmail.com');
  assert.equal(ctx.normEmail_('ana.p+tag@empresa.uy'), 'ana.p@empresa.uy');
  assert.equal(ctx.normEmail_('sin-arroba'), 'sin-arroba');
  assert.equal(ctx.normEmail_(null), '');
  assert.equal(ctx.firstName_('José María'), 'José');
  assert.equal(ctx.firstName_("D'Angelo Pérez"), "D'Angelo");
  assert.equal(ctx.firstName_('http://evil'), '');
  assert.equal(ctx.firstName_('A'), '');
  assert.equal(ctx.firstName_(''), '');
  assert.equal(ctx.firstName_(undefined), '');
  assert.equal(props.get('FORM_SECRET'), undefined);
  const s1 = ctx.secret_(); assert.ok(s1.length >= 64); assert.equal(ctx.secret_(), s1, 'se crea una sola vez');
});

test('tokenOk_: formato, firma, largo y edad', () => {
  const { ctx } = loadGas({ props: { FORM_SECRET: 'k'.repeat(40) } });
  const mk = (ms) => { const ts = String(Date.now() - ms); return ts + '.' + ctx.sign_(ts); };
  assert.equal(ctx.tokenOk_(mk(10000)), true);
  assert.equal(ctx.tokenOk_(mk(1000)), false, 'muy nuevo');
  assert.equal(ctx.tokenOk_(mk(25 * 3600e3)), false, 'vencido');
  assert.equal(ctx.tokenOk_(null), false);
  assert.equal(ctx.tokenOk_('x'.repeat(200)), false);
  assert.equal(ctx.tokenOk_('123.abc'), false);
  const good = mk(10000);
  assert.equal(ctx.tokenOk_(good.slice(0, -1)), false, 'firma más corta');
  assert.equal(ctx.tokenOk_(good.split('.')[0] + '.' + 'A'.repeat(good.split('.')[1].length)), false, 'firma falsa del mismo largo');
  const other = loadGas({ props: { FORM_SECRET: 'z'.repeat(40) } });
  assert.equal(other.ctx.tokenOk_(good), false, 'firmado con otro secreto');
  assert.match(ctx.newToken_(), /^\d{13}\.[\w-]{43}$/);
});

test('mailQuota_: si MailApp falla se asume cuota cero', () => {
  const env = loadGas();
  env.ctx.MailApp.getRemainingDailyQuota = () => { throw new Error('x'); };
  assert.equal(env.ctx.mailQuota_(), 0);
});

test('recordatorioDiario: también lista los marcados para revisar', () => {
  const env = loadGas();
  const sh = env.sheets.Contactos;
  const mk = (d, id, st) => { const r = new Array(23).fill(''); r[0] = d; r[1] = id; r[2] = st; return r; };
  sh.rows = [env.ctx.HEADERS.slice(), mk(new Date(), 'RDM-9', 'Revisar (posible spam)'), mk(new Date(Date.now() - 5 * 86400e3), 'RDM-8', 'Revisar (posible spam)')];
  env.ctx.recordatorioDiario();
  assert.equal(env.mail.length, 1);
  assert.match(env.mail[0].subject, /0 sin responder, 1 para revisar/);
  assert.match(env.mail[0].body, /RDM-9/); assert.doesNotMatch(env.mail[0].body, /RDM-8/);
});
