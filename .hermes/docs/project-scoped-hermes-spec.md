# Project-scoped lean Hermes profile

Status: complete. Projectlean's reviewed SOUL is live after James's projectlean-only protected backup/copy approval. Tested with Hermes Agent v0.21.2 (upstream `2f21d29f`, local `4e142b28`).

## Design and protected boundary

`projectlean` is a thin, project-scoped profile: a project `.hermes.md` routes knowledge work to the existing wiki, a portable `SOUL.md` supplies universal wiki-first discipline, and reusable procedures live in six vendored skill trees. This package never creates an auto-loaded project instruction file or SOUL. The router and SOUL are non-loaded templates until a human approves their protected-file copies.

Materializing `<target-repo>/.hermes.md` or the profile `SOUL.md` is a manual, human-approved step. Do not route around the platform's protected instruction-file gate. James approved and completed only the projectlean `SOUL.md` copy; the project router remains an unmaterialized template.

## Package layout

- `.hermes/bin/install-projectlean.py`: idempotent installer.
- `.hermes/bin/verify-projectlean.py`: deterministic preflight and post-apply verifier.
- `.hermes/templates/project-hermes-router.md.template`: manual router template.
- `.hermes/templates/projectlean-soul.md.template`: manual wiki-first SOUL template.
- `.hermes/templates/projectlean-config.json.template`: portable exact runtime settings.
- `.hermes/skills/`: exactly six complete trees: custom `independent-reviewer`, `grill-me`, `handoff`; required `hermes-agent`, `llm-wiki-setup`, `wiki-update`.

The installer manifest includes complete-tree hashes, the exact SOUL-template SHA, and the parsed portable-config intent. It never writes, removes, or overwrites `SOUL.md`. The verifier statically rejects a SOUL over 2,100 UTF-8 bytes, missing the merged stock communication contract, wiki-first/end-of-run/project-native-follow-up/safety concepts, host or profile facts, and obvious copied workflow structure. Final post-apply acceptance requires the protected live `SOUL.md` to byte-match the template. It also checks portable config intent, the six profile-local skill directories, explicit CLI enabled and disabled lists, exact live memory/config values, parity between vendored and canonical `.agents` wiki skills, and live `hermes --profile projectlean prompt-size --json`. The prompt check accepts only `file`, `terminal`, `vision`, `skills`, and unavoidable `(unknown)` core/deferred schemas; it fails if `kanban` reappears and records exact tool/schema measurements.

The wiki skills use one contract: set `WIKI_UPDATE_SKILL_DIR` to the installed `wiki-update` directory, resolve `WIKI_GATE="$(python3 "$WIKI_UPDATE_SKILL_DIR/resolve-gate.py" --project-root .)"`, then invoke `python3 "$WIKI_GATE" ...`. The resolver uses its paired gate first, then installed/project-vendored `.agents`, `.hermes`, and legacy `.claude` paths. A configured but nonexistent `WIKI_UPDATE_GATE` fails closed; no claim write may fall back to hand editing.

## Cross-system install, verify, rollback

From a clone of this repository:

1. Run `python3 .hermes/bin/verify-projectlean.py --mode preflight`.
2. Run `python3 .hermes/bin/install-projectlean.py --profile projectlean --clone-from default --repo /path/to/project`.
3. After human approval, run `PROFILE_DIR="$(dirname "$(hermes --profile projectlean config path)")"`, back up `"$PROFILE_DIR/SOUL.md"` as `"$PROFILE_DIR/SOUL.md.stock.bak"`, then copy `.hermes/templates/projectlean-soul.md.template` to `"$PROFILE_DIR/SOUL.md"`.
4. Run `python3 .hermes/bin/verify-projectlean.py --profile projectlean --mode postapply`, `sha256sum "$PROFILE_DIR/SOUL.md" .hermes/templates/projectlean-soul.md.template`, and `hermes --profile projectlean prompt-size --json`.
5. In a project with a conformant wiki, make one real project-context query that starts at `wiki/index.md` and states whether a durable update must go through `wiki-update`.
6. Re-run step 2 and final verification; matching manifests and hashes prove idempotence. After separate human approval, copy `.hermes/templates/project-hermes-router.md.template` to `/path/to/project/.hermes.md` manually.

The installer clones only enough live profile configuration/auth state to run the profile, deletes its cloned profile-local skills, installs the six vendored trees, leaves any `SOUL.md` untouched, disables built-in memory/user-profile injection and its external memory provider, and restricts CLI tools to `file`, `terminal`, `vision`, and `skills`. Its checked portable config sets `agent.coding_context=off`, retains `agent.execution_guidance=auto`, and fixes compression at `threshold=0.4`, `target_ratio=0.2`, `protect_last_n=12`, `min_tail_user_messages=1`, and `abort_on_summary_failure=false`. It also disables recovered non-configurable `kanban` and `messaging` toolsets: the CLI tool picker does not list them, but prompt assembly recovers them from the CLI composite.

## Model-gated guidance rationale

Generic execution guidance is auto-applied only to GPT/Codex, Grok, DeepSeek, Kimi, Qwen, GLM, Minimax, MiMo, Mistral, and Muse model families. Claude receives none; Gemini and Gemma use their separate guidance. Models outside those gates incur no guidance block. Projectlean disables coding context independently, so project behavior remains the portable SOUL, selected skills, and an explicitly approved project router rather than a generic coding-context payload.

SOUL rollback: after human approval, restore `"$PROFILE_DIR/SOUL.md.stock.bak"` to `"$PROFILE_DIR/SOUL.md"`, then re-run prompt-size. Profile rollback: `hermes profile delete projectlean`. This removes only the named profile; it does not edit `default`, a project router, or a gateway. Remove a manually materialized project `.hermes.md` only through the normal human-approved protected-file path.

## Observed apply and verification

- Preflight, Python compilation, dry-run, static template contract, expected pre-copy post-apply refusal, final post-copy post-apply acceptance, resolver success/fail-closed smoke, and `git diff --check` passed.
- Second apply passed with identical six-tree hashes.
- `projectlean` enabled exactly `file`, `terminal`, `vision`, `skills`; its explicit disabled list contained 23 other CLI/plugin/recovered toolsets, including `kanban` and `messaging`.
- Memory values were `memory_enabled=false`, `user_profile_enabled=false`, `provider=''`.
- Current projectlean measurements after disabling coding context: system 14,107 bytes, skill index 583, memory 0, user profile 0, 12 tool schemas / 16,213 bytes (`file` 4, `skills` 3, `terminal` 1, `vision` 1, unavoidable `(unknown)` 3). The measured before value was 17,386 system bytes, so the exact reduction was 3,279 bytes; no token estimate was made. The post-apply verifier records the same receipt after every apply. The prior 41,502-byte figure was invalid because it included 15 recovered Kanban schemas. Do not use `hermes tools list` alone as proof of the live prompt surface.
- Current query from `/home/james/homelab`, with coding context disabled, routed through `wiki/index.md` and found no remediation coverage. It reported the primary managed-skill evidence that the alert-forwarder schedule's `armed` boolean is the only auto-actuation gate, identified the wiki coverage gap, and correctly required a `wiki-update` candidate/review path without writing one.
- Default CLI tool listing was byte-identical. Gateway remained active with Main PID 1202 and unchanged activation timestamp; installer contains no gateway command.
- An OMP re-review round-tripped `default` configuration during its own verification, changing YAML bytes. Current default configuration is semantically identical to its automatic `.bak`; no default tool or gateway state changed. This is the sole deviation from byte-for-byte default evidence.
- Live SOUL: SHA-256 `8662733d6b4141e10f70b2c3ff9109392500ea4c7c9f2e7fe4279fa5733edaa5`; 1,886 UTF-8 bytes, +1,219 bytes over the retained 667-byte stock backup. `prompt-size` reports 14,107 system-prompt bytes and preserves 12 schemas / 16,213 schema bytes. The installed environment has no Claude-compatible tokenizer, so an exact model-token delta is intentionally not fabricated; byte deltas are authoritative.
- The merged SOUL preserves the stock Hermes communication contract, adds wiki-first/end-of-run discipline, and routes substantial follow-up work to a project's documented/native issue system without inventing or silently creating external issues. Hermes Kanban and messaging remain excluded; OpsLead routing is outside this profile.
- A real `projectlean` query read `wiki/index.md`, detected the missing remediation route, and identified a `wiki-update` candidate/review obligation. No candidate was created; promotion remains a human-reviewed follow-up.
- That query populated extra profile skill directories; the final post-apply verifier rejected the drift. Re-running the idempotent installer restored exactly the six vendored trees without rewriting the protected SOUL, and final post-apply plus SHA parity passed.

## OMP review record

Initial read-only OMP review blocked an invalid `--clone-from` plus `--no-skills` combination and a wrong-cased memory assertion. Both were fixed. Re-review returned `revise`: it required assertion of the explicit disabled list; that assertion, canonical wiki parity, exact skill-directory count, and absent-profile handling were added and deterministically verified before apply. OMP did not approve any protected-file write or gateway action. The required independent review for the merged SOUL could not run: OMP 18.1.21 was available, but its task-private `kanban-t_6f1c0d2c` profile had no model/auth. Direct deterministic review was used instead.

## Regression lessons

- `hermes tools list` is a picker/configuration view, not a complete prompt-assembly proof: recovered non-configurable toolsets, including Kanban, can bypass it. Assert `prompt-size --json` against the actual schemas.
- Final acceptance must compare raw SOUL bytes to the reviewed template, not infer customness from the runtime's stock text. This makes the protected human copy explicit and portable across Hermes versions.

## Manifest (SHA-256 tree hashes)

- `projectlean-soul.md.template`: `8662733d6b4141e10f70b2c3ff9109392500ea4c7c9f2e7fe4279fa5733edaa5` (1,886 bytes)
- `independent-reviewer`: `1db0c1bc1f89fdc93a3230bf7bf3350bcc5164447fec44a779566c9b07a7fa94`
- `grill-me`: `dbaa8c334fbce8a945fc4be9ce97a30d1075da2a02a11b8569fbb976bc028bf8`
- `handoff`: `0766deec2a5a1c2d2f867e7066a478fb59846f34e2536841ea495da6bf718763`
- `hermes-agent`: `5f85e4d3063d0065ecf5add3791252c7deb180c7f83168e7eac0def7e58eccce`
- `llm-wiki-setup`: `e3e154fe839f8ae9018f753d7d2bf926a5666e91e0994f57b8fc811ac094e852`
- `wiki-update`: `301a86b35a52014cac61659e284d34431f555ccbb26834614591691e6f654724`
