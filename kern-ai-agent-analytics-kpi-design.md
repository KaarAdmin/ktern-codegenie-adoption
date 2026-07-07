# KTern AI Agent Analytics — Centralized Dashboard KPI Design

**Purpose:** Define the KPI catalog, formulas, readiness, and dashboard structure for the centralized cross-agent analytics dashboard, built on Strands SDK telemetry (OTel spans + manual baggage attributes).

---

## 0. Run Unit — Resolved

**`session_id` is created per invocation.** This settles the earlier open question: a single invocation may still emit multiple nested spans (LLM calls, tool calls, etc.) under one `session_id`, but the **run/invocation count must be measured as `COUNT(DISTINCT session_id)`, never `COUNT(spans)`** — the latter would overcount by however many child spans each invocation produces.

Every "Agent Runs" / "Invocation" formula in this document uses `COUNT(DISTINCT session_id)` accordingly. Anywhere you see `COUNT(runs)` below, read it as `COUNT(DISTINCT session_id)` (or filtered/grouped variants of it).

One implication worth flagging: span-level fields (`total_tokens`, `status`, `start_time`/`end_time`) now need to be **aggregated up to the session first** before being used in a run-level KPI — e.g. a session's runtime is `MAX(end_time) − MIN(start_time)` across its child spans, and a session's status is likely "ERROR if any child span errored, else OK." Worth confirming that failure rule against how Strands actually surfaces errors — a failed tool call inside an otherwise-fine session should probably still count as a failed run.


---

## 1. Source Fields (nothing beyond this is assumed to exist)

**From Strands SDK (automatic):**
`input_tokens`, `output_tokens`, `total_tokens`, `cache_read_input_tokens`, `cache_write_input_tokens`

**From baggage (manual):**
`user_id`, `project_id`, `purpose`, `agent_id`, `session_id`, `environment`

**Standard OTel span fields (assumed present, not confirmed):**
`start_time`, `end_time`, `status`, `timestamp`, `parent_span_id` / `trace_id` (needed to resolve §0)

**External / not yet available:**
- Rate card (₹ or $ per 1K tokens, by model/purpose) — needed for all cost KPIs
- Org mapping (`project_id → org_id`) — needed for org-level rollups
- User/Project master data (total licensed users, total active projects) — needed for adoption %

---

## 2. KPI Readiness Matrix

| KPI | Can Build Today | Depends On |
|---|:---:|---|
| Active Users | ✅ | Existing telemetry |
| Active Projects | ✅ | Existing telemetry |
| Purpose Distribution | ✅ | Existing telemetry |
| Cache Hit Ratio | ✅ | Existing telemetry |
| Agent Runs / Invocations | ✅ | `COUNT(DISTINCT session_id)` — confirmed |
| Success Rate / Error Rate | ⚠️ | Confirm `status` populated per span, and confirm session-level error rollup rule (§0) |
| Runtime KPIs | ⚠️ | Confirm `start_time`/`end_time` populated; runtime = session-level rollup, not per-span (§0) |
| Total Cost | ⚠️ | Rate card per model/purpose |
| Cost by Agent / Project / Purpose | ⚠️ | Rate card |
| Cost by Org | ❌ | Org mapping not in current baggage |
| Adoption % (users, projects) | ❌ | User/Project master data |
| Dormant / Declining Agents | ⚠️ | Needs historical window (30/60-day comparison), otherwise built on existing data |

This table is the actual build sequence — ✅ first, ⚠️ once dependencies are resolved, ❌ deferred.

---

## 3. KPI Priority

| KPI | Priority |
|---|---|
| Total Cost | P0 |
| Active Users | P0 |
| Agent Runs | P0 |
| Success Rate | P0 |
| Cost Trend | P0 |
| Cost by Agent | P1 |
| Cost by Project | P1 |
| Purpose Distribution | P1 |
| Runtime (avg, slowest agents) | P1 |
| Dormant Agents | P1 |
| Top Projects/Teams by Usage | P2 |
| Cache Hit Ratio | P2 |
| New vs Returning Users | P2 |
| Input:Output Ratio | P3 |
| Agent Reuse Rate | P3 |

---

## 4. KPI Catalog — Organized by Domain

### A. Business KPIs (adoption, usage)

| KPI | Formula |
|---|---|
| Active Users | `COUNT(DISTINCT user_id)` in period |
| Active Projects | `COUNT(DISTINCT project_id)` in period |
| Agent Runs | `COUNT(DISTINCT session_id)` |
| User Adoption % | `COUNT(DISTINCT user_id in spans) ÷ Total Licensed Users × 100` *(needs master data)* |
| Project Adoption % | `COUNT(DISTINCT project_id in spans) ÷ Total Active Projects × 100` *(needs master data)* |
| DAU / WAU / MAU | `COUNT(DISTINCT user_id)` bucketed by day/week/month |
| New vs Returning Users | `user_id` where `MIN(timestamp)` falls in current period = new; else returning |
| Growth % (any KPI above) | `(Current Period − Prior Period) ÷ Prior Period × 100` |

### B. Financial KPIs

| KPI | Formula |
|---|---|
| Total Cost | `Σ [(input_tokens × rate_input) + (output_tokens × rate_output) + (cache_read_input_tokens × rate_cache_read) + (cache_write_input_tokens × rate_cache_write)]` per run, summed |
| Cost Trend | Total Cost bucketed by period |
| Cost by Project | Total Cost grouped by `project_id` |
| Cost by Agent | Total Cost grouped by `agent_id` |
| Cost by Purpose | Total Cost grouped by `purpose` |
| Cost by Environment | Total Cost grouped by `environment` |
| Cost by Org | Total Cost grouped by `org_id` *(needs org mapping)* |
| Avg Cost per Run | Total Cost ÷ `COUNT(DISTINCT session_id)` |
| Cache Savings | `cache_read_input_tokens × (rate_input − rate_cache_read)` |
| Prod vs Non-Prod Cost Split | Cost where `environment='prd'` vs `environment IN ('qual','staging','dev')` |

Cost by User is intentionally **not** promoted to a default widget — per review, it's only actionable if you run a chargeback model. Keep it available in the KPI library for Delivery/Finance to add manually, not on by default.

### C. Operational KPIs

| KPI | Formula |
|---|---|
| Success Rate | `COUNT(DISTINCT session_id WHERE session_status='OK') ÷ COUNT(DISTINCT session_id) × 100` |
| Error Rate | `COUNT(DISTINCT session_id WHERE session_status='ERROR') ÷ COUNT(DISTINCT session_id) × 100` |
| Error Rate by Agent | Error Rate grouped by `agent_id` |
| Avg Runtime | `Σ(end_time − start_time) ÷ COUNT(DISTINCT session_id)` |
| Avg Runtime by Agent | Avg Runtime grouped by `agent_id` |
| Avg Runtime by Purpose | Avg Runtime grouped by `purpose` |
| Slowest Agents | `agent_id` ranked by `MAX(avg runtime)` |
| Recent Failed Runs | runs where `status='ERROR'`, sorted by `timestamp DESC` |
| **Dormant Agents** | `agent_id` with `COUNT(DISTINCT session_id) = 0` in last 30 days, but `COUNT(DISTINCT session_id) > 0` historically |
| **Declining Usage Agents** | `agent_id` where `COUNT(DISTINCT session_id)` this period `<` `COUNT(DISTINCT session_id)` prior period |
| **Fastest Growing Agents** | `agent_id` ranked by highest `Growth %` in `COUNT(DISTINCT session_id)` |
| Top Agents by Usage | `agent_id` ranked by `COUNT(DISTINCT session_id)` |
| Top Projects by Usage/Cost | `project_id` ranked by `COUNT(DISTINCT session_id)` or Total Cost |
| Agent Reuse Rate | `COUNT(DISTINCT session_id) ÷ COUNT(DISTINCT user_id)`, grouped by `agent_id` |

### D. Technical KPIs (Engineering-facing)

| KPI | Formula |
|---|---|
| Total Tokens | `Σ total_tokens` |
| Avg Tokens per Invocation | `Σ total_tokens ÷ COUNT(DISTINCT session_id)` *(renamed from "Efficiency" — descriptive, not a value judgment)* |
| Cache Hit Ratio | `Σ cache_read_input_tokens ÷ Σ total_tokens` |
| Cache Write Ratio | `Σ cache_write_input_tokens ÷ Σ total_tokens` |
| Input:Output Ratio | `Σ input_tokens ÷ Σ output_tokens` |
| Tokens by Purpose | `Σ total_tokens` grouped by `purpose` |

---

## 5. Purpose Dashboard (first-class view)

`purpose` (chat / analyse / generate / doc_generation, extensible) drives materially different cost, runtime, and usage patterns — it earns its own view rather than being buried as a filter.

```
Purpose Distribution (share of runs)
Chat            ████████████ 42%
Analyse         ███████      25%
Generate        █████        20%
Doc Generation  ███          13%
```

Supporting widgets on the same view:
- Cost by Purpose
- Avg Runtime by Purpose
- Avg Tokens by Purpose
- Success Rate by Purpose
- Growth % by Purpose (period over period)

This view is also where future `purpose` values (beyond the current four) will surface automatically without needing new dashboard logic — same grouping formula, no hardcoding.

---

## 6. Dashboard Templates (not fixed personas)

Rather than hardcoding "Executive Dashboard" / "Engineering Dashboard" as locked configurations, ship them as **starting templates** the user customizes from — since two people with the same title (e.g. two Delivery Managers) may care about different things (cost vs. adoption).

**Available templates at setup:**
- ⭐ Executive Summary
- ⭐ Cost Monitoring
- ⭐ Agent Adoption
- ⭐ Operations
- ⭐ Engineering / AI Usage
- ⭐ Blank Dashboard (fully custom)

### Executive Summary (default widget set)
Row 1: Active Users ↑%, Active Projects ↑%, Agent Runs ↑%, Total Cost ↑%, Success Rate, Avg Runtime
Row 2: Usage Trend, Cost Trend
Row 3: Top Agents, Top Projects

### Cost Monitoring
Total Cost ↑%, Cost Trend, Cost by Project, Cost by Agent, Cost by Purpose, Cost by Environment, Prod vs Non-Prod Split

### Agent Adoption
Active Agents, Top Agents by Usage, Dormant Agents, Declining Usage Agents, Fastest Growing Agents, Agent Reuse Rate

### Operations
Success/Error Rate, Recent Failed Runs, Slowest Agents, Avg Runtime by Agent, Error Rate by Agent

### Engineering / AI Usage
Total Tokens, Avg Tokens per Invocation, Cache Hit Ratio, Input:Output Ratio, Runtime by Purpose, Environment Split

### Blank Dashboard
User selects freely from the full KPI library (§4), organized by the Business / Financial / Operational / Technical tabs, with the readiness (§2) and priority (§3) tags shown inline to guide selection.

---

## 7. Drill-Down Model

Every rollup KPI should support click-through navigation, consistent with how Power BI / Grafana / Datadog / CloudWatch handle this:

```
Total Cost
   → click → Cost by Project
        → click → Cost by Agent (within that project)
             → click → Cost by Session (within that agent)
                  → click → Individual Run / Trace detail
```

Same pattern applies to Agent Runs → Runs by Purpose → Runs by Agent → Individual Run, and to Active Users → Users by Project → User Session History.

This should be designed as a generic capability at the widget level (any grouped KPI can be clicked into its next-level grouping) rather than hardcoded per-KPI, since the same dimension set (`user_id`, `project_id`, `agent_id`, `purpose`, `session_id`, `environment`) recurs across nearly every metric.

---

## 8. Summary of Changes from Earlier Drafts

| Change | Reason |
|---|---|
| Dashboards reframed as templates, not fixed personas | Same role ≠ same priorities |
| "Agent Token Efficiency" → "Avg Tokens per Invocation" | Removed unearned value judgment |
| Top Users demoted from default widgets | Not actionable without chargeback model |
| Added Dormant / Declining / Fastest Growing Agents | Direct answer to "are we paying for unused agents" |
| Added Purpose as a first-class dashboard | `purpose` materially changes cost/runtime; deserves dedicated view |
| Reorganized catalog into Business / Financial / Operational / Technical | More intuitive than raw technical grouping |
| Added KPI Readiness Matrix | Separates what's buildable today from what needs external data |
| Added KPI Priority (P0–P3) | Gives engineering a build sequence |
| Added Drill-Down model | Matches expected UX from comparable observability tools |
| Resolved Run vs. Span semantics | Confirmed `session_id` = one per invocation; all "run" formulas now use `COUNT(DISTINCT session_id)`, with runtime/status rolled up from child spans to session level |
