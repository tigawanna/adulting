import {
  CURRENCIES,
  DEFAULT_CONTROLS,
  DEDUCTIONS_BY_EMPLOYMENT,
  FALLBACK_RATES,
  type ControlsState,
  type EmploymentMode,
  type Period,
} from "@/lib/calculator";

const CODES = new Set(CURRENCIES.map((currency) => currency.code));
const PERIODS = new Set<Period>(["hour", "week", "month"]);
const MODES = new Set<EmploymentMode>(["salaried", "contractor"]);
const DEDUCTION_KEYS = ["nssf", "shif", "ahl"] as const;

export interface ShareState {
  controls: ControlsState;
  pinned: string[] | null;
  rates: Record<string, number> | null;
}

function number(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function compact(value: number): string {
  return String(Number(value.toFixed(6)));
}

export function readShare(search: string): ShareState | null {
  const params = new URLSearchParams(search);
  if ([...params.keys()].length === 0) return null;

  const controls: ControlsState = {
    ...DEFAULT_CONTROLS,
    deductions: { ...DEFAULT_CONTROLS.deductions },
  };
  let found = false;

  const amount = number(params.get("amount"));
  if (amount !== undefined && amount >= 0) {
    controls.amount = amount;
    found = true;
  }
  const currency = params.get("currency");
  if (currency && CODES.has(currency)) {
    controls.inputCurrency = currency;
    found = true;
  }
  const period = params.get("period");
  if (period && PERIODS.has(period as Period)) {
    controls.period = period as Period;
    found = true;
  }
  const hours = number(params.get("hours"));
  if (hours !== undefined && hours > 0) {
    controls.hoursPerMonth = hours;
    found = true;
  }
  const weeks = number(params.get("weeks"));
  if (weeks !== undefined && weeks > 0) {
    controls.weeksPerMonth = weeks;
    found = true;
  }
  const employment = params.get("employment");
  if (employment && MODES.has(employment as EmploymentMode)) {
    controls.employment = employment as EmploymentMode;
    if (params.get("deductions") === null) {
      Object.assign(controls.deductions, DEDUCTIONS_BY_EMPLOYMENT[controls.employment]);
    }
    found = true;
  }
  const deductions = params.get("deductions");
  if (deductions !== null) {
    const enabled = new Set(deductions.split(","));
    for (const key of DEDUCTION_KEYS) controls.deductions[key] = enabled.has(key);
    found = true;
  }

  const pinnedParam = params.get("pinned");
  const pinned =
    pinnedParam === null ? null : pinnedParam.split(",").filter((code) => CODES.has(code));

  const ratesParam = params.get("rates");
  const rates: Record<string, number> | null = ratesParam === null ? null : {};
  if (rates && ratesParam) {
    for (const entry of ratesParam.split(",")) {
      const [code, raw] = entry.split(":");
      const value = number(raw ?? null);
      if (code && CODES.has(code) && value !== undefined && value > 0) rates[code] = value;
    }
  }

  return found || pinned || rates ? { controls, pinned, rates } : null;
}

export function shareQuery(state: {
  controls: ControlsState;
  pinned: string[];
  rates: Record<string, number>;
}): string {
  const { controls, pinned, rates } = state;
  const params = new URLSearchParams();

  if (controls.amount !== DEFAULT_CONTROLS.amount) params.set("amount", compact(controls.amount));
  if (controls.inputCurrency !== DEFAULT_CONTROLS.inputCurrency)
    params.set("currency", controls.inputCurrency);
  if (controls.period !== DEFAULT_CONTROLS.period) params.set("period", controls.period);
  if (controls.hoursPerMonth !== DEFAULT_CONTROLS.hoursPerMonth)
    params.set("hours", compact(controls.hoursPerMonth));
  if (controls.weeksPerMonth !== DEFAULT_CONTROLS.weeksPerMonth)
    params.set("weeks", compact(controls.weeksPerMonth));
  if (controls.employment !== DEFAULT_CONTROLS.employment)
    params.set("employment", controls.employment);

  const enabled = DEDUCTION_KEYS.filter((key) => controls.deductions[key]);
  const defaults = DEDUCTION_KEYS.filter((key) => DEFAULT_CONTROLS.deductions[key]);
  if (enabled.join(",") !== defaults.join(",")) params.set("deductions", enabled.join(","));

  if (pinned.join(",") !== "KES") params.set("pinned", pinned.join(","));

  const used = new Set([controls.inputCurrency, "USD", "KES", ...pinned]);
  const rateParts = [...used]
    .filter(
      (code) =>
        CODES.has(code) && typeof rates[code] === "number" && rates[code] !== FALLBACK_RATES[code],
    )
    .sort()
    .map((code) => `${code}:${compact(rates[code])}`);
  if (rateParts.length > 0) params.set("rates", rateParts.join(","));

  return params.toString();
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand?.("copy");
    field.remove();
  }
}
