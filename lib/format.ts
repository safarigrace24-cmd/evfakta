export function formatNok(amount: number): string {
  if (amount <= 0) return "Pris kommer";
  return `${amount.toLocaleString("nb-NO")} kr`;
}

export function formatKm(km: number): string {
  if (km <= 0) return "—";
  return `${km} km`;
}

export function formatKwh(kwh: number): string {
  if (kwh <= 0) return "—";
  return `${kwh} kWh`;
}

export function formatKw(kw: number): string {
  if (kw <= 0) return "—";
  return `${kw} kW`;
}
