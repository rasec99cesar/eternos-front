# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**sempre-web** — React + TypeScript + Vite frontend for the *Somos Eternos* platform, where couples create personalized relationship pages. Deployed to Cloudflare Pages.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run typecheck  # type-check without emitting
npm run lint       # ESLint on src/
npm run format     # Prettier on src/
npm run preview    # preview the production build
```

Before running locally, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Architecture

### Routing (`src/App.tsx`)
All routes are defined in a single file. Public routes (`/`, `/entrar`, `/p/:slug`, `/exemplos/:slug`) are open. Protected routes (`/criar`, `/editor/:pageId`, `/planos/:pageId`, `/pagamento/aprovado`, `/minhas-paginas`) are wrapped in `<ProtectedRoute>`.

### Auth flow
`AuthContext` (`src/contexts/AuthContext.tsx`) bootstraps by calling `api.auth.me()` on mount and stores the `User | null` in React state. Auth itself is a magic-link / OTP flow: user submits email → backend sends a 6-digit code → user verifies code → session cookie is set. `ProtectedRoute` redirects to `/entrar?redirect=…` when `user` is null.

### API layer (`src/services/api.ts`)
A single `request<T>()` wrapper around `fetch` with `credentials: 'include'` for cookie auth. All endpoints are grouped under `api.auth`, `api.pages`, `api.templates`, `api.slugs`, `api.public`, `api.checkout`, and `api.uploads`. File uploads skip the JSON wrapper and use `FormData` directly.

### Shared types (`src/shared/index.ts`)
Single source of truth for TypeScript types and Zod schemas used for form validation. Includes `CouplePage`, `User`, `Template`, `Order`, checkout types, and the exhaustive `UmamiEventName` union. Import types from here, never redefine them in components.

### Plan tiers
Two technical plan keys are **sempre** and **eterno**. The selected plan is read from `sessionStorage` key `selected_plan`. It changes editor behavior: `sempre` users see preset `<select>` dropdowns for text fields; `eterno` users get free-text `<input>`/`<textarea>`. This logic lives in `EditorPage` via the `isEterno` boolean and the `VarySelect` component.

### CouplePage data model
`storyJson` and `themeConfigJson` are JSON strings stored on the DB record. The editor serializes/deserializes them; `themeConfigJson` carries only the `theme` key (legacy Spotify fields have been migrated to dedicated DB columns). Photo assets use numeric positions: 0 = center polaroid, 1–3 = side polaroids, 4–5 = story chapter photos.

### CSS Modules + global styles
Each component/page has a co-located `.module.css`. Global tokens (colours, typography, utility classes like `.btn`, `.spinner`, `.polaroid`, `.reveal`, `.eyebrow`) live in `src/styles/globals.css`. The `data-theme` attribute on a container switches the active colour palette.

### Analytics (`src/utils/analytics.ts`)
All Umami events go through `trackEvent(name, data?)`. The event name must be one of the `UmamiEventName` values from `src/shared/index.ts`. Umami is injected lazily via `initUmami()` only when both `VITE_UMAMI_SRC` and `VITE_UMAMI_WEBSITE_ID` are set.

### Key hooks
- `useCounter(startDate)` — ticks every second and returns `{ days, hours, mins, secs }` elapsed since `startDate`.
- `useReveal()` — returns a ref; attaches an `IntersectionObserver` to all `.reveal` children and adds class `in` when they enter the viewport.

## Path alias

`@` resolves to `src/` (configured in `vite.config.ts`).

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (required) |
| `VITE_APP_URL` | Frontend base URL |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_UMAMI_SRC` | Umami script URL (optional) |
| `VITE_UMAMI_WEBSITE_ID` | Umami site ID (optional) |
