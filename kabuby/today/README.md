# Kabuby Intelligence OS — Today

This Pages route is the deployable, browser-safe presentation of the certified
Kabuby Physical read model. Its owner-facing Scout route is `#scout`: a read-only adapter in the same
Intelligence OS shell. The legacy `/scout/` runtime remains byte-for-byte
unchanged as a compatibility endpoint for the Chrome extension and its existing
contracts. The portal routes read only `GET https://api.kabuby.com/api/v1/intelligence/physical` through the existing Gate1 / Cloudflare Access boundary.

The route keeps authentication/session failures distinct from evidence states and opens the existing Cloudflare Access sign-in flow when a session is required. It has a durable interaction inventory and a permanent zero-dead-control gate. It does not contain fallback business metrics, direct provider
integrations, browser-side business engines, or commercial actions.
