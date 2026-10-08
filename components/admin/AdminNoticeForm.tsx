"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveAdminNotice } from "@/lib/actions/admin";
import type { FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const initial: FormState = { ok: false, message: "" };

type Data = {
  id?: string;
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  department?: string;
  targetUsers?: string;
  startAt?: string;
  endAt?: string;
  sourceUrl?: string | null;
  status?: string;
  isPinned?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "저장 중..." : "저장하기"}
    </Button>
  );
}

export function AdminNoticeForm({
  data,
  categories,
}: {
  data?: Data;
  categories: string[];
}) {
  const [state, formAction] = useFormState(saveAdminNotice, initial);
  const err = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "rounded-md bg-up/10 px-4 py-3 text-sm text-up"
              : "rounded-md border border-down/30 bg-down/5 px-4 py-3 text-sm text-down"
          }
        >
          {state.message}
        </p>
      )}
      {data?.id && <input type="hidden" name="id" value={data.id} />}

      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <Field label="제목" htmlFor="title" required error={err.title}>
          <input id="title" name="title" required defaultValue={data?.title} className={inputCls(err.title)} />
        </Field>
        <Field label="카테고리" htmlFor="category" required>
          <select id="category" name="category" defaultValue={data?.category ?? categories[0]} className={inputCls()}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="요약" htmlFor="summary" required error={err.summary}>
        <textarea id="summary" name="summary" rows={2} required defaultValue={data?.summary} className={inputCls(err.summary)} />
      </Field>

      <Field label="본문 (HTML)" htmlFor="content" required error={err.content} hint="<h2>, <p>, <ul>, <li>, <strong>, <a> 태그를 사용할 수 있습니다.">
        <textarea id="content" name="content" rows={10} required defaultValue={data?.content} className={`${inputCls(err.content)} font-mono text-sm`} />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="담당 부서" htmlFor="department" required error={err.department}>
          <input id="department" name="department" required defaultValue={data?.department} className={inputCls(err.department)} />
        </Field>
        <Field label="대상 사용자" htmlFor="targetUsers">
          <input id="targetUsers" name="targetUsers" defaultValue={data?.targetUsers ?? "전체"} className={inputCls()} />
        </Field>
        <Field label="공식 원문 URL" htmlFor="sourceUrl" error={err.sourceUrl}>
          <input id="sourceUrl" name="sourceUrl" type="url" defaultValue={data?.sourceUrl ?? ""} placeholder="https://" className={inputCls(err.sourceUrl)} />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Field label="신청 시작일" htmlFor="startAt">
          <input id="startAt" name="startAt" type="date" defaultValue={data?.startAt} className={inputCls()} />
        </Field>
        <Field label="신청 마감일" htmlFor="endAt">
          <input id="endAt" name="endAt" type="date" defaultValue={data?.endAt} className={inputCls()} />
        </Field>
        <Field label="게시 상태" htmlFor="status" required>
          <select id="status" name="status" defaultValue={data?.status ?? "draft"} className={inputCls()}>
            <option value="draft">임시저장</option>
            <option value="published">공개</option>
            <option value="archived">보관</option>
          </select>
        </Field>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <input type="checkbox" name="isPinned" defaultChecked={data?.isPinned} className="h-4 w-4 accent-[#0052ff]" />
            중요 공지 고정
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link href="/admin/notices" className="rounded-md bg-strong px-5 py-2.5 text-sm font-semibold text-ink hover:bg-hairline">
          목록으로
        </Link>
      </div>
    </form>
  );
}
