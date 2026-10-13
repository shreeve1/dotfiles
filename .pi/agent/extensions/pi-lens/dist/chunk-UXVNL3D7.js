import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/installer/managed-tool-refresh-session.js
var refreshesThisSession = 0;
function reserveManagedToolRefreshSlot(maxPerSession) {
  if (refreshesThisSession >= maxPerSession)
    return false;
  refreshesThisSession += 1;
  return true;
}
function releaseManagedToolRefreshSlot() {
  if (refreshesThisSession > 0)
    refreshesThisSession -= 1;
}
function resetManagedToolRefreshSession() {
  refreshesThisSession = 0;
}

export {
  reserveManagedToolRefreshSlot,
  releaseManagedToolRefreshSlot,
  resetManagedToolRefreshSession
};
