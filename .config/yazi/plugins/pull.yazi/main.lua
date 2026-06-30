--- @sync entry
-- Copy hovered file's path / filename / a ready-to-paste `scp -r` pull command to
-- the LOCAL clipboard via yazi's native OSC 52. ya.clipboard() writes straight to
-- the TTY, so it survives SSH + tmux — unlike `shell '... | osc52'`, whose stdout
-- yazi captures into its task pipe and the OSC 52 sequence never reaches the
-- terminal. Usage from keymap:  run = 'plugin pull -- scp|path|name'
return {
	entry = function(_, job)
		local h = cx.active.current.hovered
		if not h then
			return
		end
		local mode = job.args[1] or "scp"
		local s
		if mode == "name" then
			s = h.url.name or ""
		elseif mode == "path" then
			s = h.url.path
		else -- "scp": host = routable IP the SSH client reached, else this hostname
			local host = os.getenv("YAZI_PULL_HOST") or ya.host_name()
			s = ("scp -r %s@%s:%s ."):format(ya.user_name(), host, h.url.path)
		end
		ya.clipboard(s)
	end,
}
