import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionAdminId } from "@/lib/auth/session";
import { Logo } from "@/components/ui/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false } };

export default function AdminLoginPage() {
  if (getSessionAdminId()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo variant="vertical" height={92} className="mx-auto" priority />
          <h1 className="mt-5 text-xl font-semibold text-ink">관리자 로그인</h1>
          <p className="mt-1.5 text-sm text-body">
            Chatmore 데이터·품질 관리 시스템
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface p-7 shadow-card">
          <AdminLoginForm />
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          기본 계정은 README의 「관리자 계정 생성」을 참고하세요.
        </p>
      </div>
    </div>
  );
}
