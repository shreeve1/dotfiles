# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Local `.kanban/` boards

On a local board these labels live in each ticket's `labels:` frontmatter field, separate from `status:`:

- `status:` is the **execution lifecycle** (`pending`, `in-progress`, `review`, `done`, `blocked`, `cancelled`). The loop owns it.
- `labels:` is the **triage role**. `/triage` and humans own it; moving a ticket between states means swapping its state label, never touching `status:`.

`tralph` / `gralph` / `ralph` work a ticket only when `status: pending` **and** `labels:` holds exactly one state label, `ready-for-agent`. Because the runtime matches these strings literally, **keep the right-hand column identical to the left on a local board** (the only supported rename is the `ready-for-agent` string, via `RALPH_READY_LABEL`). A new, untriaged ticket is `needs-triage`.
