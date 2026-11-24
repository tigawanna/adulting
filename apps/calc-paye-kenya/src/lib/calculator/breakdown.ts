export type Period = "hour" | "week" | "month";

export interface BreakdownInput {
  hourlyUsd: number;
  hoursPerWeek: number;
  weeksPerMonth: number;
}

export interface Breakdown {
  hoursPerMonth: number;
  hourly: number;
  weekly: number;
  monthly: number;
  annual: number;
  scenarios: { hours: number; monthly: number }[];
}

export const SCENARIO_HOURS = [160, 170, 180] as const;

export function periodHours(period: Period, hoursPerWeek: number, weeksPerMonth: number): number {
  if (period === "hour") return 1;
  if (period === "week") return hoursPerWeek;
  return hoursPerWeek * weeksPerMonth;
}

export function deriveBreakdown({ hourlyUsd, hoursPerWeek, weeksPerMonth }: BreakdownInput): Breakdown {
  const rate = Number.isFinite(hourlyUsd) ? Math.max(0, hourlyUsd) : 0;
  const weeklyHours = Number.isFinite(hoursPerWeek) ? Math.max(0, hoursPerWeek) : 0;
  const weeks = Number.isFinite(weeksPerMonth) && weeksPerMonth > 0 ? weeksPerMonth : 4;
  const hoursPerMonth = weeklyHours * weeks;

  return {
    hoursPerMonth,
    hourly: rate,
    weekly: rate * weeklyHours,
    monthly: rate * hoursPerMonth,
    annual: rate * hoursPerMonth * 12,
    scenarios: SCENARIO_HOURS.map((hours) => ({ hours, monthly: rate * hours })),
  };
}

export function hoursPerWeekFromMonthly(monthlyHours: number, weeksPerMonth: number): number {
  const weeks = weeksPerMonth > 0 ? weeksPerMonth : 4;
  return Number((monthlyHours / weeks).toFixed(2));
}

export const REFERENCE_PERIODS = ["hour", "week", "month", "year"] as const;
export type ReferencePeriod = (typeof REFERENCE_PERIODS)[number];

/** Scale a monthly KES figure across hour / week / month / year using the same hours model as the rate breakdown. */
export function scaleMonthlyToPeriods(
  monthly: number,
  hoursPerMonth: number,
  weeksPerMonth: number,
): Record<ReferencePeriod, number> {
  const weeks = weeksPerMonth > 0 ? weeksPerMonth : 4;
  const hours = hoursPerMonth > 0 ? hoursPerMonth : 0;
  return {
    hour: hours > 0 ? monthly / hours : 0,
    week: monthly / weeks,
    month: monthly,
    year: monthly * 12,
  };
}
