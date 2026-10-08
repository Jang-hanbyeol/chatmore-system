/**
 * 오프라인 환경용 DB 초기화 스크립트 (npx tsx scripts/init-db.ts)
 * 일반적으로는 `npm run db:push` 를 사용하세요. 네트워크 제한으로 Prisma
 * 스키마 엔진을 내려받을 수 없는 환경에서만 사용하는 대체 스크립트입니다.
 * (prisma/schema.prisma 와 동일한 테이블을 생성합니다)
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { libsqlConfig } from "../lib/database/connection";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = libsqlConfig(path.join(here, "..", "prisma"));
const db = createClient(config);

const S = [
  `CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "userType" TEXT NOT NULL DEFAULT '재학생',
  "college" TEXT, "department" TEXT, "grade" TEXT, "admissionYear" TEXT,
  "language" TEXT NOT NULL DEFAULT 'ko',
  "interests" TEXT NOT NULL DEFAULT '',
  "notifySchedule" BOOLEAN NOT NULL DEFAULT true,
  "notifyScholarship" BOOLEAN NOT NULL DEFAULT true,
  "notifyProgram" BOOLEAN NOT NULL DEFAULT true,
  "notifyBookmark" BOOLEAN NOT NULL DEFAULT true,
  "notifyRecommend" BOOLEAN NOT NULL DEFAULT false,
  "answerLength" TEXT NOT NULL DEFAULT 'detailed',
  "autoExpandSources" BOOLEAN NOT NULL DEFAULT false,
  "showSuggestions" BOOLEAN NOT NULL DEFAULT true,
  "saveHistory" BOOLEAN NOT NULL DEFAULT true,
  "allowPersonalization" BOOLEAN NOT NULL DEFAULT true,
  "fontSize" TEXT NOT NULL DEFAULT 'default',
  "highContrast" BOOLEAN NOT NULL DEFAULT false,
  "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
  "onboarded" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active',
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '새 대화',
  "category" TEXT,
  "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'success',
  "summary" TEXT, "sourcesJson" TEXT, "noticesJson" TEXT, "followUpsJson" TEXT,
  "modelName" TEXT, "dataCheckedAt" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "InformationSource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "targetUsers" TEXT NOT NULL DEFAULT '전체',
  "keywords" TEXT NOT NULL DEFAULT '',
  "sourceUrl" TEXT, "attachmentUrl" TEXT,
  "startAt" DATETIME, "endAt" DATETIME,
  "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dataCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dataStatus" TEXT NOT NULL DEFAULT 'active',
  "isAiSearchable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "Notice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT '공지',
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "targetUsers" TEXT NOT NULL DEFAULT '전체',
  "startAt" DATETIME, "endAt" DATETIME, "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'published',
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "ScheduleEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT '학사',
  "startAt" DATETIME NOT NULL,
  "endAt" DATETIME,
  "department" TEXT, "sourceUrl" TEXT,
  "isDeadline" BOOLEAN NOT NULL DEFAULT false,
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS "Feedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "feedbackType" TEXT NOT NULL,
  "reason" TEXT, "comment" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "adminMemo" TEXT, "assignee" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  "messageId" TEXT,
  "content" TEXT NOT NULL,
  "contactBack" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'new',
  "adminMemo" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Bookmark" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meta" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_userId_itemType_itemId_key" ON "Bookmark"("userId","itemType","itemId")`,
  `CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "notificationType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "link" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug")`,
  `CREATE TABLE IF NOT EXISTS "Admin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email")`,
  `CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "resetAt" BIGINT NOT NULL
)`,
];

async function main() {
  for (const sql of S) await db.execute(sql);
  console.log(`테이블 생성 완료: ${config.url}`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
