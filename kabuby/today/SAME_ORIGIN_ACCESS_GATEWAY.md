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

## Required Cloudflare configuration before an end-to-end preview

1. Protect the chosen `kabuby.com` preview hostname and `/today/*` with the
   existing human Cloudflare Access application/audience used by the physical
   projection. The Access login return target must remain the original Kabuby
   URL.
2. Add the Pages service binding `PHYSICAL_PROJECTION` to the existing
   certified physical Worker (`shato-meli-connector`). No secret, service
   token, public route, or browser configuration is required.
3. Deploy this branch only to an Access-protected custom preview hostname.
   `*.kabuby.pages.dev` is deliberately not a substitute because it is a
   different browser origin and is not covered by the Kabuby Access boundary.

The binding must be verified with an authenticated browser request before any
production promotion. This repository change does not alter production,
Cloudflare Access policy, Worker bindings, or traffic.
