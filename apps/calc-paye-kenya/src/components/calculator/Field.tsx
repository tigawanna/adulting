import { Field, FieldDescription, FieldLabel } from "@ui-sdk/solid/field";
import { NumberInput, NumberInputControl, NumberInputGroup } from "@ui-sdk/solid/number-input";
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectInput,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/solid/select";
import { createSignal, For } from "solid-js";

type Accessor<T> = () => T;

interface NumberFieldProps {
  id: string;
  label: string;
  value: Accessor<number>;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  hint?: string;
}

export function NumberField(props: NumberFieldProps) {
  return (
    <Field class="space-y-1.5">
      <FieldLabel class="text-[11px] font-normal text-muted-foreground">{props.label}</FieldLabel>
      <div class="relative">
        {props.prefix ? (
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted-foreground">
            {props.prefix}
          </span>
        ) : null}
        <NumberInput
          min={props.min ?? 0}
          step={props.step ?? 1}
          value={props.value()}
          onValueChange={(value) => {
            if (value !== null) props.onChange(value);
          }}
        >
          <NumberInputGroup>
            <NumberInputControl
              id={props.id}
              inputmode="decimal"
              class={`numeric h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 ${props.prefix ? "pl-9" : ""} ${props.suffix ? "pr-11" : ""}`}
            />
          </NumberInputGroup>
        </NumberInput>
        {props.suffix ? (
          <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">
            {props.suffix}
          </span>
        ) : null}
      </div>
      {props.hint ? (
        <FieldDescription class="text-[10px] text-muted-foreground">{props.hint}</FieldDescription>
      ) : null}
    </Field>
  );
}

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; short?: string }[];
}

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  const [query, setQuery] = createSignal("");
  const visible = () => {
    const search = query().trim().toLowerCase();
    if (!search) return props.options;
    return props.options.filter((option) =>
      `${option.value} ${option.label} ${option.short ?? ""}`.toLowerCase().includes(search),
    );
  };

  return (
    <Field class="space-y-1.5">
      <FieldLabel class="text-[11px] font-normal text-muted-foreground">{props.label}</FieldLabel>
      <Select
        items={visible().map((option) => ({ value: option.value, label: option.label }))}
        value={props.value}
        itemToLabel={(value) =>
          props.options.find((option) => option.value === value)?.short ?? String(value)
        }
        query={query()}
        onQueryChange={setQuery}
        filter={false}
        onValueChange={(value) => {
          if (value !== null) props.onChange(value as T);
        }}
      >
        <SelectTrigger
          id={props.id}
          class="flex h-9 w-full items-center gap-1 overflow-hidden rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] data-placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <SelectValue class="min-w-0 flex-1 truncate whitespace-nowrap" />
        </SelectTrigger>
        <SelectContent class="rounded-md border border-border bg-popover p-1 shadow-lg">
          <SelectInput
            aria-label={`Search ${props.label}`}
            placeholder={`Search ${props.label.toLowerCase()}…`}
            class="mb-1 h-8 w-full rounded-sm border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <SelectEmpty class="px-3 py-2 text-xs text-muted-foreground">No matches</SelectEmpty>
          <SelectList class="max-h-56 overflow-y-auto">
            <For each={visible()}>
              {(option) => (
                <SelectItem
                  value={option.value}
                  class="cursor-default rounded-sm py-1.5 pr-2 pl-3 text-sm outline-none data-highlighted:bg-accent data-selected:font-medium"
                >
                  <SelectItemText>{option.label}</SelectItemText>
                  <SelectItemIndicator class="ms-auto" />
                </SelectItem>
              )}
            </For>
          </SelectList>
        </SelectContent>
      </Select>
    </Field>
  );
}
