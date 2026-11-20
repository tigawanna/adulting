/**
 * Minimal icon set for Solid 2.
 *
 * Path data is borrowed from Tabler Icons (MIT) — the published React/Solid
 * packages are compiled against Solid 1 (`splitProps`, `solid-js/web`) and do
 * not run on Solid 2. Only the glyphs actually used by this app are included.
 */
import { For, type Component } from "solid-js";

interface IconProps {
  size?: number;
}

const Glyph: Component<IconProps & { paths: string[] }> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 20}
    height={props.size ?? 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <For each={props.paths}>{(d) => <path d={d} />}</For>
  </svg>
);

export const IconCalendarMonth: Component<IconProps> = (props) => (
  <Glyph
    paths={[
      "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12",
      "M16 3v4",
      "M8 3v4",
      "M4 11h16",
      "M8 14v4",
      "M12 14v4",
      "M16 14v4",
    ]}
    {...props}
  />
);

export const IconCalendarPlus: Component<IconProps> = (props) => (
  <Glyph
    paths={[
      "M12.5 21h-6.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v5",
      "M16 3v4",
      "M8 3v4",
      "M4 11h16",
      "M16 19h6",
      "M19 16v6",
    ]}
    {...props}
  />
);

export const IconChevronLeft: Component<IconProps> = (props) => (
  <Glyph paths={["M15 6l-6 6l6 6"]} {...props} />
);

export const IconChevronRight: Component<IconProps> = (props) => (
  <Glyph paths={["M9 6l6 6l-6 6"]} {...props} />
);

export const IconExternalLink: Component<IconProps> = (props) => (
  <Glyph
    paths={[
      "M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6",
      "M11 13l9 -9",
      "M15 4h5v5",
    ]}
    {...props}
  />
);

export const IconMoon: Component<IconProps> = (props) => (
  <Glyph
    paths={["M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"]}
    {...props}
  />
);

export const IconPlus: Component<IconProps> = (props) => (
  <Glyph paths={["M12 5l0 14", "M5 12l14 0"]} {...props} />
);

export const IconSearch: Component<IconProps> = (props) => (
  <Glyph paths={["M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0", "M21 21l-6 -6"]} {...props} />
);

export const IconSun: Component<IconProps> = (props) => (
  <Glyph
    paths={[
      "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",
      "M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
    ]}
    {...props}
  />
);

export const IconX: Component<IconProps> = (props) => (
  <Glyph paths={["M18 6l-12 12", "M6 6l12 12"]} {...props} />
);

export const IconTrash: Component<IconProps> = (props) => (
  <Glyph
    paths={[
      "M4 7l16 0",
      "M10 11l0 6",
      "M14 11l0 6",
      "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12",
      "M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3",
    ]}
    {...props}
  />
);
