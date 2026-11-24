import { Show } from "solid-js";
import { Switch } from "@/components/ui/Switch";
import { useCalculator } from "@/state/calculator";

export function DeductionRow(props: {
  label: string;
  hint: string;
  amount: number;
  included: boolean;
  onToggle?: () => void;
}) {
  const calc = useCalculator();

  return (
    <div class="flex flex-col gap-2 border-b border-border/60 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div class="min-w-0">
        <p class="text-xs text-foreground">{props.label}</p>
        <p class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{props.hint}</p>
      </div>
      <div class="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end sm:pt-0.5">
        <Show when={props.included} fallback={<span class="text-[10px] text-muted-foreground">Excluded</span>}>
          <span class="numeric text-xs">{calc.formatMoney(props.amount, "KES")}</span>
        </Show>
        <Show
          when={props.onToggle}
          fallback={<span class="text-[9px] tracking-wide text-primary uppercase">Always on</span>}>
          <Switch checked={props.included} onChange={() => props.onToggle?.()} label={`Include ${props.label}`} />
        </Show>
      </div>
    </div>
  );
}
