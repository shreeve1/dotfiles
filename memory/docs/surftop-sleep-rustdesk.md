---
title: SURFTOP Sleep and RustDesk Power Requests
summary: RustDesk's disconnected remote session can hold a DISPLAY request on SURFTOP; its Qualcomm SoC also spends most Modern Standby time outside hardware DRIPS.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: []
---

## Active memory

- SURFTOP is a Windows 11 ARM Surface. `powercfg /a` reports only Standby (S0 Low Power Idle) Network Connected and Hibernate, not S3. The Balanced plan turns the display off after 10 minutes and sleeps after 20 minutes on battery, or 20 and 30 minutes on AC. The unattended-sleep timeout is 2 minutes, and battery wake timers are disabled.
- When the display stays on, check an elevated `powercfg /requests` before assuming system sleep failed. Distinguish a `DISPLAY` request from a `SYSTEM` request. On 2026-10-30, RustDesk 1.5.0+68 had an outgoing session to wrk that disconnected at 07:29 but still held the only `DISPLAY` request; `SYSTEM` was `None`. Gracefully closing that remote-session window cleared the request while RustDesk remained resident in its tray.
- A 7-day SleepStudy found 68 sleep sessions. Twelve exited for the PDC Maintenance Scheduler, one for Windows Update, and six because the restricted-standby battery drain budget was exceeded. Some long sleep sessions reported `NoHwDrips.SOC` at 94 to 99 percent, showing that the Qualcomm SoC was not reaching hardware DRIPS and drained faster than ideal.
- The last observed wake source was the Surface Button, with no active wake timers.
- Useful elevated diagnostics are `powercfg /requests`, `powercfg /waketimers`, `powercfg /lastwake`, and `powercfg /sleepstudy /duration 7 /output <file>`. `powercfg /systemsleepdiagnostics` is deprecated in favor of `powercfg /systempowerreport`.
