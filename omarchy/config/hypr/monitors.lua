-- See https://wiki.hypr.land/Configuring/Basics/Monitors/
-- List current monitors and supported resolutions with: hyprctl monitors all

-- Scaling and the connector the dock's monitor appears on are properties of the
-- machine, not of the dotfiles, so they are computed here rather than written as
-- literals: the Surface Laptop 7 (13.8", 2304x1536) is comfortable at 1.6 with 2x
-- GTK scaling, while the ThinkPad T14 Gen 5's 14" 1920x1200 panel throws away a
-- third of its height at 1.6 (1200x750 logical) and runs 1.25 (1536x960).
--
-- Computed rather than literal matters twice over. Omarchy parses this file with
-- sed and understands only literal numbers, and an expression it cannot resolve is
-- its documented signal to leave the scale to Hyprland (sync_internal_scale in
-- omarchy-hyprland-monitor-clamshell). Put `local omarchy_default_monitor_scale =
-- 1.6` back as a literal and Omarchy forces the laptop panel to 1.6 on every dock
-- event, on whichever machine reads the file.

local function omarchy_dmi_value(field)
  if type(io) ~= "table" or type(io.open) ~= "function" then
    return ""
  end

  local opened, handle = pcall(io.open, "/sys/class/dmi/id/" .. field, "r")
  if not opened or not handle then
    return ""
  end

  local read_ok, value = pcall(handle.read, handle, "*l")
  pcall(handle.close, handle)
  if not read_ok or type(value) ~= "string" then
    return ""
  end

  return value
end

-- Keyed on this machine, not on the vendor: sys_vendor alone is LENOVO on every
-- ThinkPad. Both the family string and the MTM count (product_name reports the
-- MTM here).
local function omarchy_is_thinkpad()
  local identity = table.concat({
    omarchy_dmi_value("sys_vendor"),
    omarchy_dmi_value("product_version"),
    omarchy_dmi_value("product_name"),
  }, " ")

  return identity:find("LENOVO ThinkPad T14 Gen 5", 1, true) ~= nil
    or identity:find("21MC004YUS", 1, true) ~= nil
end

local omarchy_thinkpad = omarchy_is_thinkpad()

-- A call, not a literal, on purpose: see the note at the top of this file.
local function omarchy_panel_scale()
  return omarchy_thinkpad and 1.25 or 1.6
end

local omarchy_gdk_scale = omarchy_thinkpad and 1 or 2
local omarchy_default_monitor_scale = omarchy_panel_scale()
local omarchy_widescreen_scale = 1

-- The laptop panel, and the dock's monitor. On the ThinkPad the Dell is matched by
-- description: it sits behind the dock's MST hub, whose connector name (DP-7,
-- DP-8, ...) changes on every replug. The Surface's dock shows up on DP-4. With
-- nothing docked, workspaces pinned to the external output fall back to the
-- laptop panel.
local omarchy_internal_output = "eDP-1"
local omarchy_external_output = omarchy_thinkpad and "desc:Dell Inc. DELL S3222DGM 54K20M3" or "DP-4"

hl.env("GDK_SCALE", tostring(omarchy_gdk_scale))
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = omarchy_default_monitor_scale })
hl.monitor({ output = omarchy_external_output, mode = "preferred", position = "auto", scale = omarchy_widescreen_scale })

-- Keep workspace 1 on the built-in laptop display. All of Omarchy's other
-- numbered workspaces live on the external display.
hl.workspace_rule({ workspace = "1", monitor = omarchy_internal_output, default = true, persistent = true })
for workspace = 2, 10 do
  hl.workspace_rule({
    workspace = tostring(workspace),
    monitor = omarchy_external_output,
    default = workspace == 2,
    persistent = true,
  })
end

-- On the ThinkPad, the lock's all-monitor DPMS-off knocked the dock's MST link
-- out until a replug; blanking only eDP-1 avoided it. The real dispatcher is
-- kept once in _G so reloads never wrap a previous wrapper.
-- ponytail: drop once an all-monitor DPMS-off keeps the dock's link up.
_G.omarchy_original_dpms = _G.omarchy_original_dpms or hl.dsp.dpms
if omarchy_thinkpad then
  hl.dsp.dpms = function(args)
    if type(args) == "table" and args.action == "disable" and args.monitor == nil then
      return _G.omarchy_original_dpms({ action = "disable", monitor = omarchy_internal_output })
    end
    return _G.omarchy_original_dpms(args)
  end
else
  hl.dsp.dpms = _G.omarchy_original_dpms
end

-- Configure a specific monitor.
-- hl.monitor({ output = "DP-2", mode = "2560x1440@144", position = "0x0", scale = 1 })

-- Portrait/rotated secondary monitor (transform: 1 = 90°, 3 = 270°).
-- hl.monitor({ output = "DP-2", mode = "preferred", position = "auto", scale = 1, transform = 1 })

-- BEGIN OMARCHY ARM QEMU VIRGL PROFILE
-- QEMU's Cocoa frontend publishes the live window's backing-pixel size and
-- host refresh rate through Virtio GPU EDID. Keep Quattro's preceding automatic
-- monitor rule authoritative so window resizing, Retina/non-Retina displays,
-- fullscreen, and 60/120 Hz hosts remain dynamic. Only hide the guest cursor:
-- Cocoa composes the host cursor outside the guest scanout for immediate motion.
local function omarchy_kernel_option_enabled(expected_option)
  if type(io) ~= "table" or type(io.open) ~= "function" then
    return false
  end

  local opened, cmdline_file = pcall(io.open, "/proc/cmdline", "r")
  if not opened or not cmdline_file then
    return false
  end

  local read_ok, cmdline = pcall(cmdline_file.read, cmdline_file, "*a")
  pcall(cmdline_file.close, cmdline_file)
  if not read_ok or type(cmdline) ~= "string" then
    return false
  end

  for option in cmdline:gmatch("%S+") do
    if option == expected_option then
      return true
    end
  end
  return false
end

if omarchy_kernel_option_enabled("omarchy.qemu_virgl=1") then
  -- QEMU reports the host display as a physically large desktop monitor, so
  -- automatic scaling chooses 1x even when the VM is on a 13-inch Retina panel.
  -- Keep dynamic EDID modes, but use a comfortable laptop logical scale.
  local omarchy_qemu_scale = "1.5"
  hl.monitor({ output = "", mode = "preferred", position = "auto", scale = omarchy_qemu_scale })
  hl.config({ cursor = { invisible = true } })
  o.exec_on_start(
    "env OMARCHY_DISPLAY_SYNC_SCALE=" .. omarchy_qemu_scale .. " $HOME/.local/bin/omarchy-native-display-sync"
  )
end
-- END OMARCHY ARM QEMU VIRGL PROFILE
