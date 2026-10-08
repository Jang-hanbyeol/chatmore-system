"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  deleteChatHistory,
  saveSettings,
  updateProfile,
  withdrawAccount,
} from "@/lib/actions/user";
import type { FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { INTEREST_OPTIONS, USER_TYPES } from "@/lib/validation/schemas";
import { useState, useTransition } from "react";

const initial: FormState = { ok: false, message: "" };

function Msg({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={
        state.ok
          ? "rounded-md bg-up/10 px-4 py-2.5 text-sm text-up"
          : "rounded-md bg-down/5 px-4 py-2.5 text-sm text-down"
      }
    >
      {state.message}
    </p>
  );
}

function SaveButton({ label = "저장하기" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "저장 중..." : label}
    </Button>
  );
}

function Toggle({
  name,
  label,
  desc,
  defaultChecked,
}: {
  name: string;
  label: string;
  desc?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-hairline px-4 py-3.5">
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {desc && <span className="text-xs text-muted">{desc}</span>}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 shrink-0 accent-[#0052ff]"
      />
    </label>
  );
}

export function ProfileForm({
  user,
}: {
  user: {
    name: string;
    email: string;
    userType: string;
    department: string;
    grade: string;
    interests: string[];
  };
}) {
  const [state, formAction] = useFormState(updateProfile, initial);
  return (
    <form action={formAction} className="space-y-5">
      <Msg state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="이름" htmlFor="p-name">
          <input id="p-name" value={user.name} disabled className={`${inputCls()} bg-soft`} />
        </Field>
        <Field label="계정 이메일" htmlFor="p-email">
          <input id="p-email" value={user.email} disabled className={`${inputCls()} bg-soft`} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="사용자 유형" htmlFor="userType">
          <select id="userType" name="userType" defaultValue={user.userType} className={inputCls()}>
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="학과" htmlFor="department">
          <input id="department" name="department" defaultValue={user.department} className={inputCls()} />
        </Field>
        <Field label="학년" htmlFor="grade">
          <input id="grade" name="grade" defaultValue={user.grade} className={inputCls()} />
        </Field>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-ink">관심 분야</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <label key={opt} className="cursor-pointer">
              <input
                type="checkbox"
                name="interests"
                value={opt}
                defaultChecked={user.interests.includes(opt)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-pill border border-hairline px-3.5 py-1.5 text-sm text-body peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white">
                {opt}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SaveButton />
    </form>
  );
}

export function PreferencesForm({
  user,
}: {
  user: {
    answerLength: string;
    autoExpandSources: boolean;
    showSuggestions: boolean;
    saveHistory: boolean;
    allowPersonalization: boolean;
    fontSize: string;
    highContrast: boolean;
    reduceMotion: boolean;
    language: string;
  };
}) {
  const [state, formAction] = useFormState(saveSettings, initial);
  return (
    <form action={formAction} className="space-y-6">
      <Msg state={state} />

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-ink">챗봇 설정</h3>
        <Field label="답변 길이" htmlFor="answerLength">
          <select id="answerLength" name="answerLength" defaultValue={user.answerLength} className={inputCls()}>
            <option value="simple">간단한 설명</option>
            <option value="detailed">자세한 설명</option>
          </select>
        </Field>
        <Toggle name="autoExpandSources" label="출처 자동 펼치기" defaultChecked={user.autoExpandSources} />
        <Toggle name="showSuggestions" label="추천 질문 표시" defaultChecked={user.showSuggestions} />
        <Toggle
          name="saveHistory"
          label="대화 기록 저장"
          desc="끄면 이후 대화가 기록 목록에 표시되지 않습니다."
          defaultChecked={user.saveHistory}
        />
      </section>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-ink">접근성</h3>
        <Field label="글자 크기" htmlFor="fontSize">
          <select id="fontSize" name="fontSize" defaultValue={user.fontSize} className={inputCls()}>
            <option value="default">기본</option>
            <option value="large">크게</option>
            <option value="xlarge">더 크게</option>
          </select>
        </Field>
        <Toggle name="highContrast" label="고대비 모드" defaultChecked={user.highContrast} />
        <Toggle name="reduceMotion" label="애니메이션 감소" defaultChecked={user.reduceMotion} />
        <Field label="언어" htmlFor="language">
          <select id="language" name="language" defaultValue={user.language} className={inputCls()}>
            <option value="ko">한국어</option>
            <option value="en">English (다국어 응답 연동 예정)</option>
          </select>
        </Field>
      </section>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-ink">개인정보</h3>
        <Toggle
          name="allowPersonalization"
          label="맞춤 추천 데이터 활용 동의"
          desc="질문·관심 분야를 추천 품질 개선에 활용합니다."
          defaultChecked={user.allowPersonalization}
        />
      </section>

      <SaveButton />
    </form>
  );
}

export function DangerZone() {
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-3">
      {msg && (
        <p role="status" className="rounded-md bg-soft px-4 py-2.5 text-sm text-body">
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <a
          href="/api/my-data"
          className="rounded-md border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-soft"
        >
          내 데이터 다운로드 (JSON)
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("모든 대화 기록을 삭제하시겠습니까?")) {
              startTransition(async () => {
                const r = await deleteChatHistory();
                setMsg(r.message);
              });
            }
          }}
          className="rounded-md border border-hairline px-4 py-2.5 text-sm font-semibold text-ink hover:bg-soft"
        >
          대화 기록 전체 삭제
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("정말 탈퇴하시겠습니까?")) {
              startTransition(async () => {
                const r = await withdrawAccount();
                if (r) setMsg(r.message);
              });
            }
          }}
          className="rounded-md border border-down/30 px-4 py-2.5 text-sm font-semibold text-down hover:bg-down/5"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
