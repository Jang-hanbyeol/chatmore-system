"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import type { FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Field";

const initial: FormState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "추가 중..." : "추가"}
    </Button>
  );
}

export function PersonalEventForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(action, initial);

  return (
    <div>
      <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
        <Plus size={15} aria-hidden /> 개인 일정 추가
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label="개인 일정 추가">
          <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-lg bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">개인 일정 추가</h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-soft"
              >
                <X size={17} aria-hidden />
              </button>
            </div>
            <form action={formAction} className="mt-4 space-y-4">
              {state.message && (
                <p
                  role={state.ok ? "status" : "alert"}
                  className={
                    state.ok
                      ? "rounded-md bg-up/10 px-3 py-2 text-sm text-up"
                      : "rounded-md bg-down/5 px-3 py-2 text-sm text-down"
                  }
                >
                  {state.message}
                </p>
              )}
              <div>
                <label htmlFor="pe-title" className="block text-sm font-semibold text-ink">
                  제목
                </label>
                <input id="pe-title" name="title" required className={`${inputCls()} mt-1.5`} />
              </div>
              <div>
                <label htmlFor="pe-date" className="block text-sm font-semibold text-ink">
                  날짜
                </label>
                <input id="pe-date" name="date" type="date" required className={`${inputCls()} mt-1.5`} />
              </div>
              <SubmitButton />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
