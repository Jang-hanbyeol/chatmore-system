import fs from "fs";
import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma 7 (Rust-free) + libSQL 어댑터.
 * DATABASE_URL 의 상대 경로("file:./dev.db")는 prisma/ 디렉터리 기준.
 * - libsql:// 또는 https:// URL(Turso 등)이면 원격 DB에 접속(DATABASE_AUTH_TOKEN 사용).
 * - Vercel 서버리스는 배포 파일이 읽기 전용이므로, 빌드 시 시드된 SQLite 파일을
 *   /tmp 로 복사해 사용한다(인스턴스별·임시 저장 — 데모 용도).
 */
function resolveSqliteUrl(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.replace(/^file:/, "");
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), "prisma", filePath);

  if (process.env.VERCEL) {
    const tmp = path.join("/tmp", path.basename(abs));
    if (!fs.existsSync(tmp) && fs.existsSync(abs)) fs.copyFileSync(abs, tmp);
    return `file:${tmp}`;
  }
  return `file:${abs}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaLibSql({
    url: resolveSqliteUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
