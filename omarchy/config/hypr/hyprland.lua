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

-- HyprVim (cloned + pinned by install.sh). SUPER+U enters NORMAL mode and
-- exits again; the defaults SUPER+V / SUPER+ESCAPE are Omarchy's paste and
-- system menu. Which-key needs eww (not installed), so it is off.
local hyprvim = loadfile(os.getenv("HOME") .. "/.local/share/hyprvim/init.lua")
if hyprvim then
hyprvim().setup({
  keys = { activate = "U" },
  -- ghostty can't set a plain window class (needs a dotted id), so prompt bars use foot.
  applications = { terminal = "foot" },
  which_key = { enabled = false },
  updates = { channel = "off" },
  -- i/a enter INSERT normally (a passthrough submap). Prefer fully exiting
  -- HyprVim: reset the submap and send the key's effect to the window instead.
  -- ponytail: o/O still use built-in INSERT.
  keymaps = {
    NORMAL = {
      {
        "i",
        function()
          require("hyprvim.lib.submap").reset()
        end,
        "Exit HyprVim (no char typed)",
      },
      {
        "a",
        function()
          require("hyprvim.lib.submap").reset()
          require("hyprvim.hypr").send("", "RIGHT")
        end,
        "Exit HyprVim, cursor right (no char typed)",
      },
      {
        "SHIFT + i",
        function()
          require("hyprvim.lib.submap").reset()
          require("hyprvim.hypr").send("", "HOME")
        end,
        "Exit HyprVim, line start (no char typed)",
      },
      {
        "SHIFT + a",
        function()
          require("hyprvim.lib.submap").reset()
          require("hyprvim.hypr").send("", "END")
        end,
        "Exit HyprVim, line end (no char typed)",
      },
    },
  },
})
end

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
