import path from "node:path";

/**
 * libSQL 접속 설정 (런타임 · 테이블 생성 · 시드 공용).
 * - TURSO_DATABASE_URL(Vercel Turso 연동) 또는 libsql:// 등 원격 DATABASE_URL 이면 원격 DB.
 * - 그 외에는 SQLite 파일. 상대 경로("file:./dev.db")는 sqliteBaseDir 기준.
 * - Vercel 은 인스턴스마다 파일시스템이 분리돼 파일 DB로는 데이터가 공유·보존되지
 *   않으므로, 원격 DB 설정이 없으면 조용히 동작하지 않고 바로 실패한다.
 */
export function libsqlConfig(sqliteBaseDir: string): {
  url: string;
  authToken?: string;
} {
  const raw =
    process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
  const authToken =
    process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || undefined;
  if (!raw.startsWith("file:")) return { url: raw, authToken };

  if (process.env.VERCEL) {
    throw new Error(
      "Vercel 배포에는 원격 DB가 필요합니다. TURSO_DATABASE_URL·TURSO_AUTH_TOKEN 환경변수를 설정하세요."
    );
  }
  const filePath = raw.replace(/^file:/, "");
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(sqliteBaseDir, filePath);
  return { url: `file:${abs}` };
}
