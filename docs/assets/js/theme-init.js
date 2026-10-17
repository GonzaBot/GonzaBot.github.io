/* Aplica el tema guardado antes de pintar la página, para evitar un parpadeo. */
(function () {
  "use strict";
  try {
    var t = window.localStorage.getItem("rdm-theme");
    if (t === "dark" || t === "light") { document.documentElement.setAttribute("data-theme", t); }
  } catch (e) { /* almacenamiento bloqueado: se usa el tema del sistema */ }
}());
