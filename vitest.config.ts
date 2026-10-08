import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 로컬 SQLite 파일 하나를 여러 워커가 동시에 쓰면 SQLITE_BUSY 가 나므로 파일 단위 순차 실행
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
