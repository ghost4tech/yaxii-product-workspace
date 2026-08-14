import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "../../assets/build",
      "src/components/ui/*",
      "!src/components/ui/help-tip.tsx",
      "src/components/ProLock.tsx",
      "src/components/deferred",
      "src/components/UpgradeModal.tsx",
      "src/components/WooCommerceSetup.tsx",
      "src/lib/mockData.ts",
      "src/pages/Analytics.tsx",
      "src/pages/License.tsx",
      "src/pages/NotFound.tsx",
      "src/pages/Stores.tsx",
      "src/pages/Team.tsx",
      "src/services",
      "src/stores/storesStore.ts",
      "src/stores/tierStore.ts",
      "src/test/example.test.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: { allowDefaultProject: ["src/components/ui/help-tip.tsx"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
