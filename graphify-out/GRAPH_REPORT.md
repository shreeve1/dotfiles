# Graph Report - .  (2026-09-09)

## Corpus Check
- 43 files · ~45,412 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 162 nodes · 196 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- check.sh Validation Harness
- dsh-board Autonomous Pipeline
- Fusion Verification & Roles
- DSH Deployment & Plugins
- Ralph / omp Loop
- RPIV Cross-Engine Pipeline
- Fusion Mode Core
- Interactive Learning Plugin
- Grounding & Completeness Gates
- Prune Dead-Links Toolchain
- pi-moa Mixture-of-Agents
- ktest Review Protocol Probe
- ktest Marker Check Script
- dsh-pilot Browser Automation
- graphify CLI

## God Nodes (most connected - your core abstractions)
1. `install.sh Installer` - 11 edges
2. `Fusion Orchestration Mode` - 10 edges
3. `dsh-board Pipeline Analysis` - 10 edges
4. `DeepSeek Harness aidev Deployment` - 8 edges
5. `RPIV Pipeline Driver And Companion Skills` - 8 edges
6. `Claude Fusion (Claude orchestrates, Pi executes)` - 7 edges
7. `Wiki Routing` - 7 edges
8. `check.sh Regression Gate` - 7 edges
9. `omp Fusion (Oh My Pi port)` - 6 edges
10. `dsh-learn-panel` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Verification Gate (Ralph)` --semantically_similar_to--> `check.sh Regression Gate`  [INFERRED] [semantically similar]
  CONTEXT.md → check.sh
- `check.sh Regression Gate` --conceptually_related_to--> `Unattended Build Board`  [EXTRACTED]
  check.sh → CLAUDE.md
- `Vendored pi-subagents Runtime` --conceptually_related_to--> `Pi Agent Setup`  [INFERRED]
  README.md → install.sh
- `graphify Hook Wiring` --conceptually_related_to--> `graphify Commit Hook`  [INFERRED]
  install.sh → README.md
- `Dotfiles Agent Context` --references--> `install.sh Installer`  [EXTRACTED]
  CLAUDE.md → install.sh

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fusion orchestration family (Pi/Claude/omp ports)** — docs_adr_0002_fusion_mode_fusion_mode, docs_adr_0003_claude_fusion_claude_fusion, docs_adr_0006_omp_fusion_omp_fusion [EXTRACTED 1.00]
- **Ralph loop worker/planner ADR chain** — docs_adr_0005_ralph_planner_stage_planner_stage, docs_adr_0007_ralph_single_worker_per_issue_single_worker, docs_adr_0008_ralph_omp_workers_omp_workers [EXTRACTED 1.00]
- **prune-dead-links spec + oracle + gate toolchain** — docs_specs_k551_dangling_symlinks_prune_dead_links, docs_specs_k745_prune_oracle_harness_prune_oracle, docs_specs_k801_checksh_python_selector_python_selector [EXTRACTED 1.00]
- **RPIV Pipeline Companion Skills** — wiki_analyses_rpiv_pipeline_rpiv_monitor, wiki_analyses_rpiv_pipeline_gap_sweep, wiki_analyses_rpiv_pipeline_rpiv_merge [EXTRACTED 1.00]
- **dsh-board Loop Fixes** — wiki_analyses_dsh_board_pipeline_captain_death_loop, wiki_analyses_dsh_board_pipeline_composite_task_fix, wiki_analyses_dsh_board_pipeline_agent_teams [EXTRACTED 0.95]
- **OpenCode Infrastructure Execution Chain** — wiki_raw_opencode_subagents_infra_chain, wiki_raw_opencode_subagents_forge, wiki_raw_opencode_subagents_validator [INFERRED 0.75]
- **Symlink Install Lifecycle** — install_link_path, install_backup_path, install_self_link_guard [EXTRACTED 1.00]
- **Two-layer Verification Model** — context_grounding_gate, context_completeness_review, context_verification_gate_ralph [EXTRACTED 1.00]
- **check.sh Verify Passes** — check_install_sources_resolve, check_shell_syntax, check_python_syntax, check_json_parses, check_declared_links_resolve [EXTRACTED 1.00]

## Communities (15 total, 4 thin omitted)

### Community 0 - "check.sh Validation Harness"
Cohesion: 0.08
Nodes (32): Coverage Guard, Declared Links Resolve Check, install.sh Sources Resolve Check, JSON Parse Check, Python Syntax Check, check.sh Regression Gate, Shell Syntax Check, Always-on Agent Rules (+24 more)

### Community 1 - "dsh-board Autonomous Pipeline"
Cohesion: 0.12
Nodes (24): agent_teams Captain/Scheduler, Captain-Death Build-Decompose Loop, Composite Task Build Fix, Cron Tick Staggering vs 429, dsh-board Pipeline Analysis, Fully Autonomous FF-Only Merge, Handlers Are Agent-Prose Not Code, spec-committed Decompose Gate (+16 more)

### Community 2 - "Fusion Verification & Roles"
Cohesion: 0.12
Nodes (23): Completeness Review (fresh tooled subagent), gap-review extension, Grounding Gate (pi-duo), Two-Layer Verification, Fusion Bash Policy (role enforcement), Fusion Orchestration Mode, Parent Tool Allowlist, Fusion Retry Ladder (+15 more)

### Community 3 - "DSH Deployment & Plugins"
Cohesion: 0.16
Nodes (16): profile bundles ordered mount list, DeepSeek Harness aidev Deployment, dsh-full-remote (TLS + token reverse proxy), dsh-fusion plugin, dsh-goal-keeper (mini-advisor), Effective Fusion allowlist (cordis.patch.yml), In-session bash restart self-sever root cause, Loopback-only config/secrets fence (+8 more)

### Community 4 - "Ralph / omp Loop"
Cohesion: 0.15
Nodes (13): PI_SUBAGENT_CHILD env gate, Ralph Loop Planner Stage, tralph / ralph-loop.sh driver, Maximize Built-ins Constraint, omp Fusion (Oh My Pi port), Repo-Tracked Default (.omp/agent/fusion.json), Orchestrator-by-Session-Id Detection, implement skill (+5 more)

### Community 5 - "RPIV Cross-Engine Pipeline"
Cohesion: 0.23
Nodes (12): Base-Ref Persistence (.base), File-Based Cross-Engine Handoff, gap-sweep Skill, rpiv-merge Skill, rpiv-monitor Skill, RPIV Pipeline Driver And Companion Skills, rralph Pipeline Driver, RPIV Pipeline Skills Session Capture (+4 more)

### Community 6 - "Fusion Mode Core"
Cohesion: 0.22
Nodes (10): Fusion Mode, Child Session, Claude Fusion, Fusion Mode (Pi), In-band Verifier, omp Fusion, Orchestrator Session, pi-delegate Delegation Vehicle (+2 more)

### Community 7 - "Interactive Learning Plugin"
Cohesion: 0.25
Nodes (9): dsh Interactive Learning Plugin Brainstorm, dsh-better-sidebar extension surface, teach quiz-ui.md harness question tool rule, agent.followup return leg, dsh-learn-panel, Sidebar as Instrument Panel, learn_card tool, k1002 Teach Answer-Ordering Rule Guard (+1 more)

### Community 8 - "Grounding & Completeness Gates"
Cohesion: 0.29
Nodes (7): Completeness Failure, Completeness Review, Fresh-session Reviewer, Grounding Failure, Grounding Gate, Verification Gate (Ralph), Verification — Agent Output Trust

### Community 9 - "Prune Dead-Links Toolchain"
Cohesion: 0.38
Nodes (7): k551 prune-dead-links + dead install loop, prune symlink-safety canonicalize rule, Oracle-based differential testing (realpath), k745 prune-oracle differential harness, check.sh gate, .gitignore /tests/* negation rule, k801 check.sh Python Selector

### Community 10 - "pi-moa Mixture-of-Agents"
Cohesion: 0.67
Nodes (3): pi-moa Advisor Cost Tuning Session, pi-moa Mixture-of-Agents Provider, pi-moa Fusion Install Session

## Knowledge Gaps
- **50 isolated node(s):** `check-ktest-marker.sh script`, `Fusion Retry Ladder`, `Parent Tool Allowlist`, `Sourcing Rule (model+tools from settings, persona from agents)`, `Single-Dispatch Guard (removed)` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fusion Orchestration Mode` connect `Fusion Verification & Roles` to `DSH Deployment & Plugins`, `Ralph / omp Loop`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `DeepSeek Harness aidev Deployment` connect `DSH Deployment & Plugins` to `Fusion Verification & Roles`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `DSH Plugin Install Runbook` connect `DSH Deployment & Plugins` to `Interactive Learning Plugin`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `check-ktest-marker.sh script`, `Fusion Retry Ladder`, `Parent Tool Allowlist` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `check.sh Validation Harness` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Should `dsh-board Autonomous Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Should `Fusion Verification & Roles` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._