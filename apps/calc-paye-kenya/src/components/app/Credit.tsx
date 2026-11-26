import { Icon } from "@/components/icons";

export function Credit() {
  return (
    <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      <a
        href="https://www.npmjs.com/package/@tigawanna/credit"
        target="_blank"
        rel="noreferrer"
        class="inline-flex items-center gap-1 underline-offset-2 hover:text-primary hover:underline"
      >
        Built with <span class="text-destructive">❤</span> by{" "}
        <span class="text-sm font-medium text-foreground">tigawanna</span>
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="https://github.com/tigawanna/adulting/tree/master/apps/calc-paye-kenya"
        target="_blank"
        rel="noreferrer"
        aria-label="Repository"
        class="inline-flex items-center gap-1 underline-offset-2 hover:text-primary hover:underline"
      >
        <Icon name="github" size={12} /> Repo
      </a>
    </span>
  );
}
