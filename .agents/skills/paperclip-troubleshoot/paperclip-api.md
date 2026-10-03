# Paperclip API — shared setup

Reference shared by the Paperclip skills. **Not a skill** — plain markdown, no frontmatter, so it
is never loaded on its own; a skill points at it when it needs the connection or a shared fact.

## Connection

Paperclip agent runs receive `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY`,
`PAPERCLIP_COMPANY_ID`, `PAPERCLIP_AGENT_ID`, `PAPERCLIP_RUN_ID`, and
`PAPERCLIP_TASK_ID` from the `pi_local` adapter. For an operator shell, authenticate the
Paperclip CLI separately; never store a board key in this repository.

```sh
API="${PAPERCLIP_API_URL:-https://paperclip.itassurance.com}"
: "${PAPERCLIP_API_KEY:?PAPERCLIP_API_KEY is not loaded; authenticate the operator CLI first}"
AUTH=(-H "Authorization: Bearer $PAPERCLIP_API_KEY")
```

Never print the key, place it in a command line, or copy it from
`/home/itadmin/.paperclip/instances/**`. Pass it only through the loaded environment.

## Resolve the company

The ITA company is available at `https://paperclip.itassurance.com/ITA/`. Prefer the
adapter-provided `PAPERCLIP_COMPANY_ID`; otherwise call `GET /api/companies` and select the
entry whose slugified `name` is `ita`. Never hardcode the company UUID — call it `C`.

```sh
C="${PAPERCLIP_COMPANY_ID:-}"
curl -sS "${AUTH[@]}" "$API/api/companies"
```

## Shared API facts

- **There is no `open` status.** `status=open` returns nothing, silently. Open =
  `backlog,todo,in_progress,in_review,blocked`; terminal = `done,cancelled`.
- **One assignee only.** `assigneeUserId` needs `assigneeAgentId: null` in the same update, and
  vice versa (`422` "Issue can only have one assignee").
