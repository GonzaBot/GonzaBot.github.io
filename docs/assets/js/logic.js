/* Lógica pura del sitio (sin DOM): idioma, validación y armado del envío.
   Se usa en el navegador (window.RDM_LOGIC) y en las pruebas con Node. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) { module.exports = api; }
  else { root.RDM_LOGIC = api; }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LANGS = ["es", "pt", "en"];
  var SERVICES = ["infra", "dev", "support", "auto", "sec", "train", "other"];
  var URGENCY = ["now", "month", "quarter", "info"];
  var LOCATION = ["rivera", "livramento", "uy", "abroad"];
  var BUDGET = ["unknown", "1", "2", "3", "4"];
  var CLIENT = ["company", "pro", "inst", "person"];
  var CHANNEL = ["email", "whatsapp", "call"];
  var TIME = ["morning", "afternoon", "any"];

  var LIMITS = { name: 80, company: 100, email: 254, phone: 30, desc: 2000, detailValue: 40, detailItems: 12 };
  var MIN_DESC = 20;

  function has(list, v) { return list.indexOf(v) !== -1; }

  /* Elige el idioma: 1) el pedido explícito, 2) el guardado, 3) el del navegador, 4) español. */
  function pickLang(requested, saved, browserLangs) {
    if (has(LANGS, requested)) { return requested; }
    if (has(LANGS, saved)) { return saved; }
    var list = Array.isArray(browserLangs) ? browserLangs : [];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i] || "").toLowerCase().slice(0, 2);
      if (has(LANGS, code)) { return code; }
    }
    return "es";
  }

  /* Traducción con respaldo en español y, si falta, la propia clave. */
  function translate(dict, lang, key) {
    if (dict && dict[lang] && typeof dict[lang][key] === "string") { return dict[lang][key]; }
    if (dict && dict.es && typeof dict.es[key] === "string") { return dict.es[key]; }
    return key;
  }

  /* Texto de un objeto {es, pt, en}. */
  function pick(obj, lang) {
    if (obj === null || obj === undefined) { return ""; }
    if (typeof obj === "string") { return obj; }
    return obj[lang] || obj.es || "";
  }

  /* Limpia texto libre: quita caracteres de control, recorta y limita el largo. */
  function cleanText(value, max, multiline) {
    var s = String(value === undefined || value === null ? "" : value);
    s = multiline
      ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
      : s.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, " ");
    s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    return s.slice(0, max);
  }

  /* Validación de correo sin expresiones con retroceso catastrófico: se separa en partes. */
  function isEmail(value) {
    var s = String(value || "").trim();
    if (s.length < 6 || s.length > LIMITS.email) { return false; }
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

  function isPhone(value) {
    var s = String(value || "").trim();
    if (!s) { return false; }
    var digits = s.replace(/\D/g, "");
    return /^[+0-9 ().-]{6,30}$/.test(s) && digits.length >= 6 && digits.length <= 15;
  }

  /* Opciones válidas de cada pregunta del paso 2, a partir de los datos. */
  function detailSpec(formDetails, service) {
    var list = (formDetails && formDetails[service]) || [];
    return list.map(function (q) {
      return { id: q.id, type: q.type, req: !!q.req, values: (q.o || []).map(function (o) { return o[0]; }) };
    });
  }

  /* Valida un paso del formulario. Devuelve {campo: claveDeError}. */
  function validateStep(step, state, formDetails) {
    var e = {};
    var st = state || {};
    if (step === 1) {
      if (!has(SERVICES, st.service)) { e.service = "f.err.choose"; }
    } else if (step === 2) {
      detailSpec(formDetails, st.service).forEach(function (q) {
        var v = st.details ? st.details[q.id] : undefined;
        if (q.type === "check") {
          var arr = Array.isArray(v) ? v.filter(function (x) { return has(q.values, x); }) : [];
          if (q.req && arr.length === 0) { e["d_" + q.id] = "f.err.choose"; }
        } else if (q.req && !has(q.values, v)) {
          e["d_" + q.id] = q.type === "select" ? "f.err.required" : "f.err.choose";
        }
      });
      if (cleanText(st.desc, LIMITS.desc, true).length < MIN_DESC) { e.desc = "f.err.desc"; }
    } else if (step === 3) {
      if (!has(URGENCY, st.urgency)) { e.urgency = "f.err.choose"; }
      if (!has(LOCATION, st.location)) { e.location = "f.err.choose"; }
      if (!has(CLIENT, st.client)) { e.client = "f.err.choose"; }
      if (st.budget && !has(BUDGET, st.budget)) { e.budget = "f.err.choose"; }
    } else if (step === 4) {
      if (cleanText(st.name, LIMITS.name).length < 2) { e.name = "f.err.required"; }
      if (!isEmail(st.email)) { e.email = "f.err.email"; }
      if (!has(CHANNEL, st.channel)) { e.channel = "f.err.choose"; }
      if ((st.channel === "whatsapp" || st.channel === "call") && !isPhone(st.phone)) { e.phone = "f.err.phone"; }
      else if (st.phone && !isPhone(st.phone)) { e.phone = "f.err.phone"; }
      if (st.time && !has(TIME, st.time)) { e.time = "f.err.choose"; }
      if (st.consent !== true) { e.consent = "f.err.consent"; }
    }
    return e;
  }

  function validateAll(state, formDetails) {
    var all = {};
    [1, 2, 3, 4].forEach(function (n) {
      var r = validateStep(n, state, formDetails);
      Object.keys(r).forEach(function (k) { all[k] = r[k]; });
    });
    return all;
  }

  /* Arma el objeto que viaja al servidor, solo con valores permitidos. */
  function buildPayload(state, formDetails, meta) {
    var st = state || {};
    var m = meta || {};
    var details = {};
    detailSpec(formDetails, st.service).forEach(function (q) {
      var v = st.details ? st.details[q.id] : undefined;
      if (q.type === "check") {
        var arr = Array.isArray(v) ? v.filter(function (x) { return has(q.values, x); }) : [];
        if (arr.length) { details[q.id] = arr.slice(0, LIMITS.detailItems); }
      } else if (has(q.values, v)) {
        details[q.id] = v;
      }
    });
    return {
      v: 1,
      service: has(SERVICES, st.service) ? st.service : "other",
      details: details,
      desc: cleanText(st.desc, LIMITS.desc, true),
      urgency: has(URGENCY, st.urgency) ? st.urgency : "info",
      location: has(LOCATION, st.location) ? st.location : "uy",
      budget: has(BUDGET, st.budget) ? st.budget : "unknown",
      client: has(CLIENT, st.client) ? st.client : "person",
      name: cleanText(st.name, LIMITS.name),
      company: cleanText(st.company, LIMITS.company),
      email: cleanText(st.email, LIMITS.email).toLowerCase(),
      phone: cleanText(st.phone, LIMITS.phone),
      channel: has(CHANNEL, st.channel) ? st.channel : "email",
      time: has(TIME, st.time) ? st.time : "any",
      consent: st.consent === true,
      lang: has(LANGS, m.lang) ? m.lang : "es",
      origin: cleanText(m.origin, 40),
      elapsed: Math.max(0, Math.min(86400, Math.round(Number(m.elapsed) || 0))),
      website: cleanText(st.website, 100),
      t: (typeof m.token === "string" && /^\d{10,13}\.[A-Za-z0-9_-]{20,100}$/.test(m.token)) ? m.token : ""
    };
  }

  /* Paso inicial de urgencia sugerido según las respuestas (ahorra un clic al cliente). */
  function suggestedUrgency(state) {
    var d = (state && state.details) || {};
    if (state && state.service === "sec" && d.estado === "incidente") { return "now"; }
    if (state && state.service === "infra" && d.situacion === "problema") { return "now"; }
    return "";
  }

  return {
    LANGS: LANGS, SERVICES: SERVICES, URGENCY: URGENCY, LOCATION: LOCATION, BUDGET: BUDGET,
    CLIENT: CLIENT, CHANNEL: CHANNEL, TIME: TIME, LIMITS: LIMITS, MIN_DESC: MIN_DESC,
    pickLang: pickLang, translate: translate, pick: pick, cleanText: cleanText,
    isEmail: isEmail, isPhone: isPhone, detailSpec: detailSpec,
    validateStep: validateStep, validateAll: validateAll, buildPayload: buildPayload,
    suggestedUrgency: suggestedUrgency
  };
}));
