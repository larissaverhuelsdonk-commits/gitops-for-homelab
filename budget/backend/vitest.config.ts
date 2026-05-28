import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const backendDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: backendDir,
  test: {
    include: ["../tests/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      supertest: path.join(backendDir, "node_modules/supertest"),
    },
  },
});
