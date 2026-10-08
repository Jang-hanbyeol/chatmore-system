"use client";

import Link from "next/link";
import { useDialog } from "@/components/ui/useDialog";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Compass,
  History,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageCircleMore,
  MessageSquareWarning,
  Settings,
  X,
} from "lucide-react";
import { Logo, SymbolBadge } from "@/components/ui/Logo";
import { userLogout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/chat", label: "챗봇", icon: MessageCircleMore },
  { href: "/explore", label: "정보 탐색", icon: Compass },
  { href: "/notice", label: "공지사항", icon: Megaphone },
  { href: "/calendar", label: "일정", icon: CalendarDays },
  { href: "/notifications", label: "알림", icon: Bell, badgeKey: "unread" },
  { href: "/history", label: "대화 기록", icon: History },
  { href: "/bookmarks", label: "즐겨찾기", icon: Bookmark },
  { href: "/feedback", label: "오류 신고·문의", icon: MessageSquareWarning },
  { href: "/settings", label: "설정", icon: Settings },
];

/** 사용자 접근성 설정을 html data 속성으로 적용 */
function SettingsApplier({
  fontSize,
  highContrast,
  reduceMotion,
}: {
  fontSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
}) {
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.fontSize = fontSize;
    el.dataset.contrast = highContrast ? "high" : "default";
    el.dataset.motion = reduceMotion ? "reduced" : "default";
  }, [fontSize, highContrast, reduceMotion]);
  return null;
}

export function UserShell({
  children,
  userName,
  unreadCount,
  fontSize,
  highContrast,
  reduceMotion,
}: {
  children: ReactNode;
  userName: string;
  unreadCount: number;
  fontSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);
  const drawerRef = useDialog(drawerOpen, () => setDrawerOpen(false));
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navList = (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-body hover:bg-soft hover:text-ink"
              )}
            >
              <item.icon size={17} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badgeKey === "unread" && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1.5 text-[0.6875rem] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-dvh">
      <SettingsApplier
        fontSize={fontSize}
        highContrast={highContrast}
        reduceMotion={reduceMotion}
      />

      {/* 데스크톱 사이드바 */}
      {/* 화면에 고정: 본문 길이·넘침과 무관하게 사이드바(하단 프로필 포함)는 제자리, 본문만 스크롤 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-hairline-soft px-5">
          <Link href="/home" aria-label="Chatmore 홈">
            <Logo variant="horizontal" height={26} priority />
          </Link>
        </div>
        <nav aria-label="주요 메뉴" className="flex-1 overflow-y-auto p-3 thin-scroll">
          {navList}
        </nav>
        <div className="border-t border-hairline-soft p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-strong text-sm font-bold text-ink">
              {userName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{userName}</p>
              <p className="text-xs text-muted">데모 계정</p>
            </div>
            <form action={userLogout}>
              <button
                type="submit"
                aria-label="로그아웃"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink"
              >
                <LogOut size={16} aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* 모바일 헤더 */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-hairline bg-surface px-4 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-soft"
          >
            <Menu size={20} aria-hidden />
          </button>
          <Link href="/home" aria-label="Chatmore 홈" className="flex items-center gap-2">
            <SymbolBadge size={28} />
            <Logo variant="wordmark" height={15} />
          </Link>
          <Link
            href="/notifications"
            aria-label={`알림${unreadCount > 0 ? ` ${unreadCount}건` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-soft"
          >
            <Bell size={19} aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-down" aria-hidden />
            )}
          </Link>
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* 모바일 Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <button
            type="button"
            tabIndex={-1}
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-lift">
            <div className="flex h-14 items-center justify-between border-b border-hairline-soft px-4">
              <Logo variant="horizontal" height={24} />
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setDrawerOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-soft"
              >
                <X size={19} aria-hidden />
              </button>
            </div>
            <nav aria-label="모바일 메뉴" className="flex-1 overflow-y-auto p-3">
              {navList}
            </nav>
            <div className="border-t border-hairline-soft p-4">
              <p className="text-sm font-semibold text-ink">{userName}</p>
              <form action={userLogout} className="mt-2">
                <button
                  type="submit"
                  className="w-full rounded-md bg-strong px-4 py-2.5 text-sm font-semibold text-ink hover:bg-hairline"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
