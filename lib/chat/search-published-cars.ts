import type { Car } from "@/data/cars";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { toChatCarFact } from "@/lib/chat/format-car-context";
import type { ChatSearchResult } from "@/lib/chat/types";

const FAMILY_HINTS =
  /\b(familie|familiebiler?|barn|sete|seter|7-?seter|suv|plass)\b/i;
const RANGE_HINTS =
  /\b(lengst|lengste|rekkevidde|range|wltp|langtur|kilometer)\b/i;
const CHARGE_HINTS =
  /\b(lade|lading|dc|ac|hurtiglading|ladetid|kwh\/100|forbruk)\b/i;
const BATTERY_HINTS = /\b(batteri|batterikapasitet|kwh|brukbart)\b/i;
const COMPARE_HINTS = /\b(sammenlign|vs\.?|versus|mot|eller)\b/i;
const BUDGET_HINTS = /\b(budsjett|pris|under|maks|billig|koster|kr)\b/i;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9æøå.+\-\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

/** Parse budgets like 400000, 400 000, 400.000, 400k (not «kr»). */
export function parseBudgetNok(query: string): number | null {
  const compact = query.replace(/\s/g, "");
  // Prefer full kr amounts before short "400k" shorthand.
  const dotted = compact.match(/(\d{1,3}(?:\.\d{3})+)/);
  if (dotted) {
    const n = Number(dotted[1].replace(/\./g, ""));
    if (Number.isFinite(n) && n >= 50_000) return n;
  }
  const plain = compact.match(/(\d{5,7})/);
  if (plain) {
    const n = Number(plain[1]);
    if (Number.isFinite(n) && n >= 50_000) return n;
  }
  // "450k" shorthand — must not match the "k" in "kr".
  const withK = compact.match(/(?<!\d)(\d{2,3})k(?![a-zæøå])/i);
  if (withK) {
    const n = Number(withK[1]) * 1000;
    if (Number.isFinite(n) && n >= 50_000) return n;
  }
  return null;
}

function scoreCarAgainstQuery(car: Car, queryTokens: string[]): number {
  const hay = normalize(
    [
      car.brand,
      car.model,
      car.slug,
      car.bodyStyle,
      car.variant,
      ...(car.suitableFor || []),
    ]
      .filter(Boolean)
      .join(" "),
  );
  let score = 0;
  for (const token of queryTokens) {
    if (hay.includes(token)) score += token.length >= 4 ? 3 : 2;
  }
  const brand = normalize(car.brand);
  const model = normalize(car.model);
  if (queryTokens.includes(brand)) score += 5;
  if (model.split(" ").every((part) => queryTokens.includes(part) || hay.includes(part))) {
    score += 4;
  }
  return score;
}

function detectIntent(query: string): ChatSearchResult["intent"] {
  if (COMPARE_HINTS.test(query)) return "compare";
  if (BUDGET_HINTS.test(query) || parseBudgetNok(query) != null) return "budget";
  if (FAMILY_HINTS.test(query)) return "family";
  if (RANGE_HINTS.test(query) && /\b(lengst|lengste|best)\b/i.test(query)) {
    return "longest_range";
  }
  if (BATTERY_HINTS.test(query)) return "battery";
  if (CHARGE_HINTS.test(query)) return "charging";
  if (RANGE_HINTS.test(query)) return "longest_range";
  return "general";
}

function pickTop(
  cars: Car[],
  limit: number,
  sortFn?: (a: Car, b: Car) => number,
): Car[] {
  const sorted = sortFn ? [...cars].sort(sortFn) : cars;
  return sorted.slice(0, limit);
}

/**
 * Search published EVFAKTA cars for chatbot context.
 * Uses only is_published=true via getPublishedCars().
 */
export async function searchPublishedCarsForChat(
  query: string,
): Promise<ChatSearchResult> {
  const cars = await getPublishedCars();
  const notes: string[] = [];
  const intent = detectIntent(query);
  const tokens = tokenize(query);
  const budget = parseBudgetNok(query);

  if (!cars.length) {
    notes.push(
      "Katalogen har foreløpig ingen publiserte biler. Ikke finn opp modeller.",
    );
    return { intent, cars: [], notes };
  }

  let selected: Car[] = [];

  if (intent === "budget" && budget != null) {
    selected = pickTop(
      cars.filter((car) => car.priceNok > 0 && car.priceNok <= budget),
      8,
      (a, b) => b.rangeKm - a.rangeKm,
    );
    notes.push(`Budsjettfilter: pris ≤ ${budget} NOK (kun biler med pris i databasen).`);
    if (!selected.length) {
      notes.push("Ingen publiserte biler matchet budsjettet.");
    }
  } else if (intent === "longest_range") {
    selected = pickTop(
      cars.filter((car) => car.rangeKm > 0),
      8,
      (a, b) => b.rangeKm - a.rangeKm,
    );
    notes.push("Sortert etter høyest lagret WLTP-rekkevidde.");
  } else if (intent === "family") {
    selected = pickTop(
      cars.filter((car) => {
        const seats = car.seats ?? 0;
        const body = (car.bodyStyle || "").toLowerCase();
        const suitable = (car.suitableFor || []).join(" ").toLowerCase();
        return (
          seats >= 5 ||
          body.includes("suv") ||
          suitable.includes("familie") ||
          suitable.includes("barn")
        );
      }),
      8,
      (a, b) =>
        (b.seats ?? 0) - (a.seats ?? 0) || (b.cargoL ?? 0) - (a.cargoL ?? 0),
    );
    if (!selected.length) {
      selected = pickTop(cars, 8, (a, b) => (b.seats ?? 0) - (a.seats ?? 0));
      notes.push("Få eksplisitte familietreff — viste modeller med flest seter.");
    } else {
      notes.push("Filtrert mot familie/SUV/sete-signaler i databasen.");
    }
  } else if (intent === "charging") {
    selected = pickTop(
      cars.filter((car) => car.dcKw > 0 || car.acKw > 0),
      8,
      (a, b) => b.dcKw - a.dcKw,
    );
    notes.push("Sortert etter høyest lagret DC-ladeeffekt der tilgjengelig.");
  } else if (intent === "battery") {
    selected = pickTop(
      cars.filter((car) => (car.batteryTotalKwh ?? car.batteryKwh) > 0),
      8,
      (a, b) =>
        (b.batteryTotalKwh ?? b.batteryKwh) - (a.batteryTotalKwh ?? a.batteryKwh),
    );
    notes.push("Sortert etter batterikapasitet i databasen.");
  } else if (intent === "compare") {
    const scored = cars
      .map((car) => ({ car, score: scoreCarAgainstQuery(car, tokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);
    selected = scored.slice(0, 4).map((row) => row.car);
    notes.push("Sammenligning: valgte modeller nevnt i spørsmålet når mulig.");
    if (selected.length < 2) {
      selected = pickTop(cars, 4, (a, b) => b.rangeKm - a.rangeKm);
      notes.push(
        "Fant færre enn to tydelige modelltreff — la til katalogeksempler. Ikke påstå direkte sammenligning uten dekning.",
      );
    }
  } else {
    const scored = cars
      .map((car) => ({ car, score: scoreCarAgainstQuery(car, tokens) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);
    selected = scored.slice(0, 6).map((row) => row.car);
    if (!selected.length) {
      selected = pickTop(cars, 6, (a, b) => b.rangeKm - a.rangeKm);
      notes.push(
        "Ingen sterke modelltreff i spørsmålet — sendte et nøytralt utvalg fra katalogen.",
      );
    } else {
      notes.push("Valgte modeller som matcher merke/modell/nøkkelord i spørsmålet.");
    }
  }

  // Always try to include explicit brand/model hits even for ranked intents.
  if (intent !== "compare" && intent !== "budget") {
    const named = cars
      .map((car) => ({ car, score: scoreCarAgainstQuery(car, tokens) }))
      .filter((row) => row.score >= 5)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.car);
    for (const car of named) {
      if (!selected.some((item) => item.slug === car.slug)) {
        selected.unshift(car);
      }
    }
    selected = selected.slice(0, 8);
  }

  return {
    intent: selected.length === 1 && tokens.length >= 2 ? "model_lookup" : intent,
    cars: selected.map(toChatCarFact),
    notes,
  };
}
