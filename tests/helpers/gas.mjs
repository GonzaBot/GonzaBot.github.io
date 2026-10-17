// Entorno simulado de Google Apps Script para ejecutar Code.gs en Node.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const CODE_PATH = path.resolve(here, '../../apps-script/Code.gs');

export function makeSheet(name) {
  return {
    name, rows: [], validations: [], cf: [],
    appendRow(r) { this.rows.push(r.slice()); },
    getLastRow() { return this.rows.length; },
    getRange(a, b, c, d) {
      const sheet = this;
      const api = {
        setValues(v) { if (typeof a === 'number' && a === 1) { v.forEach((row, i) => { sheet.rows[i] = row.slice(); }); } return api; },
        getValues() { return sheet.rows.slice(a - 1, a - 1 + c).map(r => r.slice(0, d)); },
        setFontWeight() { return api; }, setBackground() { return api; }, setFontColor() { return api; },
        setNumberFormat() { return api; }, setWrap() { return api; }, setDataValidation(v) { sheet.validations.push(v); return api; },
        insertCheckboxes() { return api; }, setFontSize() { return api; }
      };
      return api;
    },
    getDataRange() { const s = this; return { getValues() { return s.rows.map(r => r.slice()); } }; },
    setFrozenRows() {}, setFrozenColumns() {}, setColumnWidth() {}, clear() { this.rows = []; },
    getConditionalFormatRules() { return this.cf; }, setConditionalFormatRules(r) { this.cf = r; }
  };
}

export function loadGas(opts = {}) {
  const sheets = {};
  const ss = {
    getSheetByName(n) { return sheets[n] || null; },
    insertSheet(n) { sheets[n] = makeSheet(n); return sheets[n]; },
    getSheets() { return Object.values(sheets); },
    deleteSheet(s) { delete sheets[s.name]; },
    setActiveSheet() {}, setSpreadsheetTimeZone() {}
  };
  const cache = new Map();
  const props = new Map(Object.entries(opts.props || {}));
  const mail = []; const fetches = []; const logs = []; const triggers = [];
  let lockHeld = false; let lockWaits = 0;
  const builder = () => { const b = { requireValueInList() { return b; }, setAllowInvalid() { return b; }, build() { return { kind: 'dv' }; },
    whenTextEqualTo() { return b; }, setBackground() { return b; }, setFontColor() { return b; }, setRanges() { return b; }, setBold() { return b; } }; return b; };
  const ctx = {
    console: { error: (...a) => logs.push(['error', ...a]), log: (...a) => logs.push(['log', ...a]) },
    Logger: { log: (...a) => logs.push(['logger', ...a]) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(s) { return { content: s, mime: null, setMimeType(m) { this.mime = m; return this; }, getContent() { return this.content; } }; }
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeHmacSha256Signature(v, key) { return Array.from(crypto.createHmac('sha256', String(key)).update(String(v), 'utf8').digest()).map(b => b > 127 ? b - 256 : b); },
      base64EncodeWebSafe(bytes) { return Buffer.from(bytes.map(b => b < 0 ? b + 256 : b)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); },
      getUuid() { return crypto.randomUUID(); },
      computeDigest(alg, s) { return Array.from(crypto.createHash('sha256').update(String(s), 'utf8').digest()).map(b => b > 127 ? b - 256 : b); },
      formatDate(d, tz, pat) {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map(p => [p.type, p.value]));
        return pat.replace('yyyy', parts.year).replace('yy', parts.year.slice(2)).replace('MM', parts.month).replace('dd', parts.day).replace('HH', parts.hour === '24' ? '00' : parts.hour).replace('mm', parts.minute);
      }
    },
    Session: { getEffectiveUser() { return { getEmail() { return 'owner@example.com'; } }; } },
    CacheService: { getScriptCache() { return {
      get(k) { const v = cache.get(k); return v ? v.value : null; },
      put(k, v, ttl) { if (typeof v !== 'string') throw new Error('cache value must be string'); if (ttl > 21600) throw new Error('ttl too long'); cache.set(k, { value: v, ttl }); }
    }; } },
    LockService: { getScriptLock() { return {
      waitLock(ms) { lockWaits++; if (opts.lockFails) throw new Error('Lock timeout'); if (lockHeld) throw new Error('lock already held'); lockHeld = true; },
      releaseLock() { lockHeld = false; }
    }; } },
    PropertiesService: { getScriptProperties() { return {
      getProperty(k) { return props.has(k) ? props.get(k) : null; },
      setProperty(k, v) { props.set(k, String(v)); }
    }; } },
    SpreadsheetApp: {
      getActive() { return ss; },
      newDataValidation: builder, newConditionalFormatRule: builder
    },
    ScriptApp: {
      getProjectTriggers() { return triggers.slice(); }, deleteTrigger(t) { triggers.splice(triggers.indexOf(t), 1); },
      newTrigger(fn) { const b = { timeBased() { return b; }, atHour() { return b; }, everyDays() { return b; }, inTimezone() { return b; }, create() { const t = { getHandlerFunction: () => fn }; triggers.push(t); return t; } }; return b; }
    },
    MailApp: { sendEmail(o) { if (opts.mailFails) throw new Error('quota'); mail.push(o); }, getRemainingDailyQuota() { return opts.quota ?? 100; } },
    UrlFetchApp: { fetch(u, o) { fetches.push({ u, o }); return { getResponseCode: () => 200 }; } },
    Date, JSON, Math, Number, String, Array, Object, RegExp, Error, encodeURIComponent
  };
  vm.createContext(ctx);
  const code = fs.readFileSync(CODE_PATH, 'utf8');
  vm.runInContext(code, ctx, { filename: CODE_PATH });
  if (!opts.noSheet) { ss.insertSheet('Contactos'); }
  return { ctx, sheets, ss, cache, props, mail, fetches, logs, triggers, get lockWaits() { return lockWaits; } };
}

/* Agrega un token firmado válido (60 s de antigüedad) salvo que el cuerpo ya traiga "t". */
export function token(env, ageMs = 60000) { const ts = String(Date.now() - ageMs); return ts + '.' + env.ctx.sign_(ts); }
export function post(env, body) {
  if (body && typeof body === 'object' && !Array.isArray(body) && !('t' in body)) body = Object.assign({}, body, { t: token(env) });
  const contents = typeof body === 'string' ? body : JSON.stringify(body);
  const out = env.ctx.doPost({ postData: { contents } });
  return JSON.parse(out.getContent());
}

export function validLead(over = {}) {
  return Object.assign({
    v: 1, service: 'infra',
    details: { situacion: 'nuevo', donde: 'nube', uso: ['web', 'bd'], usuarios: '6-20' },
    desc: 'Necesitamos un servidor para el sistema de facturación con respaldo.',
    urgency: 'month', location: 'rivera', budget: '2', client: 'company',
    name: 'María Pereira', company: 'Comercial del Norte', email: 'maria@empresa.com.uy', phone: '',
    channel: 'email', time: 'any', consent: true, lang: 'es', origin: 'hero', elapsed: 60, website: ''
  }, over);
}
