"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveInfoSource } from "@/lib/actions/admin";
import type { FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DATA_STATUSES } from "@/lib/validation/schemas";
import { DATA_STATUS_LABELS } from "@/lib/utils";

const initial: FormState = { ok: false, message: "" };

type Data = {
  id?: string;
  title?: string;
  category?: string;
  summary?: string;
  content?: string;
  department?: string;
  targetUsers?: string;
  keywords?: string;
  sourceUrl?: string | null;
  startAt?: string;
  endAt?: string;
  dataStatus?: string;
  isAiSearchable?: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "저장 중..." : "저장하기"}
    </Button>
  );
}

export function InfoSourceForm({
  data,
  categories,
}: {
  data?: Data;
  categories: string[];
}) {
  const [state, formAction] = useFormState(saveInfoSource, initial);
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

      <Field label="요약" htmlFor="summary" required error={err.summary} hint="챗봇 답변의 첫 문장으로 사용됩니다.">
        <textarea id="summary" name="summary" rows={2} required defaultValue={data?.summary} className={inputCls(err.summary)} />
      </Field>

      <Field label="본문" htmlFor="content" required error={err.content} hint="줄 단위로 핵심 내용을 정리하면 답변에 항목으로 표시됩니다.">
        <textarea id="content" name="content" rows={8} required defaultValue={data?.content} className={inputCls(err.content)} />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="담당 부서" htmlFor="department" required error={err.department}>
          <input id="department" name="department" required defaultValue={data?.department} className={inputCls(err.department)} />
        </Field>
        <Field label="대상 사용자" htmlFor="targetUsers" hint="쉼표로 구분 (예: 재학생,신입생)">
          <input id="targetUsers" name="targetUsers" defaultValue={data?.targetUsers ?? "전체"} className={inputCls()} />
        </Field>
        <Field label="출처 URL" htmlFor="sourceUrl" error={err.sourceUrl}>
          <input id="sourceUrl" name="sourceUrl" type="url" defaultValue={data?.sourceUrl ?? ""} placeholder="https://" className={inputCls(err.sourceUrl)} />
        </Field>
      </div>

      <Field label="검색 키워드" htmlFor="keywords" hint="쉼표로 구분. 챗봇 검색 정확도를 높입니다.">
        <input id="keywords" name="keywords" defaultValue={data?.keywords} className={inputCls()} />
      </Field>

      <div className="grid gap-5 md:grid-cols-4">
        <Field label="신청 시작일" htmlFor="startAt">
          <input id="startAt" name="startAt" type="date" defaultValue={data?.startAt} className={inputCls()} />
        </Field>
        <Field label="신청 마감일" htmlFor="endAt">
          <input id="endAt" name="endAt" type="date" defaultValue={data?.endAt} className={inputCls()} />
        </Field>
        <Field label="데이터 상태" htmlFor="dataStatus" required>
          <select id="dataStatus" name="dataStatus" defaultValue={data?.dataStatus ?? "draft"} className={inputCls()}>
            {DATA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DATA_STATUS_LABELS[s]} ({s})
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="isAiSearchable"
              defaultChecked={data?.isAiSearchable ?? true}
              className="h-4 w-4 accent-[#0052ff]"
            />
            AI 검색 포함
          </label>
        </div>
      </div>

      <p className="rounded-md bg-soft px-4 py-2.5 text-xs text-muted">
        상태가 <strong>사용중(active)</strong>이고 <strong>AI 검색 포함</strong>일 때만
        챗봇 답변 검색에 사용됩니다. 저장 시 데이터 기준일이 오늘로 갱신됩니다.
      </p>

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link href="/admin/data" className="rounded-md bg-strong px-5 py-2.5 text-sm font-semibold text-ink hover:bg-hairline">
          목록으로
        </Link>
      </div>
    </form>
  );
}
