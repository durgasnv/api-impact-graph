# Dark Mode and Responsive Design

> Theme system and responsive behavior across the application.

## 1. Dark Mode Implementation

### Toggle Mechanism

- **Component:** `Layout.jsx` (shared across all pages)
- **State:** `useState(() => localStorage.getItem("theme") === "dark")`
- **Toggle:** Button in the navigation bar (sun icon when dark, moon icon when light)
- **Persistence:** `localStorage.setItem("theme", dark ? "dark" : "light")`
- **CSS class:** `document.documentElement.classList.toggle("dark", darkMode)` applied to `<html>`
- **Root class:** `<div className={`app${darkMode ? " dark" : ""}`}>`

### CSS Variable System

All colors use CSS custom properties defined in `:root`:

```css
:root {
  --color-bg: #f1f5f9;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-secondary: #64748b;
  --color-primary: #2563eb;
  --color-border: #e2e8f0;
  --radius: 10px;
  --shadow: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
}
```

Dark mode overrides in `.app.dark`:

```css
.app.dark {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-primary: #60a5fa;
  --color-border: #334155;
}
```

### Component-Level Dark Mode

The graph canvas detects dark mode by reading `document.querySelector(".app")?.classList.contains("dark")`. This affects:
- Node label color (`#e2e8f0` dark, `#1e293b` light)
- Node stroke color (`#334155` dark, `#ffffff` light)
- Link color (`#475569` dark, `#94a3b8` light)
- Background colors for edge label pills

### Dark Mode Coverage

Dark mode styles override all major UI sections:
- Navigation bar, footer, buttons, badges, domain tags
- Entity cards, stat cards, search bar
- Dashboard graph, dashboard action cards
- Graph container, blast radius controls, info banner
- Blast panels, legend, tips, node details
- Fullscreen mode, slide-in drawer
- Loading spinners, error banners, empty states

## 2. Responsive Design

### Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| > 960px | Full layout: 2-column blast radius, 4-column stats, 2-column dashboard |
| ≤ 960px | Single column: blast radius stacks, stats go 2-column, dashboard stacks |
| ≤ 640px | Compact: reduced padding, single-column stats, stacked hero actions, full-width drawer |

### Layout Adaptations

**Blast Radius Page:**
- Desktop: Graph + sidebar side-by-side
- Tablet: Graph + sidebar stack vertically
- Mobile: Same stack, full-width drawer in fullscreen

**Dashboard:**
- Desktop: 4-column stat grid, 2-column dashboard grid
- Tablet: 2-column stat grid, single-column dashboard
- Mobile: Single-column everything, stacked hero buttons

**Navigation:**
- Desktop: Horizontal nav links
- Mobile: Reduced padding, horizontal scroll if needed

**Entity Lists:**
- All card lists remain single-column at all widths
- Search bar goes full-width on mobile

### Fullscreen Mode

- Takes over the full viewport with `position: fixed; inset: 0; z-index: 200`
- Graph fills available space via CSS flex layout
- Sidebar becomes a slide-in drawer (340px wide, or full-width on mobile ≤ 640px)
- Drawer slides in from the right with CSS animation (`blast-slide-in-right`)

## 3. Animations

| Animation | Trigger | Effect |
|-----------|---------|--------|
| `fadeInDown` | Dashboard hero load | translateY(-8px) → 0, opacity 0 → 1 |
| `cardSlideIn` | Stat cards load | translateY(16px) → 0, opacity 0 → 1, staggered |
| `blast-slide-in-right` | Fullscreen drawer open | translateX(100%) → 0 |
| `blast-fade-in` | Drawer overlay | opacity 0 → 1 |
| `spin` | Loading spinner | 360° rotation |
| `pulse` | Loading states | opacity 0.4 ↔ 1 |

## 4. Accessibility

- All interactive elements have visible `:focus-visible` outlines (2px solid primary color)
- Control buttons have `aria-label` attributes ("Zoom in", "Zoom out", "Enter fullscreen", "Exit fullscreen", "Close details")
- `title` attributes on all icon buttons for tooltip support
- Keyboard navigation: Escape exits fullscreen and closes drawer
- Semantic HTML: `<nav>`, `<main>`, `<footer>`, proper heading hierarchy
