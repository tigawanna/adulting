import { createSignal } from "solid-js";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { useCalculator } from "@/state/calculator";
import { copyToClipboard } from "@/state/share";

export function ShareButtons() {
  const calc = useCalculator();
  const [copied, setCopied] = createSignal(false);

  async function copyLink(): Promise<void> {
    await copyToClipboard(calc.shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div class="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center">
      <Button variant="outline" size="sm" label="Copy link" onClick={() => void copyLink()}>
        <Icon name="link" size={12} /> {copied() ? "Copied" : "Copy link"}
      </Button>
      <Button variant="ghost" size="sm" label="Clear filters" onClick={calc.reset}>
        <Icon name="x" size={12} /> Clear
      </Button>
    </div>
  );
}
