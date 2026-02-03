# AGENTS.md

## Project Summary
This is a TypeScript SPA for crisis management using Leaflet to visualize NGSI-LD data. UI is an admin dashboard built with React, Tailwind, and DaisyUI. Data flows: NGSI-LD API -> typed entities -> GeoJSON -> Leaflet layers.

## Stack
- React + TypeScript (strict)
- Vite
- Tailwind CSS + DaisyUI v5
- Leaflet
- React Query
- Biome (lint/format)
- Vitest + Testing Library

## Key Commands
- `npm run dev`
- `npm run lint`
- `npm run format`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Repo Structure
- `src/map/` NGSI-LD client, transformers, map view
- `src/ui/` UI panels and layout
- `src/test/` test setup

## Architecture Rules
- Keep domain logic in `src/map/` (NGSI-LD client, transforms, map layers).
- Keep UI composition in `src/ui/` and `src/App.tsx`.
- Avoid cross-imports from `ui` into `map`.
- New features should include tests and a short entry in `AGENTS.md` if they add new conventions.

## Data Conventions
- NGSI-LD entities are transformed into GeoJSON in `src/map/transformers.ts`.
- Use `VITE_NGSI_*` env vars for broker connection. See `.env.example`.
- Avoid non-null assertions and implicit any. Keep types explicit.

## Quality Gates (must pass)
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npx @biomejs/biome format --write ./src`
- `npm run format` before commit

## TypeScript Validation
- Always run `npm run typecheck` (tsc) during development.

## Review Checklist
- Are all new functions fully typed with no implicit `any`?
- Does the change include tests for critical paths and transforms?
- Are errors handled with user-visible fallbacks (no silent failures)?
- Are map updates efficient (no unnecessary re-render or layer rebuild)?
- Are dependencies justified and documented?

## Coding Standards
- Keep changes strict and Biome-clean.
- No implicit `any`, no `!` non-null assertions.
- Prefer small, typed helper functions and clear data transforms.
- Add tests for data transforms and critical UI behavior.

## Testing Strategy
- Unit tests: `src/map/transformers.ts`, `src/map/ngsiClient.ts` (mock fetch).
- Integration tests: map renders with mock GeoJSON and shows markers.
- E2E tests (optional for prototype): critical flows in map and filters.

## Error Handling Policy
- All API errors must be surfaced in the UI (status badge or toast).
- Avoid swallowing errors in fetch or transforms; return typed results.

## Dependency Policy
- Prefer no new dependencies unless they reduce complexity or risk.
- Any new dependency must be documented in PR summary with rationale.

## Map/UI Guidelines
- Map is the primary focus of the UI.
- Avoid heavy UI changes that reduce map visibility.
- Keep overlays minimal and functional for crisis ops workflows.
