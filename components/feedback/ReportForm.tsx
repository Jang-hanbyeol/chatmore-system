"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { submitReport } from "@/lib/actions/user";
import type { FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { REPORT_TYPES } from "@/lib/validation/schemas";

const initial: FormState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "접수 중..." : "신고 접수"}
    </Button>
  );
}

export function ReportForm({ defaultMessageId }: { defaultMessageId?: string }) {
  const [state, formAction] = useFormState(submitReport, initial);

  if (state.ok) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 size={40} className="mx-auto text-up" aria-hidden />
        <p className="mt-3 text-lg font-semibold text-ink">의견이 접수되었습니다.</p>
        <p className="mt-1.5 text-sm text-body">
          보내주신 내용은 답변 품질 개선에 활용됩니다.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <p role="alert" className="rounded-md border border-down/30 bg-down/5 px-4 py-3 text-sm text-down">
          {state.message}
        </p>
      )}
      <Field label="신고 유형" htmlFor="reportType" required error={state.fieldErrors?.reportType}>
        <select id="reportType" name="reportType" required className={inputCls()} defaultValue="정보 오류">
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      {defaultMessageId && (
        <>
          <input type="hidden" name="messageId" value={defaultMessageId} />
          <p className="rounded-md bg-soft px-4 py-2.5 text-xs text-muted">
            선택한 챗봇 답변이 신고에 함께 첨부됩니다.
          </p>
        </>
      )}
      <Field
        label="상세 내용"
        htmlFor="content"
        required
        error={state.fieldErrors?.content}
        hint="어떤 정보가 잘못되었는지, 어떤 문제가 있었는지 알려주세요."
      >
        <textarea id="content" name="content" rows={5} required className={inputCls(state.fieldErrors?.content)} />
      </Field>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="contactBack" className="h-4 w-4 accent-[#0052ff]" />
        처리 결과 회신을 받겠습니다. (서비스 내 알림)
      </label>
      <SubmitButton />
    </form>
  );
}
