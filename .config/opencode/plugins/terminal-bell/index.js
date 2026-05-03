export const TerminalBell = async ({ $ }) => {
  const isMac = process.platform === "darwin";
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        try {
          if (isMac) {
            await $`afplay /System/Library/Sounds/Glass.aiff`;
          } else {
            await $`printf '\a'`;
          }
        } catch (err) {
          // bell sound is non-critical, silently continue
        }
      }
    },
  };
};
