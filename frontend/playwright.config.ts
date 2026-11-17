import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4100";
// 通常の開発サーバーや公開サイトを誤って更新しないよう、明示指定を要求する。
if (
  !process.env.E2E_PASSWORD ||
  process.env.COLETTE_E2E !== "1" ||
  !["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname)
) {
  throw new Error(
    "Set E2E_PASSWORD, COLETTE_E2E=1 and an isolated localhost E2E_BASE_URL",
  );
}
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    timezoneId: "Asia/Tokyo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
