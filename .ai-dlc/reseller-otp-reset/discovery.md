---
intent: reseller-otp-reset
created: 2026-03-09
status: active
---

# Discovery Log: Reseller OTP Reset Tool

Elaboration findings persisted during Phase 2.5 domain discovery.
Builders: read section headers for an overview, then dive into specific sections as needed.


## API Schema: NetSapiens API v2 — Authentication

**Discovered:** 2026-03-09
**Base URL:** https://edge.phoneware.cloud

### Auth Flow: JWT

**Endpoint:** `POST /jwt`
**Request body (AuthRequest):**
- `grant_type`: "password"
- `client_id`: string (env var)
- `client_secret`: string (env var)
- `username`: string (user@domain format or email)
- `password`: string

**Response (JwtRequestSuccess):**
- `token`: JWT string
- `refresh`: JWT refresh token string

**JWT Claims (JwtResponse via GET /jwt):**
- `territory`: string — the reseller partition (maps to reseller scope)
- `user_scope`: string — "Super User", "Reseller", or "Basic User"
- `domain`: string — user's domain
- `user`: string — username
- `user_email`: string|null
- `displayName`: string
- `exp`: integer — expiration timestamp
- `jti`: string — JWT ID

**MFA flow:** If MFA is required, initial auth returns an mfa_required scope. Then `POST /jwt` with `grant_type: "mfa"` + `passcode`, `mfa_vendor`, `mfa_type`, `access_token`.

### Key Observations
- `territory` field = reseller partition name
- `user_scope` determines authorization level: "Super User" can access all, "Reseller" is scoped to their territory
- client_id/client_secret are server-side env vars, not user-provided

### Gaps / Concerns
- MFA flow adds complexity — users with MFA enabled will need a two-step login
- Need to handle JWT refresh for long sessions

## API Schema: NetSapiens API v2 — Phones/MACs

**Discovered:** 2026-03-09

### NdpPhone Schema (key fields)

| Field | Type | Description |
|---|---|---|
| `device-provisioning-mac-address` | string (12 chars) | MAC address, e.g. "000011223344" |
| `domain` | string | Domain the phone belongs to |
| `reseller` | string | Reseller/territory the phone is associated with |
| `global-one-time-pass` | string | The OTP field — set to "yes" to enable global OTP |
| `device-models-brand-and-model` | string | Phone make/model |
| `device-provisioning-sip-uri-1` | string | Primary SIP line |
| `device-sip-registration-state` | string|null | Current registration state (read-only) |
| `created-datetime` | string | When the phone record was created |

### Endpoints

**Lookup phone by domain + MAC:**
`GET /domains/{domain}/phones/{mac}` → NdpPhone object
- Verifies the phone exists in the given domain
- Response includes `reseller` field for authorization check

**Lookup phone by MAC only (super user):**
`GET /phones/{mac}` → NdpPhone object

**Update phone (enable global OTP):**
`PUT /domains/{domain}/phones` with NdpPhone body
- Set `global-one-time-pass: "yes"` to enable global OTP on the device
- Requires all NdpPhone required fields in the body (GET first, modify, PUT back)

**Alternative update:**
`PUT /phones` with NdpPhone body (no domain scoping)

### Key Observations
- The PUT requires the full NdpPhone object — must GET first, then modify `global-one-time-pass` and PUT back
- MAC addresses are 12-char strings without delimiters (e.g. "000011223344")
- Authorization check: compare `phone.reseller` against `jwt.territory`
- Super Users bypass the reseller check

### Gaps / Concerns
- PUT requires many "required" fields — need to pass through all fields from GET response
- No PATCH endpoint — must send full object on update

## Architecture Decision: Authorization Model

**Decided:** 2026-03-09

### Flow
1. User logs in → JWT obtained with `territory` and `user_scope`
2. User enters domain + MAC address
3. Backend calls `GET /domains/{domain}/phones/{mac}`
4. **Authorization check:**
   - If `user_scope === "Super User"` → allow (any device)
   - If `user_scope === "Reseller"` → allow only if `phone.reseller === jwt.territory`
   - Any other scope → deny
5. If authorized, backend calls `PUT /domains/{domain}/phones` with `global-one-time-pass: "yes"`

### Key Observations
- Authorization is enforced server-side only — the React frontend never holds the NetSapiens JWT
- The Node.js backend acts as a secure proxy between the user and the NetSapiens API

## Technology Choice: React + Node.js on Railway

**Decided:** 2026-03-09

- **Frontend:** React SPA
- **Backend:** Node.js (Express) — proxies all NetSapiens API calls
- **Auth storage:** Server-side session or httpOnly cookie holding the NS JWT
- **Deployment:** Railway (container-based)
- **Configuration:** Environment variables for NS API base URL, client_id, client_secret


## Reference Implementation: Telzino Portal Embed Pattern

**Discovered:** 2026-03-09
**Source:** https://phoneware.us/files/telzino_phoneware2.js

### How NS Portal Embedding Works

1. **JavaScript injected into NS Manager Portal** (via portal customization)
2. **Portal exposes globals:**
   - `omp_level` — navigation level (e.g., "navigation_omp")
   - `current_domain` — the currently selected domain
3. **Auth token in localStorage:** `localStorage.getItem("ns_t")` contains the user's JWT or access token
4. **JWT salt cookie:** For JWT tokens, a cookie named `ns-{DOMAIN_UPPER}-{user}` exists as additional auth context
5. **Script adds UI element** (nav item or menu link) to the portal
6. **Loads iframe** with the external app, passing the auth token to the app's backend
7. **App backend validates token** and uses it for NS API calls

### Key Globals Available in Portal Context
- `omp_level`: string — portal navigation level
- `current_domain`: string — currently selected domain in the portal
- `localStorage.getItem("ns_t")`: string — the user's NS access token (JWT)

### Architecture Decision: Embedded-Only Mode

The OTP Reset tool will:
- Run ONLY as an embedded app inside the NS Manager Portal
- NO standalone login page needed
- Auth comes from the portal's existing session (`ns_t` in localStorage)
- Be added under the existing admin tools dropdown menu
- Load as an iframe in the portal content area

### Simplified Auth Flow
1. Portal JS reads `ns_t` from localStorage
2. Passes token to OTP Reset app backend (via iframe URL param or postMessage)
3. Backend decodes JWT to extract `territory`, `user_scope`, `domain`, `user`
4. Backend uses the same token for NS API calls (GET phone, PUT phone)
5. No separate login, no session management, no OAuth client_id/client_secret needed at runtime

### Gaps / Concerns
- The `ns_t` token has an expiration — need to handle token refresh or expiry gracefully
- Security: token passed via URL param is visible in browser history/logs — consider postMessage instead
- Need to confirm the `ns_t` token has sufficient permissions to call `/phones` endpoints


## Architecture Decision: Pure Client-Side SPA

**Decided:** 2026-03-09

### Decision
No backend needed. The NS API supports CORS and the portal provides the JWT via localStorage. The entire app is client-side.

### Components
1. **Portal inject script** — vanilla JS loaded in the NS Manager Portal, adds menu item, manages iframe
2. **React SPA** — static build hosted on GitHub Pages, makes NS API calls directly

### Hosting
- SPA: GitHub Pages (from this repo)
- Inject script: hosted file referenced by NS portal customization

### Auth Flow (Revised)
1. Portal inject script reads `localStorage.getItem("ns_t")` — gets the JWT
2. Script loads iframe pointing to GitHub Pages URL
3. Script sends JWT + `current_domain` to iframe via postMessage
4. SPA decodes JWT client-side → extracts `territory`, `user_scope`
5. SPA calls NS API directly with JWT as Bearer token
6. Authorization check is client-side: compare `phone.reseller` with `jwt.territory`

### Why No Backend
- The JWT from localStorage is already authorized to call the NS API
- CORS is allowed on the NS API
- Authorization logic is simple (scope + territory comparison)
- Eliminates server costs, deployment complexity, and an entire attack surface


## UI Mockup: OTP Reset SPA

**Confirmed:** 2026-03-09
**Source:** collaborative
**File:** `.ai-dlc/reseller-otp-reset/mockups/unit-01-react-otp-spa-wireframe.html`

### Flow
1. **Enter MAC** — single text field, accepts any format (colons, dashes, raw), auto-strips
2. **Confirm Device** — shows device card with MAC, model, domain, reseller, line 1, current OTP status
3. **Result** — success banner + "Reset Another Device" button

### Interactions
- Look Up Device button: calls GET /domains/{domain}/phones/{mac}, shows device preview or error
- Enable Global OTP button: calls PUT to set global-one-time-pass to "yes", shows result
- Back button: returns to MAC input from confirmation step
- Reset Another Device: clears form, returns to step 1

### Error States
- Access Denied: shown at step 2 when phone.reseller !== jwt.territory (Reseller scope)
- Device Not Found: shown at step 2 when API returns 404
- Session Expired: shown on any 401/403, user must refresh portal

### Data Mapping
- User info bar ← JWT claims (user, user_scope, territory, domain)
- Device card ← NdpPhone fields (device-provisioning-mac-address, device-models-brand-and-model, domain, reseller, device-provisioning-sip-uri-1, global-one-time-pass)

## Architecture Decision: No Domain Input Field

**Decided:** 2026-03-09

The domain is extracted from the JWT token (`jwt.domain`) — no user input needed. This simplifies the UI and prevents errors from typing wrong domains. Domain is shown in the user info bar for context.

## Architecture Decision: No Autocomplete

**Decided:** 2026-03-09

Device autocomplete was rejected — domains can have thousands of devices. Instead, user types the full MAC and a single device lookup is performed. This is simpler and more efficient.

