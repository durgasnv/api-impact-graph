# API Browsing Pages

## 1. What This Phase Built

Two new frontend pages:

- **APIs List** (`/apis`) — browse all APIs, search by name, navigate to detail.
- **API Detail** (`/apis/:id`) — view versions, consumers, and navigate to blast radius.

## 2. File Map

```
client/src/
├── api.js                      — fetchAllApis, fetchApiById, fetchApiConsumers
├── components/
│   ├── SearchBar.jsx           — controlled text input with focus ring
│   ├── EmptyState.jsx          — centered message for empty lists
│   └── VersionBadge.jsx        — active/deprecated badge
├── pages/
│   ├── ApisList.jsx            — list page with search
│   └── ApiDetail.jsx           — detail page with versions, consumers
├── App.jsx                     — routes: /apis, /apis/:id
├── components/Layout.jsx       — APIs link active for /apis/* nested routes
└── index.css                   — page, card, badge, version, search styles
```

## 3. APIs List Page

Fetches `GET /api/apis`. Displays each API as a card showing:

- Name
- Description
- Domain tag
- Version count badge
- "Has deprecated versions" badge (if applicable)

Cards are links to `/apis/:id`.

### Search

Client-side filtering by API name. Input is controlled via `useState`. Two empty states:

- No APIs at all: "No APIs found."
- Search returns nothing: "No APIs match your search."

## 4. API Detail Page

Fetches `GET /api/apis/:id` and `GET /api/apis/:id/consumers` in parallel via `Promise.all`.

Displays:

- API name and domain tag
- Description
- Version list with active/deprecated badges
- Replacement info for deprecated versions
- Consumer list with links to `/services/:id`
- "Analyze Blast Radius" button (links to `/apis/:id/blast-radius` — Phase 7)

### Version Replacement

Backend returns `replacedBy` in the version data. The component builds a lookup map and displays "Replaced by Payment API v2.0.0" below the deprecated version.

### Consumer List

Each consumer is a clickable card linking to `/services/:id`. If no consumers exist, shows: "No services currently consume this API."

### Not Found

If `GET /api/apis/:id` returns 404, shows an error banner. The back link to `/apis` remains available.

## 5. Reused Components

| Component | Source | Usage |
|-----------|--------|-------|
| LoadingSpinner | Phase 5 | Both pages during fetch |
| ErrorBanner | Phase 5 | API load failure, 404 |
| SearchBar | Phase 6 | APIs list filtering |
| EmptyState | Phase 6 | Empty list, no search matches |
| VersionBadge | Phase 6 | Created but versions rendered inline for more context |

## 6. Navigation

The Layout component was updated so the "APIs" nav link stays active when the user is on `/apis/:id`. Uses `useLocation()` to check `pathname.startsWith("/apis/")`.

## 7. Backend Warm-Up

The cognodb driver connects lazily — the TCP connection only establishes on the first `session.run()`. This caused ~17s delays on the first frontend request.

Fixed by adding a warm-up query in `server/src/index.js`:

```js
const session = driver.session();
await session.run("RETURN 1");
await session.close();
```

The server now logs `cognodb connected` before `Server running on port 3001`.

## 8. Styling Approach

All new styles use the existing CSS variable system (`--color-primary`, `--color-border`, etc.). Cards match the dashboard stat cards. Badges use semantic colors: green for active, yellow for deprecated, gray for muted counts. Domain tags use primary-light background.

Responsive: on mobile, the page header stacks vertically and the search bar goes full width.
