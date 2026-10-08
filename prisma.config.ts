import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI 설정.
 * DATABASE_URL 의 상대 경로("file:./dev.db")는 prisma/ 디렉터리 기준으로
 * 해석합니다 (런타임 lib/database/db.ts 와 동일한 규칙).
 */
function resolveSqliteUrl(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  const filePath = raw.replace(/^file:/, "");
  if (path.isAbsolute(filePath)) return `file:${filePath}`;
  return `file:${path.join(__dirname, "prisma", filePath)}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveSqliteUrl(),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
