// Full Next app profile with server logging and Drizzle boundaries.
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import drizzle from "eslint-plugin-drizzle";
import base from "./eslint-rules/next-base.mjs";
import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  js.configs.recommended,
  ...base,
  ...tseslint.configs.strict,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: { security, "import-x": importX },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-unsafe-regex": "warn",
      "security/detect-child-process": "warn",
      "import-x/no-unresolved": "error",
      "import-x/no-duplicates": "error",
      "react/jsx-key": "warn",
      "react/no-array-index-key": "warn",
      "react/jsx-no-target-blank": "warn",
      "react/no-danger": "warn",
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary", "coerce"] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { security, "import-x": importX, drizzle },
    settings: { "import-x/resolver": { typescript: createTypeScriptImportResolver() } },
    rules: {
      "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
      "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: { module: "readonly", require: "readonly" } },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { quality },
    rules: {
      "quality/no-direct-console": ["error", { logger: "the server logger (remove client debug output)" }],
      "quality/no-direct-data-access": ["error", { modules: ["@/db", "@/db/index"], bindings: ["db", "getDb"], layers: ["/src/app/", "/src/components/"], extensions: [".tsx"] }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "quality/no-direct-console": "off",
      "quality/no-direct-data-access": "off",
    },
  },
  {
    settings: { "import-x/resolver": { typescript: createTypeScriptImportResolver() } },
  },
  globalIgnores(["drizzle/**", "**/*.tsbuildinfo"]),
]);
