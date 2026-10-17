/* Interfaz general: idioma, tema, menú, secciones dinámicas y proyectos.
   Todo el contenido se inserta con textContent: no se usa innerHTML. */
(function () {
  "use strict";

  var L = window.RDM_LOGIC;
  var I18N = window.RDM_I18N;
  var D = window.RDM_DATA;
  var CFG = window.RDM_CONFIG || {};
  var doc = document;

  var STATUS_KEYS = { prod: "work.s.prod", lab: "work.s.lab", tool: "work.s.tool", wip: "work.s.wip", design: "work.s.design" };
  var CAT_KEYS = { servers: "work.f.servers", dev: "work.f.dev", sec: "work.f.sec", auto: "work.f.auto", net: "work.f.net" };

  var state = { lang: "es", filter: "all", layer: 0, avail: true, token: null };

  /* ---------- utilidades ---------- */
  function $(id) { return doc.getElementById(id); }
  function t(key) { return L.translate(I18N, state.lang, key); }
  function p(obj) { return L.pick(obj, state.lang); }

  function store(key, value) {
    try {
      if (value === undefined) { return window.localStorage.getItem(key); }
      window.localStorage.setItem(key, value);
    } catch (e) { /* sin almacenamiento disponible */ }
    return null;
  }

  function safeUrl(u) {
    return (typeof u === "string" && /^https:\/\/[^\s"'<>]+$/.test(u)) ? u : null;
  }

  /* Crea elementos sin HTML en texto: h("p", {class: "x"}, ["hola"]) */
  function h(tag, attrs, kids) {
    var el = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { return; }
        if (k === "text") { el.textContent = v; }
        else if (k === "class") { el.className = v; }
        else { el.setAttribute(k, v === true ? "" : String(v)); }
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) { return; }
      el.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
    });
    return el;
  }

  function icon(id, cls) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = doc.createElementNS(NS, "svg");
    svg.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    svg.setAttribute("aria-hidden", "true");
    var use = doc.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + id);
    svg.appendChild(use);
    return svg;
  }

  function clear(el) { while (el && el.firstChild) { el.removeChild(el.firstChild); } }

  /* ---------- idioma ---------- */
  function langFromUrl() {
    try { return new URLSearchParams(window.location.search).get("lang"); } catch (e) { return null; }
  }

  function applyStatic() {
    doc.documentElement.setAttribute("lang", state.lang);
    doc.title = t("meta.title");
    var md = doc.querySelector('meta[name="description"]');
    if (md) { md.setAttribute("content", t("meta.desc")); }
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-aria]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-ph]"), function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-i18n-alt]"), function (el) {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });
    Array.prototype.forEach.call(doc.querySelectorAll(".lang__b"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === state.lang ? "true" : "false");
    });
    var avail = $("availText");
    if (avail) { avail.textContent = t(state.avail ? "hero.avail.on" : "hero.avail.off"); }
  }

  function setLang(lang, persist) {
    state.lang = L.pickLang(lang, null, ["es"]);
    if (persist) {
      store("rdm-lang", state.lang);
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("lang", state.lang);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (e) { /* entorno sin History API */ }
    }
    applyStatic();
    renderAll();
    doc.dispatchEvent(new CustomEvent("rdm:lang", { detail: { lang: state.lang } }));
  }

  /* ---------- tema ---------- */
  function effectiveTheme() {
    var attr = doc.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") { return attr; }
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function toggleTheme() {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    doc.documentElement.setAttribute("data-theme", next);
    store("rdm-theme", next);
  }

  /* ---------- secciones ---------- */
  function renderStats() {
    var dl = $("stats"); clear(dl);
    D.stats.forEach(function (s) {
      dl.appendChild(h("div", null, [h("dt", { text: s.n }), h("dd", { text: t(s.k) })]));
    });
  }

  function renderServices() {
    var grid = $("servicesGrid"); clear(grid);
    D.services.forEach(function (s) {
      var items = h("ul", { class: "checks" }, (s.items[state.lang] || s.items.es).map(function (x) { return h("li", { text: x }); }));
      var cta = h("a", { class: "svc__cta", href: "#contacto", "data-service": s.id, "data-origin": "services" }, [t("services.cta")]);
      grid.appendChild(h("article", { class: "svc", id: "svc-" + s.id }, [
        h("div", { class: "svc__head" }, [h("span", { class: "svc__icon" }, [icon(s.icon)]), h("h3", { text: p(s.t) })]),
        h("p", { text: p(s.d) }),
        items,
        cta
      ]));
    });
  }

  function renderLayers() {
    var tabs = $("layerTabs"); clear(tabs);
    D.layers.forEach(function (ly, i) {
      var sel = i === state.layer;
      var b = h("button", {
        type: "button", class: "layer", role: "tab", id: "tab-" + ly.id,
        "aria-selected": sel ? "true" : "false", "aria-controls": "layerPanel", tabindex: sel ? "0" : "-1", "data-i": i
      }, [
        h("span", { class: "layer__led", "aria-hidden": "true" }),
        h("span", null, [h("span", { class: "layer__t", text: p(ly.t) }), h("span", { class: "layer__s", text: p(ly.s) })]),
        h("span", { class: "layer__n", "aria-hidden": "true", text: "L" + (D.layers.length - i) })
      ]);
      tabs.appendChild(b);
    });
    renderLayerPanel();
  }

  function renderLayerPanel() {
    var ly = D.layers[state.layer];
    var panel = $("layerPanel"); clear(panel);
    panel.setAttribute("aria-labelledby", "tab-" + ly.id);
    var proofHref = safeUrl(ly.proof.href);
    panel.appendChild(h("h3", { text: p(ly.t) }));
    panel.appendChild(h("p", { text: p(ly.d) }));
    panel.appendChild(h("dl", { class: "kv" }, [h("dt", { text: t("servers.tools") }), h("dd", { text: ly.tools })]));
    panel.appendChild(h("dl", { class: "kv" }, [
      h("dt", { text: t("servers.proof") }),
      h("dd", null, [proofHref ? h("a", { href: proofHref, target: "_blank", rel: "noopener noreferrer", text: ly.proof.label }) : ly.proof.label])
    ]));
  }

  function selectLayer(i, focus) {
    var n = D.layers.length;
    state.layer = ((i % n) + n) % n;
    Array.prototype.forEach.call($("layerTabs").children, function (b, k) {
      var sel = k === state.layer;
      b.setAttribute("aria-selected", sel ? "true" : "false");
      b.setAttribute("tabindex", sel ? "0" : "-1");
      if (sel && focus) { b.focus(); }
    });
    renderLayerPanel();
  }

  function renderDev() {
    var grid = $("devGrid"); clear(grid);
    D.dev.forEach(function (d) {
      grid.appendChild(h("article", { class: "devcard" }, [
        h("div", { class: "devcard__head" }, [h("h3", { text: p(d.t) }), h("span", { class: "devcard__icon" }, [icon(d.icon)])]),
        h("p", { text: p(d.d) }),
        h("div", { class: "devcard__ex" }, [
          h("p", { class: "devcard__label", text: t("dev.examples") }),
          h("ul", { class: "checks" }, (d.ex[state.lang] || d.ex.es).map(function (x) { return h("li", { text: x }); }))
        ]),
        h("p", { class: "devcard__stack" }, [h("span", { class: "sr-only", text: t("dev.stack") + ": " }), d.stack])
      ]));
    });
  }

  function visibleProjects() {
    return D.projects.filter(function (pr) { return state.filter === "all" || pr.cats.indexOf(state.filter) !== -1; });
  }

  function renderProjects() {
    var list = $("projectList"); clear(list);
    var items = visibleProjects();
    items.forEach(function (pr) {
      var btn = h("button", { type: "button", class: "proj__btn", "data-project": pr.id, "aria-haspopup": "dialog" }, [
        h("span", { class: "proj__meta" }, [
          h("span", { class: "status status--" + pr.status, text: t(STATUS_KEYS[pr.status] || "work.s.lab") }),
          h("span", { class: "proj__cats", text: pr.cats.map(function (c) { return t(CAT_KEYS[c]); }).join(" · ") })
        ]),
        h("h3", { text: p(pr.t) }),
        h("p", { text: p(pr.s) }),
        h("span", { class: "proj__foot" }, [
          h("span", { class: "proj__stack", text: pr.stack.slice(0, 3).join(" · ") }),
          h("span", null, [t("work.open")])
        ])
      ]);
      list.appendChild(h("li", { class: "proj" }, [btn]));
    });
    var st = $("filterStatus");
    if (st) { st.textContent = items.length + " · " + t("work.f." + (state.filter === "all" ? "all" : state.filter)); }
    Array.prototype.forEach.call(doc.querySelectorAll("#filters .chip"), function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-filter") === state.filter ? "true" : "false");
    });
  }

  var lastOpener = null;
  function openCase(id, opener) {
    var pr = null;
    D.projects.forEach(function (x) { if (x.id === id) { pr = x; } });
    if (!pr) { return; }
    lastOpener = opener || null;
    $("caseStatus").textContent = "";
    $("caseStatus").appendChild(h("span", { class: "status status--" + pr.status, text: t(STATUS_KEYS[pr.status]) }));
    $("caseTitle").textContent = p(pr.t);
    var body = $("caseBody"); clear(body);
    [["work.problem", pr.p], ["work.solution", pr.so], ["work.result", pr.r]].forEach(function (row) {
      body.appendChild(h("div", null, [h("dt", { text: t(row[0]) }), h("dd", { text: p(row[1]) })]));
    });
    body.appendChild(h("div", null, [
      h("dt", { text: t("work.stack") }),
      h("dd", { class: "case__stack" }, pr.stack.map(function (s) { return h("span", { text: s }); }))
    ]));
    var links = $("caseLinks"); clear(links);
    var live = safeUrl(pr.live);
    var repo = safeUrl(pr.repo);
    if (live) { links.appendChild(h("a", { class: "btn btn--cta btn--sm", href: live, target: "_blank", rel: "noopener noreferrer" }, [t("work.live"), icon("ext")])); }
    if (repo) { links.appendChild(h("a", { class: "btn btn--ghost btn--sm", href: repo, target: "_blank", rel: "noopener noreferrer" }, [icon("github"), t("work.repo")])); }
    if (!live && !repo) { links.appendChild(h("p", { class: "case__private", text: t("work.private") })); }
    var dlg = $("caseDialog");
    if (typeof dlg.showModal === "function") { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    $("caseClose").focus();
  }

  function closeCase() {
    var dlg = $("caseDialog");
    if (typeof dlg.close === "function" && dlg.open) { dlg.close(); } else { dlg.removeAttribute("open"); }
  }

  function renderTimeline() {
    var ol = $("timeline"); clear(ol);
    D.timeline.forEach(function (it) {
      ol.appendChild(h("li", null, [
        h("span", { class: "timeline__y", text: it.y }),
        h("span", { class: "timeline__t", text: p(it.t) }),
        h("span", { class: "timeline__o", text: p(it.o) })
      ]));
    });
  }

  function renderCerts() {
    var box = $("certs"); clear(box);
    D.certs.forEach(function (g) {
      box.appendChild(h("div", null, [
        h("h3", { text: p(g.g) }),
        h("ul", null, g.items.map(function (c) { return h("li", null, [h("span", { text: c[0] }), h("span", { text: c[1] })]); }))
      ]));
    });
  }

  function renderQuote() {
    var tr = t("quote.tr");
    var text = $("quoteText");
    var orig = $("quoteOrig");
    var isPt = state.lang === "pt" || !tr || tr === "quote.tr";
    text.hidden = isPt;
    text.textContent = isPt ? "" : "«" + tr + "»";
    orig.classList.toggle("is-main", isPt);
    orig.setAttribute("aria-label", isPt ? "" : t("quote.orig"));
    if (!isPt) { orig.setAttribute("title", t("quote.orig")); } else { orig.removeAttribute("title"); }
  }

  function renderAll() {
    renderStats(); renderServices(); renderLayers(); renderDev(); renderProjects(); renderTimeline(); renderCerts(); renderQuote();
  }

  /* ---------- disponibilidad y token firmado desde Apps Script ---------- */
  var configPromise = null;
  function fetchConfig() {
    var api = safeUrl(CFG.API_URL);
    if (!api || !window.fetch) { return Promise.resolve(null); }
    if (configPromise) { return configPromise; }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 6000);
    configPromise = fetch(api + "?action=config", { method: "GET", signal: ctrl ? ctrl.signal : undefined, credentials: "omit", cache: "no-store", redirect: "follow" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        clearTimeout(timer);
        configPromise = null;
        if (!cfg || typeof cfg !== "object") { return null; }
        if (typeof cfg.t === "string" && /^\d{10,13}\.[A-Za-z0-9_-]{20,100}$/.test(cfg.t)) { state.token = { t: cfg.t, at: Date.now() }; }
        state.avail = cfg.available !== false;
        var a = $("avail");
        if (a) { a.setAttribute("data-state", state.avail ? "on" : "off"); }
        $("availText").textContent = t(state.avail ? "hero.avail.on" : "hero.avail.off");
        return cfg;
      })
      .catch(function () { clearTimeout(timer); configPromise = null; return null; });
    return configPromise;
  }

  /* Devuelve un token con al menos 4,5 s de antigüedad (el servidor rechaza los recién emitidos). */
  function ensureToken() {
    function ready() {
      var tok = state.token;
      if (!tok || Date.now() - tok.at > 20 * 3600 * 1000) { return null; }
      var wait = 4500 - (Date.now() - tok.at);
      return wait > 0 ? new Promise(function (res) { setTimeout(function () { res(tok.t); }, wait); }) : Promise.resolve(tok.t);
    }
    return ready() || fetchConfig().then(function () { return ready() || null; });
  }

  /* ---------- eventos ---------- */
  function bind() {
    doc.querySelector(".lang").addEventListener("click", function (e) {
      var b = e.target.closest(".lang__b");
      if (b) { setLang(b.getAttribute("data-lang"), true); }
    });
    $("themeBtn").addEventListener("click", toggleTheme);

    var menuBtn = $("menuBtn");
    var nav = $("nav");
    function setMenu(open) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
    }
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) { setMenu(false); } });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
    });

    $("layerTabs").addEventListener("click", function (e) {
      var b = e.target.closest(".layer");
      if (b) { selectLayer(Number(b.getAttribute("data-i")), false); }
    });
    $("layerTabs").addEventListener("keydown", function (e) {
      var keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (keys[e.key]) { e.preventDefault(); selectLayer(state.layer + keys[e.key], true); }
      else if (e.key === "Home") { e.preventDefault(); selectLayer(0, true); }
      else if (e.key === "End") { e.preventDefault(); selectLayer(D.layers.length - 1, true); }
    });

    $("filters").addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (!c) { return; }
      var f = c.getAttribute("data-filter");
      state.filter = (f === "all" || CAT_KEYS[f]) ? f : "all";
      renderProjects();
    });
    $("projectList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-project]");
      if (b) { openCase(b.getAttribute("data-project"), b); }
    });
    var dlg = $("caseDialog");
    $("caseClose").addEventListener("click", closeCase);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) { closeCase(); } });
    dlg.addEventListener("close", function () { if (lastOpener && doc.contains(lastOpener)) { lastOpener.focus(); } });

    /* Botones que abren el formulario con un servicio ya elegido */
    doc.addEventListener("click", function (e) {
      var a = e.target.closest("a[href='#contacto']");
      if (!a) { return; }
      doc.dispatchEvent(new CustomEvent("rdm:preselect", {
        detail: { service: a.getAttribute("data-service") || "", origin: a.getAttribute("data-origin") || "" }
      }));
    });

    /* Marca en el menú la sección visible */
    if ("IntersectionObserver" in window) {
      var links = {};
      Array.prototype.forEach.call(nav.querySelectorAll("a"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var a = links[en.target.id];
          if (!a) { return; }
          if (en.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].removeAttribute("aria-current"); });
            a.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(links).forEach(function (id) { var s = $(id); if (s) { io.observe(s); } });
    }
  }

  function init() {
    var y = $("year");
    if (y) { y.textContent = String(new Date().getFullYear()); }
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    state.lang = L.pickLang(langFromUrl(), store("rdm-lang"), langs);
    applyStatic();
    renderAll();
    bind();
    fetchConfig();
    if (window.top !== window.self && /\.github\.io$/.test(window.location.hostname)) {
      doc.documentElement.classList.add("is-framed");
    }
    window.RDM_APP = { getLang: function () { return state.lang; }, t: t, h: h, icon: icon, clear: clear, store: store, safeUrl: safeUrl, ensureToken: ensureToken };
    doc.dispatchEvent(new CustomEvent("rdm:ready", { detail: { lang: state.lang } }));
  }

  if (doc.readyState === "loading") { doc.addEventListener("DOMContentLoaded", init); } else { init(); }
}());
