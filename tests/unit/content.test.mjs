// Consistencia del contenido: traducciones completas, datos válidos y
// coincidencia exacta entre las opciones del formulario y las que acepta el servidor.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadSiteData, SITE } from '../helpers/browser-data.mjs';
import { loadGas } from '../helpers/gas.mjs';

const raw = loadSiteData();
const { L, CFG } = raw;
const I18N = JSON.parse(JSON.stringify(raw.I18N));
const D = JSON.parse(JSON.stringify(raw.D));
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const LANGS = ['es', 'pt', 'en'];

test('las tres lenguas tienen exactamente las mismas claves', () => {
  const es = Object.keys(I18N.es).sort();
  for (const l of ['pt', 'en']) assert.deepEqual(Object.keys(I18N[l]).sort(), es, l);
});

test('ninguna traducción vacía salvo la cita en portugués (se muestra el original)', () => {
  for (const l of LANGS) for (const [k, v] of Object.entries(I18N[l])) {
    if (l === 'pt' && k === 'quote.tr') continue;
    assert.ok(typeof v === 'string' && v.trim().length > 0, `${l}.${k}`);
  }
});

test('cada data-i18n del HTML existe en el diccionario', () => {
  const keys = [...html.matchAll(/data-i18n(?:-aria|-ph|-alt)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 100);
  for (const k of keys) assert.ok(k in I18N.es, k);
});

test('las claves usadas desde JavaScript existen', () => {
  const js = ['app.js', 'form.js'].map(f => fs.readFileSync(path.join(SITE, 'assets/js', f), 'utf8')).join('\n');
  const keys = new Set([...js.matchAll(/\bt\("([a-z0-9.]+)"\)/gi)].map(m => m[1]));
  for (const k of ['work.s.prod', 'work.f.servers', 'f.err.choose', 'f.err.desc', 'f.err.consent', 'f.err.phone', 'f.err.email', 'f.err.required', 'f.err.rate']) keys.add(k);
  for (const k of keys) assert.ok(k in I18N.es, k);
});

test('todos los textos de datos tienen es, pt y en', () => {
  const check = (obj, where) => { for (const l of LANGS) assert.ok(typeof obj[l] === 'string' && obj[l].length, `${where}.${l}`); };
  D.services.forEach(s => { check(s.t, s.id + '.t'); check(s.d, s.id + '.d'); LANGS.forEach(l => assert.equal(s.items[l].length, 3, s.id)); });
  D.layers.forEach(x => { check(x.t, x.id); check(x.s, x.id); check(x.d, x.id); });
  D.dev.forEach(x => { check(x.t, x.id); check(x.d, x.id); LANGS.forEach(l => assert.equal(x.ex[l].length, 3)); });
  D.projects.forEach(p => ['t', 's', 'p', 'so', 'r'].forEach(k => check(p[k], p.id + '.' + k)));
  D.timeline.forEach((x, i) => { check(x.t, 'tl' + i); check(x.o, 'tl' + i); });
  Object.entries(D.formDetails).forEach(([sv, qs]) => qs.forEach(q => { check(q.q, sv + '.' + q.id); q.o.forEach(o => typeof o[1] === 'object' && check(o[1], sv + '.' + q.id + '.' + o[0])); }));
  Object.entries(D.descPlaceholder).forEach(([k, v]) => check(v, 'ph.' + k));
});

test('proyectos: ids únicos, estados y categorías válidas, enlaces https', () => {
  const ids = D.projects.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of D.projects) {
    assert.ok(['prod', 'lab', 'tool', 'wip', 'design'].includes(p.status), p.id);
    assert.ok(p.cats.length && p.cats.every(c => ['servers', 'dev', 'sec', 'auto', 'net'].includes(c)), p.id);
    for (const u of [p.repo, p.live].filter(Boolean)) assert.match(u, /^https:\/\/(github\.com|utu-tranqueras\.github\.io)\//, p.id);
    assert.ok(p.stack.length >= 2, p.id);
  }
  for (const f of ['servers', 'dev', 'sec', 'auto', 'net']) assert.ok(D.projects.some(p => p.cats.includes(f)), 'filtro vacío: ' + f);
});

test('privacidad: el sitio no publica teléfono, cédula ni el nombre del free shop', () => {
  const all = fs.readdirSync(path.join(SITE, 'assets/js')).map(f => fs.readFileSync(path.join(SITE, 'assets/js', f), 'utf8')).join('\n') + html;
  assert.doesNotMatch(all, /92\s?175\s?096|175096/);
  assert.doesNotMatch(all, /gonzardem@gmail|gonzardem11/);
  assert.doesNotMatch(all, /M[oó]vilY[aá]|CentralRV|Ecogrup/i, 'la app de taxis no se nombra');
  assert.doesNotMatch(all, /c[eé]dula|\bC\.I\.\s?\d|\d\.\d{3}\.\d{3}-\d/i);
});

test('las opciones del formulario coinciden con las que acepta Apps Script', () => {
  const gas = loadGas();
  const DETAILS = JSON.parse(JSON.stringify(gas.ctx.DETAILS)); const LISTS = JSON.parse(JSON.stringify(gas.ctx.LISTS));
  assert.deepEqual(Object.keys(DETAILS).sort(), Object.keys(D.formDetails).sort());
  for (const [sv, qs] of Object.entries(D.formDetails)) {
    assert.deepEqual(qs.map(q => q.id).sort(), Object.keys(DETAILS[sv]).sort(), sv);
    for (const q of qs) {
      const g = DETAILS[sv][q.id];
      assert.equal(g.type, q.type, sv + '.' + q.id);
      assert.equal(g.req, !!q.req, sv + '.' + q.id + ' obligatorio');
      assert.deepEqual(q.o.map(o => o[0]).sort(), Object.keys(g.o).sort(), sv + '.' + q.id);
    }
  }
  assert.deepEqual(Object.keys(LISTS.service).sort(), [...L.SERVICES].sort());
  for (const [k, arr] of [['urgency', L.URGENCY], ['location', L.LOCATION], ['budget', L.BUDGET], ['client', L.CLIENT], ['channel', L.CHANNEL], ['time', L.TIME], ['lang', L.LANGS]])
    assert.deepEqual(Object.keys(LISTS[k]).sort(), [...arr].sort(), k);
  const radios = (name) => [...html.matchAll(new RegExp(`name="${name}" value="([^"]+)"`, 'g'))].map(m => m[1]).sort();
  assert.deepEqual(radios('urgency'), [...L.URGENCY].sort());
  assert.deepEqual(radios('location'), [...L.LOCATION].sort());
  assert.deepEqual(radios('client'), [...L.CLIENT].sort());
  assert.deepEqual(radios('channel'), [...L.CHANNEL].sort());
});

test('configuración: sin URL de API por defecto y objeto congelado', () => {
  assert.equal(CFG.API_URL, '');
  assert.ok(Object.isFrozen(CFG));
});
