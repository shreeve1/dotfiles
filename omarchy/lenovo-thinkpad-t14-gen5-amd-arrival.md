# Lenovo ThinkPad T14 Gen 5 AMD — Arrival and Omarchy Setup Checklist

Purchased: September 22, 2026
Replaces: Surface Laptop 7 (Intel) — see `HARDWARE-surface-laptop-7.md`
Drivers and firmware guide: `lenovo-thinkpad-t14-gen5-amd-drivers.md`

## Purchase record

- Listing: https://www.ebay.com/itm/278399198004
- Price: $1,099.00 + $8.00 USPS Ground Advantage
- Seller: BestBinsEast (100% positive, ~2,377 ratings), ships from Albany, GA
- Condition (per listing): New
- Returns: 30 days, seller pays return shipping
- Lenovo MTM (from listing): `21MC004YUS`
- UPC (from listing): `198154361556`
- Listing specs: Ryzen 7 PRO 8840U, Radeon 780M, 32 GB RAM, 512 GB SSD,
  14" 1920x1200 touch, fingerprint reader, Windows 11 Pro

Return deadline: 30 days from delivery. Write the delivery date here: ____________

## What Lenovo's spec sheet says (platform, not this exact unit)

Source: Lenovo PSREF `ThinkPad_T14_Gen_5_AMD_Spec.pdf` (August 28 2026 edition).
The model-specific PSREF page for `21MC004YUS` did not load, so the items below are
platform options. Anything marked VERIFY must be confirmed on the actual machine.

- CPU: AMD Ryzen 5 / 7 PRO 8000 series
- Memory: two DDR5-5600 SODIMM slots, dual-channel, up to 64 GB (not soldered)
- Storage: one M.2 2280 PCIe 4.0 x4 slot, up to 2 TB
- WLAN (VERIFY which one): Qualcomm Wi-Fi 6E NFA725A (BT 5.3) or
  Qualcomm Wi-Fi 7 NCM825 (BT 5.3, 5.4-ready). No MediaTek option is listed.
- Ethernet: Realtek RTL8111EPV Gigabit, Wake-on-LAN
- Audio: Realtek ALC3287 codec
- Camera (VERIFY which one): 5 MP with privacy shutter, or 5 MP + IR with privacy shutter
- Display (VERIFY which touch panel): the spec sheet lists two 1920x1200 multi-touch
  panels, a 400-nit 45% NTSC panel and a 500-nit panel. The listing does not say which.
- Battery (VERIFY): 39.3 Wh or 52.5 Wh; 65 W USB-C charger
- Ports: 2x USB-C Thunderbolt 4 / USB4 40 Gbps (PD 3.0, DP 2.1), 2x USB-A 5 Gbps
  (one always-on), HDMI 2.1 (4K60), RJ-45, 3.5 mm combo jack; optional nano-SIM /
  smart card reader
- Fingerprint (listing says yes): match-on-chip reader in the power button
- Weight: about 1.37–1.39 kg (3.02–3.06 lb)

## Step 1 — On arrival, before touching Windows

- [ ] Inspect box and seals; photograph the box, bottom label, and any damage
      (useful if a return or warranty claim is needed).
- [ ] Record serial number (bottom label): ____________
- [ ] Confirm the bottom label MTM is `21MC004YUS`.
- [ ] Look up the serial at https://pcsupport.lenovo.com and record:
  - Warranty start: ____________  end: ____________  type: ____________
  - If the start date is well before the delivery date, note it (the "new" unit
    may have been registered earlier).
- [ ] Look up the MTM at https://psref.lenovo.com to identify the exact panel,
      battery, camera, and WLAN for this model.

## Step 2 — Firmware updates from Windows (optional but easiest)

Lenovo BIOS updates are also published through LVFS (`fwupd`), but doing the first
round from Windows avoids surprises.

- [ ] Boot Windows once, connect to Wi-Fi, run Lenovo Vantage / Commercial Vantage,
      apply BIOS, EC, and Thunderbolt firmware updates.
- [ ] Note the BIOS version after updating: ____________
- [ ] Optional: make a Windows recovery drive if you might want to restore Windows
      for resale later.

## Step 3 — BIOS settings (F1 at boot)

- [ ] Secure Boot: disable, or configure it per the Omarchy manual before installing.
- [ ] Sleep state: check whether the BIOS offers a "Linux" / S3 option. Leave it at the
      default (Windows / Modern Standby, s2idle) first; only change it if suspend
      testing below fails.
- [ ] Set a BIOS supervisor password only if you want one; do not lose it.

## Step 4 — Install Omarchy

- [ ] Boot the Omarchy USB installer (F12 boot menu).
- [ ] Before installing, from the live session, quickly check Wi-Fi, keyboard,
      touchpad, and display work.
- [ ] Install. Keep this checklist open on another device.

## Step 5 — Hardware test (do all of this inside the return window)

Record pass/fail and notes for each.

### Identify the hardware

```bash
cat /sys/class/dmi/id/product_name /sys/class/dmi/id/product_version
lscpu | grep 'Model name'
free -h
lspci -nnk | grep -A3 -Ei 'vga|display|network|ethernet|audio'
lsblk -d -o NAME,SIZE,MODEL
cat /sys/class/power_supply/BAT*/energy_full_design
```

- [ ] CPU is Ryzen 7 PRO 8840U
- [ ] 32 GB RAM detected; check stick layout with `sudo dmidecode -t memory | grep -E 'Size|Locator'`
      (2x16 GB is dual-channel; 1x32 GB means the second slot is empty)
- [ ] WLAN card identified: ____________ (driver should be `ath11k_pci` or `ath12k_pci`)
- [ ] Battery design capacity: ____________ Wh

### Checklist

| Item | How to test | Result |
|---|---|---|
| Graphics | `lsmod \| grep amdgpu`; smooth animations in Hyprland | |
| Wi-Fi | Connect on 5 GHz; run a speed test; leave connected 30 min | |
| Bluetooth | Pair headphones and a mouse; play audio | |
| Ethernet | Plug in cable; `ip addr` shows an address | |
| Speakers | Play audio; check both channels | |
| Microphone | Record a voice clip and play it back | |
| Headphone jack | Plug in wired headphones | |
| Webcam | Open a camera app or a browser video-call test | |
| Privacy shutter | Close shutter; image goes black | |
| Touchscreen | Tap and scroll in a browser | |
| Fingerprint | Enroll a finger with `fprintd-enroll`, then `fprintd-verify` | |
| Keyboard backlight | Fn + Space | |
| Function keys | Volume, brightness, mic mute, airplane mode | |
| Suspend / resume | Close lid 5+ min, reopen; Wi-Fi and BT reconnect | |
| Suspend drain | Suspend overnight; note battery % before/after | |
| Battery reporting | Battery % shows in the Omarchy bar | |
| Battery life | Light use from 100%; note hours | |
| USB-C charging | Charge from both USB-C ports | |
| External display | HDMI and USB-C / Thunderbolt monitor | |
| USB-A ports | Plug in a flash drive in each | |
| Brightness | Brightness keys change the panel | |
| Panel quality | Check brightness and color against the Surface (400 vs 500 nit panel) | |

### Useful diagnostics if something fails

```bash
journalctl -b -p 3 --no-pager | tail -50       # errors this boot
sudo dmesg | grep -iE 'firmware|ath1|amdgpu|error' | tail -40
cat /sys/power/mem_sleep                       # [s2idle] expected by default
fwupdmgr get-devices
```

## Step 6 — After it passes

- [ ] Follow the post-install run order in `lenovo-thinkpad-t14-gen5-amd-drivers.md`
      (microcode check, `omarchy-update-firmware`, `omarchy-setup-security-fingerprint`).
- [ ] Firmware updates from Linux going forward: `fwupdmgr refresh && fwupdmgr update`
- [ ] Optional RAM upgrade later: two SODIMM slots, up to 64 GB total.
- [ ] Restore dotfiles: `bash install.sh` from the repo root (see `README.md`).
- [ ] Update `README.md` "Host hardware" section to point at this machine.
- [ ] Decide what to do with the Surface Laptop 7 (wipe before selling).

## If it fails

- Message the seller through eBay within 30 days of delivery; they pay return shipping.
- Keep photos, the serial number, and notes from the checklist above.
- For hardware faults after the return window, use the Lenovo warranty via
  pcsupport.lenovo.com.

## Notes

- Why this machine: all-AMD platform (Radeon 780M, no NVIDIA), mature upstream Linux
  support for the Ryzen 8040/7040 generation, Qualcomm WLAN instead of MediaTek, and
  upgradeable RAM. These are expectations from research, not tested results — the
  checklist above is the real test.
- Performance expectation (general knowledge, not benchmarked): roughly even with the
  Surface's Core Ultra 7 266V single-core, faster multi-core, similar graphics.
