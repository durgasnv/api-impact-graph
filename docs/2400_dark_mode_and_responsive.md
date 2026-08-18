# Dark Mode and Responsive Design

## What We Built

A full dark theme using CSS custom properties, toggled via a button in the nav bar, persisted to localStorage. Responsive layouts at 960px and 640px breakpoints.

## Key Decisions

- Used CSS custom properties (`--color-bg`, `--color-surface`, etc.) so dark mode is a single class toggle on `<html>` — no per-component logic needed
- Graph canvas detects dark mode by reading `document.querySelector(".app").classList.contains("dark")` since canvas doesn't respond to CSS variables
- localStorage for persistence — no backend user preferences needed for a demo

## Errors Encountered

### Dark mode didn't apply to the graph canvas
**Cause:** Canvas elements don't inherit CSS variables. The `drawNode()` and `drawLink()` functions hard-coded light-mode colors.
**Fix:** Added runtime detection: `const isDark = document.querySelector(".app")?.classList.contains("dark")` inside each draw function, then branching colors.

### Dark mode flash on page load
**Cause:** Light mode CSS loaded first, then `useEffect` applied the dark class.
**Fix:** Moved the dark class application to `Layout.jsx` initialization — the class is set before first render by reading localStorage in `useState`.

### Mobile layout had horizontal scroll
**Cause:** The blast radius graph card had a fixed min-width from the force-graph container.
**Fix:** Added `min-width: 0` on the graph column in the CSS grid, and `overflow: hidden` on the fullscreen container.

## What We Learned

- CSS custom properties are the cleanest way to implement theme switching — one toggle, instant effect
- Canvas-based visualizations need special handling for dark mode since they don't inherit styles
- `localStorage` is sufficient for theme persistence in a single-user demo app
- Mobile-first responsive design is harder when you start desktop-first — the blast radius page was built desktop-first and needed retrofitting
