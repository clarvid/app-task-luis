# Copilot instructions for app-task-luis

- Repo type: static vanilla JS SPA (no build tools). key files: `index.html`, `styles.css`, `app.js`.
- Main behavior in `app.js`: state in top-level vars (`tasks`, `currentFilter, currentPriority`), DOM helpers `qs`, `qsa`, persist using `localStorage` keys `tasks`, `username`, `theme`.
- UI flows: create/edit task modal, detail modal with status/subtasks, filter bar, priority selector. `renderTasks()` is central and must be called after state changes.
- Task model: `{id, title, desc, due, dur, status, priority, color, subtasks[], created}`; subtasks are `{id, title, done}`.
- IDs are generated with `Date.now() + Math.random()`; preserve this stable local-only format when adding tasks.

## What to change/help with
- New features should be implementable with DOM methods and state updates in `app.js` (no framework). Example: add keyboard shortcut to `fab`, add swipe support, or inline edit in cards.
- Use existing helpers: `addSubtaskRow()`, `openModal()`, `persist()`, `updateFooter()`.
- Keep styles in `styles.css` and page structure in `index.html` (avoid wholesale rewrites unless required).

## Run and debug
- No build command. open `index.html` directly or run a static server from project folder:
  - `python -m http.server 8000`
  - open `http://localhost:8000`
- Debugging: use Chrome DevTools, inspect `localStorage` entries and console logs in `app.js`.

## Conventions
- Prefer explicit, imperative DOM updates (no external frameworks).
- Keep UI text in Spanish (labels + placeholders in existing code).
- Simple/responsive layout: max 5 cards per row and mobile friendly in `styles.css`.

## When code changes are needed
- Mention file(s) to edit explicitly in PR description.
- For state mutation, always update `tasks` then `persist()` followed by `renderTasks()`.

## Infra & dependencies
- No npm/Yarn. no CI tests present in repo. keep pure static front-end.
