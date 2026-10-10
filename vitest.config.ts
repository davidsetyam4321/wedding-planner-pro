import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Convex functions diuji dengan convex-test, yang butuh runtime Edge
// (Web Crypto, Blob, TextEncoder) dan file convex-test di-inline supaya
// transform-nya jalan di dalam environment tersebut.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "edge-runtime",
    include: ["src/**/*.test.ts"],
    server: {
      deps: { inline: ["convex-test"] },
    },
  },
});
