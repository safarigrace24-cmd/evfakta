# EVFAKTA Design System 2.0

**Status:** Implemented on public website (2026-07-28) — see `docs/EVFAKTA_DESIGN_2_IMPLEMENTATION_REPORT.md`  
**Scope:** Public website UX (admin CMS excluded)  
**Audience:** Product, design, engineering  
**Market:** Norway — electric vehicle discovery, comparison, and buying guidance

---

## 1. Design philosophy

### 1.1 Positioning

EVFAKTA is Norway’s calm, authoritative EV platform: the place you go when you want clarity before money, not another noisy car marketplace.

The product should feel like a **precision instrument wrapped in Scandinavian hospitality** — generous space, honest data, and photography that shows real cars in real Nordic light.

### 1.2 Principles

| Principle | Meaning in practice |
|-----------|---------------------|
| **Clarity over chrome** | Every pixel earns its place. Prefer empty space to decoration. |
| **Data with dignity** | Specs are the product. Present numbers like a luxury dashboard, not a spreadsheet dump. |
| **Trust is visual** | Sources, last-updated, and methodology sit close to claims — never buried. |
| **Scandinavian calm** | Soft light, cool neutrals, restrained green accent. No neon, no purple gradients, no dark-mode default. |
| **Speed as feeling** | Instant search feedback, skeleton states that look intentional, transitions under 200ms. |
| **Mobile first** | Design the thumb path first; expand to desktop as a richer composition of the same system. |
| **One job per screen region** | Hero sells the mission. Search finds. Cards compare at a glance. Detail pages decide. |

### 1.3 Inspiration (not imitation)

| Reference | Steal this feeling | Do not steal |
|-----------|--------------------|--------------|
| Apple | Hero photography, typographic confidence | Product-launch hype language |
| Rivian | Outdoor authenticity, material honesty | Adventure-brand costume |
| Stripe | Documentation-grade clarity for complex data | Developer-dashboard density |
| Linear | Precision, quiet motion, sharp hierarchy | Issue-tracker metaphors |
| Tesla | Spec-forward product pages | Aggressive dark UI / cult branding |

### 1.4 Emotional target

After 10 seconds on EVFAKTA, a first-time buyer should feel:  
*“I can understand this. I won’t be tricked. I can choose calmly.”*

---

## 2. Design system foundations

### 2.1 Color palette

Light theme only for public v2.

#### Core tokens

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F7F8F6` | Page canvas (cool off-white, slight green cast) |
| `--bg-elevated` | `#FFFFFF` | Cards, sheets, nav |
| `--bg-subtle` | `#EEF1ED` | Alternating sections, filter bars |
| `--ink` | `#0C1210` | Primary text |
| `--ink-secondary` | `#3A4540` | Body secondary |
| `--ink-muted` | `#6B776F` | Labels, meta, captions |
| `--line` | `#D7DED8` | Borders, dividers |
| `--line-soft` | `#E8EDE9` | Hairlines inside cards |
| `--brand` | `#0F6B45` | Primary action / trust accent (deep forest, not neon) |
| `--brand-hover` | `#0B5536` | Hover/pressed |
| `--brand-soft` | `#E3F2EA` | Soft fills, selected chips |
| `--accent-data` | `#1A6FBF` | Numeric emphasis for charging/power (cool blue, sparingly) |
| `--success` | `#1F7A4D` | Positive deltas, “best in compare” |
| `--warning` | `#A65F00` | Caution, incomplete data |
| `--danger` | `#B42318` | Errors, destructive |
| `--focus` | `#0F6B45` | Focus ring (2px + 2px offset) |

#### Photography overlays

- Hero image scrim: `linear-gradient(180deg, rgba(12,18,16,0.15) 0%, rgba(12,18,16,0.55) 100%)` only when text sits on image.
- Prefer **text beside image**, not text on image, whenever layout allows.

#### Forbidden (v2 public)

- Purple / indigo marketing gradients  
- Neon teal on near-black (legacy live dark look)  
- Warm cream + terracotta “AI brochure” palette  
- Glow shadows and glassmorphism stacks  

### 2.2 Typography

**Primary UI:** `Geist` or `Söhne` / `Inter` as fallback — geometric neo-grotesk.  
**Display (optional, sparingly):** `Fraunces` or `Newsreader` for guide/article titles only — never for nav or specs.

| Role | Size / line / weight | Tracking |
|------|----------------------|----------|
| Display | 48–64 / 1.05 / 600 | -0.03em |
| H1 | 36–44 / 1.1 / 650 | -0.025em |
| H2 | 28–32 / 1.15 / 650 | -0.02em |
| H3 | 20–22 / 1.25 / 600 | -0.015em |
| Body L | 18 / 1.6 / 400 | 0 |
| Body | 16 / 1.55 / 400 | 0 |
| Body S | 14 / 1.5 / 400 | 0 |
| Label | 12–13 / 1.3 / 600 | 0.04em uppercase optional for meta only |
| Stat number | 28–40 / 1 / 700 | -0.02em |
| Spec value | 16–18 / 1.2 / 650 | -0.01em |

**Rules**

- Specs use tabular lining figures (`font-variant-numeric: tabular-nums`).  
- Never mix more than two type families on one page.  
- Norwegian copy: prefer short sentences; avoid marketing exclamation.

### 2.3 Spacing system

Base unit: **4px**. Preferred scale:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`

| Context | Token |
|---------|-------|
| Component inner padding | 16–24 |
| Card gap | 16–24 |
| Section vertical | 64–96 mobile / 80–128 desktop |
| Page gutters | 16 mobile / 24 tablet / 32–40 desktop |
| Max content width | 1200px (marketing), 1120px (catalog), 720px (articles) |

### 2.4 Radius

| Token | Value | Use |
|-------|-------|-----|
| `--r-sm` | 8px | Inputs, chips |
| `--r-md` | 12px | Buttons, small cards |
| `--r-lg` | 16px | Standard cards |
| `--r-xl` | 24px | Hero media, large panels |
| `--r-full` | 999px | Pills only when interactive (filters) |

Avoid zero-radius “broadsheet” and exaggerated 32px+ on every card.

### 2.5 Shadows

Minimal elevation — prefer border + background shift over shadow.

| Level | Value |
|-------|-------|
| Rest | `0 1px 2px rgba(12,18,16,0.04)` |
| Hover | `0 8px 24px rgba(12,18,16,0.08)` |
| Modal | `0 24px 48px rgba(12,18,16,0.14)` |

No multi-layer neon glows.

### 2.6 Motion

| Motion | Duration | Easing | Use |
|--------|----------|--------|-----|
| Micro | 120ms | `ease-out` | Button press, chip select |
| UI | 180–220ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Hover lift, drawer |
| Page | 280ms | same | Section reveal (once, reduced-motion aware) |

**Rules**

- Prefer opacity + translateY(4–8px), never bounce.  
- Honor `prefers-reduced-motion: reduce` → instant state change.  
- Skeleton shimmer is optional; static soft blocks are fine.

### 2.7 Icons

- Line icons, 1.5–1.75 stroke, 20/24px optical sizes.  
- Lucide / Phosphor-like geometry.  
- Never emoji as UI icons.  
- Spec icons (range, battery, charge) share one family and one weight.

### 2.8 Grid & breakpoints

| Name | Width | Columns | Gutter |
|------|-------|---------|--------|
| Compact | 0–374 | 4 | 16 |
| Mobile | 375–767 | 4 | 16 |
| Tablet | 768–1023 | 8 | 20 |
| Desktop | 1024–1439 | 12 | 24 |
| Wide | 1440+ | 12 | 32 |

**Card grids**

- Mobile: 1 col  
- Tablet: 2 col  
- Desktop: 3 col (catalog), 4 col (brand logos)

### 2.9 Accessibility

- Text contrast ≥ 4.5:1 body, ≥ 3:1 large text.  
- Focus visible on every interactive control.  
- Touch targets ≥ 44×44px.  
- Compare tables: sticky first column + horizontal scroll with visible affordance.  
- Don’t rely on color alone for “best value” — add ✓ / “Best” label.  
- Images: meaningful alt in Norwegian; decorative images empty alt.  
- Forms: visible labels (not placeholder-only).  
- Skip link to main content.  
- Keyboard: trap focus in drawers/modals; Esc closes.

---

## 3. Component library

### 3.1 Buttons

| Variant | Visual | Use |
|---------|--------|-----|
| Primary | Filled brand, white label | Main CTA |
| Secondary | White fill, soft border | Secondary path |
| Ghost | Text-only + hover soft fill | Tertiary |
| Destructive | Soft red fill | Account delete |
| Icon | Square 40–44 | Favorite, close |

Sizes: `sm` 36h · `md` 44h · `lg` 52h (hero).

### 3.2 Cards

**Model card**

```
┌─────────────────────────────┐
│  [ 16:10 photo          ]♡  │
│  Brand                      │
│  Model name                 │
│  ─── ─── ───                │
│  Range   Charge   Battery   │
│  [ Se fakta → ]             │
└─────────────────────────────┘
```

- No price unless public price policy is ON.  
- Hover: 2px lift + soft shadow.  
- Loading: soft image block + 3 text bars.

**Brand card** — logo on soft field, name, model count.  
**Guide card** — 3:2 image, eyebrow category, title, 1-line excerpt, read time.  
**Stat card** — large number + label (homepage trust strip only, max 3).

### 3.3 Navigation

**Desktop**

- Sticky translucent white bar (blur 12px).  
- Left: wordmark (text-first, optional small mark).  
- Center/left cluster: Modeller · Merker · Sammenlign · Guider · Kalkulator.  
- Right: Søk icon/field · Logg inn / Min side.

**Mobile**

- Compact bar + search icon + menu.  
- Full-screen drawer (not tiny hamburger dump): primary links + search field at top.

### 3.4 Search & filters

**Global search (homepage hero)**

- Large field, 56–64px height.  
- Placeholder: “Søk modell, merke eller behov…”  
- Instant suggestions: models, brands, guides.  
- Keyboard: ↑↓ select, Enter open, Esc clear.

**Catalog filters**

- Sticky filter bar on mobile as bottom sheet trigger (“Filtre”).  
- Desktop: left rail OR top chips (prefer top chips for less dashboard feel).  
- Active filters as removable pills.

### 3.5 Spec blocks

```
┌──────────────┐
│ Rekkevidde   │
│ 533 km       │
│ WLTP         │
└──────────────┘
```

Highlight one primary fact (usually range or charge) with brand-soft background.

### 3.6 Tables

- Compare: sticky model headers + sticky first column.  
- Best cells: soft success tint + “Best” caption.  
- Empty cells: em dash “—” not “0”.  
- Hide rows where all cars lack data.

### 3.7 Badges

| Badge | Style |
|-------|-------|
| Drivlinje | Neutral soft |
| Ny | Brand soft |
| Vinter | Cool blue soft |
| Mangler data | Warning soft |
| Kildebekreftet | Brand soft + check |

### 3.8 Forms

- Label above input.  
- 44–48px height.  
- Error text under field in danger color.  
- Account pages: single-column, max 480px.

### 3.9 Feedback

- Toasts: bottom-center mobile, top-right desktop, 4s.  
- Empty states: one illustration-free composition — headline, one sentence, one CTA.  
- Skeletons: match final layout geometry.

---

## 4. Page layouts

### 4.1 Homepage

**Job:** Orient, search, and route to decision tools in under 15 seconds.

#### Wireframe — mobile

```
┌─────────────────────┐
│ EVFAKTA      ☰  🔍  │
├─────────────────────┤
│                     │
│  Finn riktig elbil  │
│  med rolige fakta   │
│                     │
│ ┌─────────────────┐ │
│ │ Søk modeller…   │ │
│ └─────────────────┘ │
│ [Utforsk] [Sammenlign]│
│                     │
│ ── Populære modeller│
│ ┌─────┐ ┌─────┐     │
│ │card │ │card │ →   │
│ └─────┘ └─────┘     │
│                     │
│ ── Merker           │
│ ○ ○ ○ ○  →          │
│                     │
│ ── Guider           │
│ ┌─────────────────┐ │
│ │ guide card      │ │
│ └─────────────────┘ │
│                     │
│ ── Sammenlign CTA   │
│                     │
│ ── Nyhetsbrev       │
│                     │
│ Footer              │
└─────────────────────┘
```

#### Wireframe — desktop

```
┌──────────────────────────────────────────────────────────┐
│ EVFAKTA   Modeller Merker Sammenlign Guider   🔍  Konto │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Finn riktig elbil                    ┌──────────────┐  │
│   med rolige, kildebaserte fakta       │              │  │
│                                        │  full-bleed  │  │
│   ┌──────────────────────────────┐     │  EV photo    │  │
│   │ Søk modell, merke, behov…    │     │              │  │
│   └──────────────────────────────┘     └──────────────┘  │
│   [Se modeller]  [Sammenlign]                            │
│                                                          │
│  Populære modeller                         Se alle →     │
│  ┌──────┐ ┌──────┐ ┌──────┐                              │
│  │      │ │      │ │      │                              │
│  └──────┘ └──────┘ └──────┘                              │
│                                                          │
│  Populære merker                                         │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                                │
│                                                          │
│  Siste guider / anmeldelser        |  Sammenlign strip   │
│                                                          │
│  Nyhetsbrev (single field)                               │
│  Footer                                                  │
└──────────────────────────────────────────────────────────┘
```

**Section rules**

1. **Hero** — brand + one headline + one sentence + search + one CTA group. No stat strip clutter in first viewport if it competes with search.  
2. **Popular models** — 3–6 cards from CMS.  
3. **Brands** — logo row / wrap.  
4. **Guides & reviews** — editorial, not inventory.  
5. **Compare CTA** — single purpose band.  
6. **News** — optional; collapse if empty.  
7. **Newsletter** — one email + consent line.  
8. **Footer** — compact legal + primary IA.

**Interaction ideas**

- Search focuses on load (desktop only, not mobile).  
- Model card favorite requires auth → soft modal, not hard redirect shock.  
- Horizontal snap carousel on mobile for popular models.

---

### 4.2 Search / catalog (`/modeller`)

**Job:** Filter the universe down to a shortlist.

```
Desktop
┌──────────────┬─────────────────────────────────┐
│ Filtre       │ Resultater (42)   Sortering ▾   │
│ Merke        │ ┌────┐ ┌────┐ ┌────┐            │
│ Rekkevidde   │ │    │ │    │ │    │            │
│ Lading       │ └────┘ └────┘ └────┘            │
│ Karosseri    │ …                               │
│ Drivlinje    │                                 │
└──────────────┴─────────────────────────────────┘

Mobile
[Filtre (3)]  [Sorter]     then full-width card stack
```

**UX notes**

- URL-synced filters (shareable).  
- Zero results: suggest clearing one facet + popular models.  
- Hide price/score facets while public policy hides those fields.

---

### 4.3 Brand page (`/merker/[slug]`)

**Job:** Orient around a marque, then dive into models.

```
┌────────────────────────────────────────┐
│ ← Merker                               │
│ [Logo]  Volkswagen                     │
│ Kort merketekst · Kilde / nettside     │
│                                        │
│ Modeller (n)                           │
│ card grid                              │
└────────────────────────────────────────┘
```

No fake brand “scores.” Keep editorial short.

---

### 4.4 Model page (`/modeller/[slug]`)

**Job:** Support a confident buy/shortlist decision.

#### Information architecture (order)

1. Breadcrumb  
2. Hero media + identity + primary facts  
3. Variant selector  
4. Key stats (range, charge, battery, consumption)  
5. Pros / cons / suitable for  
6. Winter performance (if data exists; else omit section)  
7. Full specifications  
8. Gallery  
9. FAQ (model-specific when available)  
10. Sources & last checked  
11. Related models  
12. Sticky mobile CTA bar: Sammenlign · Favoritt

#### Wireframe — desktop

```
┌─────────────────────────────────────────────────────────┐
│ Hjem / Modeller / Volkswagen ID.4                       │
│                                                         │
│ Volkswagen                                              │
│ ID.4                              [♡] [Sammenlign]      │
│ Variant ▾ Pro 4MOTION                                   │
│                                                         │
│ ┌───────────────────────┐  ┌ Rekkevidde 533 km WLTP ┐   │
│ │                       │  │ Hurtiglading 185 kW    │   │
│ │     Gallery / Hero    │  │ Batteri xx kWh         │   │
│ │                       │  │ Forbruk xx kWh/100     │   │
│ └───────────────────────┘  └────────────────────────┘   │
│                                                         │
│ Fordeler          Ulemper         Passer for            │
│ · · ·             · · ·           · · ·                 │
│                                                         │
│ Vinter (optional panel)                                 │
│                                                         │
│ Spesifikasjoner (dl grid, 2 cols)                       │
│                                                         │
│ Galleri                                                 │
│ FAQ                                                     │
│ Kilder · Sist sjekket                                   │
│ Lignende modeller                                       │
└─────────────────────────────────────────────────────────┘
```

**Premium details**

- Variant change updates URL (`?variant=`) without full page jolt.  
- Missing fields omitted (never “0 km”).  
- Draft editorial markers must never appear publicly.  
- Price/score blocks appear only when policy allows.

---

### 4.5 Compare (`/sammenlign`)

**Job:** Side-by-side decision for 2–3 cars (v2 can plan for 4 later; ship 3 first for clarity).

```
┌────────────────────────────────────────────┐
│ Sammenlign elbiler                         │
│ [+ Legg til bil]  chip chip chip           │
│                                            │
│          │ Model A │ Model B │ Model C     │
│ Photo    │         │         │             │
│ Rekkevidde │ 533 ✓ │ 514     │ 460         │
│ Lading     │ …     │ … ✓     │ …           │
│ …          │       │         │             │
└────────────────────────────────────────────┘
```

**Interactions**

- Add via search modal.  
- Swap variant per column.  
- Share URL with selections.  
- “Clear all” + empty state with 3 popular picks.  
- Highlight best numeric values with label, not color alone.

---

### 4.6 Articles & buying guides

**Job:** Teach without feeling like SEO sludge.

- Article layout: 720px measure, large title, byline, updated date, hero optional.  
- Guide hub: filter by stage (første elbil · familie · brukt · langtur · vinter).  
- Inline “related models” cards mid-article (max 2).  
- TOC sticky on desktop for long guides.

```
Guider hub
┌──────────────┐
│ Kategori chips│
│ ┌────┐ ┌────┐ │
│ │    │ │    │ │
│ └────┘ └────┘ │
└──────────────┘
```

---

### 4.7 Calculator

**Job:** Translate kWh into personal kroner — eventually. Design the UX now even if engine ships later.

```
┌─────────────────────────────┐
│ Ladekostnad                 │
│ Årlig km        [____]      │
│ Hjemmepris kr/kWh [____]    │
│ Andel hjemme %  [====·]     │
│ Modell (valgfri) ▾          │
│                             │
│ Resultat                    │
│ kr / år                     │
│ kr / 100 km                 │
│ Antakelser (expand)         │
└─────────────────────────────┘
```

Show assumptions openly. Never imply official EVFAKTA “test” without data.

---

### 4.8 User account (`/min-side`)

**Job:** Favorites and light preference — not a social network.

```
┌─────────────────────┐
│ Min side            │
│ E-post              │
│                     │
│ Favoritter          │
│ card grid / empty   │
│                     │
│ [Logg ut]           │
└─────────────────────┘
```

Auth pages (login/register/reset): centered card, calm, no marketing carousel.

---

### 4.9 Footer

Columns: Utforsk · Guider · Konto · Om / Kontakt  
Contact email prominent.  
One-line disclaimer: specs vary by trim; estimates are estimates.  
No fake app-store badges until real.

---

## 5. Interaction ideas (cross-cutting)

| Idea | Value |
|------|-------|
| **Command search** (`/` or ⌘K) | Power users jump to model/brand/guide |
| **Shortlist tray** | Up to 3 cars parked for compare from any card |
| **“Explain this number”** | Tooltip on WLTP / DC kW / usable kWh |
| **Source popover** | Tap source chip → URL + checked date |
| **Progressive gallery** | Hero first; more images on demand |
| **Smart empty** | Filters too tight → suggest nearest matches |
| **Quiet analytics** | Track shortlist→compare conversion, not vanity |

---

## 6. Mobile vs desktop summary

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Nav | Drawer | Inline links |
| Catalog filters | Bottom sheet | Rail or top chips |
| Model CTA | Sticky bottom bar | Inline header actions |
| Compare | Horizontal scroll table | Full table |
| Hero | Stacked search then image | Split or full-bleed photo behind calm type |
| Cards | 1 col | 3 col |

---

## 7. Content & trust rules (UX constraints)

These are product rules that design must respect:

1. Never invent specs in UI copy.  
2. Never show draft markers (`Draft – Requires editor review.`).  
3. Don’t advertise unfinished tools (map, testdata lab, app) until live.  
4. Model counts always reflect real published inventory.  
5. Prices and EVFAKTA Scores follow public display policy flags.  
6. Norwegian-first labels; units always shown (`km`, `kW`, `kWh`).

---

## 8. Accessibility checklist (delivery)

- [ ] Color contrast audited on brand-soft surfaces  
- [ ] Focus order matches visual order  
- [ ] Compare usable with keyboard only  
- [ ] Screen reader names for favorite/compare icon buttons  
- [ ] Form errors linked via `aria-describedby`  
- [ ] Reduced motion verified  
- [ ] Zoom 200% no loss of critical actions  

---

## 9. Design QA scenarios

1. First-time buyer lands on homepage → searches “familie SUV” → opens model → adds two to compare.  
2. Used-buyer filters by range + brand → opens model → checks sources date.  
3. Enthusiast opens compare share URL on phone → switches variant → sees table scroll affordance.  
4. Guide reader finishes winter guide → clicks related models → favorites one → logs in and returns.

---

## 10. Out of scope (explicit)

- Admin CMS redesign  
- Dark mode public theme (future optional)  
- Marketplace checkout / dealer inventory  
- Live clone of current www.evfakta.no dark UI  
- Implementation in this pass  

---

## 11. Suggested next steps (after approval)

1. High-fidelity mockups for Homepage + Model + Compare (Figma).  
2. Component inventory mapped to rebuild code modules.  
3. Content model for Guides/Articles.  
4. Phased implementation: foundations → chrome → homepage → model → compare → guides → calculator.

---

## 12. One-line north star

**EVFAKTA Design System 2.0: Scandinavian calm, photographic honesty, and data you can trust — so choosing an EV in Norway feels simple.**
