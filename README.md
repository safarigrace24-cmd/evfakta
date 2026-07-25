# EVFAKTA.no – Vercel starter

## Kjør lokalt
```bash
npm install
npm run dev
```

## Publiser
1. Opprett et tomt repository på GitHub.
2. Last opp alle filene fra denne mappen.
3. Gå til Vercel → Add New → Project.
4. Importer GitHub-repositoryet.
5. Trykk Deploy.

Vercel oppdager Next.js automatisk.

## Legg til biler
Nye biler legges inn via Admin (`/admin/biler`). Publiserte biler vises på `/modeller`.

### Engangsimport fra `data/cars.ts`
Importer eksisterende startdata til Supabase (upsert på `slug`, trygt å kjøre flere ganger):

1. Kjør SQL-migrasjonen for `public.cars` i Supabase.
2. Sett `NEXT_PUBLIC_SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`.
3. Kjør:

```bash
npm run import:cars
```

Skriptet kjøres **ikke** automatisk ved `build` eller deploy. `data/cars.ts` endres ikke.

### CSV-import til `public.cars`
Importer mange modeller fra en lokal CSV-fil (upsert på `slug`):

1. Kjør SQL-migrasjonen for `public.cars` i Supabase.
2. Sett `NEXT_PUBLIC_SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`.
3. Kopier malen og fyll inn bilene dine:

```bash
cp data/cars-import.template.csv data/cars-import.csv
```

4. Kolonner i malen (samme som `public.cars`):

Basekolonner:
`slug,brand,model,year,price_nok,range_km,battery_kwh,dc_charging_kw,drivetrain,image_url,description,is_published`

Utvidede (valgfrie) kolonner:
`consumption_kwh_100km,power_hp,torque_nm,acceleration_0_100,top_speed_kmh,seats,cargo_l,towing_kg,warranty,ac_charging_kw,vehicle_type,body_style`

- Påkrevd: `brand`, `model`
- `slug` genereres automatisk hvis den mangler eller er ugyldig
- `is_published` godtar: `true` / `false` / `yes` / `no` / `1` / `0`
- Tomme tallfelt lagres som `null`
- Eldre CSV-filer uten utvidede kolonner fungerer fortsatt

5. Kjør:

```bash
npm run import:cars:csv
# eller med egen filsti:
npm run import:cars:csv -- path/to/file.csv
```

Skriptet kjøres **ikke** automatisk ved `build` eller deploy. `data/cars.ts` endres ikke.

### Bildegalleri (Supabase Storage)
Admin laster opp bildebilder til bucket `car-images` som `{slug}.webp`.

1. Kjør SQL-migrasjonen `supabase/migrations/20260725150000_car_images_storage.sql` i Supabase.
2. Sørg for at `SUPABASE_SERVICE_ROLE_KEY` er satt i `.env.local`.
3. I admin: last opp / bytt / fjern bilde, deretter **Lagre** bilen.

## Domene
Test først Vercel-adressen. Flytt deretter `evfakta.no` under Project → Settings → Domains.
