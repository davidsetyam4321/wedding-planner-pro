import { defineConfig } from "vitest/config";

// Convex functions diuji dengan convex-test, yang butuh runtime Edge
// (Web Crypto, Blob, TextEncoder) dan file convex-test di-inline supaya
// transform-nya jalan di dalam environment tersebut.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["src/**/*.test.ts"],
    server: {
      deps: { inline: ["convex-test"] },
    },
  },
});
