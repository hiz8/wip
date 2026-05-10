import tsParser from "@typescript-eslint/parser";
import stylex from "@stylexjs/eslint-plugin";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@stylexjs": stylex,
    },
    rules: {
      "@stylexjs/valid-styles": "error",
      "@stylexjs/valid-shorthands": "error",
      "@stylexjs/no-legacy-contextual-styles": "error",
      "@stylexjs/no-unused": "error",
    },
  },
  {
    ignores: ["**/node_modules/**", ".output/**", ".vinxi/**", "dist/**", "src/routeTree.gen.ts"],
  },
];
