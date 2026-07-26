# EVFAKTA Master Catalog Plan

**Date:** 2026-07-25  
**Purpose:** Structured catalog production for EVFAKTA.no without inventing vehicle data  
**Constraint:** Prices, specs and claims must come from verified Norwegian sources  
**Machine source of truth:** `lib/admin/master-catalog.ts`  
**First import batch (not applied):** `data/catalog-batch-01-tesla.json`

---

## Principles

1. **No invented data** — unknown fields stay `null` / empty until verified.
2. **Import ≠ publish** — all batch rows use `is_published: false` and `import_status: needs_review`.
3. **Model + variants** — one public model page; trims live in `car_variants`.
4. **Sources required before publish** — `source_name` / `source_url` + checked date.
5. **Images required before publish** — primary image (and preferably gallery).
6. **Human review** — approve and publish are separate admin actions.

---

## Production workflow

```
Plan (this doc)
  → Shell import (identity + empty variants)
  → Fill specs from official NO sources
  → Attach images
  → Review / approve
  → Publish
```

| Stage | Catalog status | Review status |
|-------|----------------|---------------|
| Listed only | `planned` | `not_started` |
| Shell in DB / batch file | `shell` | `needs_review` |
| Partial specs | `partial` | `needs_review` |
| Complete + sourced | `ready` | `approved` |
| Live on site | `published` | `published` |

### Missing-data checklist (every model)

- [ ] `price_nok`
- [ ] `range_km` / `winter_range_km`
- [ ] `battery_total_kwh` / `battery_usable_kwh`
- [ ] `dc_charging_kw` / `charge_time_10_80_minutes`
- [ ] `drivetrain` / `power_hp`
- [ ] dimensions / weights
- [ ] official Norwegian source
- [ ] primary image + gallery
- [ ] variant specs (if multi-trim)

### Asset / source status labels

| Label | Meaning |
|-------|---------|
| `missing` | Not present |
| `placeholder` | Path/URL stub only |
| `present` | File or URL exists, not verified |
| `verified` | Checked against source |

---

## First 50 models (Norway priority)

Grouped by brand. **Suggested slug** is the public `/modeller/{slug}` key.

### Tesla (4) — batch 01

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Model 3 | `tesla-model-3` | Rear-Wheel Drive; Long Range AWD; Performance | shell | missing | missing | not_started |
| Model Y | `tesla-model-y` | Long Range RWD; Long Range AWD; Performance | shell | missing | missing | not_started |
| Model S | `tesla-model-s` | Model S; Plaid | shell | missing | missing | not_started |
| Model X | `tesla-model-x` | Model X; Plaid | shell | missing | missing | not_started |

**Batch file:** `data/catalog-batch-01-tesla.json`  
**Notes:** Empty structured shells only. Fill from Tesla Norge / OFV before approval.

### Volkswagen (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| ID.3 | `volkswagen-id-3` | Pro; Pro S; GTX | planned | missing | missing | not_started |
| ID.4 | `volkswagen-id-4` | Pro; Pro 4MOTION; GTX | planned | missing | missing | not_started |
| ID.7 | `volkswagen-id-7` | Pro; Pro S; GTX | planned | missing | missing | not_started |

### Volvo (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| EX30 | `volvo-ex30` | Single Motor; Twin Motor Performance | planned | missing | missing | not_started |
| EX40 | `volvo-ex40` | Single Motor; Twin Motor | planned | missing | missing | not_started |
| EX90 | `volvo-ex90` | Twin Motor; Performance | planned | missing | missing | not_started |

### BMW (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| i4 | `bmw-i4` | eDrive40; xDrive40; M50 | planned | missing | missing | not_started |
| iX1 | `bmw-ix1` | eDrive20; xDrive30 | planned | missing | missing | not_started |
| iX | `bmw-ix` | xDrive40; xDrive50; M60 | planned | missing | missing | not_started |

### Audi (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Q4 e-tron | `audi-q4-e-tron` | 45; 55 quattro | planned | missing | missing | not_started |
| Q6 e-tron | `audi-q6-e-tron` | performance; SQ6 | planned | missing | missing | not_started |

### Kia (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| EV3 | `kia-ev3` | Standard Range; Long Range; GT-Line | planned | missing | missing | not_started |
| EV6 | `kia-ev6` | RWD; AWD; GT | planned | missing | missing | not_started |
| EV9 | `kia-ev9` | RWD; AWD; GT-Line | planned | missing | missing | not_started |

### Hyundai (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Ioniq 5 | `hyundai-ioniq-5` | RWD; AWD; N | planned | missing | missing | not_started |
| Ioniq 6 | `hyundai-ioniq-6` | RWD; AWD | planned | missing | missing | not_started |
| Kona Electric | `hyundai-kona-electric` | Standard Range; Long Range | planned | missing | missing | not_started |

### Polestar (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| 2 | `polestar-2` | Long Range Single Motor; Long Range Dual Motor | planned | missing | missing | not_started |
| 3 | `polestar-3` | Long Range Dual Motor; Performance | planned | missing | missing | not_started |
| 4 | `polestar-4` | Long Range Single Motor; Long Range Dual Motor | planned | missing | missing | not_started |

### BYD (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Seal | `byd-seal` | Design; Excellence | planned | missing | missing | not_started |
| Atto 3 | `byd-atto-3` | Comfort; Design | planned | missing | missing | not_started |
| Sealion 7 | `byd-sealion-7` | Comfort; Design; Excellence | planned | missing | missing | not_started |

### Toyota (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| bZ4X | `toyota-bz4x` | FWD; AWD | planned | missing | missing | not_started |
| C-HR+ | `toyota-c-hr-plus` | FWD; AWD | planned | missing | missing | not_started |

### Ford (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Explorer EV | `ford-explorer-ev` | Extended Range RWD; Extended Range AWD | planned | missing | missing | not_started |
| Mustang Mach-E | `ford-mustang-mach-e` | Standard Range; Extended Range; GT | planned | missing | missing | not_started |

### Mercedes-Benz (3)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| EQA | `mercedes-benz-eqa` | 250+; 350 4MATIC | planned | missing | missing | not_started |
| EQB | `mercedes-benz-eqb` | 250+; 350 4MATIC | planned | missing | missing | not_started |
| EQE | `mercedes-benz-eqe` | 350+; 500 4MATIC | planned | missing | missing | not_started |

### Nissan (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Leaf | `nissan-leaf` | Base; e+ | planned | missing | missing | not_started |
| Ariya | `nissan-ariya` | Engage; Evolve+; e-4ORCE | planned | missing | missing | not_started |

### MG (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| MG4 | `mg-mg4` | Standard; Luxury; XPower | planned | missing | missing | not_started |
| ZS EV | `mg-zs-ev` | Standard; Long Range | planned | missing | missing | not_started |

### Renault (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Megane E-Tech | `renault-megane-e-tech` | Equilibre; Techno; Iconic | planned | missing | missing | not_started |
| 5 E-Tech | `renault-5-e-tech` | Evolution; Techno; Iconic | planned | missing | missing | not_started |

### Xpeng (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| G6 | `xpeng-g6` | RWD Standard; RWD Long Range; AWD Performance | planned | missing | missing | not_started |
| G9 | `xpeng-g9` | RWD Long Range; AWD Performance | planned | missing | missing | not_started |

### Zeekr (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| 001 | `zeekr-001` | Long Range RWD; Performance AWD | planned | missing | missing | not_started |
| 7X | `zeekr-7x` | Long Range RWD; Performance AWD | planned | missing | missing | not_started |

### Skoda (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Enyaq | `skoda-enyaq` | 60; 85; 85x; vRS | planned | missing | missing | not_started |
| Elroq | `skoda-elroq` | 50; 60; 85 | planned | missing | missing | not_started |

### Cupra (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| Born | `cupra-born` | V1; V2; VZ | planned | missing | missing | not_started |
| Tavascan | `cupra-tavascan` | Endurance; VZ | planned | missing | missing | not_started |

### Peugeot (2)

| Model | Slug | Expected variants | Catalog | Images | Source | Review |
|-------|------|-------------------|---------|--------|--------|--------|
| e-208 | `peugeot-e-208` | Active; Allure; GT | planned | missing | missing | not_started |
| E-3008 | `peugeot-e-3008` | Allure; GT | planned | missing | missing | not_started |

**Total: 50 models** across 20 brands.

---

## Import batches

| Batch | File | Models | Status |
|-------|------|--------|--------|
| 01 Tesla | `data/catalog-batch-01-tesla.json` | Model 3 / Y / S / X | Ready to preview — **not applied** |
| 02 VW/Skoda/Cupra | TBD | ID.3, ID.4, ID.7, Enyaq, Elroq, Born, Tavascan | Planned |
| 03 Korean | TBD | Kia + Hyundai | Planned |
| 04 Premium EU | TBD | BMW, Audi, Mercedes, Volvo, Polestar | Planned |
| 05 Others | TBD | BYD, Toyota, Ford, Nissan, MG, Renault, Xpeng, Zeekr, Peugeot | Planned |

---

## Admin progress

`/admin/import` shows master-catalog progress against the live DB:

- Planned models (50)
- Imported models (slugs from this list present in `cars`)
- Needs review / approved / published (subset of imported)
- Missing images / missing sources (among imported master models)

---

## Next manual step

1. Apply pending Supabase migrations (including `car_variants`) if not already applied.
2. Ensure Tesla brand exists under `/admin/merker`.
3. Open **Admin → Import → Ny import**, upload `data/catalog-batch-01-tesla.json`, preview, then apply.
4. Fill specs and sources from Tesla Norge (and OFV where relevant) — do not invent numbers.
5. Attach images, approve, then publish deliberately.

---

## Related docs

- `docs/EV_DATA_MODEL.md` — field model
- `docs/CATALOG_MANAGEMENT_SYSTEM.md` — import engine
- `supabase/migrations/20260725220000_create_car_variants.sql` — variants table
