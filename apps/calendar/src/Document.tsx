import { HydrationScript, type JSX } from "@solidjs/web";

const BOOT_THEME = `(() => {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("kenya-calendar:theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
    root.dataset.theme = "light";
  }
})();`;

export default function Document(props: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f6f7f4" />
        <meta
          name="description"
          content="Kenya Tools Calendar — public holidays, KRA filing periods, school terms and deadlines in one place."
        />
        <link rel="icon" type="image/svg+xml" href="/kenya.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <script innerHTML={BOOT_THEME} />
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
