import { Field, FieldLabel } from "@ui-sdk/solid/field";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/solid/segmented-control";
import { For } from "solid-js";
import { Icon } from "@/components/icons";
import { useCalculator } from "@/state/calculator";
import type { EmploymentMode } from "@/lib/calculator";

const MODES: readonly { value: EmploymentMode; label: string; icon: "briefcase" | "laptop" }[] = [
  { value: "salaried", label: "Salaried", icon: "briefcase" },
  { value: "contractor", label: "Contractor", icon: "laptop" },
];

const MODE_COPY: Record<EmploymentMode, string> = {
  salaried: "Your employer withholds PAYE, NSSF, SHIF and the housing levy.",
  contractor: "You invoice gross — set aside tax and statutory contributions yourself.",
};

export function EmploymentSwitch() {
  const calc = useCalculator();
  const employment = () => calc.controls.employment;

  return (
    <section class="mt-6 flex flex-col items-start gap-3 border-y border-border py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6">
      <Field class="flex flex-wrap items-center gap-3">
        <FieldLabel class="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          I am
        </FieldLabel>
        <SegmentedControl
          value={employment()}
          onValueChange={(value) => {
            if (value !== null) calc.setEmployment(value as EmploymentMode);
          }}
        >
          <SegmentedControlIndicator class="bg-primary" />
          <For each={MODES}>
            {(mode) => (
              <SegmentedControlItem
                value={mode.value}
                class="gap-1.5 text-xs data-checked:text-primary-foreground"
              >
                <Icon name={mode.icon} size={12} />
                {mode.label}
              </SegmentedControlItem>
            )}
          </For>
        </SegmentedControl>
      </Field>
      <p class="max-w-md text-[11px] leading-relaxed text-muted-foreground">
        {MODE_COPY[employment()]}
      </p>
    </section>
  );
}
