# EVFAKTA EV Master Data Model

**Date:** 2026-07-25  
**Purpose:** Final recommended EV data model before large-scale catalog import  
**Status:** Recommendation + first additive migration implemented  
**Constraint:** Do not remove existing functionality; evolve via additive migrations  
**Implemented migration:** `supabase/migrations/20260725210000_cars_ev_master_fields.sql`

---

## Executive summary

`public.cars` is currently a **wide operational table**: identity, specs, pricing, review workflow, provenance, and EVFAKTA scores all live on one row. That is acceptable for the first hundreds of models, but a **master EV database** should normalize editorial scores, sources, and reviews into satellite tables while keeping a lean, query-friendly `cars` core for catalog listing and comparison.

**Recommended direction**

| Keep on `cars` (core) | Move later (satellites) |
|----------------------|-------------------------|
| Identity, taxonomy, key specs, price, publish flags | Scores → `car_scores` |
| Primary image URL (cache) | Field/source provenance → `car_sources` |
| Brand FK + denormalized brand name | Long-form reviews → `car_reviews` |
| Workflow (`import_status`, `is_published`) | Multi-image already → `car_images` |
| Country / market | Import jobs stay as ops tables |

No schema changes are applied by this report.

---

## 1. Every field currently available

### 1.1 `public.cars` (as of migrations through `20260725200000`)

#### Identity & taxonomy

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `slug` | `text` unique | Public URL key |
| `brand` | `text` not null | Denormalized display name |
| `brand_id` | `uuid` FK → `brands` nullable | Preferred brand link |
| `model` | `text` not null | |
| `year` | `integer` | Model year / årsmodell |
| `vehicle_type` | `text` | e.g. Personbil, SUV |
| `body_style` | `text` | e.g. Sedan, Hatchback |
| `country` | `text` default `'NO'` | Market / filter |

#### Pricing & headline specs

| Column | Type | Notes |
|--------|------|--------|
| `price_nok` | `integer` | List / from-price NOK |
| `range_km` | `integer` | Treated as WLTP range today |
| `battery_kwh` | `numeric` | Usable/nominal not distinguished |
| `dc_charging_kw` | `integer` | Peak DC |
| `ac_charging_kw` | `numeric` | AC onboard |
| `drivetrain` | `text` | FWD / RWD / AWD (Norwegian labels) |
| `consumption_kwh_100km` | `numeric` | Combined WLTP-style |
| `power_hp` | `integer` | |
| `torque_nm` | `integer` | |
| `acceleration_0_100` | `numeric` | Seconds |
| `top_speed_kmh` | `integer` | |
| `seats` | `integer` | |
| `cargo_l` | `integer` | Litres |
| `towing_kg` | `integer` | |
| `warranty` | `text` | Free-text warranty string |

#### Content & media (on-row)

| Column | Type | Notes |
|--------|------|--------|
| `description` | `text` | Short editorial blurb |
| `image_url` | `text` | Primary / legacy image (also synced from gallery) |

#### Publish & review workflow

| Column | Type | Notes |
|--------|------|--------|
| `is_published` | `boolean` default false | Public visibility |
| `import_status` | `text` | `draft` \| `needs_review` \| `approved` |
| `import_notes` | `text` | Internal notes |

#### Source / provenance (on-row)

| Column | Type | Notes |
|--------|------|--------|
| `source_name` | `text` | Primary source label |
| `source_url` | `text` | Primary source URL |
| `source_updated_at` | `timestamptz` | Source-side update time |
| `data_last_checked_at` | `timestamptz` | Last human/system check |
| `field_sources` | `jsonb` default `{}` | Per-field provenance map |
| `imported_at` | `timestamptz` | Last import touch |
| `last_import_job_id` | `uuid` FK → `import_jobs` | |

#### EVFAKTA scores (on-row today)

| Column | Type | Notes |
|--------|------|--------|
| `range_score` | `numeric` 0–10 | Manual only |
| `charging_score` | `numeric` 0–10 | Manual only |
| `winter_score` | `numeric` 0–10 | Manual only |
| `comfort_score` | `numeric` 0–10 | Manual only |
| `space_score` | `numeric` 0–10 | Manual only |
| `value_score` | `numeric` 0–10 | Manual only |
| `reliability_score` | `numeric` 0–10 | Manual only |
| `overall_score` | `numeric` 0–10 | Manual; not auto-derived |
| `score_notes` | `text` | |
| `score_methodology` | `text` | Public methodology blurb |

#### Timestamps

| Column | Type |
|--------|------|
| `created_at` | `timestamptz` |
| `updated_at` | `timestamptz` (trigger) |

**Approx. field count on `cars` today: ~50 columns.**

---

### 1.2 Related tables already in production shape

#### `public.brands`

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `name` | `text` unique |
| `slug` | `text` unique |
| `logo_url` | `text` |
| `country` | `text` |
| `website_url` | `text` |
| `description` | `text` |
| `is_active` | `boolean` |
| `created_at` / `updated_at` | `timestamptz` |

#### `public.car_images`

| Column | Type |
|--------|------|
| `id` | `uuid` PK |
| `car_id` | `uuid` FK → `cars` |
| `image_url` | `text` |
| `storage_path` | `text` |
| `image_type` | `front\|rear\|side\|interior\|cargo\|detail\|other` |
| `alt_text` | `text` |
| `sort_order` | `integer` |
| `is_primary` | `boolean` (one primary per car) |
| `created_at` | `timestamptz` |

#### Ops / import (keep as ops, not product catalog)

| Table | Role |
|-------|------|
| `import_jobs` | Import run history |
| `import_job_items` | Per-row import results |
| `favorites` | User favorites by car slug |

Storage buckets: `car-images`, `brand-logos`.

---

## 2. Important EV fields still missing

Prioritized for a **Norwegian EV master catalog**. These are not present as first-class columns today.

### 2.1 High priority (needed before large import)

| Missing field / concept | Why it matters |
|-------------------------|----------------|
| **Trim / variant name** (`variant`, `trim`) | One “model” often has multiple trims (RWD / Long Range / Performance) |
| **Battery usable vs total** (`battery_usable_kwh`, `battery_total_kwh`) | Avoid ambiguous `battery_kwh` |
| **WLTP range (explicit)** + cycle notes | Clarify vs estimated/real-world |
| **Real-world / winter range** (`range_winter_km`, `range_real_km`) | Core EVFAKTA differentiator |
| **Charge curve / DC @ 10–80%** (`dc_10_80_min`, `dc_avg_kw`) | Peak kW alone is misleading |
| **Connector type** (`ccs2`, `nacs`, adapter notes) | Market-critical in NO/EU |
| **Onboard charger phases** (`ac_phases`, `ac_max_a`) | Home charging realism |
| **Heat pump** (`has_heat_pump` boolean) | Winter efficiency |
| **V2L / bidirectional** (`v2l`, `v2h`, `v2g`) | Growing buyer filter |
| **Dimensions** (L/W/H mm, wheelbase) | Compare + parking / garage |
| **Curb / max weight, payload** | Practical Norway use |
| **Frunk volume** | EV-specific space metric |
| **Ground clearance** | Norway roads / winter |
| **Price includes** (delivery, fees) / **price valid from** | Pricing trust |
| **Market status** (`available`, `coming`, `discontinued`) | Catalog hygiene |
| **VIN / type-approval refs** (optional) | Traceability for serious DB |

### 2.2 Medium priority (enrichment)

| Missing field / concept | Why |
|-------------------------|-----|
| Motor count / layout (1/2/3 motors) | Beyond drivetrain label |
| Power in kW (alongside hk) | Industry-standard unit |
| Suspension / air suspension | Comfort score inputs |
| Drive modes / regen levels | Editorial + filters |
| Software / OTA notes | Editorial |
| Infotainment / Apple CarPlay / Android Auto | Buyer filters |
| ADAS package name / level | Safety narrative |
| Tire size / aero wheels option | Efficiency footnotes |
| Warranty split (vehicle / battery / years / km) | Structured vs free text |
| Service interval / cost notes | Ownership TCO later |
| Insurance group (NO) | Later TCO |
| CO₂ manufacturing / lifecycle notes | Editorial, not inventing specs |

### 2.3 Intentionally out of scope for v1 master import

- Live stock / dealer inventory  
- User-generated telemetry  
- Scraped unofficial 0–100 claims without source  
- Auto-generated EVFAKTA scores  

---

## 3. Which fields should stay in `public.cars`

Keep a **wide-but-stable core** optimized for list/filter/compare and public detail “above the fold”.

### Stay on `cars` (recommended core)

**Identity**

- `id`, `slug`, `brand_id`, `brand` (denormalized until brand_id is mandatory), `model`
- Future: `variant` / `trim`, `model_year` (or keep `year`), `market_status`

**Taxonomy / filters**

- `vehicle_type`, `body_style`, `drivetrain`, `country` (market)
- Future: `seats`, connector enums, `has_heat_pump`, `market_status`

**Headline numbers (catalog + compare)**

- `price_nok` (+ later `price_valid_from`)
- Range: keep one primary `range_wltp_km` (migrate from `range_km`) and optional `range_winter_km`
- Battery: prefer `battery_usable_kwh` (migrate meaning of `battery_kwh` carefully)
- `dc_charging_kw`, `ac_charging_kw`, `consumption_kwh_100km`
- `power_hp` (and later `power_kw`), `torque_nm`, `acceleration_0_100`, `top_speed_kmh`
- `cargo_l`, `towing_kg`

**Content / UX cache**

- `description` (short)
- `image_url` (primary cache; source of truth remains `car_images`)

**Workflow (product ops, high-frequency)**

- `is_published`, `import_status`, `import_notes`
- `data_last_checked_at`
- Lightweight primary source pointers: `source_name`, `source_url` (until `car_sources` is primary)

**Timestamps**

- `created_at`, `updated_at`
- `imported_at`, `last_import_job_id` (ops; OK on cars)

### Do **not** grow forever on `cars`

Avoid adding unbounded JSON blobs for reviews, full charge curves, or multi-source history beyond a transitional `field_sources`.

---

## 4. Which fields should move to separate tables (future)

| Current on `cars` | Move to | Reason |
|-------------------|---------|--------|
| `range_score` … `overall_score`, `score_notes`, `score_methodology` | **`car_scores`** | Editorial domain; versionable; keeps cars lean |
| `source_*` detail + `field_sources` history | **`car_sources`** | Multiple sources per car/field over time |
| Long-form editorial text (not yet stored) | **`car_reviews`** | Articles / verdicts / pros-cons |
| Gallery (already) | **`car_images`** | Already correct |
| Brand metadata (already) | **`brands`** | Already correct |
| Import run logs (already) | **`import_jobs` / `import_job_items`** | Ops, not product |

**Transitional strategy (when migrations happen later)**

1. Create satellite tables.  
2. Backfill from `cars` columns.  
3. Dual-read in app (cars columns OR satellites).  
4. Stop writing denormalized score/source columns.  
5. Drop duplicated columns only after all readers migrate — **not now**.

---

## 5. Recommended normalized schema

> Illustrative DDL for a future migration series. **Do not apply yet.**

### 5.1 `public.brands` (keep + small extensions)

```sql
-- Existing columns remain.
-- Recommended additive fields (future):
--   parent_company text,
--   logo_storage_path text,
--   sort_order integer default 0
```

**Role:** Canonical manufacturer / make.  
`cars.brand_id` should become required over time; `cars.brand` kept as denormalized cache for fast lists.

---

### 5.2 `public.cars` (lean core)

```sql
-- Conceptual target shape (evolution of current table, not a drop/recreate):
--
-- identity
--   id, slug, brand_id, brand, model, variant, year, country, market_status
-- taxonomy
--   vehicle_type, body_style, drivetrain, seats
-- pricing
--   price_nok, price_valid_from, currency default 'NOK'
-- energy & performance (headline)
--   battery_usable_kwh, battery_total_kwh
--   range_wltp_km, range_winter_km, consumption_kwh_100km
--   dc_charging_kw, dc_10_80_min, ac_charging_kw, connector_types text[]
--   power_hp, power_kw, torque_nm, acceleration_0_100, top_speed_kmh
-- practical
--   cargo_l, frunk_l, towing_kg, length_mm, width_mm, height_mm, ground_clearance_mm
--   has_heat_pump boolean, v2l boolean
-- content cache
--   description, image_url
-- workflow
--   is_published, import_status, import_notes
--   data_last_checked_at, imported_at, last_import_job_id
--   source_name, source_url  -- denormalized “primary” until car_sources is sole owner
-- timestamps
--   created_at, updated_at
```

**Naming migration note:** Prefer additive columns (`range_wltp_km`) and backfill from `range_km` rather than renaming in place during import season.

---

### 5.3 `public.car_images` (keep)

Current design is already correct for a master DB:

- Multiple images per car  
- Typed shots + primary flag  
- Storage path + public URL  

**Future additive fields (optional):** `width`, `height`, `checksum`, `source_url`, `license`.

---

### 5.4 `public.car_scores` (new — future)

One active scorecard per car (or versioned rows).

```sql
create table public.car_scores (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  range_score numeric check (range_score is null or (range_score between 0 and 10)),
  charging_score numeric check (charging_score is null or (charging_score between 0 and 10)),
  winter_score numeric check (winter_score is null or (winter_score between 0 and 10)),
  comfort_score numeric check (comfort_score is null or (comfort_score between 0 and 10)),
  space_score numeric check (space_score is null or (space_score between 0 and 10)),
  value_score numeric check (value_score is null or (value_score between 0 and 10)),
  reliability_score numeric check (reliability_score is null or (reliability_score between 0 and 10)),
  overall_score numeric check (overall_score is null or (overall_score between 0 and 10)),
  score_notes text,
  score_methodology text,
  is_current boolean not null default true,
  scored_at timestamptz,
  scored_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce one current scorecard per car (partial unique index).
-- create unique index car_scores_one_current on public.car_scores (car_id) where is_current;
```

**Rules (unchanged product policy):** scores are **manual only** — never auto-generated from specs.

Optional later denormalization: cache `overall_score` on `cars` for sort performance.

---

### 5.5 `public.car_sources` (new — future)

Replace / supersede opaque `field_sources` jsonb for queryable provenance.

```sql
create table public.car_sources (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  field_name text,              -- null = whole-car primary source
  source_name text,
  source_url text,
  source_type text,             -- manufacturer | importer | ofv | manual | other
  source_updated_at timestamptz,
  checked_at timestamptz,
  import_job_id uuid references public.import_jobs (id) on delete set null,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index car_sources_car_id_idx on public.car_sources (car_id);
create index car_sources_field_name_idx on public.car_sources (car_id, field_name);
```

**Migration path:** keep `cars.source_name` / `source_url` / `field_sources` until admin + publish gates read from `car_sources`.

---

### 5.6 `public.car_reviews` (new — future)

Editorial long-form (not the same as `import_status` review workflow).

```sql
create table public.car_reviews (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  title text not null,
  slug text,                    -- optional per-car or global unique
  summary text,                 -- short verdict
  body_md text,                 -- long-form markdown
  pros text[],                  -- or jsonb
  cons text[],
  author_name text,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index car_reviews_car_id_idx on public.car_reviews (car_id);
```

**Do not confuse with:** `cars.import_status = needs_review` (catalog QA workflow).

---

### 5.7 Entity relationship (target)

```text
brands 1──* cars
cars   1──* car_images
cars   1──0..1 car_scores (is_current)
cars   1──* car_sources
cars   1──* car_reviews
cars   *──1 import_jobs (last_import_job_id, optional)
import_jobs 1──* import_job_items
```

---

## 6. Mapping: current → future

| Current | Future home | Action later |
|---------|-------------|--------------|
| Score columns on `cars` | `car_scores` | Backfill + dual-write → drop from cars |
| `source_*`, `field_sources` | `car_sources` | Backfill rows; keep primary cache on cars |
| `description` only | `cars` + optional `car_reviews` | Keep short desc on cars |
| `image_url` + `car_images` | unchanged | Keep cache column |
| `brand` + `brand_id` | unchanged | Tighten FK over time |
| `range_km` | `cars.range_wltp_km` | Additive rename strategy |
| `battery_kwh` | `cars.battery_usable_kwh` | Clarify semantics in docs + admin UI |
| `warranty` text | `cars` short-term; structured warranty table long-term | Optional |

---

## 7. Import readiness recommendations (no schema change yet)

Until satellite tables exist:

1. **Continue importing into `public.cars`** as today (CSV/JSON admin import).  
2. Treat each **trim/variant as its own slug/row** (e.g. `tesla-model-y-long-range-rwd`).  
3. Put ambiguous battery/range semantics in `import_notes` + sources.  
4. Do **not** invent missing specs; leave null.  
5. Keep scores empty unless editorially set.  
6. Prefer `brand_id` resolution by brand name during import (already supported).  
7. Use `country='NO'` unless another market is intentional.

When ready for master-scale:

1. Add high-priority missing **core columns** on `cars` (variant, battery usable/total, winter range, connectors, heat pump).  
2. Then extract `car_scores` and `car_sources`.  
3. Add `car_reviews` when editorial content ships.

---

## 8. What this report does **not** do

- Does **not** alter Supabase / run migrations  
- Does **not** remove or rename production columns  
- Does **not** change admin UI, import engine, or public pages  
- Does **not** invent vehicle data  

---

## 9. Sources for this audit

| Artifact | Path |
|----------|------|
| Base cars | `supabase/migrations/20260724210000_create_cars.sql` |
| EV extensions | `supabase/migrations/20260725120000_extend_cars_ev_fields.sql` |
| Review/source fields | `supabase/migrations/20260725140000_cars_import_review_fields.sql` |
| Brands | `supabase/migrations/20260725170000_create_brands.sql` |
| Images | `supabase/migrations/20260725160000_create_car_images.sql` |
| Scores | `supabase/migrations/20260725180000_cars_evfakta_scores.sql` |
| Import/provenance | `supabase/migrations/20260725200000_catalog_import_system.sql` |
| App types | `lib/admin/types.ts`, `data/cars.ts` |

---

## 10. Bottom line

| Question | Answer |
|----------|--------|
| Is `cars` usable for large import **now**? | **Yes**, for core catalog + review workflow |
| Is it the final master shape? | **No** — too wide; scores/sources/reviews should satellite |
| Biggest gaps before “complete EV DB”? | Variant/trim, battery usable/total, winter range, charge realism, connectors, heat pump, dimensions |
| What to do next (later migration)? | Additive core columns → then `car_scores` / `car_sources` / `car_reviews` |

**No database changes were made for this recommendation.**
