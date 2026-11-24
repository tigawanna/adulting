import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@ui-sdk/solid/collapsible";
import { For } from "solid-js";
import { Icon } from "@/components/icons";
import { KRA_CONFIG, type KraBand } from "@/lib/calculator";

export function TaxBands(props: { bands: readonly KraBand[]; taxableAnnual: number }) {
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Collapsible class="border-t border-border pt-3">
      <CollapsibleTrigger class="disclosure-button" aria-label="How the PAYE was calculated">
        <Icon name="chevron" size={12} class="disclosure-chevron" />
        How the PAYE was calculated
      </CollapsibleTrigger>
      <CollapsiblePanel class="pt-3">
        <div class="space-y-2 sm:hidden">
          <For each={props.bands} keyed={(band) => band.label}>
            {(band) => (
              <div class="rounded-md border border-border px-3 py-2">
                <div class="flex items-baseline justify-between gap-3">
                  <p class="text-[11px]">{band().label}</p>
                  <p class="numeric text-[11px] text-muted-foreground">
                    {(band().rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div class="mt-1 flex items-baseline justify-between gap-3">
                  <p class="text-[10px] text-muted-foreground">Taxable {money(band().taxable)}</p>
                  <p class="numeric text-[11px]">Tax {money(band().tax)}</p>
                </div>
              </div>
            )}
          </For>
        </div>
        <table class="hidden w-full text-left text-[11px] tabular-nums sm:table">
          <thead class="text-muted-foreground">
            <tr>
              <th class="pb-2 font-normal">Band</th>
              <th class="pb-2 font-normal">Rate</th>
              <th class="pb-2 text-right font-normal">Taxable</th>
              <th class="pb-2 text-right font-normal">Tax</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.bands} keyed={(band) => `table-${band.label}`}>
              {(band) => (
                <tr class="border-t border-border/60">
                  <td class="py-1.5">{band().label}</td>
                  <td class="py-1.5 text-muted-foreground">{(band().rate * 100).toFixed(1)}%</td>
                  <td class="py-1.5 text-right">{money(band().taxable)}</td>
                  <td class="py-1.5 text-right">{money(band().tax)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <p class="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Taxable pay {money(props.taxableAnnual)} / year, after the statutory contributions
          included here. Personal relief of {money(KRA_CONFIG.paye.personalReliefAnnual)}/year is
          deducted from the tax due, floored at zero.
        </p>
      </CollapsiblePanel>
    </Collapsible>
  );
}
