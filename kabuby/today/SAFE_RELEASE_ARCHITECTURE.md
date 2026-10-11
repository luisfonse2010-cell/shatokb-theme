# Kabuby safe-release delivery and navigation architecture

## Established delivery truth

The Cloudflare Pages project is `kabuby`, its Git source is
`luisfonse2010-cell/shatokb-theme`, and `kabuby.com` is listed as a native
Pages project domain. The retained production deployment is recorded in
`production-release-baseline.json`.

The public root currently reaches Pages through the owner-preserved DNS-only
CNAME. Read-only checks show that Cloudflare Access is not applied to that
traffic. The owner observed that changing that root record to proxied caused
mojibake and a Scout regression; that technique is permanently rejected and
is not a valid Access migration path.

The observed regression has no reproducible response transformation available
while the safe DNS-only baseline is preserved. Its bounded cause is therefore
`UNKNOWN_EXTERNAL_DELIVERY_TRANSFORMATION`. The release gate does not rely on
or repeat that experiment.

## Supported target path

```
owner browser → Access-protected Pages hostname → Kabuby Intelligence OS
→ same-origin Pages Function → private PHYSICAL_PROJECTION service binding
→ shato-meli-connector → sanitized read-only physical projection
```

`kabuby/wrangler.toml` declares the fixed service binding. It contains no
route, credential, secret, browser configuration, or public proxy setting.
The Function is GET-only and fails closed before calling the binding when the
Access assertion is absent.

## Safe custom preview prerequisite

A production-like test requires an Access-protected Pages custom hostname that
does not alter root `kabuby.com`. The exact owner-only configuration is:

1. In **Cloudflare Pages → kabuby → Custom domains**, add a dedicated hostname
   such as `preview.kabuby.com` using the Pages-supported custom-domain flow.
2. In **Cloudflare Zero Trust → Access → Applications → Kabuby Intelligence
   OS**, add that exact hostname to the existing owner-only self-hosted
   application (or its supported domain list) while retaining the existing
   policy and audience expected by the Worker.
3. In the Pages production/preview binding settings, verify
   `PHYSICAL_PROJECTION` resolves to the Worker service
   `shato-meli-connector`.

Expected verification: an unauthenticated `GET` to the preview hostname is
challenged by Access; after login, its same-origin projection returns a
sanitized read-only payload. Root `kabuby.com`, Scout, and existing API Access
applications remain unchanged.

## Product information architecture

The primary sidebar stays intentionally small. Secondary navigation organizes
existing read-model truth without creating engines or browser calculations:

- **Opportunities:** Opportunity Radar, Amazon → eBay, Amazon → Mercado Libre,
  Product Discovery, My Opportunities.
- **Supply:** sources, availability, source cost, freshness, supplier monitor,
  exceptions.
- **Economics & Risk:** economic truth, KIL8, TAC, cost protection, stress,
  risk.
- **Marketplace Operations:** sales, publication center, shadow repricer,
  fulfillment, marketplace health and exceptions.
- **Portfolio, Intelligence & Learning, Settings & Policies:** their existing
  certified read-model views.

Every missing factual dataset renders an explicit empty state. The interface
never creates an opportunity, sale, supplier cost, price recommendation, or
commercial action to fill a view.
