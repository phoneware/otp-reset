---
status: pending
depends_on: []
branch: ai-dlc/reseller-otp-reset/01-react-otp-spa
discipline: frontend
workflow: ""
ticket: ""
wireframe: mockups/unit-01-react-otp-spa-wireframe.html
---

# unit-01-react-otp-spa

## Description
Build the React SPA that resellers use to enable global OTP on phone devices. This is the core application loaded in an iframe inside the NS Manager Portal. It handles JWT decoding, device lookup, authorization checks, and the OTP enable operation — all client-side with direct NS API calls.

## Discipline
frontend - This unit will be executed by `do-frontend-development` specialized agents.

## Domain Entities
- **Portal User**: Decoded from the NS JWT received via postMessage from the parent portal. Fields used: `user` (username), `user_scope` ("Super User" or "Reseller"), `territory` (reseller partition), `domain`.
- **Phone/Device (NdpPhone)**: Fetched from the NS API by MAC address. Fields used: `device-provisioning-mac-address`, `device-models-brand-and-model`, `domain`, `reseller`, `device-provisioning-sip-uri-1`, `global-one-time-pass`.

## Data Sources
- **Parent portal via postMessage**: Receives the NS JWT token and `current_domain` from the portal inject script
- **NS API `GET /domains/{domain}/phones/{mac}`**: Fetches the NdpPhone record for a given domain + MAC. Called with `Authorization: Bearer {jwt}` header. Returns full NdpPhone object or 404.
- **NS API `PUT /domains/{domain}/phones`**: Updates the phone record. The request body must include ALL required NdpPhone fields (not just the changed one). The app must GET the full record first, set `global-one-time-pass` to `"yes"`, and PUT the entire object back. Called with `Authorization: Bearer {jwt}` header. Returns 202 on success.
- **NS API base URL**: `https://edge.phoneware.cloud` (should be configurable, e.g., via a build-time env var or constant)

## Technical Specification

### Tech Stack
- React (create with Vite for fast builds and GitHub Pages compatibility)
- Deployed as a static site to GitHub Pages

### 3-Step User Flow

**Step 1 — Enter MAC:**
- User info bar at top showing: username, scope, territory, domain (decoded from JWT)
- Single text input for MAC address
- Accepts any format: `00:A1:B2:C3:D4:E5`, `00-A1-B2-C3-D4-E5`, `00A1B2C3D4E5`
- Auto-strip colons, dashes, spaces → normalize to 12-char uppercase alphanumeric
- Client-side validation: must be exactly 12 hex characters after stripping
- "Look Up Device" button (disabled until valid MAC entered)

**Step 2 — Confirm Device:**
- Call `GET /domains/{domain}/phones/{mac}` with Bearer token
- Display device confirmation card with these NdpPhone fields:
  - MAC: `device-provisioning-mac-address`
  - Model: `device-models-brand-and-model`
  - Domain: `domain`
  - Reseller: `reseller`
  - Line 1: `device-provisioning-sip-uri-1`
  - Global OTP: `global-one-time-pass` (show current value — "yes", "no", or empty)
- **Authorization check (client-side):**
  - If `jwt.user_scope === "Super User"` → show confirm card (allow any device)
  - If `jwt.user_scope === "Reseller"` AND `phone.reseller === jwt.territory` → show confirm card
  - If `jwt.user_scope === "Reseller"` AND `phone.reseller !== jwt.territory` → show Access Denied error
  - Any other scope → show Access Denied error
- "Enable Global OTP" button + "Back" button
- Back returns to Step 1 with the MAC field pre-filled

**Step 3 — Result:**
- Call `PUT /domains/{domain}/phones` with the full NdpPhone object from the GET response, but with `global-one-time-pass` set to `"yes"`
- On 202 success: show success banner with MAC and model
- On failure: show error banner with API error message
- "Reset Another Device" button returns to Step 1 with cleared form

### Error States
- **Device Not Found**: API returns 404 → show warning banner at Step 2
- **Access Denied**: Reseller scope + wrong territory → show error banner at Step 2
- **Session Expired**: API returns 401 or 403 → show error banner telling user to refresh the portal page. Disable all form interactions.
- **Network Error**: Fetch fails → show generic error banner with retry option

### postMessage Protocol
- **Incoming from parent** (portal inject script):
  - `{ type: "init", token: "<jwt>", domain: "<current_domain>" }`
- **Outgoing to parent**:
  - `{ type: "setHeight", height: <number> }` — sent on content resize so parent can adjust iframe height
- Use `window.addEventListener("message", ...)` with origin validation

### JWT Decoding
- Decode JWT client-side by base64-decoding the payload (second segment split by `.`)
- Extract: `user`, `user_scope`, `territory`, `domain`, `exp`
- Check `exp` against current time — if expired, show session expired message immediately
- Do NOT validate the JWT signature client-side (the NS API validates it on every request)

## Success Criteria
- [ ] App receives JWT and domain from parent portal via postMessage
- [ ] User info bar displays username, scope, territory, and domain from decoded JWT
- [ ] MAC input accepts formats with colons, dashes, or no separators and normalizes to 12-char uppercase
- [ ] Invalid MAC format (non-hex chars, wrong length) shows inline validation error
- [ ] "Look Up Device" calls `GET /domains/{domain}/phones/{mac}` with Bearer token
- [ ] Device confirmation card displays MAC, model, domain, reseller, line 1, and current OTP status
- [ ] Reseller scope users are denied when `phone.reseller !== jwt.territory`
- [ ] Super User scope users can enable OTP on any device
- [ ] "Enable Global OTP" calls `PUT /domains/{domain}/phones` with full NdpPhone body and `global-one-time-pass: "yes"`
- [ ] Success/error/not-found/session-expired states all render appropriate banners
- [ ] App sends `setHeight` postMessage to parent on content changes

## Risks
- **PUT requires full NdpPhone object**: The NS API has no PATCH endpoint. The app must include all required fields from the GET response in the PUT body. Mitigation: spread the full GET response into the PUT body, overriding only `global-one-time-pass`.
- **JWT expiration mid-session**: Token could expire while the user is on the confirm screen. Mitigation: check `exp` before each API call, not just on init.
- **CORS policy changes**: If NS changes CORS policy, all API calls break. Mitigation: document the CORS dependency; if it breaks, a minimal proxy backend would be the fallback.

## Boundaries
This unit does NOT handle:
- Portal integration (adding menu items, managing the iframe) — that's unit-02
- Hosting/deployment configuration for GitHub Pages — that's handled as part of the repo setup
- Any backend server logic — this is a pure client-side SPA

## Notes
- The wireframe at `mockups/unit-01-react-otp-spa-wireframe.html` shows the approved layout and flow
- Reference implementation for postMessage pattern: Telzino's portal embed at `https://phoneware.us/files/telzino_phoneware2.js`
- The NdpPhone schema has many required fields — when building the PUT request, always spread the full GET response and override only the field being changed
