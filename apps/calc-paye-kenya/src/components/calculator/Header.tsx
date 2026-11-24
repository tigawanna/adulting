import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-sdk/solid/tooltip";
import { Show } from "solid-js";
import { Icon } from "@/components/icons";
import { useCalculator } from "@/state/calculator";

const STATUS_VIEW = {
  loading: "Updating rates",
  error: "Bundled rates",
  idle: "Live rates",
} as const;

export function Header() {
  const calc = useCalculator();
  const time = () =>
    calc.updatedAt() > 0
      ? new Date(calc.updatedAt()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";
  const themeLabel = () => `Switch to ${calc.theme() === "dark" ? "light" : "dark"} mode`;

  return (
    <header class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div>
        <div class="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h1 class="text-lg font-medium tracking-tight">
            calc paye kenya<span class="text-primary">.</span>
          </h1>
          <span class="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            rate · currency · tax
          </span>
        </div>
        <p class="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          What your hourly rate actually means per week, per month, in your currency, and after
          Kenyan statutory deductions.
        </p>
      </div>

      <div class="flex items-center gap-1.5 pt-0.5">
        <Show when={calc.disclaimerDismissed()}>
          <Tooltip type="label">
            <TooltipTrigger
              class="tc-btn tc-btn-ghost tc-btn-icon tc-btn-danger"
              aria-label="Show disclaimer"
              onClick={calc.showDisclaimer}
            >
              <Icon name="info" />
            </TooltipTrigger>
            <TooltipContent class="ui-tooltip">Show disclaimer</TooltipContent>
          </Tooltip>
        </Show>
        <span class="numeric text-[11px] text-muted-foreground">
          {STATUS_VIEW[calc.rateStatus()]}
          {time() ? ` · ${time()}` : ""}
        </span>
        <Tooltip type="label">
          <TooltipTrigger
            class="tc-btn tc-btn-ghost tc-btn-icon"
            aria-label="Refresh exchange rates"
            aria-disabled={calc.rateStatus() === "loading" ? "true" : undefined}
            onClick={() => {
              if (calc.rateStatus() !== "loading") void calc.refreshRates();
            }}
          >
            <Icon name="refresh" class={calc.rateStatus() === "loading" ? "animate-spin" : ""} />
          </TooltipTrigger>
          <TooltipContent class="ui-tooltip">Refresh exchange rates</TooltipContent>
        </Tooltip>
        <Tooltip type="label">
          <TooltipTrigger
            class="tc-btn tc-btn-ghost tc-btn-icon"
            aria-label={themeLabel()}
            onClick={calc.toggleTheme}
          >
            <Icon name={calc.theme() === "dark" ? "sun" : "moon"} />
          </TooltipTrigger>
          <TooltipContent class="ui-tooltip">{themeLabel()}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
