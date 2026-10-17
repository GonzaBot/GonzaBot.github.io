/* Formulario de presupuesto por pasos.
   Paso 1 servicio, 2 detalles según el servicio, 3 plazos y lugar, 4 contacto, 5 revisión.
   Guarda un borrador local, valida cada paso y envía a Apps Script. */
(function () {
  "use strict";

  var L = window.RDM_LOGIC;
  var D = window.RDM_DATA;
  var CFG = window.RDM_CONFIG || {};
  var doc = document;
  var DRAFT_KEY = "rdm-draft-v1";
  var DRAFT_MAX_AGE = 7 * 24 * 3600 * 1000;
  /* Por privacidad, el borrador local no guarda nombre, empresa, correo ni teléfono. */
  var DRAFT_FIELDS = ["service", "desc", "urgency", "location", "client", "budget", "channel", "time"];
  var TOTAL = 5;

  var A = null; /* utilidades de app.js */
  var form, step = 1, errors = {}, startedAt = 0, origin = "", sending = false, saveTimer = null;
  var st = emptyState();

  function emptyState() {
    return { service: "", details: {}, desc: "", urgency: "", location: "", client: "", budget: "unknown",
      name: "", company: "", email: "", phone: "", channel: "", time: "any", consent: false, website: "" };
  }

  function $(id) { return doc.getElementById(id); }
  function t(k) { return A.t(k); }
  function lang() { return A.getLang(); }
  function pick(o) { return L.pick(o, lang()); }

  /* ---------- borrador ---------- */
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var copy = { details: st.details, step: Math.min(step, 3), savedAt: Date.now() };
      DRAFT_FIELDS.forEach(function (k) { copy[k] = st[k]; });
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(copy)); } catch (e) { /* sin almacenamiento */ }
    }, 300);
  }

  function loadDraft() {
    var raw = null;
    try { raw = window.localStorage.getItem(DRAFT_KEY); } catch (e) { return false; }
    if (!raw || raw.length > 20000) { return false; }
    var data;
    try { data = JSON.parse(raw); } catch (e) { return false; }
    if (!data || typeof data !== "object" || Array.isArray(data)) { return false; }
    if (!(Number(data.savedAt) > Date.now() - DRAFT_MAX_AGE)) { clearDraft(); return false; }
    var base = emptyState();
    var changed = false;
    DRAFT_FIELDS.forEach(function (k) {
      if (typeof data[k] === "string" && data[k] !== base[k]) { base[k] = data[k].slice(0, 2000); changed = true; }
    });
    if (base.service && L.SERVICES.indexOf(base.service) === -1) { base.service = ""; }
    if (data.details && typeof data.details === "object" && !Array.isArray(data.details)) {
      L.detailSpec(D.formDetails, base.service).forEach(function (q) {
        var v = data.details[q.id];
        if (q.type === "check" && Array.isArray(v)) { base.details[q.id] = v.filter(function (x) { return q.values.indexOf(x) !== -1; }); changed = true; }
        else if (typeof v === "string" && q.values.indexOf(v) !== -1) { base.details[q.id] = v; changed = true; }
      });
    }
    st = base;
    var s = Number(data.step);
    step = (s >= 1 && s <= 3) ? s : 1;
    return changed;
  }

  function clearDraft() { try { window.localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ } }

  /* ---------- render ---------- */
  function renderServiceOpts() {
    var box = $("serviceOpts"); A.clear(box);
    var list = D.services.map(function (s) { return { id: s.id, icon: s.icon, t: s.t, d: s.d }; });
    list.push({ id: "other", icon: "doc", t: D.otherService, d: null });
    list.forEach(function (s) {
      var input = A.h("input", { type: "radio", name: "service", value: s.id, id: "svc-opt-" + s.id });
      if (st.service === s.id) { input.checked = true; }
      var kids = [input, A.icon(s.icon), A.h("b", { text: pick(s.t) })];
      if (s.d) { kids.push(A.h("small", { text: firstSentence(pick(s.d)) })); }
      box.appendChild(A.h("label", { class: "opt", for: "svc-opt-" + s.id }, kids));
    });
  }

  function firstSentence(s) {
    var i = s.indexOf(",");
    var j = s.indexOf(".");
    var cut = s.length;
    if (j > 0) { cut = j; }
    if (i > 30 && i < cut) { cut = i; }
    return s.slice(0, cut);
  }

  function renderDetails() {
    var box = $("detailFields"); A.clear(box);
    var qs = (D.formDetails[st.service] || []);
    qs.forEach(function (q) {
      var fid = "d_" + q.id;
      var labelId = "lbl-" + fid;
      if (q.type === "select") {
        var sel = A.h("select", { id: "f-" + fid, name: fid, "aria-describedby": "err-" + fid });
        sel.appendChild(A.h("option", { value: "", text: t("f.choose") }));
        q.o.forEach(function (o) {
          var opt = A.h("option", { value: o[0], text: pick(o[1]) });
          if (st.details[q.id] === o[0]) { opt.selected = true; }
          sel.appendChild(opt);
        });
        var lab = A.h("label", { for: "f-" + fid }, [pick(q.q)]);
        if (!q.req) { lab.appendChild(A.h("span", { class: "opt-tag", text: " (" + t("f.optional") + ")" })); }
        box.appendChild(A.h("div", { class: "field" }, [lab, sel, A.h("p", { class: "err", id: "err-" + fid, role: "alert" })]));
      } else {
        var isCheck = q.type === "check";
        var group = A.h("div", { class: "group", role: isCheck ? "group" : "radiogroup", "aria-labelledby": labelId, "aria-describedby": "err-" + fid, "data-field": fid });
        var label = A.h("p", { class: "group__label", id: labelId }, [pick(q.q)]);
        if (isCheck) { label.appendChild(A.h("span", { class: "opt-tag", text: " · " + t("f.multi") })); }
        if (!q.req) { label.appendChild(A.h("span", { class: "opt-tag", text: " (" + t("f.optional") + ")" })); }
        var opts = A.h("div", { class: "opts" });
        q.o.forEach(function (o) {
          var input = A.h("input", { type: isCheck ? "checkbox" : "radio", name: fid, value: o[0] });
          var cur = st.details[q.id];
          if (isCheck ? (Array.isArray(cur) && cur.indexOf(o[0]) !== -1) : cur === o[0]) { input.checked = true; }
          opts.appendChild(A.h("label", { class: "opt" }, [input, A.h("span", { text: pick(o[1]) })]));
        });
        group.appendChild(label);
        group.appendChild(opts);
        group.appendChild(A.h("p", { class: "err", id: "err-" + fid, role: "alert" }));
        box.appendChild(group);
      }
    });
    var ph = D.descPlaceholder[st.service] || D.descPlaceholder.other;
    $("f-desc").setAttribute("placeholder", pick(ph));
    updateIncident();
  }

  function fillStatic() {
    $("f-desc").value = st.desc;
    updateCount();
    setRadio("urgency", st.urgency);
    setRadio("location", st.location);
    setRadio("client", st.client);
    setRadio("channel", st.channel);
    $("f-budget").value = L.BUDGET.indexOf(st.budget) !== -1 ? st.budget : "unknown";
    $("f-time").value = L.TIME.indexOf(st.time) !== -1 ? st.time : "any";
    $("f-name").value = st.name;
    $("f-company").value = st.company;
    $("f-email").value = st.email;
    $("f-phone").value = st.phone;
    $("f-consent").checked = st.consent;
    updatePhoneTag();
  }

  function setRadio(name, value) {
    Array.prototype.forEach.call(form.querySelectorAll('input[name="' + name + '"]'), function (r) { r.checked = r.value === value; });
  }

  function updateCount() {
    $("descCount").textContent = $("f-desc").value.length + " / " + L.LIMITS.desc;
  }

  function updateIncident() {
    var d = st.details || {};
    var show = (st.service === "sec" && d.estado === "incidente") || (st.service === "infra" && d.situacion === "problema");
    $("incidentNote").hidden = !show;
  }

  function updatePhoneTag() {
    $("phoneOpt").hidden = st.channel === "whatsapp" || st.channel === "call";
  }

  function showStep(n, focus) {
    step = n;
    for (var i = 1; i <= TOTAL; i++) { $("step" + i).hidden = i !== n; }
    $("backBtn").hidden = n === 1;
    $("nextBtn").hidden = n === TOTAL;
    $("sendBtn").hidden = n !== TOTAL;
    $("stepCount").textContent = t("f.step") + " " + n + " " + t("f.of") + " " + TOTAL;
    Array.prototype.forEach.call($("progress").children, function (li) {
      var s = Number(li.getAttribute("data-step"));
      li.classList.toggle("is-done", s < n);
      li.classList.toggle("is-current", s === n);
      if (s === n) { li.setAttribute("aria-current", "step"); } else { li.removeAttribute("aria-current"); }
    });
    if (n === 3 && !st.urgency) {
      var sug = L.suggestedUrgency(st);
      if (sug) { st.urgency = sug; setRadio("urgency", sug); }
    }
    if (n === TOTAL) { renderReview(); }
    if (focus) {
      var lg = $("step" + n).querySelector("legend");
      if (lg) { try { lg.focus({ preventScroll: true }); } catch (e) { lg.focus(); } }
      var top = $("quoteForm").getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) { $("quoteForm").scrollIntoView({ block: "start", behavior: "smooth" }); }
    }
    saveDraft();
  }

  /* ---------- lectura del formulario ---------- */
  function readForm() {
    var fd = function (name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : "";
    };
    st.service = fd("service") || st.service;
    var details = {};
    (D.formDetails[st.service] || []).forEach(function (q) {
      var fid = "d_" + q.id;
      if (q.type === "check") {
        details[q.id] = Array.prototype.map.call(form.querySelectorAll('input[name="' + fid + '"]:checked'), function (c) { return c.value; });
      } else if (q.type === "select") {
        var s = $("f-" + fid);
        details[q.id] = s ? s.value : "";
      } else {
        details[q.id] = fd(fid);
      }
    });
    st.details = details;
    st.desc = $("f-desc").value;
    st.urgency = fd("urgency");
    st.location = fd("location");
    st.client = fd("client");
    st.budget = $("f-budget").value;
    st.name = $("f-name").value;
    st.company = $("f-company").value;
    st.email = $("f-email").value;
    st.phone = $("f-phone").value;
    st.channel = fd("channel");
    st.time = $("f-time").value;
    st.consent = $("f-consent").checked;
    st.website = $("f-website").value;
  }

  /* ---------- errores ---------- */
  function errTarget(field) {
    var map = { desc: "f-desc", name: "f-name", email: "f-email", phone: "f-phone", consent: "f-consent", budget: "f-budget", time: "f-time" };
    if (map[field]) { return $(map[field]); }
    if (field.indexOf("d_") === 0) {
      return $("f-" + field) || form.querySelector('[data-field="' + field + '"]');
    }
    var input = form.querySelector('input[name="' + field + '"]');
    return input ? input.closest(".group") || input.closest(".opts") : null;
  }

  function clearErrors() {
    Array.prototype.forEach.call(form.querySelectorAll(".err"), function (e) { e.textContent = ""; });
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (e) { e.removeAttribute("aria-invalid"); });
    Array.prototype.forEach.call(form.querySelectorAll('[data-invalid="true"]'), function (e) { e.removeAttribute("data-invalid"); });
  }

  function showErrors(errs, focus) {
    clearErrors();
    errors = errs;
    var first = null;
    Object.keys(errs).forEach(function (field) {
      var box = $("err-" + field);
      if (box) { box.textContent = t(errs[field]); }
      var target = errTarget(field);
      if (!target) { return; }
      if (target.classList && (target.classList.contains("group") || target.classList.contains("opts"))) {
        target.setAttribute("data-invalid", "true");
        if (!first) { first = target.querySelector("input"); }
      } else {
        target.setAttribute("aria-invalid", "true");
        if (!first) { first = target; }
      }
    });
    if (focus && first) { first.focus(); }
    return Object.keys(errs).length === 0;
  }

  function validateCurrent(focus) {
    readForm();
    return showErrors(L.validateStep(step, st, D.formDetails), focus);
  }

  /* ---------- revisión ---------- */
  function optText(name, value) {
    var input = form.querySelector('input[name="' + name + '"][value="' + cssEsc(value) + '"]');
    return input ? input.parentNode.textContent.trim() : value;
  }
  function cssEsc(v) { return String(v).replace(/[^a-zA-Z0-9_<>+.-]/g, ""); }

  function selText(id, value) {
    var sel = $(id);
    if (!sel) { return value; }
    var o = Array.prototype.filter.call(sel.options, function (x) { return x.value === value; })[0];
    return o ? o.textContent : value;
  }

  function serviceName(id) {
    if (id === "other") { return pick(D.otherService); }
    var s = D.services.filter(function (x) { return x.id === id; })[0];
    return s ? pick(s.t) : id;
  }

  function renderReview() {
    var dl = $("review"); A.clear(dl);
    var detailLines = [];
    (D.formDetails[st.service] || []).forEach(function (q) {
      var v = st.details[q.id];
      if (!v || (Array.isArray(v) && !v.length)) { return; }
      var names = (Array.isArray(v) ? v : [v]).map(function (x) {
        var o = q.o.filter(function (oo) { return oo[0] === x; })[0];
        return o ? pick(o[1]) : x;
      });
      detailLines.push(pick(q.q) + " " + names.join(", "));
    });
    detailLines.push(L.cleanText(st.desc, L.LIMITS.desc, true));
    var rows = [
      ["f.r.service", serviceName(st.service), 1],
      ["f.r.detail", detailLines.join("\n"), 2],
      ["f.r.when", [optText("urgency", st.urgency), optText("location", st.location), optText("client", st.client), selText("f-budget", st.budget)].join(" · "), 3],
      ["f.r.you", [L.cleanText(st.name, 80), L.cleanText(st.company, 100), L.cleanText(st.email, 254), L.cleanText(st.phone, 30), optText("channel", st.channel), selText("f-time", st.time)].filter(Boolean).join("\n"), 4]
    ];
    rows.forEach(function (r) {
      var edit = A.h("button", { type: "button", "data-goto": r[2], text: t("f.edit") });
      edit.setAttribute("aria-label", t("f.edit") + ": " + t(r[0]));
      dl.appendChild(A.h("div", null, [A.h("dt", { text: t(r[0]) }), A.h("dd", { text: r[1] }), edit]));
    });
  }

  /* ---------- navegación ---------- */
  function next() {
    if (!validateCurrent(true)) { return; }
    if (step === 1) { renderDetails(); }
    showStep(Math.min(step + 1, TOTAL), true);
  }

  function back() {
    readForm();
    clearErrors();
    showStep(Math.max(step - 1, 1), true);
  }

  /* ---------- envío ---------- */
  function setSending(on) {
    sending = on;
    $("sendBtn").disabled = on;
    $("backBtn").disabled = on;
    $("sendLabel").textContent = t(on ? "f.sending" : "f.send");
  }

  function finish(id, demo) {
    $("leadForm").hidden = true;
    $("progress").hidden = true;
    $("draftNote").hidden = true;
    $("leadId").textContent = id;
    $("demoNote").hidden = !demo;
    var done = $("done");
    done.hidden = false;
    done.focus();
    clearDraft();
  }

  function submit(e) {
    if (e) { e.preventDefault(); }
    if (sending) { return; }
    readForm();
    var all = L.validateAll(st, D.formDetails);
    var keys = Object.keys(all);
    if (keys.length) {
      var order = [["service"], ["desc"], ["urgency", "location", "client", "budget"], ["name", "email", "phone", "channel", "time", "consent"]];
      for (var i = 0; i < order.length; i++) {
        var hit = keys.some(function (k) { return order[i].indexOf(k) !== -1 || (i === 1 && k.indexOf("d_") === 0); });
        if (hit) {
          if (i === 0 || i === 1) { renderDetails(); }
          fillStatic();
          showStep(i + 1, false);
          showErrors(L.validateStep(i + 1, st, D.formDetails), true);
          return;
        }
      }
    }
    var api = A.safeUrl(CFG.API_URL);
    $("err-send").textContent = "";
    if (doc.documentElement.classList.contains("is-framed")) { $("err-send").textContent = t("f.err.send"); return; }
    if (!api) {
      finish("DEMO-" + new Date().toISOString().slice(2, 7).replace("-", "") + "-0000", true);
      return;
    }
    setSending(true);
    var elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    A.ensureToken().then(function (token) {
      var payload = L.buildPayload(st, D.formDetails, { lang: lang(), origin: origin, elapsed: elapsed, token: token });
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, CFG.TIMEOUT_MS || 15000);
      return fetch(api, {
        method: "POST",
        body: JSON.stringify(payload),
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        return r.json();
      }).then(function (res) {
        clearTimeout(timer);
        setSending(false);
        if (res && res.ok && typeof res.id === "string" && /^[A-Z]{3}-\d{4}-\d{4}$/.test(res.id)) {
          finish(res.id, false);
        } else {
          $("err-send").textContent = t(res && res.error === "rate" ? "f.err.rate" : "f.err.send");
        }
      }, function (err) { clearTimeout(timer); throw err; });
    }).catch(function () {
      setSending(false);
      $("err-send").textContent = t("f.err.send");
    });
  }

  function reset() {
    st = emptyState();
    errors = {};
    startedAt = 0;
    form.reset();
    renderServiceOpts();
    renderDetails();
    fillStatic();
    clearErrors();
    $("leadForm").hidden = false;
    $("progress").hidden = false;
    $("done").hidden = true;
    clearDraft();
    showStep(1, true);
  }

  /* ---------- eventos ---------- */
  function bind() {
    form.addEventListener("submit", submit);
    $("nextBtn").addEventListener("click", next);
    $("backBtn").addEventListener("click", back);
    $("newBtn").addEventListener("click", reset);

    form.addEventListener("change", function (e) {
      if (!startedAt) { startedAt = Date.now(); }
      var name = e.target.name;
      if (name === "service") {
        var prev = st.service;
        readForm();
        if (prev !== st.service) { st.details = {}; renderDetails(); }
      } else {
        readForm();
      }
      if (name === "channel") { updatePhoneTag(); }
      if (name && name.indexOf("d_") === 0) { updateIncident(); }
      var err = errors && Object.keys(errors).length ? L.validateStep(step, st, D.formDetails) : null;
      if (err) { showErrors(err, false); }
      saveDraft();
    });
    form.addEventListener("input", function (e) {
      if (!startedAt) { startedAt = Date.now(); }
      if (e.target.id === "f-desc") { updateCount(); }
      readForm();
      if (errors[e.target.name]) {
        var box = $("err-" + e.target.name);
        if (box) { box.textContent = ""; }
        e.target.removeAttribute("aria-invalid");
        delete errors[e.target.name];
      }
      saveDraft();
    });
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && step < TOTAL) {
        e.preventDefault();
        next();
      }
    });
    $("review").addEventListener("click", function (e) {
      var b = e.target.closest("[data-goto]");
      if (b) { showStep(Number(b.getAttribute("data-goto")), true); }
    });

    doc.addEventListener("rdm:preselect", function (e) {
      var d = e.detail || {};
      origin = String(d.origin || "").slice(0, 40);
      if (!$("done").hidden) { return; }
      if (d.service && L.SERVICES.indexOf(d.service) !== -1 && step <= 2) {
        var changed = st.service !== d.service;
        st.service = d.service;
        if (changed) { st.details = {}; }
        renderServiceOpts();
        renderDetails();
        setTimeout(function () { showStep(2, true); }, 450);
      }
    });

    doc.addEventListener("rdm:lang", function () {
      readForm();
      renderServiceOpts();
      renderDetails();
      fillStatic();
      showStep(step, false);
      if (Object.keys(errors).length) { showErrors(errors, false); }
      if (!$("done").hidden) { $("sendLabel").textContent = t("f.send"); }
    });
  }

  function init() {
    if (form) { return; }
    A = window.RDM_APP;
    form = $("leadForm");
    if (!A || !form) { return; }
    var restored = loadDraft();
    renderServiceOpts();
    renderDetails();
    fillStatic();
    bind();
    showStep(step, false);
    if (restored) { $("draftNote").hidden = false; }
  }

  if (window.RDM_APP) { init(); } else { doc.addEventListener("rdm:ready", init); }
}());
