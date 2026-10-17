// Carga los scripts del sitio (sin DOM) para pruebas unitarias.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const SITE = path.resolve(here, '../../docs');
export function loadSiteData() {
  const ctx = { window: {} }; ctx.self = ctx.window; vm.createContext(ctx);
  for (const f of ['logic.js', 'i18n.js', 'data.js', 'config.js']) {
    vm.runInContext(fs.readFileSync(path.join(SITE, 'assets/js', f), 'utf8'), ctx, { filename: f });
  }
  return { L: ctx.window.RDM_LOGIC || ctx.self.RDM_LOGIC, I18N: ctx.window.RDM_I18N, D: ctx.window.RDM_DATA, CFG: ctx.window.RDM_CONFIG };
}
