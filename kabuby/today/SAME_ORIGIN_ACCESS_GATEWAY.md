# Kabuby Today same-origin Access gateway

The Today browser client reads only `GET /api/v1/intelligence/physical` on
its own origin. It has no API hostname, service credential, Access token, or
cookie handling code.

The Pages Function at `functions/api/v1/intelligence/physical.js` is a narrow
GET-only gateway. It requires the Cloudflare Access assertion injected at the
Kabuby origin and forwards only that assertion and `Accept: application/json`
to the fixed `PHYSICAL_PROJECTION` service binding. It refuses methods,
parameters, missing assertions, unconfigured bindings, upstream errors, and
payloads that do not retain `commercial_authority: NONE` and
`commercial_actions_enabled: false`.

## Required configuration before production promotion

1. Configure the existing Cloudflare Access application to protect `kabuby.com`
   and the Today route. The Access login return target must remain the original
   Kabuby URL.
2. The source-managed Pages configuration lives in `kabuby/wrangler.toml`. It
   declares the fixed private `PHYSICAL_PROJECTION` service binding to the
   certified `shato-meli-connector` Worker. It has no public route, variable,
   secret, or browser-visible configuration.
3. Publish this configuration only after the rollback baseline in
   `production-release-baseline.json` is refreshed and the custom domain is
   Access-protected. `*.kabuby.pages.dev` is deliberately not a substitute
   because it is a different browser origin and is not covered by the Kabuby
   Access boundary.

The binding must be verified with an authenticated browser request before any
production promotion. This source change does not alter production, Cloudflare
Access policy, Worker bindings, or traffic.


## Bounded owner read queries

The owner OS extends the same GET-only route with the closed read allowlist
`view`, `run`, `decision`, `demand`, `category`, `limit`, `offset`, and `asin`.
The upstream canonical loader validates values and duplicate keys; all SQL
values use bound parameters. Pages forwards only these query keys to the same
fixed private service. No provider, table, persistence key, URL, credential,
command, or mutation can be selected. Access assertion and role checks remain
unchanged. Pages never returns an assertion or forwards Cookie/Authorization.
Default page size is 20, maximum 50. Current selection never falls back to an
archive; historical V3 dossiers require explicit `view=history`.
