import { For, Show } from "solid-js";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { NumberField } from "./Field";
import { TaxBands } from "./TaxBands";
import {
  convert,
  KRA_CONFIG,
  REFERENCE_PERIODS,
  scaleMonthlyToPeriods,
  type ReferencePeriod,
} from "@/lib/calculator";
import { useCalculator } from "@/state/calculator";

const MODE_LABEL = { salaried: "Employer deductions", contractor: "Self-remitted" } as const;

const PERIOD_LABEL: Record<ReferencePeriod, string> = {
  hour: "Hour",
  week: "Week",
  month: "Month",
  year: "Year",
};

export function Tax() {
  const calc = useCalculator();
  const salaried = () => calc.controls.employment === "salaried";
  const statutory = calc.statutory;
  const money = (value: number) => calc.formatMoney(value, "KES");

  return (
    <section class="space-y-6">
      <div class="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
        <h2 class="text-sm font-medium">KRA tax &amp; take-home</h2>
        <span class="text-[11px] text-muted-foreground">
          {MODE_LABEL[calc.controls.employment]} · {KRA_CONFIG.taxYear} rates
        </span>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1 basis-full sm:basis-auto">
          <NumberField
            id="gross-kes"
            label={salaried() ? "Monthly gross salary (KES)" : "Monthly gross income (KES)"}
            prefix="KSh"
            step={1000}
            value={() => Math.round(statutory().gross)}
            onChange={calc.setMonthlyGrossKes}
          />
        </div>
        <div class="min-w-0 flex-1 basis-full sm:basis-auto">
          <NumberField
            id="net-kes"
            label="Take-home target (KES)"
            prefix="KSh"
            step={1000}
            value={() => Math.round(statutory().net)}
            onChange={calc.setMonthlyNetKes}
          />
        </div>
      </div>

      <div class="grid gap-4 border-l-2 border-primary py-1 pl-4 sm:grid-cols-2">
        <div>
          <p class="text-[10px] tracking-[0.14em] text-primary uppercase">Take home / month</p>
          <p class="numeric mt-1 text-2xl font-medium sm:text-3xl">{money(statutory().net)}</p>
        </div>
        <div>
          <p class="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            {salaried() ? "Withheld / month" : "Set aside / month"}
          </p>
          <p class="numeric mt-1 text-2xl font-medium sm:text-3xl">
            {money(statutory().totalDeductions)}
          </p>
        </div>
        <p class="numeric text-xs leading-relaxed text-muted-foreground sm:col-span-2">
          {(() => {
            const parts = [`PAYE ${money(statutory().paye)}`];
            if (calc.controls.deductions.nssf) parts.push(`NSSF ${money(statutory().nssf.total)}`);
            if (calc.controls.deductions.shif) parts.push(`SHIF ${money(statutory().shif)}`);
            if (calc.controls.deductions.ahl) parts.push(`AHL ${money(statutory().ahl)}`);
            return parts.join(" · ");
          })()}
        </p>
      </div>

      <ReferenceTable />

      <p class="numeric text-[10px] text-muted-foreground">
        Total deductions are {(statutory().effectiveRate * 100).toFixed(1)}% of gross · taxable pay{" "}
        {money(statutory().taxable)} / month
      </p>

      <Show
        when={!salaried()}
        fallback={
          <p class="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
            Your employer withholds PAYE monthly using KRA&apos;s pay-band tables. The band-by-band
            breakdown is shown for contractors.
          </p>
        }
      >
        <TaxBands bands={statutory().payeResult.bands} taxableAnnual={statutory().taxable * 12} />
      </Show>
    </section>
  );
}

function uniqueCodes(codes: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const code of codes) {
    if (!code || seen.has(code)) continue;
    seen.add(code);
    next.push(code);
  }
  return next;
}

function ReferenceTable() {
  const calc = useCalculator();
  const statutory = calc.statutory;
  const hours = () => calc.breakdown().hoursPerMonth;
  const weeks = () => calc.controls.weeksPerMonth;

  const currencies = () => uniqueCodes(["KES", calc.controls.inputCurrency, ...calc.pinned()]);
  const grossKes = () => scaleMonthlyToPeriods(statutory().gross, hours(), weeks());
  const netKes = () => scaleMonthlyToPeriods(statutory().net, hours(), weeks());

  const amount = (kes: number, code: string) =>
    code === "KES" ? kes : convert(kes, "KES", code, calc.rates());
  const figure = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
    }).format(value);

  return (
    <div class="space-y-2">
      <p class="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        Gross &amp; take-home by period
      </p>
      <div class="space-y-3">
        <For each={currencies()} keyed={(code) => code}>
          {(code) => (
            <div class="overflow-hidden rounded-md border border-border">
              <div class="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <p class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {code()}
                </p>
                <Show when={calc.pinned().includes(code())}>
                  <Button
                    variant="ghost"
                    size="icon"
                    label={`Remove ${code()} rate`}
                    iconOnly
                    onClick={() => calc.togglePin(code())}
                    class="tc-btn-tiny text-muted-foreground"
                  >
                    <Icon name="x" size={10} />
                  </Button>
                </Show>
              </div>
              <div class="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
                <For each={[...REFERENCE_PERIODS]} keyed={(period) => `${code()}-${period}`}>
                  {(period) => (
                    <div class="bg-background px-3 py-2.5">
                      <p class="text-[9px] tracking-wide text-muted-foreground uppercase">
                        {PERIOD_LABEL[period()]}
                      </p>
                      <div class="mt-1.5 flex items-baseline justify-between gap-2">
                        <span class="text-[9px] tracking-wide text-muted-foreground uppercase">
                          Gross
                        </span>
                        <span class="numeric text-xs">
                          {figure(amount(grossKes()[period()], code()))}
                        </span>
                      </div>
                      <div class="mt-0.5 flex items-baseline justify-between gap-2">
                        <span class="text-[9px] tracking-wide text-primary uppercase">Net</span>
                        <span class="numeric text-xs text-primary">
                          {figure(amount(netKes()[period()], code()))}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <Button
        variant="primary-60"
        size="sm"
        label="Add rate"
        onClick={() => calc.setDrawerOpen(true)}
        class="w-full"
      >
        <Icon name="plus" size={12} /> Add rate
      </Button>
      <p class="text-[10px] text-muted-foreground">
        Net is monthly take-home scaled across periods. Deductions / yr{" "}
        {calc.formatMoney(statutory().totalDeductions * 12, "KES")}.
      </p>
    </div>
  );
}
