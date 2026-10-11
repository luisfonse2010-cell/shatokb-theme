# Kabuby Physical product requirements V1

## Locked opportunity hierarchy

The future authenticated Opportunities surface must preserve these first-class
paths; it must not collapse them into generic Product Discovery:

```text
OPPORTUNITIES
├── Opportunity Radar
├── Amazon → eBay
├── Amazon → Mercado Libre
├── Product Discovery
└── My Opportunities
```

`Amazon → eBay` and `Amazon → Mercado Libre` are product-critical specialized
Physical pipelines. This document is a product requirement only: it does not
claim either pipeline is continuously operational, grant commercial authority,
or change Scout.

## Continuous discovery requirement

`AUTONOMOUS_PRODUCT_DISCOVERY_24X7 = REQUIRED`.

The intended cloud-only chain is Scheduler → queues → budget/rate controls →
discovery → deduplication → identity → market evidence → Discovery 360 → KIL8
→ TAC → risk → ranking → qualified candidate persistence → re-evaluation →
Opportunities UI. The chain must not depend on an owner Mac, browser, ChatGPT,
or Codex remaining open. Current certification status is recorded separately
in the canonical Physical audit; this requirement does not lower evidence,
economics, or risk gates to meet a throughput number.

## Visual prerequisites retained

The approved visual reference remains
`KABUBY_INTELLIGENCE_OS_CANONICAL_VISUAL_REFERENCE_V1`: gold geometric K,
time-aware hero, EN/ES/PT/AUTO foundation, and no Scout visual change.
