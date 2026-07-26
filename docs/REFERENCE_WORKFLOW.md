# EVFAKTA Reference Workflow

**Status:** Production workflow reference  
**Audience:** Editors and researchers  
**Scope:** How to research, verify, draft, and prepare a car for review — without publishing  
**Related docs:** `docs/CAR_BLUEPRINT.md` (editorial/technical page standard), `docs/RESEARCH_PIPELINE.md`, `docs/EVFAKTA_MASTER_CATALOG.md`

---

## Purpose

This document defines the **validated content workflow** for producing EVFAKTA car records.

It is **not** a permanent content template for page copy or specs.

| Document | Owns |
|----------|------|
| `docs/CAR_BLUEPRINT.md` | What every car page must contain (sections, fields, origins) |
| `docs/REFERENCE_WORKFLOW.md` | How editors move a car from research → review → ready for approval |

**First validated example:** Tesla Model 3 (`tesla-model-3`).  
Use it to learn the process. Do **not** copy Model 3 prose or numbers onto other cars.

---

## Hard rules

1. Never invent specs. Prefer empty over guessed.
2. Prefer manufacturer Norway pages + official manuals / CoC.
3. Never auto-publish. Import and research land as `needs_review`.
4. Approval ≠ publish.
5. Do not silently resolve conflicts.
6. Do not treat page URLs as approved images.
7. Do not redesign the CMS while producing content.

---

## Workflow steps

### 1. Research

- Start a research job for brand + model (live URL and/or manual paste / structured JSON).
- If live fetch is blocked (e.g. HTTP 403), continue with **manual** official source paste — expected for some OEMs.
- Capture proposed fields, variants, image candidates, and missing-field lists.

### 2. Verify

- Open the research review workspace (`/admin/import/research/[id]`).
- Work **topic by topic** (or Focus mode).
- Approve only values backed by official sources.
- Leave unconfirmed values empty.

### 3. Resolve conflicts

- Show all candidates; never auto-pick.
- Actions: choose A/B, enter custom (still sourced), or leave unresolved / empty.
- Variant-specific numbers stay on the correct variant — do not merge trims into one base value when manuals disagree by trim.

### 4. Explain missing information

- List what is missing and **why** (blocked fetch, not published by OEM, two official values cannot fit one field, etc.).
- Record “not available” only when the editor confirms the OEM does not publish that fact for this market.

### 5. Generate editorial drafts

Draft against `CAR_BLUEPRINT.md` structure, typically:

- Short introduction  
- Who the car is for  
- Strengths  
- Weaknesses  
- Winter considerations  
- Charging experience  
- Long-distance suitability  
- Daily usability  

Mark drafts with **Draft – Requires editor review.** until a human rewrites and approves.

### 6. Suggest image candidates

Categorise: Front · Rear · Side · Interior · Cargo  

- Prefer official OEM media.  
- Label source pages / PDFs clearly — do not approve them as image files.  
- Do not attach until an editor downloads and approves rights.

### 7. Suggest official sources

Every populated field should eventually have:

- Source name  
- Source URL  
- Last checked  
- Confidence  
- Review status  

Primary sources: OEM Norway site, Owner’s Manual, official warranty / support docs.

### 8. Prepare review

- Import approved research as `needs_review` (never published).
- Open Car Editor: specs tables, editorial, sources, images, variants.
- Complete readiness report (completion %, missing, conflicts, images, editorial).
- Ready for **approval** only when conflicts are gone, critical specs are sourced, editorial is reviewed, and images are attached with rights notes.
- **Publish** remains a separate human action.

---

## First validated example: Tesla Model 3

| Item | Value |
|------|--------|
| Slug | `tesla-model-3` |
| Car id | `cd2df65a-f868-4385-9c73-f79356f295ae` |
| Review package | `docs/TESLA_MODEL3_REVIEW.md` |
| Batch data | `data/research-batch-model3-tesla.json` |
| Apply helper | `scripts/apply-model3-reference-workflow.ts` |

What this example validates:

- Official-source-only conflict resolution  
- Leaving energy/performance empty when Tesla Norge cannot be captured  
- Variant notes when dimensions differ by trim  
- Editorial draft discipline  
- Image candidates without attach  
- Status stays `needs_review` / unpublished  

What it does **not** define forever:

- Exact Model 3 copy for other brands  
- Permanent “golden” field values for every EV  
- Page IA (that is `CAR_BLUEPRINT.md`)

---

## Brand production order (content)

1. Tesla (Model 3 → Y → S → X)  
2. Volkswagen  
3. Volvo  
4. BMW  
5. Audi  
6. BYD  
7. Remaining important EVs sold in Norway (`docs/EVFAKTA_MASTER_CATALOG.md`)

Each car repeats this reference workflow; each page must satisfy `CAR_BLUEPRINT.md`.

---

## Document control

| Item | Value |
|------|--------|
| Document | `docs/REFERENCE_WORKFLOW.md` |
| Owners | EVFAKTA editorial |
| Change policy | Update when the production process changes; do not use this file to redefine page sections |
| Non-goals | CMS features, schema changes, auto-publish |
