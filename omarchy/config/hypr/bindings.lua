-- Keep only your personal keybinding overrides here. Add new bindings or
-- unbind defaults before replacing them.

-- See current bindings and descriptions:
--   omarchy menu keybindings --print

-- To disable every Omarchy default binding, set this in
-- ~/.config/hypr/hyprland.lua before require("default.hypr.omarchy"), then add
-- only the bindings you want below:
--   omarchy_default_bindings = false

-- To disable all preinstalled app/webapp bindings, set:
--   omarchy_preinstalled_bindings = false

-- Add a new binding.
-- o.bind("SUPER + SHIFT + R", "SSH", "alacritty -e ssh your-server")

-- Change an existing binding by unbinding it first, then binding the key again.
-- This example changes SUPER+SPACE from the launcher to the Omarchy root menu.
-- hl.unbind("SUPER + SPACE")
-- o.bind("SUPER + SPACE", "Omarchy menu", "omarchy-menu toggle root")

-- Disable a default binding without replacing it.
-- hl.unbind("SUPER + SHIFT + B")

-- Logitech MX Keys examples:
-- o.bind("SUPER + SHIFT + S", nil, "omarchy-capture-screenshot")
-- Use hold-to-talk for both Voxtype shortcuts. Omarchy defaults
-- SUPER+CTRL+X to toggle mode and F9 to push-to-talk, so replace both.
hl.unbind("SUPER + CTRL + X")
o.bind("SUPER + CTRL + X", "Start dictation (push-to-talk)", "voxtype record start")
o.bind("SUPER + CTRL + X", "Stop dictation (push-to-talk)", "voxtype record stop", { release = true })
hl.unbind("F9")
o.bind("CTRL + SPACE", "Start dictation (push-to-talk)", "voxtype record start")
o.bind("CTRL + SPACE", "Stop dictation (push-to-talk)", "voxtype record stop", { release = true })
-- o.bind("SUPER + PERIOD", nil, "omarchy-shell shell toggle omarchy.emojis")

-- Super+Enter originally used Omarchy's direct terminal launcher. In this VM,
-- Ghostty must start via its desktop entry so its software-rendering service
-- environment (LIBGL_ALWAYS_SOFTWARE=1) is applied.
hl.unbind("SUPER + RETURN")
o.bind("SUPER + RETURN", "Terminal", { launch = "gtk-launch com.mitchellh.ghostty.desktop" })

-- Focus-driven overlapping deck layout. The service promotes the focused
-- window automatically; these bindings adjust its foreground scale or pause it.
o.bind("SUPER + ALT + PRIOR", "Deck: enlarge foreground", "hypr-deck scale 0.05")
o.bind("SUPER + ALT + NEXT", "Deck: shrink foreground", "hypr-deck scale -0.05")
o.bind("SUPER + ALT + D", "Deck: toggle automatic overlap", "hypr-deck toggle")
o.bind("SUPER + SHIFT + ALT + D", "Deck: restore normal tiling", "hypr-deck restore-tiling")

-- Keep a Deck window's saved leaf while temporarily expanding or pinning it.
-- Native toggles only change live floating state, leaving Deck unable to know
-- that a second press should restore and promote the original slot.
hl.unbind("SUPER + T")
o.bind("SUPER + T", "Deck-aware expand/restore toggle", "hypr-deck float-toggle")
hl.unbind("SUPER + O")
o.bind("SUPER + O", "Deck-aware pop window", "hypr-deck pop-toggle")

-- Floating overlap has no reliable native directional focus order. Replace the
-- default tile-oriented arrows with Deck's saved-slot geometric navigation.
for key, direction in pairs({ LEFT = "left", RIGHT = "right", UP = "up", DOWN = "down" }) do
  hl.unbind("SUPER + " .. key)
  o.bind("SUPER + " .. key, "Deck focus " .. direction, "hypr-deck focus " .. direction)
  -- Native swaps move live floating geometry only. Deck must instead exchange
  -- saved split-tree ownership so the move survives the next focus event.
  hl.unbind("SUPER + SHIFT + " .. key)
  o.bind("SUPER + SHIFT + " .. key, "Deck swap " .. direction, "hypr-deck swap " .. direction)
end
