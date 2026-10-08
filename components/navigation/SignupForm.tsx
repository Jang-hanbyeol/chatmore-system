"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Info } from "lucide-react";
import { signupAttempt, type FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: FormState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "확인 중..." : "가입하기"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAttempt, initial);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <p className="flex items-start gap-2 rounded-md bg-primary/5 px-4 py-3 text-xs leading-relaxed text-primary">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
        시범 운영 단계에서는 데모 계정으로만 이용할 수 있습니다. 정식 오픈 시
        학교 계정 연동 가입이 제공될 예정입니다.
      </p>
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-warn/30 bg-warn/5 px-4 py-3 text-sm leading-relaxed text-warn"
        >
          {state.message}{" "}
          <Link href="/login" className="font-semibold underline">
            로그인 화면으로
          </Link>
        </p>
      )}
      <Field label="이름" htmlFor="name" required>
        <input id="name" name="name" required className={inputCls()} />
      </Field>
      <Field label="학교 이메일" htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="예: hong@scnu.ac.kr"
          required
          className={inputCls()}
        />
      </Field>
      <Field label="비밀번호" htmlFor="password" required hint="10자 이상을 권장합니다.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={inputCls()}
        />
      </Field>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#0052ff]" />
        <span>
          (필수){" "}
          <Link href="/terms" className="text-primary underline">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="text-primary underline">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </span>
      </label>
      <SubmitButton />
    </form>
  );
}
