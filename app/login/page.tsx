import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/auth/guards";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/navigation/LoginForm";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (await getActiveUser()) redirect("/home");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo variant="vertical" height={92} className="mx-auto" priority />
          <p className="mt-4 text-[0.9375rem] text-body">
            흩어진 대학 정보를 하나의 대화로.
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface p-7 shadow-card">
          <LoginForm next={searchParams.next} />
        </div>
        <p className="mt-6 text-center text-sm text-body">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            회원가입
          </Link>
        </p>
        <p className="mt-4 flex justify-center gap-4 text-xs text-muted">
          <Link href="/privacy" className="hover:text-ink">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-ink">
            이용약관
          </Link>
        </p>
      </div>
    </div>
  );
}
