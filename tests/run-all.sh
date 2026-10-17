#!/usr/bin/env bash
# Ejecuta todas las baterías de pruebas. Uso: bash tests/run-all.sh
set -e
cd "$(dirname "$0")"
echo "== Unitarias + caja blanca (con cobertura) =="; node --test --experimental-test-coverage unit/*.test.mjs
echo "== Pentest del receptor (Apps Script) =="; node --test security/server.test.mjs
echo "== Caja negra (navegador) =="; node --test --test-concurrency=1 e2e/site.test.mjs
echo "== Integración navegador ↔ Apps Script =="; node --test --test-concurrency=1 integration/form-api.test.mjs
echo "== Usabilidad y accesibilidad =="; node --test --test-concurrency=1 e2e/usability.test.mjs
echo "== Pentest del sitio =="; node --test --test-concurrency=1 security/client.test.mjs
echo "== Cobertura del JavaScript del navegador =="; node coverage-browser.mjs
echo "== Análisis estático de seguridad (ESLint) =="; cd .. && npx eslint --no-eslintrc -c .eslintrc.json docs/assets/js/*.js
