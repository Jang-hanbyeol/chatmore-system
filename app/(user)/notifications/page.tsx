import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BellRing, CalendarClock, Info, Sparkles } from "lucide-react";
import { db } from "@/lib/database/db";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/user";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "알림" };
export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; icon: typeof Bell }> = {
  important: { label: "중요 공지", icon: BellRing },
  deadline: { label: "마감 임박", icon: CalendarClock },
  recommend: { label: "추천 정보", icon: Sparkles },
  bookmark: { label: "즐겨찾기 변경", icon: Bell },
  system: { label: "시스템 안내", icon: Info },
};

export default async function NotificationsPage() {
  const user = await requireOnboardedUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">알림</h1>
          <p className="mt-1 text-sm text-body">
            읽지 않은 알림 {unread}건
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-md bg-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-hairline"
            >
              모두 읽음 처리
            </button>
          </form>
        )}
      </header>

      <p className="rounded-md bg-soft px-4 py-2.5 text-xs text-muted">
        현재 알림은 서비스 내 알림함으로 제공됩니다. 이메일·브라우저 알림 채널은
        연동 예정이며, 설정에서 수신 여부를 선택할 수 있습니다.
      </p>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="새 알림이 없습니다"
          description="중요 일정과 마감 정보가 도착하면 이곳에 표시됩니다."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.notificationType] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <div
                  className={cn(
                    "flex items-start gap-3.5 rounded-lg border p-4",
                    n.isRead
                      ? "border-hairline bg-surface"
                      : "border-primary/30 bg-primary/[0.03]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      n.isRead ? "bg-strong text-muted" : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-xs text-muted">
                      {meta.label} · {relativeTime(n.createdAt)}
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="읽지 않음" />
                      )}
                    </p>
                    <p className="mt-0.5 text-[0.9375rem] font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-body">{n.content}</p>
                    <div className="mt-2 flex gap-3">
                      {n.link && (
                        <Link href={n.link} className="text-xs font-semibold text-primary">
                          바로 가기
                        </Link>
                      )}
                      {!n.isRead && (
                        <form action={markNotificationRead.bind(null, n.id)}>
                          <button type="submit" className="text-xs text-body hover:text-ink">
                            읽음 처리
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
