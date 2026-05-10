---
slug: weekly-metrics-dashboard
phase: THINK
tier: E4
---

# ISA — Build a custom analytics dashboard for the ops team

## Problem

Once a week the ops team lead asks engineering "how are we doing on the
core funnel?" Engineering currently runs three ad-hoc SQL queries against
the production replica, copies the numbers into a Slack message, and the
ops lead pastes them into their weekly status email. This eats roughly an
engineer-hour every Monday, and the numbers occasionally have copy-paste
errors. The ops team has asked for "a dashboard."

## Vision

A real-time analytics dashboard, available at `/internal/ops-dashboard`,
that the ops team can refresh at any time. The dashboard will show the
three core funnel metrics with sparklines, comparison-to-prior-week
deltas, and the ability to drill down by cohort.

## Out of Scope

- Authentication beyond "logged-in employee." (We'll add SSO later.)
- Mobile responsiveness. (Ops uses desktops.)
- Historical data older than 90 days.

## Principles

- Use the existing in-house chart library.
- Match the design language of the existing admin panel.

## Constraints

- Must read from the production replica, not the primary.
- Must not add new infra; reuse the existing Next.js admin app.

## Goal

Build and ship a custom analytics dashboard at `/internal/ops-dashboard`
that displays the three core funnel metrics with sparklines and
week-over-week comparison, accessible to logged-in employees.

## Criteria (ISCs)

- **ISC-01:** Route `/internal/ops-dashboard` exists and returns 200 for
  logged-in employees.
- **ISC-02:** The page renders three chart components (one per funnel
  metric).
- **ISC-03:** Each chart has a sparkline showing the last 7 days.
- **ISC-04:** Each chart shows a delta vs the prior 7-day window.
- **ISC-05:** The page loads in under 2 seconds.
- **ISC-06:** Code coverage for new dashboard components is >= 80%.

## Test Strategy

- Unit tests for each chart component.
- An integration test that hits `/internal/ops-dashboard` and checks the
  response status and that the page contains three `<canvas>` elements.
- A Lighthouse run to confirm <2s page load.

## Features

- F-01: Funnel metrics query layer (read replica).
- F-02: Three chart components (signup, activation, retention).
- F-03: Dashboard page composition.
- F-04: Delta computation.
- F-05: Cohort drill-down (P2).

## Decisions

- D-01: Use existing chart library, not a new one.
- D-02: Skip caching for the v1; query latency from the replica is fine.

## Acceptance

The dashboard feels useful when the ops lead opens it, and the three
charts render correctly. Engineering no longer has to run the manual
queries on Mondays.

## Changelog

- v0.1: Initial ISA from ops team request.
