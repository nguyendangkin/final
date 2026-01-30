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
  // Custom rule overrides
  {
    rules: {
      // This rule is overly strict for valid client-side hydration patterns
      // in Next.js. The pattern `useEffect(() => setMounted(true), [])` is
      // standard for client-only components.
      "react-hooks/set-state-in-effect": "off",
      // We're using Google Fonts via <link> in layout which is acceptable
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
