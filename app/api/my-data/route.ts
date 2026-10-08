import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { getSessionUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** 내 데이터 다운로드 (개인정보 이동권 대응 — JSON) */
export async function GET() {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [user, conversations, bookmarks, feedbacks, reports] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          userType: true,
          department: true,
          grade: true,
          interests: true,
          createdAt: true,
        },
      }),
      db.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            select: { role: true, content: true, createdAt: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.bookmark.findMany({ where: { userId } }),
      db.feedback.findMany({
        where: { userId },
        select: { feedbackType: true, reason: true, createdAt: true },
      }),
      db.report.findMany({
        where: { userId },
        select: { reportType: true, content: true, status: true, createdAt: true },
      }),
    ]);

  return new NextResponse(
    JSON.stringify(
      { exportedAt: new Date().toISOString(), user, conversations, bookmarks, feedbacks, reports },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="chatmore-my-data.json"`,
      },
    }
  );
}
