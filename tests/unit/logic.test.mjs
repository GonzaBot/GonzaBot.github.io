// Pruebas unitarias de la lógica pura del navegador (logic.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { loadSiteData } from '../helpers/browser-data.mjs';
const require = createRequire(import.meta.url);
const L = require('../../docs/assets/js/logic.js');
const { D } = loadSiteData();

const okState = () => ({
  service: 'dev', details: { plataforma: ['web', 'android'], etapa: 'idea', funciones: ['stock'] },
  desc: 'Queremos una app para que los clientes hagan pedidos.', urgency: 'month', location: 'rivera', client: 'company', budget: '2',
  name: 'Ana Souza', company: 'X', email: 'ana@empresa.com.br', phone: '+55 55 99999-1234', channel: 'whatsapp', time: 'any', consent: true, website: ''
});

test('pickLang: prioridad explícito > guardado > navegador > español', () => {
  assert.equal(L.pickLang('pt', 'en', ['es']), 'pt');
  assert.equal(L.pickLang(null, 'en', ['pt-BR']), 'en');
  assert.equal(L.pickLang(null, null, ['pt-BR', 'en']), 'pt');
  assert.equal(L.pickLang(null, null, ['fr-FR', 'en-US']), 'en');
  assert.equal(L.pickLang(null, null, ['de']), 'es');
  assert.equal(L.pickLang(undefined, undefined, undefined), 'es');
  assert.equal(L.pickLang('<script>', 'xx', [null, 42]), 'es');
  assert.equal(L.pickLang('EN', null, []), 'es', 'solo minúsculas exactas desde la URL');
  assert.equal(L.pickLang(null, null, ['EN-gb']), 'en', 'el navegador se normaliza');
});

test('translate y pick con respaldo', () => {
  const dict = { es: { a: 'hola', b: 'b-es' }, pt: { a: 'olá' } };
  assert.equal(L.translate(dict, 'pt', 'a'), 'olá');
  assert.equal(L.translate(dict, 'pt', 'b'), 'b-es');
  assert.equal(L.translate(dict, 'en', 'zzz'), 'zzz');
  assert.equal(L.translate(null, 'es', 'k'), 'k');
  assert.equal(L.pick({ es: 'x', en: 'y' }, 'en'), 'y');
  assert.equal(L.pick({ es: 'x' }, 'pt'), 'x');
  assert.equal(L.pick('plain', 'pt'), 'plain');
  assert.equal(L.pick(null, 'pt'), '');
  assert.equal(L.pick(undefined, 'pt'), '');
});

test('cleanText: control, bidi, espacios y largo', () => {
  assert.equal(L.cleanText('  a\u0000b‮c  ', 10), 'a b c');
  assert.equal(L.cleanText('x'.repeat(50), 10).length, 10);
  assert.equal(L.cleanText('l1\n\n\n\nl2', 100, true), 'l1\n\nl2');
  assert.equal(L.cleanText('l1\nl2', 100, false), 'l1 l2');
  assert.equal(L.cleanText(null, 5), '');
  assert.equal(L.cleanText(12345, 3), '123');
  assert.equal(L.cleanText('a​b', 5), 'a b');
});

test('isEmail: válidos e inválidos', () => {
  for (const ok of ['a@b.co', 'maria.p+tag@empresa.com.uy', "o'neil@x.org", 'x@sub-dom.example.travel']) assert.ok(L.isEmail(ok), ok);
  for (const bad of ['', 'a@b', '@b.com', 'a@.com', 'a b@c.com', 'a@b.c', 'a@b..com', 'a@-b.com', 'a@b.com\nBcc: x@y.com', 'a@b.com\r\nX: y', '<a@b.com>', 'a@b.com,c@d.com', 'x'.repeat(65) + '@b.com', 'a@' + 'b'.repeat(250) + '.com', null, undefined, {}])
    assert.equal(L.isEmail(bad), false, String(bad));
});

test('isPhone: formatos de UY, BR e internacionales', () => {
  for (const ok of ['+598 92 175 096', '092175096', '+55 (55) 99999-1234', '+1 555.000.0000']) assert.ok(L.isPhone(ok), ok);
  for (const bad of ['', '12345', 'abc12345678', '+598 92 175 096 ext 2', '1'.repeat(16), '<script>', null]) assert.equal(L.isPhone(bad), false, String(bad));
});

test('validateStep 1: servicio obligatorio y de la lista', () => {
  assert.deepEqual(L.validateStep(1, { service: 'dev' }, D.formDetails), {});
  assert.equal(L.validateStep(1, { service: '' }, D.formDetails).service, 'f.err.choose');
  assert.equal(L.validateStep(1, { service: '__proto__' }, D.formDetails).service, 'f.err.choose');
  assert.equal(L.validateStep(1, null, D.formDetails).service, 'f.err.choose');
});

test('validateStep 2: preguntas obligatorias según servicio y descripción mínima', () => {
  const s = okState();
  assert.deepEqual(L.validateStep(2, s, D.formDetails), {});
  const e = L.validateStep(2, { ...s, details: {}, desc: 'corto' }, D.formDetails);
  assert.equal(e.d_plataforma, 'f.err.choose');
  assert.equal(e.d_etapa, 'f.err.choose');
  assert.equal(e.desc, 'f.err.desc');
  assert.equal(e.d_funciones, undefined, 'opcional');
  const bogus = L.validateStep(2, { ...s, details: { plataforma: ['hack'], etapa: 'x' } }, D.formDetails);
  assert.ok(bogus.d_plataforma && bogus.d_etapa, 'valores fuera de lista no cuentan');
  const sup = L.validateStep(2, { service: 'support', details: { modalidad: 'mensual' }, desc: 'x'.repeat(25) }, D.formDetails);
  assert.equal(sup.d_equipos, 'f.err.required', 'select obligatorio');
  assert.deepEqual(L.validateStep(2, { service: 'other', details: {}, desc: 'x'.repeat(20) }, D.formDetails), {});
  assert.equal(L.validateStep(2, { service: 'other', details: {}, desc: ' '.repeat(30) + 'x' }, D.formDetails).desc, 'f.err.desc', 'los espacios no cuentan');
});

test('validateStep 3: urgencia, ubicación y cliente; presupuesto opcional pero válido', () => {
  const s = okState();
  assert.deepEqual(L.validateStep(3, s, D.formDetails), {});
  const e = L.validateStep(3, {}, D.formDetails);
  assert.deepEqual(Object.keys(e).sort(), ['client', 'location', 'urgency']);
  assert.equal(L.validateStep(3, { ...s, budget: '9' }, D.formDetails).budget, 'f.err.choose');
  assert.deepEqual(L.validateStep(3, { ...s, budget: '' }, D.formDetails), {});
});

test('validateStep 4: contacto, teléfono condicional y consentimiento', () => {
  const s = okState();
  assert.deepEqual(L.validateStep(4, s, D.formDetails), {});
  assert.equal(L.validateStep(4, { ...s, phone: '' }, D.formDetails).phone, 'f.err.phone', 'WhatsApp exige número');
  assert.equal(L.validateStep(4, { ...s, channel: 'call', phone: '' }, D.formDetails).phone, 'f.err.phone');
  assert.equal(L.validateStep(4, { ...s, channel: 'email', phone: '' }, D.formDetails).phone, undefined);
  assert.equal(L.validateStep(4, { ...s, channel: 'email', phone: 'abc' }, D.formDetails).phone, 'f.err.phone', 'si lo escribe, debe ser válido');
  assert.equal(L.validateStep(4, { ...s, consent: 'true' }, D.formDetails).consent, 'f.err.consent', 'solo booleano true');
  assert.equal(L.validateStep(4, { ...s, name: ' a ' }, D.formDetails).name, 'f.err.required');
  assert.equal(L.validateStep(4, { ...s, email: 'mal' }, D.formDetails).email, 'f.err.email');
  assert.equal(L.validateStep(4, { ...s, channel: 'fax' }, D.formDetails).channel, 'f.err.choose');
  assert.equal(L.validateStep(4, { ...s, time: 'night' }, D.formDetails).time, 'f.err.choose');
  assert.deepEqual(L.validateStep(9, s, D.formDetails), {}, 'paso inexistente');
});

test('validateAll junta los errores de todos los pasos', () => {
  const e = L.validateAll({}, D.formDetails);
  for (const k of ['service', 'desc', 'urgency', 'location', 'client', 'name', 'email', 'channel', 'consent']) assert.ok(k in e, k);
  assert.deepEqual(L.validateAll(okState(), D.formDetails), {});
});

test('buildPayload: solo valores permitidos, límites y metadatos', () => {
  const s = okState();
  s.details = { plataforma: ['web', 'evil', 'android'], etapa: 'idea', funciones: 'stock', extra: 'x', __proto__: { polluted: 1 } };
  s.name = 'A'.repeat(200); s.desc = 'd'.repeat(5000); s.email = '  ANA@Empresa.COM.br ';
  const p = L.buildPayload(s, D.formDetails, { lang: 'pt', origin: 'hero<script>', elapsed: 1e9 });
  assert.deepEqual(p.details, { plataforma: ['web', 'android'], etapa: 'idea' });
  assert.equal(p.name.length, 80);
  assert.equal(p.desc.length, 2000);
  assert.equal(p.email, 'ana@empresa.com.br');
  assert.equal(p.lang, 'pt');
  assert.equal(p.elapsed, 86400);
  assert.equal(p.v, 1);
  assert.equal(p.consent, true);
  const bad = L.buildPayload({ service: 'nope', urgency: 'x', location: 'x', budget: 'x', client: 'x', channel: 'x', time: 'x' }, D.formDetails, { lang: 'xx', elapsed: -5 });
  assert.equal(bad.service, 'other'); assert.equal(bad.urgency, 'info'); assert.equal(bad.location, 'uy');
  assert.equal(bad.budget, 'unknown'); assert.equal(bad.client, 'person'); assert.equal(bad.channel, 'email');
  assert.equal(bad.time, 'any'); assert.equal(bad.lang, 'es'); assert.equal(bad.elapsed, 0); assert.equal(bad.consent, false);
  assert.equal(({}).polluted, undefined, 'sin contaminación del prototipo');
});

test('suggestedUrgency marca urgente los incidentes y servidores caídos', () => {
  assert.equal(L.suggestedUrgency({ service: 'sec', details: { estado: 'incidente' } }), 'now');
  assert.equal(L.suggestedUrgency({ service: 'infra', details: { situacion: 'problema' } }), 'now');
  assert.equal(L.suggestedUrgency({ service: 'sec', details: { estado: 'prevenir' } }), '');
  assert.equal(L.suggestedUrgency({ service: 'dev' }), '');
  assert.equal(L.suggestedUrgency(null), '');
});
