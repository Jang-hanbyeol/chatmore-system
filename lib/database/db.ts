import path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { libsqlConfig } from "./connection";

/**
 * Prisma 7 (Rust-free) + libSQL 어댑터.
 * 접속 대상 결정 규칙은 ./connection.ts 참고 (원격 Turso 또는 prisma/ 기준 SQLite 파일).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaLibSql(
    libsqlConfig(path.join(process.cwd(), "prisma"), { copyToTmpOnVercel: true })
  );
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
