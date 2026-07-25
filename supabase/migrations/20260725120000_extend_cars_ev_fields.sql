-- Extend public.cars with complete EV database fields (all nullable).
-- Existing rows remain valid; no data rewrite required.

alter table public.cars
  add column if not exists consumption_kwh_100km numeric,
  add column if not exists power_hp integer,
  add column if not exists torque_nm integer,
  add column if not exists acceleration_0_100 numeric,
  add column if not exists top_speed_kmh integer,
  add column if not exists seats integer,
  add column if not exists cargo_l integer,
  add column if not exists towing_kg integer,
  add column if not exists warranty text,
  add column if not exists ac_charging_kw numeric,
  add column if not exists vehicle_type text,
  add column if not exists body_style text;
