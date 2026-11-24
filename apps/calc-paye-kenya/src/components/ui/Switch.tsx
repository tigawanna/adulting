import { Switch as UiSwitch, SwitchThumb } from "@ui-sdk/solid/switch";

export function Switch(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <UiSwitch
      checked={props.checked}
      onCheckedChange={(checked) => props.onChange(checked)}
      aria-label={props.label}
      class="ui-switch"
    >
      <SwitchThumb class="ui-switch-thumb" />
    </UiSwitch>
  );
}
