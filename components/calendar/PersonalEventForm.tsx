"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import type { FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Field";
import { useDialog } from "@/components/ui/useDialog";

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
  // 열 때마다 key 를 바꿔 폼 상태(이전 메시지·입력값)를 초기화
  const [formKey, setFormKey] = useState(0);
  const openDialog = () => {
    setFormKey((k) => k + 1);
    setOpen(true);
  };
  const dialogRef = useDialog(open, () => setOpen(false));

  return (
    <div>
      <Button variant="secondary" size="sm" type="button" onClick={openDialog}>
        <Plus size={15} aria-hidden /> 개인 일정 추가
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label="개인 일정 추가">
          <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div ref={dialogRef} className="relative w-full max-w-sm rounded-lg bg-surface p-6">
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
            <EventForm key={formKey} action={action} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** 추가 성공 시 모달을 닫는다 (같은 일정을 다시 눌러 중복 등록하는 것 방지) */
function EventForm({
  action,
  onDone,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  onDone: () => void;
}) {
  const [state, formAction] = useFormState(action, initial);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (state.ok) onDoneRef.current();
  }, [state]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {state.message && !state.ok && (
        <p role="alert" className="rounded-md bg-down/5 px-3 py-2 text-sm text-down">
          {state.message}
        </p>
      )}
      <div>
        <label htmlFor="pe-title" className="block text-sm font-semibold text-ink">
          제목
        </label>
        <input id="pe-title" name="title" required maxLength={100} className={`${inputCls()} mt-1.5`} />
      </div>
      <div>
        <label htmlFor="pe-date" className="block text-sm font-semibold text-ink">
          날짜
        </label>
        <input id="pe-date" name="date" type="date" required className={`${inputCls()} mt-1.5`} />
      </div>
      <SubmitButton />
    </form>
  );
}
