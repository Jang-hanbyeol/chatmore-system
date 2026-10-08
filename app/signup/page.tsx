import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SignupForm } from "@/components/navigation/SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo variant="vertical" height={92} className="mx-auto" priority />
          <h1 className="mt-5 text-xl font-semibold text-ink">회원가입</h1>
          <p className="mt-2 text-sm text-body">
            학교 이메일로 Chatmore를 시작하세요.
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-surface p-7 shadow-card">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-body">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold text-primary">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
