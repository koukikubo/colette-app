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
    // Docker内での並列実行による負荷を抑え、
    // UIテストが制限時間を超えないよう、ワーカーを1つにする。
    maxWorkers: 1,
  },
});
