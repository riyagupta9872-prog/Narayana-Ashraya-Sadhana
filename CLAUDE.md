# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The **Narayana-Ashraya-Sadhana Tracker** is a Progressive Web App (PWA) for tracking daily spiritual practices within a multi-department, multi-team spiritual organization. It uses vanilla JavaScript with Firebase as the backend — no build tools, no npm, no transpilation.

## Running the App

Open `index.html` directly in a browser. There are no build steps, no package manager, and no local server required (though a local server avoids CORS issues when testing service worker features). All dependencies are loaded from CDN:

- Firebase v8.10.1 (Auth + Firestore)
- Chart.js v4.4.0
- XLSX v0.18.5 (Excel export)

## Architecture

### Single-Page Application Pattern

All application logic lives in [app.js](app.js) (~2,680 lines). The app is structured as a single HTML page ([index.html](index.html)) with multiple panels/modals shown/hidden via JavaScript. [signup.html](signup.html) is the only separate page.

### Data Layer — Firebase

- **Authentication:** Firebase Auth (email/password)
- **Database:** Firestore with three collections:
  - `users` — user profiles (name, dept, team, level, role)
  - `users/{uid}/sadhana` — daily entries subcollection (doc ID = `YYYY-MM-DD`)
  - `notifications` — in-app notifications (queried by `userId`)

### Role Hierarchy

Four roles with progressively wider admin scope (defined in `app.js` around lines 131–174):
- `user` — submit own sadhana only
- `teamLeader` — view/manage own team
- `deptAdmin` — view/manage own department
- `superAdmin` — full access to all users; can edit any user's sadhana entries

### Organizational Structure

Four departments, each with multiple teams: `IGF`, `IYF`, `ICF_MTG`, `ICF_PRJI`. The `DEPT_TEAMS` map (line 137) governs this structure.

### Scoring Engine

Four level-based scoring functions (`calcScoreL1`–`calcScoreL4`, lines 243–332) with daily maximums of 105/110/115/140 points respectively. Scoring factors include: sleep time, wakeup time, chanting rounds, reading minutes, hearing minutes, instrument practice, notes revision (L4 only), and day-sleep penalty. Additional scoring: `calcServiceWeekly()` (line 334), `calcSundayBonus()` (line 344), `calculateScores()` (line 353) as the unified entry point.

### Key Modules in app.js

| Lines | Section | Module |
|-------|---------|--------|
| 1–15 | §1 | Firebase initialization |
| 22–127 | | Custom AM/PM time picker (`buildTimePicker`, `setTimePicker`, `fmt12`) |
| 131–174 | | Role/scope helpers (`isSuperAdmin`, `getAdminScope`, `matchesScope`) |
| 183–239 | §3 | Helpers — time conversion, date utils, instrument options |
| 241–368 | | Scoring engine (L1–L4, service, Sunday bonus) |
| 371–738 | §4 | Excel export (user + master reports) |
| 741–826 | §5 | Auth state listener + dashboard init |
| 828–862 | §6 | Tab navigation (`switchTab`, `showSection`) |
| 865–1127 | §7 | Weekly reports table |
| 1129–1264 | §8 | Progress charts (Chart.js) |
| 1266–1347 | §9 | Sadhana form scoring with sleep-time warning |
| 1349–1799 | §10 | Admin panel — user management, inactive devotees, admin management |
| 1801–2056 | §11 | Super Admin — edit sadhana entries + edit history modal |
| 2057–2231 | | Devotee profile modal |
| 2232–2327 | §12 | Date select & profile form |
| 2328–2380 | §13 | Password toggle & password change modal |
| 2382–2430 | §14 | Misc bindings (login, logout, profile save) |
| 2430–2462 | | Toast notification system |
| 2462–2680 | | Notifications (in-app), reminders, user sidebar |

### PWA

[sw.js](sw.js) implements network-first caching with Firebase API calls excluded. [manifest.json](manifest.json) configures standalone display. Note: the service worker references Firebase v9.22.2 URLs in its cache list while `index.html` loads v8.10.1 — these are intentionally different (compat SDK).

## Key Conventions

- **Firebase v8 (compat SDK)** is used — not the modular v9+ API. Use `firebase.firestore()`, `firebase.auth()` patterns.
- **Panel visibility** is toggled by adding/removing `hidden`/`active` CSS classes — search for `classList` changes to trace UI flow.
- **All public functions** called from HTML `onclick=` are assigned to `window.*` at the bottom of their respective sections (54 total `window.*` assignments).
- **Edit history** is tracked as a subcollection or array within each sadhana entry, with `editedBy`/`reason` fields.
- **Score coloring** in reports uses CSS classes (`.low-score`, `.mid-score`, `.high-score`) based on thresholds in report rendering functions.
- **NR (Not Reported)** is a sentinel value used throughout for missing/unfilled sadhana data; `getNRData()` (line 206) returns a penalty-scored placeholder entry.
- **Date format** is `YYYY-MM-DD` strings throughout (used as Firestore document IDs and in all date logic).
- **All styles** are inline in [index.html](index.html) `<style>` tags and [style.css](style.css) — no CSS preprocessor.
