import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React 19 flags "setState inside an effect" as an error because of
      // cascading-render concerns. For our use cases — closing a modal after a
      // successful server action, flashing a transient "Saved" message — the
      // extra render is intentional and not a perf issue. Downgrade to warning
      // so it's still visible during dev but doesn't block CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
