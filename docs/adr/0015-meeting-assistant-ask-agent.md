---
status: accepted
---
# The Ask agent has full project tools and is fed Research Cards, guarded by prompt only

The Meeting Assistant gains an Ask box in the Overlay, backed by one long-lived omp process (the Ask agent) run from `~/Documents/itastack`. It loads the project's `AGENTS.md`, memory and skills and has the same tools as the terminal agent, including the ITAStack tools that can change Halo, M365 and other client systems. The user chose this so a call can pull tickets and use personal memory. Ticket 062 holds the build details.

## Considered Options

- Gate every write behind a confirm in the Overlay (`--approval-mode`): declined by the user. How `--approval-mode` behaves over RPC was not tested.
- Cards shown but not fed to the agent: declined by the user.
- Read-only agent: declined by the user, who wants actions.
- A separate Ask window: rejected, because `no_screen_share` is per namespace and a second surface doubles what a share can reveal.
- Auto-feed each card as it appears: rejected, because a card could then start a turn with write tools by itself.
- A fixed guard block outside the Persona: rejected, because `AGENTS.md` line 85 already says to name and confirm any change to a client or connected system, and the Ask agent loads it.

## Consequences

- The write guard is an instruction, not a gate. Assumed: a smaller model is less likely to hold it against planted text, and tool-call behaviour is untested.
- Cards come from web pages and spoken words, so a caller or a page can plant instructions in one. They reach the agent as untrusted text on the next message, through an extension, with the typed text unchanged. The agent can also read `cards.jsonl` and the live transcript with its file tools, so the labelling protects only the push route.
- [INFERENCE] Planted text steering a write-capable agent during a live call needs several steps, so it is unlikely. It was not tested and the cost is high. Revisit the gate if the agent is seen acting on a card's contents, and check ITAStack tool calls before using it on a real ticket.
- Privacy. Call text, typed text and the results of ITAStack and file tools (Halo tickets, M365 data, client names) reach OpenRouter (DeepSeek) through the Ask agent, with no general-topic-only rule and no limit on how much transcript it can read. The research workers keep both limits. The omp advisor, which copies each turn to `cliproxy/gpt-6.1-sol`, is switched off for this process with a shipped `--config` overlay. Verified with a throwaway probe.
- Pause changes meaning. It stops research and card creation, drops unsent cards, and leaves Ask working. Ask still re-sends the whole saved conversation on every turn, and the agent can read the live transcript. Recording continues. The exact wording is in ticket 062.
- The Overlay takes keyboard focus while the box is open, and the open surface is larger than a card, so a screen share hides a larger rectangle then. Only `grim` was exercised; the portal is inferred, as in ADR 0014.
- Amends ADR 0014: the privacy sentence has a second route, "never takes keyboard focus" no longer holds while the box is open, and "card-sized surface" holds only while the box is closed.
- The conversation persists across Meetings in `~/Documents/itastack/artifacts/meeting-assistant/`. Call and client text sits there until "new conversation", which does not remove anything the agent wrote into `memory/`, `research/`, `notes/` or `reports/`.
