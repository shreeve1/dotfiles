-- Learn how to configure Hyprland: https://wiki.hypr.land/Configuring/Start/

-- Omarchy's bootstrap keeps path setup out of this user config.
dofile((os.getenv("OMARCHY_PATH") or "/usr/share/omarchy") .. "/default/hypr/bootstrap.lua")

-- Disable all Omarchy default bindings. Add your own in hypr/bindings.lua.
-- omarchy_default_bindings = false
--
-- Or disable only bindings for Omarchy's preinstalled apps/web apps while
-- keeping core window-manager bindings:
-- omarchy_preinstalled_bindings = false

-- Load Omarchy defaults.
require("default.hypr.omarchy")

-- Put your personal overrides in these files. They're loaded after Omarchy's
-- defaults so package updates can improve the defaults without rewriting your
-- ~/.config/hypr files.
require("hypr.monitors")
require("hypr.input")
require("hypr.bindings")
require("hypr.looknfeel")
require("hypr.autostart")

-- Toggle config flags dynamically.
require("default.hypr.toggles")

-- Add any other personal Hyprland configuration below.
-- o.window("qemu", { workspace = "5" })

-- Zoom creates a normal tiled XWayland window by default. Keep it outside
-- hypr-deck so opening Zoom does not split and rearrange the current workspace.
o.window("^zoom$", { float = true, center = true, size = { 1056, 700 } })

-- Slack's Huddle preview is a separate window from the main Slack client.
-- Leave the main client managed, but keep Huddle windows out of Deck's tree.
o.window({ class = "^slack$", title = "^Slack - Huddle Preview$" }, {
  tag = "+deck-ignore",
  float = true,
  center = true,
})
