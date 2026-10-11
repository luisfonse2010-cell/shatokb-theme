# Kabuby Intelligence OS — Today

This Pages route is the deployable, browser-safe presentation of the certified
Kabuby Physical read model. It is intentionally isolated from the existing
Scout surface: `/` continues to serve Scout unchanged, while `/today/` reads
only `GET https://api.kabuby.com/api/v1/intelligence/physical` through the
existing Gate1 / Cloudflare Access boundary.

The route renders explicit evidence states when authenticated projection is not
available. It does not contain fallback business metrics, direct provider
integrations, browser-side business engines, or commercial actions.
