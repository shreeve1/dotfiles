export const TerminalBell = async ({ $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        try {
          await $`afplay /System/Library/Sounds/Glass.aiff`;
        } catch (err) {
          console.warn("Failed to play audible bell:", err);
        }
      }
    },
  };
};
