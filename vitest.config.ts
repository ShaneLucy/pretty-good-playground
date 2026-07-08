import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "src/**/*.svelte", "scripts/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      thresholds: {
        lines: 80,
        branches: 80
      }
    },
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        resolve: {
          conditions: ["browser"]
        },
        test: {
          name: "client",
          environment: "jsdom",
          include: ["test/**/*.svelte.{test,spec}.{js,ts}"]
        }
      },

      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["test/**/*.{test,spec}.{js,ts}"],
          exclude: ["test/**/*.svelte.{test,spec}.{js,ts}"]
        }
      }
    ]
  }
});
