import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageCircleMore } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { ddayLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const n = await db.notice.findFirst({
    where: { id: params.id, status: "published" },
  });
  return { title: n ? n.title : "공지사항" };
}

export default async function NoticeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireOnboardedUser();
  const notice = await db.notice.findFirst({
    where: { id: params.id, status: "published" },
  });
  if (!notice) notFound();

  // 조회 수 증가
  await db.notice.update({
    where: { id: notice.id },
    data: { viewCount: { increment: 1 } },
  });

  const bookmark = await db.bookmark.findUnique({
    where: {
      userId_itemType_itemId: {
        userId: user.id,
        itemType: "notice",
        itemId: notice.id,
      },
    },
  });

  const dday = ddayLabel(notice.endAt);
  const expired = dday === "마감됨";

  return (
    <article className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <nav aria-label="탐색 경로" className="text-sm text-muted">
        <Link href="/notice" className="inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> 공지사항 목록
        </Link>
      </nav>

      <header className="rounded-lg border border-hairline bg-surface p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">{notice.category}</Badge>
          {dday && !expired && <Badge tone="amber">{dday}</Badge>}
          {expired && <Badge>마감됨</Badge>}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold leading-snug text-ink md:text-2xl">
            {notice.title}
          </h1>
          <BookmarkButton
            itemType="notice"
            itemId={notice.id}
            title={notice.title}
            meta={notice.category}
            initial={Boolean(bookmark)}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">담당 부서</dt>
            <dd className="font-medium text-ink">{notice.department}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">작성일</dt>
            <dd className="font-medium text-ink">{formatDate(notice.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">신청 기간</dt>
            <dd className="font-medium text-ink">
              {notice.startAt || notice.endAt
                ? `${notice.startAt ? formatDate(notice.startAt) : ""} ~ ${notice.endAt ? formatDate(notice.endAt) : ""}`
                : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">조회</dt>
            <dd className="font-medium text-ink">{notice.viewCount + 1}</dd>
          </div>
        </dl>
      </header>

      {expired && (
        <p
          role="status"
          className="rounded-md border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn"
        >
          이 정보는 신청 기간이 종료되었거나 업데이트가 필요합니다. 최신 공식
          공지를 확인해 주세요.
        </p>
      )}

      <section className="rounded-lg border border-hairline bg-surface p-6">
        <h2 className="sr-only">공지 내용</h2>
        <p className="rounded-md bg-soft px-4 py-3 text-sm font-medium text-ink">
          {notice.summary}
        </p>
        <div
          className="prose-basic mt-4"
          // 관리자 페이지에서 작성된 신뢰된 콘텐츠만 렌더링합니다.
          dangerouslySetInnerHTML={{ __html: notice.content }}
        />
        {notice.sourceUrl && (
          <a
            href={notice.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary"
          >
            <ExternalLink size={14} aria-hidden /> 공식 원문 보기
          </a>
        )}
      </section>

      <Link
        href={`/chat?q=${encodeURIComponent(`"${notice.title}" 공지에 대해 자세히 알려줘`)}`}
        className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 font-semibold text-white hover:bg-primary-active"
      >
        <MessageCircleMore size={17} aria-hidden />
        이 공지에 대해 Chatmore에게 질문하기
      </Link>
    </article>
  );
}
