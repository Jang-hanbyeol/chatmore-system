"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, School } from "lucide-react";
import { userLogin, type FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: FormState = { ok: false, message: "" };

const DEMO_ACCOUNTS = [
  { email: "student@demo.chatmore.kr", label: "재학생 (김순천)" },
  { email: "freshman@demo.chatmore.kr", label: "신입생 · 온보딩 체험" },
  { email: "grad@demo.chatmore.kr", label: "대학원생" },
  { email: "global@demo.chatmore.kr", label: "외국인 유학생" },
];
const DEMO_PASSWORD = "chatmore-demo";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "로그인 중..." : "로그인"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(userLogin, initial);
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  function fillDemo(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (pwRef.current) pwRef.current.value = DEMO_PASSWORD;
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4" noValidate>
        {state.message && (
          <p
            role="alert"
            className="rounded-md border border-down/30 bg-down/5 px-4 py-3 text-sm text-down"
          >
            {state.message}
          </p>
        )}
        <Field label="학교 이메일" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            ref={emailRef}
            autoComplete="username"
            placeholder="예: student@demo.chatmore.kr"
            required
            className={inputCls()}
          />
        </Field>
        <Field label="비밀번호" htmlFor="password" required>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              ref={pwRef}
              autoComplete="current-password"
              required
              className={inputCls()}
            />
            <button
              type="button"
              aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showPw ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>
        </Field>
        <SubmitButton />
      </form>

      <button
        type="button"
        disabled
        title="학교 계정 연동 예정"
        className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-hairline bg-soft text-[15px] font-semibold text-muted"
      >
        <School size={16} aria-hidden /> 학교 계정으로 로그인 (연동 예정)
      </button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={() =>
            window.alert(
              "시범 운영 단계에서는 비밀번호 재설정이 지원되지 않습니다.\n데모 계정 비밀번호: chatmore-demo"
            )
          }
          className="text-body hover:text-ink"
        >
          비밀번호 찾기
        </button>
        <Link href="/signup" className="text-primary">
          회원가입
        </Link>
      </div>

      {/* 데모 계정 안내 */}
      <div className="rounded-md bg-soft p-4">
        <p className="text-xs font-semibold text-ink">
          데모 계정으로 체험하기{" "}
          <span className="font-normal text-muted">(비밀번호: {DEMO_PASSWORD})</span>
        </p>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => fillDemo(a.email)}
              className="rounded-sm border border-hairline bg-surface px-2.5 py-2 text-left text-xs text-body hover:border-primary hover:text-ink"
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          버튼을 누르면 입력창에 계정 정보가 채워집니다.
        </p>
      </div>
    </div>
  );
}
