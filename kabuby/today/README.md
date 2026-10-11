# Kabuby Intelligence OS — Today

This Pages route is the deployable, browser-safe presentation of the certified
Kabuby Physical read model. It is intentionally isolated from the existing
Scout surface: `/` continues to serve Scout unchanged, while `/today/` reads
only `GET https://api.kabuby.com/api/v1/intelligence/physical` through the
existing Gate1 / Cloudflare Access boundary.

The route keeps authentication/session failures distinct from evidence states and opens the existing Cloudflare Access sign-in flow when a session is required. It has a durable interaction inventory and a permanent zero-dead-control gate. It does not contain fallback business metrics, direct provider
integrations, browser-side business engines, or commercial actions.
