import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],

  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    // Docker 内で多数の jsdom ワーカーを同時起動すると CPU が飽和し、
    // 単体では成功する UI テストが 5 秒を超えるため、並列数を制限する。
    maxWorkers: 2,
  },
});
