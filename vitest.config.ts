import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  // The hard-rule tests read every source file, which takes a while on a busy machine.
  test: { pool: "threads", include: ["__tests__/**/*.test.ts"], testTimeout: 30_000 },
});
