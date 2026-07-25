-- EV master catalog fields (additive, all nullable).
-- Existing cars remain valid; no data rewrite required.
-- See docs/EV_DATA_MODEL.md.

alter table public.cars
  -- Identity
  add column if not exists variant text,
  add column if not exists trim_level text,
  add column if not exists model_generation text,
  -- Battery
  add column if not exists battery_total_kwh numeric,
  add column if not exists battery_usable_kwh numeric,
  add column if not exists battery_chemistry text,
  -- Range
  add column if not exists winter_range_km integer,
  add column if not exists real_world_range_km integer,
  -- Charging
  add column if not exists charge_time_10_80_minutes integer,
  add column if not exists charging_connector_ac text,
  add column if not exists charging_connector_dc text,
  -- Dimensions and weight
  add column if not exists length_mm integer,
  add column if not exists width_mm integer,
  add column if not exists height_mm integer,
  add column if not exists wheelbase_mm integer,
  add column if not exists curb_weight_kg integer,
  add column if not exists gross_weight_kg integer,
  add column if not exists frunk_l integer,
  -- Equipment and energy features
  add column if not exists heat_pump boolean,
  add column if not exists v2l boolean,
  add column if not exists v2g boolean,
  add column if not exists apple_carplay boolean,
  add column if not exists android_auto boolean,
  add column if not exists head_up_display boolean,
  add column if not exists panoramic_roof boolean,
  add column if not exists ota_updates boolean,
  -- Editorial lists (one item per array element)
  add column if not exists pros text[],
  add column if not exists cons text[],
  add column if not exists suitable_for text[];

comment on column public.cars.variant is 'Trim/variant marketing name (e.g. Long Range AWD).';
comment on column public.cars.trim_level is 'Trim level label when distinct from variant.';
comment on column public.cars.model_generation is 'Generation code or name (e.g. Juniper, MEB).';
comment on column public.cars.battery_total_kwh is 'Gross / total battery capacity (kWh).';
comment on column public.cars.battery_usable_kwh is 'Usable battery capacity (kWh).';
comment on column public.cars.battery_chemistry is 'Cell chemistry label (e.g. NMC, LFP).';
comment on column public.cars.winter_range_km is 'Estimated or measured winter range (km).';
comment on column public.cars.real_world_range_km is 'Estimated real-world range (km).';
comment on column public.cars.charge_time_10_80_minutes is 'Typical DC 10–80% charge time in minutes.';
comment on column public.cars.charging_connector_ac is 'AC connector type (e.g. Type 2).';
comment on column public.cars.charging_connector_dc is 'DC connector type (e.g. CCS2, NACS).';
comment on column public.cars.heat_pump is 'Has heat pump (null = unknown).';
comment on column public.cars.v2l is 'Vehicle-to-load support (null = unknown).';
comment on column public.cars.v2g is 'Vehicle-to-grid support (null = unknown).';
comment on column public.cars.pros is 'Editorial pros (text array).';
comment on column public.cars.cons is 'Editorial cons (text array).';
comment on column public.cars.suitable_for is 'Editorial suitable-for tags (text array).';
