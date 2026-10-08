import fs from "node:fs";
import path from "node:path";

/**
 * libSQL 접속 설정 (런타임 · 테이블 생성 · 시드 공용).
 * - TURSO_DATABASE_URL(Vercel Turso 연동) 또는 libsql:// 등 원격 DATABASE_URL 이면 원격 DB.
 * - 그 외에는 SQLite 파일. 상대 경로("file:./dev.db")는 sqliteBaseDir 기준.
 * - Vercel 런타임에서 파일 DB를 쓰면 배포 파일이 읽기 전용이므로 /tmp 로 복사해 사용
 *   (인스턴스별·임시 저장 — 원격 DB가 없을 때의 데모 대체 경로).
 */
export function libsqlConfig(
  sqliteBaseDir: string,
  { copyToTmpOnVercel = false } = {}
): { url: string; authToken?: string } {
  const raw =
    process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || undefined;
  if (!raw.startsWith("file:")) return { url: raw, authToken };

  const filePath = raw.replace(/^file:/, "");
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(sqliteBaseDir, filePath);

  if (copyToTmpOnVercel && process.env.VERCEL) {
    const tmp = path.join("/tmp", path.basename(abs));
    if (!fs.existsSync(tmp) && fs.existsSync(abs)) fs.copyFileSync(abs, tmp);
    return { url: `file:${tmp}` };
  }
  return { url: `file:${abs}` };
}
