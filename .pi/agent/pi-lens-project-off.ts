// Lets one project turn pi-lens off. pi-lens's own on/off switch (lens.enabled)
// is machine-wide only, so a project that drops a .pi/pi-lens.json gets that
// file used as pi-lens's config instead of ~/.pi-lens/config.json; put
// {"lens": {"enabled": false}} in it. itastack does this (2026-11-05): pi-lens
// scanned its ~11k files before every bash call, ~1.3 s each, for Markdown hints.
//
// Must load before pi-lens reads its config: listed by path in settings.json
// "extensions", which pi loads ahead of auto-discovered extensions/ entries.
// ponytail: depends on that load order; after a pi upgrade, check that a pi
// session in itastack shows no pi-lens LSP status. Upgrade path: a project-scoped
// lens.enabled in pi-lens, if upstream adds one.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export default function piLensProjectOff(_pi: ExtensionAPI) {
  if (process.env.PI_LENS_CONFIG_PATH) return;
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    const file = join(dir, ".pi", "pi-lens.json");
    if (existsSync(file)) {
      process.env.PI_LENS_CONFIG_PATH = file;
      return;
    }
    if (dirname(dir) === dir) return;
  }
}
