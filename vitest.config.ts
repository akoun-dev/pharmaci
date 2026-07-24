import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/headers": path.resolve(__dirname, "./src/test/__mocks__/next-headers.ts"),
      "next/server": path.resolve(__dirname, "./src/test/__mocks__/next-server.ts"),
    },
  },
});
