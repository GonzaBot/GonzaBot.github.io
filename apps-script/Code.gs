/**
 * Rodríguez de Mello Sistemas — receptor del formulario de presupuesto.
 *
 * Qué hace con cada pedido:
 *   1. Valida todo de nuevo (no confía en el navegador) y descarta bots.
 *   2. Limita envíos repetidos por correo y por hora.
 *   3. Le asigna un número de seguimiento (RDM-AAMM-0001).
 *   4. Calcula prioridad (Alta / Media / Baja) y la próxima acción con fecha límite.
 *   5. Lo guarda en la hoja "Contactos" con un resumen legible.
 *   6. Te avisa por correo (y por Telegram si lo configurás).
 *   7. Le manda al cliente una confirmación en su idioma.
 *
 * Instalación: ver README.md (pasos 1 a 6). Primero ejecutá la función setup().
 */

var CONFIG = {
  OWNER_EMAIL: "",            // vacío = la cuenta dueña del script
  BRAND: "Rodríguez de Mello Sistemas",
  ID_PREFIX: "RDM",
  SHEET_LEADS: "Contactos",
  SHEET_CONFIG: "Config",
  SHEET_PANEL: "Panel",
  MAX_BODY: 20000,            // bytes máximos aceptados por envío
  MAX_PER_EMAIL: 3,           // envíos por correo en la ventana
  EMAIL_WINDOW_SEC: 600,      // 10 minutos
  MAX_PER_HOUR: 40,           // envíos totales por hora
  MIN_ELAPSED_SEC: 4,         // menos que esto = probablemente un bot
  TOKEN_MAX_AGE_H: 24,        // validez del token firmado del formulario
  REPLY_WINDOW_SEC: 21600,    // una autorrespuesta por destinatario cada 6 h
  DUPLICATE_WINDOW_SEC: 600,  // reenvíos idénticos dentro de 10 min devuelven el mismo número
  MAIL_RESERVE: 10,           // cuota diaria reservada para avisos al dueño
  TIMEZONE: "America/Montevideo"
};

var HEADERS = ["Fecha", "ID", "Estado", "Prioridad", "Puntaje", "Próxima acción", "Servicio", "Resumen", "Descripción",
  "Urgencia", "Ubicación", "Presupuesto", "Tipo de cliente", "Nombre", "Empresa", "Email", "Teléfono", "Canal",
  "Horario", "Idioma", "Origen", "Segundos", "Notas"];

var ESTADOS = ["Nuevo", "Contactado", "Presupuesto enviado", "Ganado", "Perdido", "Revisar (posible spam)"];

/* Valores permitidos y su texto en español para la planilla. Debe coincidir con data.js. */
var LISTS = {
  service: { infra: "Servidores e infraestructura", dev: "Desarrollo web, escritorio y mobile", support: "Soporte y mantenimiento de TI",
    auto: "Automatización de procesos", sec: "Ciberseguridad", train: "Capacitación", other: "Otra cosa" },
  urgency: { now: "Lo antes posible", month: "Este mes", quarter: "Próximos 3 meses", info: "Solo averiguando" },
  location: { rivera: "Rivera", livramento: "Santana do Livramento", uy: "Otro lugar de Uruguay", abroad: "Otro país" },
  budget: { unknown: "No sabe", "1": "< US$ 300", "2": "US$ 300–1.000", "3": "US$ 1.000–3.000", "4": "> US$ 3.000" },
  client: { company: "Empresa o comercio", pro: "Profesional independiente", inst: "Institución", person: "Particular" },
  channel: { email: "Correo", whatsapp: "WhatsApp", call: "Llamada" },
  time: { any: "Cualquier horario", morning: "Mañana", afternoon: "Tarde" },
  lang: { es: "Español", pt: "Português", en: "English" }
};

var DETAILS = {
  infra: {
    situacion: { label: "Situación", type: "radio", req: true, o: { nuevo: "No tiene servidor", mejorar: "Mejorar o asegurar", problema: "Problema ahora" } },
    donde: { label: "Dónde", type: "radio", req: true, o: { local: "Equipo de la empresa", nube: "Nube", nose: "No sabe" } },
    uso: { label: "Uso", type: "check", req: true, o: { gestion: "Gestión", web: "Web", archivos: "Archivos", bd: "Base de datos", camaras: "Cámaras", otro: "Otro" } },
    usuarios: { label: "Usuarios", type: "select", req: false, o: { "1-5": "1–5", "6-20": "6–20", "21-50": "21–50", "50+": "50+" } }
  },
  dev: {
    plataforma: { label: "Plataforma", type: "check", req: true, o: { web: "Web", escritorio: "Escritorio", android: "Android", iphone: "iPhone" } },
    etapa: { label: "Etapa", type: "radio", req: true, o: { idea: "Idea", diseno: "Tiene diseño", existe: "Ya existe" } },
    funciones: { label: "Funciones", type: "check", req: false, o: { login: "Usuarios", stock: "Stock", ventas: "Ventas", turnos: "Turnos", reportes: "Reportes", pagos: "Pagos", integrar: "Integraciones" } }
  },
  support: {
    equipos: { label: "Equipos", type: "select", req: true, o: { "1-5": "1–5", "6-15": "6–15", "16-40": "16–40", "40+": "40+" } },
    modalidad: { label: "Modalidad", type: "radio", req: true, o: { puntual: "Puntual", mensual: "Mensual", relevamiento: "Relevamiento" } },
    sistemas: { label: "Sistemas", type: "check", req: false, o: { windows: "Windows", linux: "Linux", red: "Red y wifi", pos: "Impresoras/POS", correo: "Correo" } }
  },
  auto: {
    tarea: { label: "Tarea", type: "check", req: true, o: { consultas: "Consultas", correos: "Correos", reportes: "Reportes", carga: "Carga de datos", avisos: "Avisos", otra: "Otra" } },
    herramientas: { label: "Herramientas", type: "check", req: false, o: { whatsapp: "WhatsApp", telegram: "Telegram", correo: "Correo", planillas: "Planillas", sistema: "Sistema propio" } },
    horas: { label: "Horas/semana", type: "select", req: false, o: { "<2": "< 2", "2-5": "2–5", "5-10": "5–10", "10+": "10+" } }
  },
  sec: {
    estado: { label: "Estado", type: "radio", req: true, o: { incidente: "INCIDENTE ACTIVO", sospecha: "Sospecha", prevenir: "Prevenir" } },
    proteger: { label: "Proteger", type: "check", req: true, o: { pcs: "Computadoras", servidor: "Servidor", red: "Red", correo: "Correo", web: "Web", datos: "Datos de clientes" } }
  },
  train: {
    tema: { label: "Tema", type: "check", req: true, o: { seguridad: "Seguridad", ia: "IA", planillas: "Planillas", otro: "Otro" } },
    personas: { label: "Personas", type: "select", req: true, o: { "1-5": "1–5", "6-15": "6–15", "16-30": "16–30", "30+": "30+" } },
    formato: { label: "Formato", type: "radio", req: true, o: { presencial: "Presencial", virtual: "Virtual", indistinto: "Indistinto" } }
  },
  other: {}
};

/* ---------------------------------------------------------------- utilidades */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function has_(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

function clean_(value, max, multiline) {
  var s = String(value === undefined || value === null ? "" : value);
  s = multiline
    ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    : s.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, " ");
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s.slice(0, max);
}

function isEmail_(s) {
  s = String(s || "");
  if (s.length < 6 || s.length > 254) { return false; }
  var at = s.indexOf("@");
  if (at < 1 || at !== s.lastIndexOf("@")) { return false; }
  var local = s.slice(0, at);
  var labels = s.slice(at + 1).split(".");
  if (!/^[A-Za-z0-9._%+'-]{1,64}$/.test(local) || labels.length < 2) { return false; }
  for (var i = 0; i < labels.length; i++) {
    if (!/^[A-Za-z0-9-]{1,63}$/.test(labels[i]) || labels[i].charAt(0) === "-" || labels[i].charAt(labels[i].length - 1) === "-") { return false; }
  }
  return /^[A-Za-z]{2,24}$/.test(labels[labels.length - 1]);
}

function isPhone_(s) {
  s = String(s || "").trim();
  var digits = s.replace(/\D/g, "");
  return /^[+0-9 ().-]{6,30}$/.test(s) && digits.length >= 6 && digits.length <= 15;
}

/* Evita que un texto que empieza con = + - @ se ejecute como fórmula en la planilla. */
function cell_(v) {
  var s = String(v === undefined || v === null ? "" : v);
  return /^[=+\-@\t\r|%]/.test(s) ? "'" + s : s;
}

function esc_(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function hash_(s) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s));
  return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? "0" + v : v; }).join("").slice(0, 32);
}

/** Normaliza un correo para los límites: minúsculas, sin +etiqueta y sin puntos en Gmail. */
function normEmail_(email) {
  var e = String(email || "").toLowerCase();
  var at = e.lastIndexOf("@");
  if (at < 1) { return e; }
  var local = e.slice(0, at).split("+")[0];
  var domain = e.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") { local = local.replace(/\./g, ""); domain = "gmail.com"; }
  return local + "@" + domain;
}

/** Primer nombre apto para un saludo: solo letras, apóstrofo o guion. Si no, vacío. */
function firstName_(name) {
  var first = String(name || "").trim().split(/\s+/)[0] || "";
  return /^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž][A-Za-zÀ-ÖØ-öø-ÿĀ-ž'’-]{1,29}$/.test(first) ? first : "";
}

function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty("FORM_SECRET");
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty("FORM_SECRET", s); }
  return s;
}

/** Firma HMAC-SHA256 en base64 URL-safe sin relleno. */
function sign_(value) {
  var bytes = Utilities.computeHmacSha256Signature(String(value), secret_());
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, "");
}

function newToken_() {
  var ts = String(Date.now());
  return ts + "." + sign_(ts);
}

/** El token debe estar firmado por este script y tener entre 4 s y 24 h. */
function tokenOk_(token) {
  if (typeof token !== "string" || token.length > 120 || !/^\d{10,13}\.[A-Za-z0-9_-]{20,}$/.test(token)) { return false; }
  var parts = token.split(".");
  var expected = sign_(parts[0]);
  if (expected.length !== parts[1].length) { return false; }
  var diff = 0;
  for (var i = 0; i < expected.length; i++) { diff |= expected.charCodeAt(i) ^ parts[1].charCodeAt(i); }
  if (diff !== 0) { return false; }
  var age = Date.now() - Number(parts[0]);
  return age >= CONFIG.MIN_ELAPSED_SEC * 1000 && age <= CONFIG.TOKEN_MAX_AGE_H * 3600 * 1000;
}

function mailQuota_() {
  try { return MailApp.getRemainingDailyQuota(); } catch (err) { return 0; }
}

function ownerEmail_() {
  return CONFIG.OWNER_EMAIL || Session.getEffectiveUser().getEmail();
}

function fmt_(date, pattern) {
  return Utilities.formatDate(date, CONFIG.TIMEZONE, pattern);
}

/* ---------------------------------------------------------------- validación */

/** Devuelve {ok:true, lead:{...}} o {ok:false, errors:[...]} */
function validate_(d) {
  var errors = [];
  if (!d || typeof d !== "object" || Array.isArray(d)) { return { ok: false, errors: ["body"] }; }
  if (d.v !== 1) { errors.push("version"); }
  var service = has_(LISTS.service, d.service) ? d.service : null;
  if (!service) { errors.push("service"); service = "other"; }

  var details = {};
  var spec = DETAILS[service] || {};
  var rawDetails = (d.details && typeof d.details === "object" && !Array.isArray(d.details)) ? d.details : {};
  Object.keys(rawDetails).forEach(function (k) { if (!has_(spec, k)) { errors.push("detail:" + k); } });
  Object.keys(spec).forEach(function (k) {
    var q = spec[k];
    var v = rawDetails[k];
    if (q.type === "check") {
      var arr = Array.isArray(v) ? v.filter(function (x) { return typeof x === "string" && has_(q.o, x); }) : [];
      if (Array.isArray(v) && arr.length !== v.length) { errors.push("detail:" + k); }
      if (q.req && !arr.length) { errors.push("detail:" + k); }
      if (arr.length) { details[k] = arr.filter(function (x, i) { return arr.indexOf(x) === i; }).slice(0, 12); }
    } else {
      if (v !== undefined && v !== "" && !(typeof v === "string" && has_(q.o, v))) { errors.push("detail:" + k); }
      else if (q.req && !(typeof v === "string" && has_(q.o, v))) { errors.push("detail:" + k); }
      else if (typeof v === "string" && has_(q.o, v)) { details[k] = v; }
    }
  });

  var lead = {
    service: service,
    details: details,
    desc: clean_(d.desc, 2000, true),
    urgency: d.urgency, location: d.location, budget: d.budget === undefined ? "unknown" : d.budget,
    client: d.client, channel: d.channel, time: d.time === undefined ? "any" : d.time, lang: d.lang,
    name: clean_(d.name, 80),
    company: clean_(d.company, 100),
    email: clean_(d.email, 254).toLowerCase(),
    phone: clean_(d.phone, 30),
    origin: clean_(d.origin, 40).replace(/[^a-z0-9_-]/gi, ""),
    elapsed: Math.max(0, Math.min(86400, Math.round(Number(d.elapsed) || 0)))
  };

  ["urgency", "location", "budget", "client", "channel", "time", "lang"].forEach(function (k) {
    if (!(typeof lead[k] === "string" && has_(LISTS[k], lead[k]))) { errors.push(k); }
  });
  if (lead.desc.length < 20) { errors.push("desc"); }
  if (lead.name.length < 2) { errors.push("name"); }
  if (!isEmail_(lead.email)) { errors.push("email"); }
  if ((lead.channel === "whatsapp" || lead.channel === "call") && !isPhone_(lead.phone)) { errors.push("phone"); }
  else if (lead.phone && !isPhone_(lead.phone)) { errors.push("phone"); }
  if (d.consent !== true) { errors.push("consent"); }

  return errors.length ? { ok: false, errors: errors } : { ok: true, lead: lead };
}

/* ---------------------------------------------------------------- reglas de negocio */

function isIncident_(lead) {
  return (lead.service === "sec" && lead.details.estado === "incidente") ||
    (lead.service === "infra" && lead.details.situacion === "problema");
}

/** Puntaje de 0 a 100 y etiqueta de prioridad. */
function score_(lead) {
  var s = 0;
  s += { now: 40, month: 25, quarter: 12, info: 0 }[lead.urgency] || 0;
  s += { "4": 25, "3": 20, "2": 12, "1": 5, unknown: 8 }[lead.budget] || 0;
  s += { company: 10, inst: 10, pro: 6, person: 2 }[lead.client] || 0;
  s += { rivera: 8, livramento: 8, uy: 5, abroad: 5 }[lead.location] || 0;
  if (isIncident_(lead)) { s += 25; }
  if (lead.service === "support" && lead.details.modalidad === "mensual") { s += 8; }
  if (lead.service === "infra" || lead.service === "dev") { s += 4; }
  s = Math.max(0, Math.min(100, s));
  var label = s >= 60 ? "Alta" : (s >= 35 ? "Media" : "Baja");
  return { score: s, label: label };
}

/** Qué hacer y para cuándo, según urgencia, incidente y canal. */
function nextAction_(lead, now) {
  var hours = isIncident_(lead) ? 2 : ({ now: 4, month: 24, quarter: 48, info: 72 }[lead.urgency] || 48);
  var due = new Date(now.getTime() + hours * 3600 * 1000);
  var how = { email: "Responder por correo", whatsapp: "Escribir por WhatsApp", call: "Llamar" }[lead.channel] || "Responder";
  return how + " antes del " + fmt_(due, "dd/MM HH:mm");
}

/** Resumen de una línea para la planilla y los avisos. */
function summary_(lead) {
  var parts = [LISTS.service[lead.service]];
  var spec = DETAILS[lead.service] || {};
  Object.keys(spec).forEach(function (k) {
    var v = lead.details[k];
    if (v === undefined) { return; }
    var names = (Array.isArray(v) ? v : [v]).map(function (x) { return spec[k].o[x]; });
    parts.push(spec[k].label + ": " + names.join(", "));
  });
  return parts.join(" · ");
}

/* ---------------------------------------------------------------- límites */

function rateLimited_(email) {
  var cache = CacheService.getScriptCache();
  var hourKey = "h:" + fmt_(new Date(), "yyyyMMddHH");
  var emailKey = "e:" + hash_(normEmail_(email));
  var hourCount = Number(cache.get(hourKey) || 0);
  var emailCount = Number(cache.get(emailKey) || 0);
  if (hourCount >= CONFIG.MAX_PER_HOUR || emailCount >= CONFIG.MAX_PER_EMAIL) { return true; }
  cache.put(hourKey, String(hourCount + 1), 3600);
  cache.put(emailKey, String(emailCount + 1), CONFIG.EMAIL_WINDOW_SEC);
  return false;
}

function nextId_(now) {
  var props = PropertiesService.getScriptProperties();
  var period = fmt_(now, "yyMM");
  var key = "seq_" + period;
  var n = Number(props.getProperty(key) || 0) + 1;
  props.setProperty(key, String(n));
  return CONFIG.ID_PREFIX + "-" + period + "-" + ("000" + n).slice(-4);
}

/* ---------------------------------------------------------------- entrada */

function doPost(e) {
  try {
    var body = e && e.postData && typeof e.postData.contents === "string" ? e.postData.contents : "";
    if (!body || body.length > CONFIG.MAX_BODY) { return json_({ ok: false, error: "invalid" }); }
    var data;
    try { data = JSON.parse(body); } catch (err) { return json_({ ok: false, error: "invalid" }); }
    if (!data || typeof data !== "object" || Array.isArray(data)) { return json_({ ok: false, error: "invalid" }); }

    // Trampa para bots: el campo oculto viene lleno. Respondemos como si nada, con un número creíble.
    if (typeof data.website === "string" && data.website.trim() !== "") {
      return json_({ ok: true, id: CONFIG.ID_PREFIX + "-" + fmt_(new Date(), "yyMM") + "-" + String(1000 + Math.floor(Math.random() * 9000)) });
    }

    var v = validate_(data);
    if (!v.ok) { return json_({ ok: false, error: "invalid", fields: v.errors.slice(0, 20) }); }
    var lead = v.lead;

    // Reenvío idéntico (doble clic, reintento o replay): mismo número, sin duplicar.
    var cache = CacheService.getScriptCache();
    var dupKey = "d:" + hash_(normEmail_(lead.email) + "|" + lead.service + "|" + lead.desc);
    var prev = cache.get(dupKey);
    if (prev) { return json_({ ok: true, id: prev }); }

    if (rateLimited_(lead.email)) { return json_({ ok: false, error: "rate" }); }

    var suspicious = lead.elapsed < CONFIG.MIN_ELAPSED_SEC || !tokenOk_(data.t);
    var now = new Date();
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    var id;
    try {
      id = nextId_(now);
      saveLead_(id, lead, now, suspicious);
    } finally {
      lock.releaseLock();
    }
    cache.put(dupKey, id, CONFIG.DUPLICATE_WINDOW_SEC);

    if (!suspicious) {
      safely_(function () { notifyOwner_(id, lead, now); });
      safely_(function () { replyClient_(id, lead); });
      safely_(function () { notifyTelegram_(id, lead); });
    }
    return json_({ ok: true, id: id });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: "server" });
  }
}

/* Un aviso que falla (cuota, red) no debe hacer fallar un pedido ya guardado. */
function safely_(fn) {
  try { fn(); } catch (err) { console.error(err && err.stack ? err.stack : err); }
}

function doGet(e) {
  var action = e && e.parameter ? String(e.parameter.action || "") : "";
  if (action === "config") {
    var cfg = readConfig_();
    return json_({ available: cfg.available, t: newToken_() });
  }
  return json_({ ok: true });
}

function readConfig_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("config");
  if (hit) { try { return JSON.parse(hit); } catch (err) { /* recalcula */ } }
  var out = { available: true };
  var sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_CONFIG);
  if (sh) {
    sh.getDataRange().getValues().forEach(function (row) {
      if (String(row[0]).trim() === "disponible") {
        var val = row[1];
        out.available = !(val === false || String(val).toUpperCase() === "FALSE" || String(val).toUpperCase() === "NO");
      }
    });
  }
  cache.put("config", JSON.stringify(out), 300);
  return out;
}

/* ---------------------------------------------------------------- planilla */

function saveLead_(id, lead, now, suspicious) {
  var sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_LEADS);
  if (!sh) { throw new Error("Falta la hoja " + CONFIG.SHEET_LEADS + ". Ejecutá setup()."); }
  var pr = score_(lead);
  var row = [
    now, id, suspicious ? ESTADOS[5] : ESTADOS[0], pr.label, pr.score, nextAction_(lead, now),
    LISTS.service[lead.service], summary_(lead), lead.desc,
    LISTS.urgency[lead.urgency], LISTS.location[lead.location], LISTS.budget[lead.budget], LISTS.client[lead.client],
    lead.name, lead.company, lead.email, lead.phone, LISTS.channel[lead.channel], LISTS.time[lead.time],
    LISTS.lang[lead.lang], lead.origin, lead.elapsed, ""
  ].map(function (v, i) { return (i === 0 || i === 4 || i === 21) ? v : cell_(v); });
  sh.appendRow(row);
}

/* ---------------------------------------------------------------- avisos */

function notifyOwner_(id, lead, now) {
  if (mailQuota_() < 1) { return; }
  var pr = score_(lead);
  var incident = isIncident_(lead);
  var subject = (incident ? "[INCIDENTE] " : "[" + pr.label + "] ") + id + " · " + LISTS.service[lead.service] + " · " + (lead.company || lead.name);
  var rows = [
    ["Prioridad", pr.label + " (" + pr.score + "/100)"],
    ["Próxima acción", nextAction_(lead, now)],
    ["Resumen", summary_(lead)],
    ["Descripción", lead.desc],
    ["Urgencia", LISTS.urgency[lead.urgency]],
    ["Ubicación", LISTS.location[lead.location]],
    ["Presupuesto", LISTS.budget[lead.budget]],
    ["Cliente", LISTS.client[lead.client]],
    ["Nombre", lead.name],
    ["Empresa", lead.company || "—"],
    ["Email", lead.email],
    ["Teléfono", lead.phone || "—"],
    ["Canal", LISTS.channel[lead.channel] + " · " + LISTS.time[lead.time]],
    ["Idioma", LISTS.lang[lead.lang]]
  ];
  var text = rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
  var html = "<div style=\"font-family:Arial,sans-serif;font-size:14px;color:#0E1726\">" +
    "<h2 style=\"margin:0 0 12px\">" + esc_(id) + "</h2><table cellpadding=\"6\" style=\"border-collapse:collapse\">" +
    rows.map(function (r) {
      return "<tr><td style=\"color:#4A5A6C;vertical-align:top;white-space:nowrap\">" + esc_(r[0]) + "</td><td style=\"white-space:pre-wrap\">" + esc_(r[1]) + "</td></tr>";
    }).join("") + "</table></div>";
  MailApp.sendEmail({ to: ownerEmail_(), replyTo: lead.email, subject: subject, body: text, htmlBody: html, name: CONFIG.BRAND });
}

var REPLY = {
  es: { s: "Recibí tu pedido", hi: "Hola", l1: "Gracias por escribirme. Recibí tu pedido de presupuesto sobre:", l2: "Tu número de seguimiento es", l3: "Te respondo en un día hábil por el canal que elegiste. Si querés agregar algo, respondé este correo.", bye: "Saludos" },
  pt: { s: "Recebi seu pedido", hi: "Olá", l1: "Obrigado pelo contato. Recebi seu pedido de orçamento sobre:", l2: "Seu número de acompanhamento é", l3: "Respondo em um dia útil pelo canal que você escolheu. Se quiser acrescentar algo, responda este e-mail.", bye: "Abraço" },
  en: { s: "I got your request", hi: "Hi", l1: "Thanks for reaching out. I received your quote request about:", l2: "Your tracking number is", l3: "I'll reply within one business day through the channel you chose. To add anything, just reply to this email.", bye: "Best regards" }
};
var SERVICE_NAMES = {
  pt: { infra: "Servidores e infraestrutura", dev: "Desenvolvimento web, desktop e mobile", support: "Suporte e manutenção de TI", auto: "Automação de processos", sec: "Cibersegurança", train: "Capacitação", other: "Outro assunto" },
  en: { infra: "Servers and infrastructure", dev: "Web, desktop and mobile development", support: "IT support and maintenance", auto: "Process automation", sec: "Cybersecurity", train: "Training", other: "Something else" }
};

function replyClient_(id, lead) {
  if (mailQuota_() <= CONFIG.MAIL_RESERVE) { return; }
  var cache = CacheService.getScriptCache();
  var replyKey = "r:" + hash_(normEmail_(lead.email));
  if (cache.get(replyKey)) { return; }
  cache.put(replyKey, "1", CONFIG.REPLY_WINDOW_SEC);
  var R = REPLY[lead.lang] || REPLY.es;
  var service = lead.lang === "es" ? LISTS.service[lead.service] : SERVICE_NAMES[lead.lang][lead.service];
  var first = firstName_(lead.name);
  var greet = first ? R.hi + " " + first : R.hi;
  var text = greet + ",\n\n" + R.l1 + "\n" + service + "\n\n" + R.l2 + " " + id + ".\n\n" + R.l3 + "\n\n" + R.bye + ",\nGonzalo Rodríguez de Mello\n" + CONFIG.BRAND;
  var html = "<div style=\"font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#0E1726;max-width:560px\">" +
    "<p>" + esc_(greet) + ",</p><p>" + esc_(R.l1) + "<br><b>" + esc_(service) + "</b></p>" +
    "<p>" + esc_(R.l2) + " <b style=\"font-family:monospace;font-size:16px\">" + esc_(id) + "</b>.</p>" +
    "<p>" + esc_(R.l3) + "</p><p>" + esc_(R.bye) + ",<br>Gonzalo Rodríguez de Mello<br><span style=\"color:#1A5DC8\">" + esc_(CONFIG.BRAND) + "</span></p></div>";
  MailApp.sendEmail({ to: lead.email, replyTo: ownerEmail_(), subject: R.s + " · " + id, body: text, htmlBody: html, name: CONFIG.BRAND });
}

function notifyTelegram_(id, lead) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TELEGRAM_TOKEN");
  var chat = props.getProperty("TELEGRAM_CHAT_ID");
  if (!token || !chat) { return; }
  var pr = score_(lead);
  var text = (isIncident_(lead) ? "🚨 INCIDENTE\n" : "") + id + " · " + pr.label + "\n" + summary_(lead) + "\n" +
    lead.name + (lead.company ? " (" + lead.company + ")" : "") + "\n" + LISTS.channel[lead.channel] + ": " + (lead.phone || lead.email);
  UrlFetchApp.fetch("https://api.telegram.org/bot" + encodeURIComponent(token) + "/sendMessage", {
    method: "post", payload: { chat_id: chat, text: text.slice(0, 3500), disable_web_page_preview: "true" }, muteHttpExceptions: true
  });
}

/* ---------------------------------------------------------------- recordatorio diario */

/** Te avisa a las 8:00 los pedidos que siguen en "Nuevo" y vencieron su plazo. */
function recordatorioDiario() {
  var sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_LEADS);
  if (!sh || sh.getLastRow() < 2) { return; }
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();
  var limit = Date.now() - 24 * 3600 * 1000;
  var pending = values.filter(function (r) { return r[2] === "Nuevo" && r[0] instanceof Date && r[0].getTime() < limit; });
  var review = values.filter(function (r) { return r[2] === ESTADOS[5] && r[0] instanceof Date && r[0].getTime() > Date.now() - 48 * 3600 * 1000; });
  if (!pending.length && !review.length) { return; }
  var line = function (r) { return r[1] + " · " + r[3] + " · " + r[6] + " · " + r[13] + " · " + r[5]; };
  var text = "";
  if (pending.length) { text += "Pedidos sin responder hace más de 24 h:\n\n" + pending.map(line).join("\n") + "\n\n"; }
  if (review.length) { text += "Pedidos marcados para revisar (posible spam) en las últimas 48 h. Si alguno es real, cambiá su estado a Nuevo:\n\n" + review.map(line).join("\n"); }
  MailApp.sendEmail({ to: ownerEmail_(), subject: "Pendientes: " + pending.length + " sin responder, " + review.length + " para revisar", body: text, name: CONFIG.BRAND });
}

/* ---------------------------------------------------------------- instalación */

/** Ejecutar una sola vez desde el editor: crea hojas, formatos, panel y recordatorio. */
function setup() {
  secret_();
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  var sh = ss.getSheetByName(CONFIG.SHEET_LEADS) || ss.insertSheet(CONFIG.SHEET_LEADS);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold").setBackground("#0E1726").setFontColor("#FFFFFF");
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  sh.getRange("A:A").setNumberFormat("dd/MM/yyyy HH:mm");
  var widths = [120, 110, 150, 80, 70, 230, 200, 360, 360, 130, 150, 120, 150, 160, 160, 220, 130, 100, 120, 90, 90, 80, 240];
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange("H:I").setWrap(true);

  var estado = SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(false).build();
  sh.getRange(2, 3, 1000, 1).setDataValidation(estado);

  var pr = sh.getRange(2, 4, 1000, 1);
  var rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Alta").setBackground("#FBE7E4").setFontColor("#8A2318").setRanges([pr]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Media").setBackground("#FCEFD9").setFontColor("#6B4304").setRanges([pr]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Baja").setBackground("#E5EBE9").setFontColor("#4A5A6C").setRanges([pr]).build());
  var est = sh.getRange(2, 3, 1000, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Ganado").setBackground("#D5EEE6").setFontColor("#0B5A49").setRanges([est]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("Nuevo").setBold(true).setRanges([est]).build());
  sh.setConditionalFormatRules(rules);

  var cfg = ss.getSheetByName(CONFIG.SHEET_CONFIG) || ss.insertSheet(CONFIG.SHEET_CONFIG);
  if (cfg.getLastRow() === 0) {
    cfg.getRange(1, 1, 2, 3).setValues([
      ["clave", "valor", "explicación"],
      ["disponible", true, "TRUE = la web muestra 'Disponible para proyectos nuevos'. FALSE = 'Agenda completa'."]
    ]);
    cfg.getRange("B2").insertCheckboxes();
    cfg.getRange(1, 1, 1, 3).setFontWeight("bold");
    cfg.setColumnWidth(3, 520);
  }

  var panel = ss.getSheetByName(CONFIG.SHEET_PANEL) || ss.insertSheet(CONFIG.SHEET_PANEL);
  panel.clear();
  var L = CONFIG.SHEET_LEADS;
  var block = [["Resumen de pedidos", ""], ["Total", "=COUNTA(" + L + "!B2:B)"],
    ["Últimos 7 días", "=COUNTIFS(" + L + "!A2:A,\">=\"&(TODAY()-7))"],
    ["Sin responder (Nuevo)", "=COUNTIF(" + L + "!C2:C,\"Nuevo\")"],
    ["Prioridad alta sin responder", "=COUNTIFS(" + L + "!C2:C,\"Nuevo\"," + L + "!D2:D,\"Alta\")"],
    ["Ganados", "=COUNTIF(" + L + "!C2:C,\"Ganado\")"],
    ["Tasa de cierre", "=IFERROR(B6/COUNTIFS(" + L + "!C2:C,\"<>Revisar (posible spam)\"," + L + "!B2:B,\"<>\"),0)"], ["", ""], ["Por estado", ""]];
  ESTADOS.forEach(function (e) { block.push([e, "=COUNTIF(" + L + "!C2:C,\"" + e + "\")"]); });
  block.push(["", ""], ["Por servicio", ""]);
  Object.keys(LISTS.service).forEach(function (k) { block.push([LISTS.service[k], "=COUNTIF(" + L + "!G2:G,\"" + LISTS.service[k] + "\")"]); });
  panel.getRange(1, 1, block.length, 2).setValues(block);
  panel.getRange("A1").setFontWeight("bold").setFontSize(14);
  panel.getRange("B7").setNumberFormat("0%");
  panel.setColumnWidth(1, 260);

  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === "recordatorioDiario") { ScriptApp.deleteTrigger(tr); }
  });
  ScriptApp.newTrigger("recordatorioDiario").timeBased().atHour(8).everyDays(1).inTimezone(CONFIG.TIMEZONE).create();

  var def = ss.getSheetByName("Hoja 1") || ss.getSheetByName("Sheet1") || ss.getSheetByName("Página1");
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) { ss.deleteSheet(def); }
  ss.setActiveSheet(sh);
}

/** Prueba manual desde el editor: crea un pedido de ejemplo. Borrá la fila después. */
function pruebaManual() {
  var ts = String(Date.now() - 60000);
  var fake = { postData: { contents: JSON.stringify({
    v: 1, service: "infra", details: { situacion: "nuevo", donde: "nube", uso: ["web", "bd"], usuarios: "6-20" },
    desc: "Pedido de prueba generado desde el editor de Apps Script.", urgency: "month", location: "rivera", budget: "2",
    client: "company", name: "Prueba Interna", company: "Test", email: ownerEmail_(), phone: "", channel: "email", time: "any",
    consent: true, lang: "es", origin: "test", elapsed: 60, website: "",
    t: ts + "." + sign_(ts) }) } };
  Logger.log(doPost(fake).getContent());
}
