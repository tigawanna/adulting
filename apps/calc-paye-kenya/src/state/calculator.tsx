import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createStore,
  onSettled,
  useContext,
} from "solid-js";
import { type JSX } from "@solidjs/web";
import {
  CURRENCIES,
  DEDUCTIONS_BY_EMPLOYMENT,
  DEFAULT_CONTROLS,
  FALLBACK_RATES,
  calculateStatutory,
  convert,
  deriveBreakdown,
  fetchRates,
  grossForNetSalary,
  hoursPerWeekFromMonthly,
  periodHours,
  type Breakdown,
  type ControlsState,
  type DeductionKey,
  type EmploymentMode,
  type RatesResult,
  type StatutoryBreakdown,
} from "@/lib/calculator";
import { readStored, removeStored, writeStored } from "./persistence";
import { readShare, shareQuery } from "./share";
import { applyTheme, loadTheme, saveTheme, type Theme } from "./theme";

type Accessor<T> = () => T;
export type RateStatus = "loading" | "error" | "idle" | "shared" | "bundled";

const PINNED_KEY = "calcpayekenya:pinned";
const DISCLAIMER_KEY = "calcpayekenya:disclaimer-dismissed";
const RATES_TIMEOUT_MS = 5_000;

interface CalculatorValue {
  controls: ControlsState;
  setAmount: (amount: number) => void;
  setInputCurrency: (code: string) => void;
  setPeriod: (period: ControlsState["period"]) => void;
  setHoursPerMonth: (hours: number) => void;
  setWeeksPerMonth: (weeks: number) => void;
  setEmployment: (employment: EmploymentMode) => void;
  toggleDeduction: (key: DeductionKey) => void;
  setMonthlyGrossKes: (gross: number) => void;
  setMonthlyNetKes: (net: number) => void;
  pinned: Accessor<string[]>;
  togglePin: (code: string) => void;
  setLocalCurrency: (code: string) => void;
  drawerOpen: Accessor<boolean>;
  setDrawerOpen: (open: boolean) => void;
  disclaimerDismissed: Accessor<boolean>;
  dismissDisclaimer: () => void;
  showDisclaimer: () => void;
  theme: Accessor<Theme>;
  toggleTheme: () => void;
  rates: Accessor<Record<string, number>>;
  rateStatus: Accessor<RateStatus>;
  updatedAt: Accessor<number>;
  refreshRates: () => Promise<void>;
  breakdown: Accessor<Breakdown>;
  statutory: Accessor<StatutoryBreakdown>;
  local: (amountUsd: number, code: string) => number;
  formatMoney: (amount: number, currency: string, digits?: number) => string;
  shareUrl: () => string;
  reset: () => void;
}

const CalculatorContext = createContext<CalculatorValue>();

function loadPinned(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStored({ key: PINNED_KEY }) ?? "null");
    if (!Array.isArray(parsed)) return ["KES"];
    const valid = new Set(CURRENCIES.map((currency) => currency.code));
    return parsed.filter((code): code is string => typeof code === "string" && valid.has(code));
  } catch {
    return ["KES"];
  }
}

export function CalculatorProvider(props: { children: JSX.Element }) {
  const shared = typeof window === "undefined" ? null : readShare(window.location.search);
  const [urlReady, setUrlReady] = createSignal(false);
  const [controls, setControls] = createStore<ControlsState>({
    ...DEFAULT_CONTROLS,
    deductions: { ...DEFAULT_CONTROLS.deductions },
  });
  const [pinned, setPinned] = createSignal<string[]>(["KES"]);
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = createSignal(false);
  const [theme, setTheme] = createSignal<Theme>("dark");
  const [ratesResult, setRatesResult] = createSignal<RatesResult>({
    rates: FALLBACK_RATES,
    updatedAt: 0,
  });
  const [rateStatus, setRateStatus] = createSignal<RateStatus>("loading");

  const rates = (): Record<string, number> => ratesResult().rates;
  const updatedAt = (): number => ratesResult().updatedAt;

  const hoursPerWeek = createMemo(() =>
    hoursPerWeekFromMonthly(controls.hoursPerMonth, controls.weeksPerMonth),
  );
  const hoursInPeriod = createMemo(() =>
    periodHours(controls.period, hoursPerWeek(), controls.weeksPerMonth),
  );
  const amountUsd = createMemo(() =>
    convert(controls.amount, controls.inputCurrency, "USD", rates()),
  );
  const hourlyUsd = createMemo(() => (hoursInPeriod() > 0 ? amountUsd() / hoursInPeriod() : 0));
  const breakdown = createMemo(() =>
    deriveBreakdown({
      hourlyUsd: hourlyUsd(),
      hoursPerWeek: hoursPerWeek(),
      weeksPerMonth: controls.weeksPerMonth,
    }),
  );
  const grossMonthlyKes = createMemo(() => convert(breakdown().monthly, "USD", "KES", rates()));
  const statutory = createMemo(() =>
    calculateStatutory({ grossMonthly: grossMonthlyKes(), deductions: { ...controls.deductions } }),
  );

  function setEmployment(employment: EmploymentMode): void {
    const next = DEDUCTIONS_BY_EMPLOYMENT[employment];
    setControls((state) => {
      state.employment = employment;
      state.deductions.nssf = next.nssf;
      state.deductions.shif = next.shif;
      state.deductions.ahl = next.ahl;
    });
  }

  function toggleDeduction(key: DeductionKey): void {
    setControls((state) => {
      state.deductions[key] = !state.deductions[key];
    });
  }

  function setMonthlyGrossKes(monthlyGrossKes: number): void {
    const usdMonthly = convert(monthlyGrossKes, "KES", "USD", rates());
    const hourly = controls.hoursPerMonth > 0 ? usdMonthly / controls.hoursPerMonth : 0;
    setControls((state) => {
      state.amount = hourly;
      state.inputCurrency = "USD";
      state.period = "hour";
    });
  }

  function setMonthlyNetKes(monthlyNetKes: number): void {
    setMonthlyGrossKes(
      grossForNetSalary({ netMonthly: monthlyNetKes, deductions: { ...controls.deductions } }),
    );
  }

  function savePinned(next: string[]): void {
    setPinned(next);
    writeStored({ key: PINNED_KEY, value: JSON.stringify(next) });
  }

  function togglePin(code: string): void {
    const current = pinned();
    savePinned(
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  function setLocalCurrency(code: string): void {
    savePinned([code, ...pinned().filter((item) => item !== code)]);
  }

  function dismissDisclaimer(): void {
    setDisclaimerDismissed(true);
    writeStored({ key: DISCLAIMER_KEY, value: "1" });
  }

  function showDisclaimer(): void {
    setDisclaimerDismissed(false);
    removeStored({ key: DISCLAIMER_KEY });
  }

  function toggleTheme(): void {
    const next: Theme = theme() === "dark" ? "light" : "dark";
    saveTheme({ theme: next });
    let applied = false;
    const commit = () => {
      if (applied) return;
      applied = true;
      setTheme(next);
      applyTheme({ theme: next });
    };

    if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
      const transition = document.startViewTransition(commit);
      void transition.finished.catch(() => {});
      void transition.updateCallbackDone.catch(() => {});
      // Background tabs can pause frames before the transition callback runs.
      setTimeout(commit, 250);
    } else {
      commit();
    }
  }

  async function refreshRates(): Promise<void> {
    setRateStatus("loading");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RATES_TIMEOUT_MS);
    try {
      const result = await fetchRates(controller.signal);
      setRatesResult(result);
      setRateStatus("idle");
    } catch {
      setRateStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }

  function reset(): void {
    setControls((state) => {
      state.amount = DEFAULT_CONTROLS.amount;
      state.inputCurrency = DEFAULT_CONTROLS.inputCurrency;
      state.period = DEFAULT_CONTROLS.period;
      state.hoursPerMonth = DEFAULT_CONTROLS.hoursPerMonth;
      state.weeksPerMonth = DEFAULT_CONTROLS.weeksPerMonth;
      state.employment = DEFAULT_CONTROLS.employment;
      Object.assign(state.deductions, DEFAULT_CONTROLS.deductions);
    });
    setPinned(["KES"]);
    setRatesResult({ rates: { ...FALLBACK_RATES }, updatedAt: 0 });
    setRateStatus("bundled");
  }

  createEffect(
    () => theme(),
    (next) => applyTheme({ theme: next }),
  );

  onSettled(() => {
    if (shared) {
      setControls((state) => {
        state.amount = shared.controls.amount;
        state.inputCurrency = shared.controls.inputCurrency;
        state.period = shared.controls.period;
        state.hoursPerMonth = shared.controls.hoursPerMonth;
        state.weeksPerMonth = shared.controls.weeksPerMonth;
        state.employment = shared.controls.employment;
        Object.assign(state.deductions, shared.controls.deductions);
      });
      setPinned(shared.pinned ? [...shared.pinned] : loadPinned());
      if (shared.rates) {
        setRatesResult({ rates: { ...FALLBACK_RATES, ...shared.rates }, updatedAt: 0 });
        setRateStatus("shared");
      } else {
        void refreshRates();
      }
    } else {
      setPinned(loadPinned());
      void refreshRates();
    }
    setDisclaimerDismissed(readStored({ key: DISCLAIMER_KEY }) === "1");
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    applyTheme({ theme: savedTheme });
    if (typeof document !== "undefined") delete document.documentElement.dataset.booting;
    setUrlReady(true);
  });

  createEffect(
    () => ({
      ready: urlReady(),
      query: shareQuery({ controls, pinned: pinned(), rates: rates() }),
    }),
    ({ ready, query }) => {
      if (!ready) return;
      const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
        window.history.replaceState(null, "", next);
      }
    },
  );

  const value: CalculatorValue = {
    controls,
    setAmount: (amount) =>
      setControls((state) => {
        state.amount = amount;
      }),
    setInputCurrency: (code) =>
      setControls((state) => {
        state.inputCurrency = code;
      }),
    setPeriod: (period) =>
      setControls((state) => {
        state.period = period;
      }),
    setHoursPerMonth: (hours) =>
      setControls((state) => {
        state.hoursPerMonth = hours;
      }),
    setWeeksPerMonth: (weeks) =>
      setControls((state) => {
        state.weeksPerMonth = weeks;
      }),
    setEmployment,
    toggleDeduction,
    setMonthlyGrossKes,
    setMonthlyNetKes,
    pinned,
    togglePin,
    setLocalCurrency,
    drawerOpen,
    setDrawerOpen,
    disclaimerDismissed,
    dismissDisclaimer,
    showDisclaimer,
    theme,
    toggleTheme,
    rates,
    rateStatus,
    updatedAt,
    refreshRates,
    breakdown,
    statutory,
    local: (amountUsdValue, code) => convert(amountUsdValue, "USD", code, rates()),
    formatMoney: (amount, currency, digits) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: digits ?? (Math.abs(amount) >= 1000 ? 0 : 2),
      }).format(amount),
    shareUrl: () => {
      const query = shareQuery({ controls, pinned: pinned(), rates: rates() });
      return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
    },
    reset,
  };

  return <CalculatorContext value={value}>{props.children}</CalculatorContext>;
}

export function useCalculator(): CalculatorValue {
  const value = useContext(CalculatorContext);
  if (!value) throw new Error("CalculatorProvider is missing");
  return value;
}
