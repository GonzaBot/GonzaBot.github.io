# Rodríguez de Mello Sistemas

Sitio profesional de Gonzalo Rodríguez de Mello: servidores, desarrollo web, de escritorio y mobile, automatización y ciberseguridad. Está en español, portugués e inglés, y tiene un formulario de presupuesto por pasos que guarda cada pedido en Google Sheets, lo prioriza y avisa por correo y Telegram.

- **Sitio:** HTML, CSS y JavaScript sin frameworks ni dependencias externas, publicado con GitHub Pages desde la carpeta `docs/`.
- **Receptor del formulario:** Google Apps Script (`apps-script/Code.gs`) vinculado a una planilla de Google.
- **Pruebas:** 120 pruebas automáticas (unitarias, caja blanca, caja negra, integración, usabilidad y penetración) en `tests/`.

## Estructura

```
docs/                    el sitio publicado
  index.html
  404.html
  .well-known/           security.txt y política de divulgación (RFC 9116)
  assets/css/styles.css
  assets/js/
    config.js            URL del Apps Script (lo único que tenés que editar para conectar)
    logic.js             validación y armado del envío (se prueba también en Node)
    i18n.js              textos de la interfaz en es, pt y en
    data.js              servicios, proyectos, trayectoria, certificaciones y preguntas
    app.js               idioma, tema, secciones, proyectos
    form.js              formulario por pasos
apps-script/
  Code.gs                receptor: valida, limita, numera, prioriza, guarda y avisa
  appsscript.json        manifiesto con permisos mínimos
tests/                   todas las baterías de pruebas
```

## Puesta en marcha

### 1. Publicar el sitio en GitHub Pages

1. Creá un repositorio público llamado exactamente `GonzaBot.github.io`.
2. Subí todo el contenido de esta carpeta (incluida `docs/`, con sus archivos ocultos `.nojekyll` y `.well-known/`).
3. En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch**, rama `main`, carpeta `/docs`. Guardá.
4. En la misma pantalla marcá **Enforce HTTPS**.
5. A los pocos minutos el sitio queda en `https://gonzabot.github.io/`.

Si preferís otra dirección, cambiá `https://gonzabot.github.io/` en `docs/index.html` (canonical, hreflang, og:url, og:image), `docs/sitemap.xml`, `docs/robots.txt` y `docs/.well-known/security.txt`.

### 2. Crear la planilla y el receptor

1. En Google Drive creá una planilla nueva, por ejemplo «Pedidos · Rodríguez de Mello Sistemas».
2. **Extensiones → Apps Script**. Borrá el contenido de `Código.gs` y pegá el de `apps-script/Code.gs`.
3. En **Configuración del proyecto** activá «Mostrar el archivo de manifiesto appsscript.json» y reemplazá su contenido por el de `apps-script/appsscript.json`.
4. Elegí la función `setup` en la barra superior y tocá **Ejecutar**. Autorizá los permisos (es tu propia cuenta). Esto crea las hojas **Contactos**, **Config** y **Panel**, el secreto que firma los tokens del formulario y el recordatorio diario de las 8:00.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
6. Copiá la URL que termina en `/exec`.

### 3. Conectar el sitio

Abrí `docs/assets/js/config.js` y pegá la URL:

```js
window.RDM_CONFIG = Object.freeze({
  API_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
  TIMEOUT_MS: 15000
});
```

Subí el cambio. Mientras `API_URL` esté vacío, el formulario funciona en modo vista previa y no envía nada.

### 4. Probar

1. Abrí el sitio, completá un pedido real y esperá unos segundos antes de enviarlo.
2. Revisá la hoja **Contactos**: aparece la fila con número `RDM-AAMM-0001`, prioridad, próxima acción y resumen.
3. Te llega un correo con el pedido, y al cliente una confirmación en su idioma.
4. En la hoja **Config**, desmarcá `disponible` y recargá el sitio: el cartel cambia a «Agenda completa» (puede tardar hasta 5 minutos por la caché).

### 5. Avisos por Telegram (opcional)

En Apps Script: **Configuración del proyecto → Propiedades del script**, agregá:

- `TELEGRAM_TOKEN`: el token de tu bot (de @BotFather).
- `TELEGRAM_CHAT_ID`: tu chat id.

### 6. Cuando cambies `Code.gs`

Para mantener la misma URL: **Implementar → Administrar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar**. Si creás una implementación nueva, la URL cambia y hay que actualizar `config.js`.

## Cómo trabaja la planilla por vos

- **Número de seguimiento** por mes (`RDM-2610-0007`), que el cliente recibe por correo.
- **Prioridad Alta / Media / Baja** según urgencia, presupuesto, tipo de cliente, ubicación e incidentes activos.
- **Próxima acción con fecha límite**: «Escribir por WhatsApp antes del 18/10 12:00». Un incidente activo da 2 horas.
- **Estado** con lista desplegable: Nuevo, Contactado, Presupuesto enviado, Ganado, Perdido, Revisar (posible spam).
- **Panel** con totales, pedidos de los últimos 7 días, pendientes de prioridad alta y tasa de cierre.
- **Recordatorio diario** con los pedidos sin responder hace más de 24 horas y los marcados para revisar.
- Los pedidos que llegan demasiado rápido o sin token válido se guardan como «Revisar (posible spam)» y no generan correos. Si alguno es real, cambiá su estado a Nuevo.

## Editar el contenido

- **Textos de la interfaz:** `docs/assets/js/i18n.js` (las tres lenguas tienen las mismas claves; una prueba lo verifica).
- **Servicios, proyectos, trayectoria y certificaciones:** `docs/assets/js/data.js`. Para sumar un proyecto, copiá un bloque de `projects` y cambiá los textos.
- **Preguntas del formulario:** `formDetails` en `data.js`. Si agregás o cambiás una opción, cambiala también en `DETAILS` de `Code.gs`; la prueba `las opciones del formulario coinciden con las que acepta Apps Script` avisa si no coinciden.

## Pruebas

Requisitos: Node 20 o superior.

```bash
npm install
npx playwright install chromium
npm test            # todas las baterías
npm run test:unit   # unitarias y caja blanca con cobertura
npm run test:security
```

## Seguridad

- CSP estricta por meta (`default-src 'none'`, sin `unsafe-inline` ni `unsafe-eval`), sin recursos de terceros ni rastreadores.
- Todo el contenido dinámico se inserta con `textContent`; no hay `innerHTML`.
- El receptor valida con lista blanca, limita envíos por correo normalizado y por hora, detecta reenvíos, protege la planilla contra inyección de fórmulas, escapa el HTML de los correos y exige un token HMAC firmado con antigüedad mínima.
- GitHub Pages no permite configurar cabeceras HTTP. Después de publicar, conviene revisar lo que envía:

```bash
curl -sI https://gonzabot.github.io/ | grep -iE "strict-transport|x-content-type|content-security|x-frame"
```

Para reportar una vulnerabilidad: ver `docs/.well-known/security.txt`.
