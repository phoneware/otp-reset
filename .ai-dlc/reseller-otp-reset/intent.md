---
workflow: default
git:
  change_strategy: intent
  auto_merge: true
  auto_squash: false
announcements: []
created: 2026-03-09
status: active
epic: ""
---

# Reseller OTP Reset Tool

## Problem
Resellers need to enable the global OTP on phone devices for provisioning, but currently must have full access to the NDP (NetSapiens Device Provisioning) platform. Giving resellers unrestricted NDP access is a security and operational risk. There is no scoped tool that limits resellers to only the OTP enable operation on devices within their territory.

## Solution
Build a client-side React SPA embedded in the NetSapiens Manager Portal that allows resellers to enable global OTP on phone devices scoped to their territory. The app requires no backend — it reads the portal's existing JWT from localStorage and makes NS API calls directly (CORS is allowed). A portal inject script adds the tool to the admin tools dropdown menu and manages the iframe embedding.

## Domain Model

### Entities
- **Portal User**: Authenticated via the NS Manager Portal session. Has `user_scope` ("Super User" or "Reseller") and `territory` (reseller partition) from the JWT stored in `localStorage` as `ns_t`.
- **Phone/Device**: Identified by `device-provisioning-mac-address` (12-character string, no separators). Belongs to a `domain` and a `reseller`. Has a `global-one-time-pass` field that can be set to `"yes"` to enable global OTP.
- **Domain**: A NetSapiens domain that phones are grouped under. Extracted from the JWT `domain` claim.
- **Reseller/Territory**: A partition that groups domains and devices. Maps to the `territory` field on the JWT and the `reseller` field on the phone.

### Relationships
- A Portal User belongs to one Territory (from JWT `territory` claim)
- A Phone belongs to one Domain and one Reseller/Territory
- A Domain belongs to one Reseller/Territory

### Data Sources
- **NS Portal Context** (client-side globals and localStorage):
  - `localStorage.getItem("ns_t")` — user's JWT or access token
  - `current_domain` — currently selected domain in the portal
  - `omp_level` — portal navigation level
- **NetSapiens API v2** (`https://edge.phoneware.cloud`):
  - Phone lookup: `GET /domains/{domain}/phones/{mac}` — returns NdpPhone object with `reseller`, `domain`, `global-one-time-pass`, `device-models-brand-and-model`, `device-provisioning-sip-uri-1`
  - Phone update: `PUT /domains/{domain}/phones` — set `global-one-time-pass` to `"yes"` (requires full NdpPhone object — GET first, modify field, PUT back)
  - Auth: uses the portal's existing JWT as Bearer token — no separate OAuth client_id/client_secret needed at runtime

### Data Gaps
- The PUT endpoint requires all required NdpPhone fields — the app must GET the full phone record first, modify only `global-one-time-pass`, and PUT the complete object back
- The `ns_t` token has an expiration — the app must handle 401/403 gracefully by asking the user to refresh the portal page

## Success Criteria
- [ ] Portal inject script adds "OTP Reset" link to the admin tools dropdown menu in the NS Manager Portal
- [ ] Clicking the link loads the OTP Reset React SPA in an iframe within the portal content area
- [ ] The app reads the user's NS JWT from `localStorage.getItem("ns_t")` and decodes it client-side to extract `territory`, `user_scope`, and `domain`
- [ ] User sees their identity info (username, scope, territory, domain) in a user info bar
- [ ] User can enter a MAC address in any format (colons, dashes, or raw) and it is auto-stripped to 12 characters
- [ ] On "Look Up Device", the app calls `GET /domains/{domain}/phones/{mac}` with the JWT as Bearer token
- [ ] The app displays a device confirmation card showing MAC, model, domain, reseller, line 1, and current OTP status
- [ ] If `user_scope` is "Reseller", access is denied when `phone.reseller !== jwt.territory`
- [ ] If `user_scope` is "Super User", access is allowed for any device regardless of reseller
- [ ] On confirmation, the app calls `PUT /domains/{domain}/phones` setting `global-one-time-pass` to `"yes"` (passing all other fields unchanged from the GET response)
- [ ] User sees clear success/error feedback (success banner, access denied, device not found, session expired)
- [ ] Expired or invalid NS tokens (401/403 from API) result in a "session expired — refresh portal" message

## Context
- This is a greenfield project — no existing codebase
- The app is embedded-only (no standalone login flow)
- Hosting: GitHub Pages (static site)
- The portal inject script pattern follows the same approach used by Telzino's AI Agents integration (reference: `https://phoneware.us/files/telzino_phoneware2.js`)
- NS API base URL: `https://edge.phoneware.cloud`
- The domain field was removed from the form — domain comes from the JWT automatically
- Autocomplete was rejected due to potentially thousands of devices per domain
