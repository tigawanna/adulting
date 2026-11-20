import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    // These apps were carried over verbatim from the source monorepo; keep
    // their original formatting rather than reformatting them on every run.
    ignorePatterns: [
      "**/routeTree.gen.ts",
      "apps/calc-paye-kenya/**",
      "apps/rate-calculator/**",
      ".agents/skills/**",
    ],
  },
  staged: {
    "*": (files: readonly string[]) => {
      const checked = files.filter((file) => !file.endsWith("routeTree.gen.ts"));
      if (checked.length === 0) return [];
      return `vp check --fix ${checked.map((file) => `'${file}'`).join(" ")}`;
    },
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    jsPlugins: ["@shadcn/lint"],
    categories: { correctness: "error" },
    rules: {
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "no-nested-ternary": "warn",
    },
  },
});
