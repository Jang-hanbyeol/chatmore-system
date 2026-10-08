"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminLogin, type FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: FormState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "확인 중..." : "로그인"}
    </Button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(adminLogin, initial);
  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p role="alert" className="rounded-md border border-down/30 bg-down/5 px-4 py-3 text-sm text-down">
          {state.message}
        </p>
      )}
      <Field label="이메일" htmlFor="email" required>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputCls()} />
      </Field>
      <Field label="비밀번호" htmlFor="password" required>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls()} />
      </Field>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-[#0052ff]" />
        로그인 상태 유지 (30일)
      </label>
      <SubmitButton />
    </form>
  );
}
