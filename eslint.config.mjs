import { defineConfig, globalIgnores } from "eslint/config";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

export default defineConfig([
  ...coreWebVitals,
  ...typescript,
  { files: ["**/*.{ts,tsx,js,mjs}"], settings: { next: { rootDir: "apps/web/" } } },
  globalIgnores(["**/.next/**", "**/next-env.d.ts"]),
]);
