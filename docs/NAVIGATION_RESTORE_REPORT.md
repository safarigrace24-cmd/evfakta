# Navigation restore report

**Date:** 2026-07-28  
**Scope:** Public information architecture only (Design System 2.0 visuals unchanged)  
**Commit / push:** Not performed (per request)

## Goal

Restore the complete EVFAKTA platform navigation and homepage IA from the old structure, while keeping the modern Design System 2.0 look.

## Navigation restored

Desktop / mobile main nav (in order):

| Label | Route | Status |
| --- | --- | --- |
| Hjem | `/` | Live |
| Modeller | `/modeller` | Live |
| Sammenlign | `/sammenlign` | Live |
| Kalkulator | `/kalkulator` | Under utvikling |
| Rimeligste | `/rimeligste` | Under utvikling |
| Verktøy | `/verktoy` | Under utvikling |
| Testdata | `/testdata` | Under utvikling |
| Ladestasjoner | `/ladekart` | Under utvikling |
| Bruktbil | `/bruktbil` | Live |
| Info | `/info` | Live |

Also kept:

- **Logg inn / Min side** (+ logout when signed in)
- Header social buttons: **YouTube**, **TikTok**, **LinkedIn**
- Search shortcut → `/modeller`

## Removed from main navigation

- **Mer** dropdown (empty / unused)
- **Merker** top-level / dropdown entry

`/merker` remains as a route (sitemap + brand cards on homepage can still deep-link). It is not part of the restored main nav IA.

## Files changed

| Area | Files |
| --- | --- |
| Nav config | `config/site.ts` — `platformNavLinks` / `primaryNavLinks` / `headerSocialLinks` |
| Feature flags | `lib/public/feature-flags.ts` — incomplete features stay `inNav: true` |
| Header | `components/layout/site-header.tsx` — full IA, no Mer, header socials |
| Footer | `components/layout/site-footer.tsx` — platform destinations, no Merker |
| Homepage | `app/page.tsx` + `components/home/platform-hub-section.tsx` |
| Styles | `app/globals.css` — compact platform nav, social row, hub grid, ≤1180px drawer |
| Sitemap | `app/sitemap.ts` — all platform destinations listed |
| Stub copy | `app/kalkulator`, `rimeligste`, `verktoy`, `testdata`, `ladekart` — honest “Under utvikling”, no “hidden from nav” claims |

## Homepage platform hub

New section **«Hele plattformen / Alt EVFAKTA tilbyr»** links to every destination above (except Hjem), with **Under utvikling** badges where features are incomplete.

## Design System 2.0

No color, typography, spacing, or component redesign. Only IA wiring plus minimal layout CSS so the longer nav fits (smaller link padding, earlier mobile drawer breakpoint).

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm test` | Passed (96 tests) |
| `npm run build` | Passed (Next.js 16.2.11) |

No commit. No push.
