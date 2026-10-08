import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Database,
  FileWarning,
  LayoutDashboard,
  MessageSquareText,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { adminLogout } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { AdminNavLink } from "@/components/admin/AdminNavLink";

export const metadata: Metadata = {
  title: { default: "관리자", template: "%s | Chatmore 관리자" },
  robots: { index: false },
};

const MENU = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/data", label: "대학 정보 데이터", icon: Database },
  { href: "/admin/notices", label: "공지사항", icon: Bell },
  { href: "/admin/questions", label: "질문 분석", icon: MessagesSquare },
  { href: "/admin/answers", label: "답변 품질", icon: ShieldCheck },
  { href: "/admin/feedback", label: "사용자 피드백", icon: MessageSquareText },
  { href: "/admin/reports", label: "오류 신고", icon: FileWarning },
  { href: "/admin/categories", label: "카테고리", icon: Tags },
  { href: "/admin/users", label: "사용자", icon: Users },
  { href: "/admin/analytics", label: "통계", icon: BarChart3 },
  { href: "/admin/settings", label: "시스템 설정", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-hairline-soft px-5">
          <Logo variant="symbol" height={28} />
          <span className="font-semibold text-ink">Chatmore</span>
          <span className="rounded-sm bg-strong px-1.5 py-0.5 text-[0.625rem] font-bold text-muted">
            ADMIN
          </span>
        </div>
        <nav aria-label="관리자 메뉴" className="flex-1 space-y-0.5 overflow-y-auto p-3 thin-scroll">
          {MENU.map((m) => (
            <AdminNavLink
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-body hover:bg-soft hover:text-ink"
              activeClassName="bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary"
            >
              <m.icon size={16} aria-hidden />
              {m.label}
            </AdminNavLink>
          ))}
        </nav>
        <div className="border-t border-hairline-soft p-4">
          <p className="truncate text-xs text-muted">{admin.email}</p>
          <div className="mt-2.5 flex gap-2">
            <Link
              href="/home"
              className="flex-1 rounded-md bg-strong px-3 py-2 text-center text-xs font-semibold text-ink hover:bg-hairline"
            >
              학생 화면
            </Link>
            <form action={adminLogout} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-md bg-strong px-3 py-2 text-xs font-semibold text-ink hover:bg-hairline"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-hairline bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo variant="symbol" height={24} />
            <span className="text-sm font-semibold text-ink">관리자</span>
          </div>
          <form action={adminLogout}>
            <button type="submit" className="rounded-md bg-strong px-3 py-1.5 text-xs font-semibold text-ink">
              로그아웃
            </button>
          </form>
        </div>
        <nav
          aria-label="관리자 메뉴 (모바일)"
          className="flex gap-1 overflow-x-auto border-b border-hairline bg-surface px-3 py-2 lg:hidden"
        >
          {MENU.map((m) => (
            <AdminNavLink
              key={m.href}
              href={m.href}
              className="shrink-0 rounded-md bg-strong px-3 py-1.5 text-xs font-medium text-ink"
              activeClassName="bg-ink font-semibold text-white"
            >
              {m.label}
            </AdminNavLink>
          ))}
        </nav>
        <main id="main" className="min-w-0 flex-1 p-4 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
