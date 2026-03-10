---
status: pending
depends_on:
  - unit-01-react-otp-spa
branch: ai-dlc/reseller-otp-reset/02-portal-inject-script
discipline: frontend
workflow: ""
ticket: ""
---

# unit-02-portal-inject-script

## Description
Build the vanilla JavaScript file that is loaded into the NetSapiens Manager Portal to add the "OTP Reset" tool to the admin tools dropdown menu. When clicked, it loads the React OTP Reset SPA (unit-01) in an iframe and passes the user's authentication context to it via postMessage.

## Discipline
frontend - This unit will be executed by `do-frontend-development` specialized agents.

## Domain Entities
- **Portal Context**: Global variables and localStorage available in the NS Manager Portal page:
  - `omp_level` — portal navigation level (e.g., "navigation_omp")
  - `current_domain` — currently selected domain in the portal
  - `localStorage.getItem("ns_t")` — the user's NS JWT or access token

## Data Sources
- **Portal DOM**: The existing admin tools dropdown menu in the portal UI (jQuery `$('.user-toolbar')` or similar). The script injects a new menu item into this existing dropdown.
- **localStorage**: Reads `ns_t` to get the user's auth token.
- **Portal globals**: Reads `omp_level` to detect portal environment and `current_domain` for the active domain.

## Technical Specification

### File Structure
A single vanilla JavaScript file (e.g., `otp-reset-inject.js`) that:
1. Is loaded via a `<script>` tag in the NS Manager Portal (added through portal customization)
2. Runs immediately on page load (IIFE or module pattern)
3. Does NOT depend on any external libraries (the portal has jQuery available, but avoid depending on it if possible — use vanilla DOM APIs)

### Behavior

**1. Detect Portal Environment:**
- Check for `omp_level` global to confirm we're in the NS Manager Portal
- Read `current_domain` to get the active domain
- If `omp_level` is not defined, exit silently (not in the portal)

**2. Add Menu Item:**
- Locate the admin tools dropdown in the portal toolbar (reference: the Telzino script uses `$('.user-toolbar')` and jQuery `.prepend()`)
- Add an "OTP Reset" link to the existing admin tools dropdown
- The link should navigate to a portal page that loads the iframe OR inject the iframe directly into the content area
- Recommended approach: add `<li><a href="/portal/home?module=otp-reset">OTP Reset</a></li>` to the admin tools dropdown

**3. Load SPA in iframe (when module=otp-reset is active):**
- Check if the current URL has `?module=otp-reset`
- If yes:
  - Clear the portal content area (`#content`)
  - Read the NS JWT from `localStorage.getItem("ns_t")`
  - If no token found, show an error message
  - Create an iframe pointing to the GitHub Pages URL of the React SPA (e.g., `https://phoneware.github.io/otp-reset/`)
  - Insert the iframe into the content area
  - After iframe loads, send the auth context via postMessage:
    ```javascript
    iframe.contentWindow.postMessage({
      type: "init",
      token: nsToken,
      domain: current_domain
    }, "https://phoneware.github.io");
    ```
  - The postMessage target origin MUST be the GitHub Pages origin for security

**4. Handle iframe communication:**
- Listen for `message` events from the iframe
- Handle `{ type: "setHeight", height: <number> }` — resize the iframe element to match content height
- Validate message origin matches the expected GitHub Pages origin

### Security Considerations
- Never pass the token via URL parameters (visible in browser history/logs)
- Always validate postMessage origins (both sending and receiving)
- The token is already in localStorage (set by the portal) — we're not introducing new token storage

### Hosting
- The inject script file should be hosted at a stable URL (e.g., on the same server as other portal customization scripts, or on GitHub Pages alongside the SPA)
- The NS portal admin loads it via a `<script src="...">` tag in portal customization settings

## Success Criteria
- [ ] Script detects the NS Manager Portal environment via `omp_level` global
- [ ] Script adds an "OTP Reset" link to the admin tools dropdown menu
- [ ] Clicking the link loads the React OTP Reset SPA in an iframe in the portal content area
- [ ] Script reads `ns_t` from localStorage and sends it to the iframe via postMessage (NOT via URL params)
- [ ] Script sends `current_domain` to the iframe alongside the token
- [ ] Script handles `setHeight` messages from the iframe to resize it
- [ ] PostMessage origin validation is enforced on both send and receive
- [ ] Script exits silently if not running in the NS Manager Portal (no errors in non-portal contexts)

## Risks
- **Portal DOM structure changes**: NS portal updates could change the toolbar DOM structure, breaking the menu injection. Mitigation: use defensive DOM queries with fallbacks; log warnings if expected elements are not found.
- **localStorage key changes**: NS could change the `ns_t` key name in a future update. Mitigation: document the dependency; the key name could be made configurable.
- **Content Security Policy**: The portal might add CSP headers that block iframe loading from GitHub Pages. Mitigation: test in the actual portal environment; if CSP blocks it, the SPA would need to be hosted on an allowed origin.

## Boundaries
This unit does NOT handle:
- The OTP enable logic, device lookup, or authorization — that's all in unit-01 (the React SPA)
- Any backend server — this is a client-side script
- Portal authentication — the portal handles that; this script only reads the existing token

## Notes
- Reference implementation: Telzino's portal embed script at `https://phoneware.us/files/telzino_phoneware2.js` — follows the same pattern of adding a nav item, loading an iframe, and passing auth via postMessage
- The Telzino script uses jQuery (available in the portal) for DOM manipulation — this is acceptable if it simplifies portal DOM interaction, but prefer vanilla JS where possible
- The iframe URL (GitHub Pages) should be a configurable constant at the top of the script for easy updates
