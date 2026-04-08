# Verifier: Plan New Feature

## Target Agent
planner.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Required Sections Present (weight: 3)
- 5: Plan has ALL required sections: Task Description, Objective, Relevant Files, Step by Step Tasks, Acceptance Criteria, Validation Commands
- 4: Missing 1 section
- 3: Missing 2 sections
- 1: Missing 3+ sections
- 0: Not recognizable as a structured plan

### Criterion 2: Task Breakdown Quality (weight: 3)
- 5: Tasks use [N.M] IDs, are in correct dependency order, are atomic and actionable, include [parallel-safe]/[sequential] annotations where appropriate
- 4: Good task IDs and order but missing annotations
- 3: Reasonable tasks but vague or not clearly ordered
- 1: Tasks are too high-level ("implement WebSocket support") with no breakdown
- 0: No task breakdown

### Criterion 3: Codebase Grounding (weight: 2)
- 5: Plan references specific files from the codebase context (order.service.ts, auth middleware, server.ts), identifies integration points, and lists new files to create
- 3: References some files but misses key integration points
- 1: Generic plan that could apply to any project — not grounded in this codebase
- 0: Contradicts the codebase context (e.g., references files that don't exist)

### Criterion 4: Validation Commands (weight: 2)
- 5: Includes specific, runnable validation commands (npm test, type-check, build, and ideally a manual verification step for WebSocket functionality)
- 3: Includes generic validation commands but not specific to this project
- 1: Mentions "run tests" without specific commands
- 0: No validation section

### Criterion 5: Acceptance Criteria Specificity (weight: 2)
- 5: Acceptance criteria are measurable and specific (e.g., "authenticated users receive real-time notification within 2 seconds of order status change", "unauthenticated WebSocket connections are rejected")
- 3: Acceptance criteria exist but are vague ("WebSocket notifications work")
- 1: Only 1-2 generic criteria
- 0: No acceptance criteria

### Criterion 6: Security Awareness (weight: 1)
- 5: Plan addresses authentication for WebSocket connections (not just HTTP), ensures users only receive notifications for their own orders, considers connection lifecycle
- 3: Mentions auth but doesn't detail how WebSocket connections are authenticated
- 1: No mention of security considerations
- 0: Plan would create security vulnerabilities (e.g., broadcasting all notifications to all users)

## Required Elements
- [ ] Socket.IO is the chosen library (as specified in requirements)
- [ ] Plan includes installing socket.io as a dependency
- [ ] Plan modifies server.ts or app.ts for Socket.IO integration
- [ ] Plan modifies order.service.ts to emit notifications on status change
- [ ] Plan includes WebSocket authentication (not just HTTP auth)
- [ ] Tasks have [N.M] ID format
- [ ] Validation commands section exists with runnable commands
- [ ] New files to create are listed

## Anti-Patterns
- Planning for a WebSocket library other than Socket.IO (ignoring requirements)
- No dependency installation step
- Tasks not in dependency order (e.g., testing before implementation)
- No mention of the existing notification.service.ts (should consider integration)
- Planning changes to files not in the codebase context
- Vague tasks like "set up WebSocket" without specific file-level actions
