-- Extra autostart processes.
-- o.launch_on_start("my-service")

-- Text expander (triggers in ~/.config/espanso/match/). Refuses to start twice.
o.exec_on_start("espanso daemon")
