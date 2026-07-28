# EVFAKTA Brand Integration Report

**Date:** 2026-07-28  
**Scope:** Official logo, favicon, contact, social links, metadata  
**Constraint:** No public redesign; Design System 2.0 unchanged; admin/CMS untouched

---

## Original asset source

| Source | Location |
|--------|----------|
| Approved brand board (owner-supplied) | `docs/brand-source/evfakta-brand-board.png` |
| Workspace upload | Cursor assets (`ChatGPT_Image_28._juli_2026__…png`) |

Individual logo/icon files were cropped/exported from the board (and the official car+lightning mark was placed on the approved forest-green field for favicon/app icon sizes). The symbol and colors were not redesigned.

---

## Asset files created

| File | Purpose |
|------|---------|
| `public/brand/evfakta-logo.png` | Horizontal green logo + tagline (header / light UI) |
| `public/brand/evfakta-logo-light.png` | White horizontal logo (dark footer) |
| `public/brand/evfakta-icon.png` | Square app/favicon icon (512×512) |
| `public/brand/evfakta-icon-circle.png` | Circular icon variant (extra) |
| `public/brand/evfakta-mark.png` | Standalone car+lightning mark |
| `public/brand/apple-touch-icon.png` | 180×180 Apple touch |
| `public/brand/favicon-32.png` / `favicon-16.png` | Browser tab icons |
| `public/brand/og-image.png` | 1200×630 Open Graph |
| `app/icon.png` | Next.js metadata icon |
| `app/apple-icon.png` | Next.js Apple icon |
| `public/favicon.ico` | Legacy favicon request path (PNG bytes) |

---

## Header implementation

- Component: `components/brand/brand-logo.tsx`
- Used in `components/layout/site-header.tsx`
- Desktop: full horizontal logo (`object-fit: contain`, not stretched)
- Mobile (≤640px): compact square icon
- Links to `/`
- Accessible name: `EVFAKTA – Finn riktig elbil basert på fakta`

---

## Footer implementation

- Dark footer uses `variant="light"` white logo
- Official tagline: `Finn riktig elbil – basert på fakta.`
- Contact: `mailto:post@evfakta.no`
- Social row with line icons (YouTube, TikTok, Instagram, LinkedIn)
- External links: `target="_blank"` + `rel="noopener noreferrer"`
- Norwegian `aria-label`s as specified
- Hidden on `/admin`

---

## Favicon setup

- Metadata `icons` in `app/layout.tsx`
- `app/icon.png` + `app/apple-icon.png`
- `/brand/favicon-16.png`, `/brand/favicon-32.png`, `/brand/apple-touch-icon.png`
- No horizontal wordmark used as favicon

---

## Metadata setup

- Site name: **EVFAKTA**
- Title template: `%s | EVFAKTA`
- Default title: `EVFAKTA – Finn riktig elbil basert på fakta`
- Description: official kildebaserte fakta copy
- Canonical base: `https://www.evfakta.no`
- Open Graph: siteName, locale `nb_NO`, type website, official OG image
- Twitter: `summary_large_image` only (no X account claimed)

---

## Structured data

Organization JSON-LD in root layout:

- name, url, logo, email `post@evfakta.no`
- `sameAs`: the four official social URLs
- contactPoint with email

---

## Social links added (exact)

1. https://www.youtube.com/channel/UCuOYFNBVUGH_v05CbIrEnsg  
2. https://www.tiktok.com/@evfakta  
3. https://www.instagram.com/evfakta.no/  
4. https://www.linkedin.com/company/evfakta.no/?viewAsMember=true  

Configured in `config/site.ts`.

---

## Responsive checks

| Breakpoint | Logo behavior |
|------------|---------------|
| ≤640px | Header uses square icon |
| ≥641px | Header uses horizontal logo |
| Footer | Light logo scales with `max-width`; tagline wraps |
| Touch | Social icons 44×44 |

---

## Remaining missing / notes

- Brand-board raster exports are soft at large sizes; vector SVG masters would improve sharpness if provided later
- `public/favicon.ico` is PNG content named `.ico` (browsers accept; true ICO optional later)
- No Facebook / X / Snapchat links (intentionally omitted)

---

## Exact routes covered

```
/
/modeller
/modeller/[slug]
/merker
/merker/[slug]
/sammenlign
/login
/registrer
/min-side
Footer (all public pages)
Mobile navigation (shared header)
/admin (brand logo in slim chrome only; CMS styling untouched)
```

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm test` | Pass (96) |
| `npm run build` | Pass |
| Schema / migrations | None |
| Publish / approval | Unchanged |
| Commit / push | Not performed |
