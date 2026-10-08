"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { saveOnboarding } from "@/lib/actions/user";
import type { FormState } from "@/lib/actions/auth";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { INTEREST_OPTIONS, USER_TYPES } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

const initial: FormState = { ok: false, message: "" };
const STEPS = ["사용자 유형", "기본 정보", "관심 정보", "알림 설정"];

const NOTIFY_OPTIONS = [
  { name: "notifySchedule", label: "중요 학사일정", defaultOn: true },
  { name: "notifyScholarship", label: "장학금 마감", defaultOn: true },
  { name: "notifyProgram", label: "비교과 신청 마감", defaultOn: true },
  { name: "notifyBookmark", label: "즐겨찾기 공지 변경", defaultOn: true },
  { name: "notifyRecommend", label: "추천 정보", defaultOn: false },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "저장 중..." : "설정 완료"}
      <Check size={16} aria-hidden />
    </Button>
  );
}

export function OnboardingWizard({
  defaults,
}: {
  defaults: {
    userType: string;
    college: string;
    department: string;
    grade: string;
    admissionYear: string;
    interests: string[];
  };
}) {
  const [state, formAction] = useFormState(saveOnboarding, initial);
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState(defaults.userType || "재학생");
  const [interests, setInterests] = useState<string[]>(defaults.interests);

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col"
      onKeyDown={(e) => {
        // 마지막 단계 전에는 입력란에서 Enter 가 전체 제출(단계 건너뛰기) 대신 다음 단계로 이동
        if (e.key === "Enter" && step < 3 && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
          setStep((s) => s + 1);
        }
      }}
    >
      {/* 진행 표시 */}
      <ol className="mb-8 flex items-center gap-2" aria-label="진행 단계">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                i < step && "bg-up text-white",
                i === step && "bg-primary text-white",
                i > step && "bg-strong text-muted"
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check size={13} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-[0.6875rem]", i === step ? "font-semibold text-ink" : "text-muted")}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {state.message && (
        <p role="alert" className="mb-4 rounded-md border border-down/30 bg-down/5 px-4 py-3 text-sm text-down">
          {state.message}
        </p>
      )}

      {/* STEP 1: 사용자 유형 */}
      <div hidden={step !== 0} className={step === 0 ? "flex-1" : undefined}>
        <h1 className="text-xl font-semibold text-ink">어떤 사용자이신가요?</h1>
        <p className="mt-1.5 text-sm text-body">맞춤 정보 추천에 사용됩니다.</p>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {USER_TYPES.map((t) => (
            <label
              key={t}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3.5 text-[0.9375rem] font-medium",
                userType === t
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-hairline bg-surface text-body hover:border-muted"
              )}
            >
              <input
                type="radio"
                name="userType"
                value={t}
                checked={userType === t}
                onChange={() => setUserType(t)}
                className="h-4 w-4 accent-[#0052ff]"
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {/* STEP 2: 기본 정보 */}
      <div hidden={step !== 1} className={step === 1 ? "flex-1 space-y-4" : undefined}>
        <h1 className="text-xl font-semibold text-ink">기본 정보를 알려주세요</h1>
        <p className="text-sm text-body">모든 항목은 선택 사항입니다.</p>
        <Field label="소속 단과대학" htmlFor="college">
          <input id="college" name="college" defaultValue={defaults.college} placeholder="예: 공과대학" className={inputCls()} />
        </Field>
        <Field label="학과" htmlFor="department">
          <input id="department" name="department" defaultValue={defaults.department} placeholder="예: 컴퓨터공학과" className={inputCls()} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="학년" htmlFor="grade">
            <select id="grade" name="grade" defaultValue={defaults.grade} className={inputCls()}>
              <option value="">선택 안 함</option>
              {["1학년", "2학년", "3학년", "4학년", "대학원", "기타"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="입학 연도" htmlFor="admissionYear">
            <input id="admissionYear" name="admissionYear" defaultValue={defaults.admissionYear} placeholder="예: 2024" className={inputCls()} />
          </Field>
        </div>
      </div>

      {/* STEP 3: 관심 정보 */}
      <div hidden={step !== 2} className={step === 2 ? "flex-1" : undefined}>
        <h1 className="text-xl font-semibold text-ink">관심 있는 정보를 선택하세요</h1>
        <p className="mt-1.5 text-sm text-body">여러 개를 선택할 수 있습니다.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => {
            const on = interests.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "cursor-pointer rounded-pill border px-4 py-2 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-surface text-body hover:border-muted"
                )}
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={opt}
                  checked={on}
                  onChange={() =>
                    setInterests((prev) =>
                      on ? prev.filter((v) => v !== opt) : [...prev, opt]
                    )
                  }
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>
      </div>

      {/* STEP 4: 알림 설정 */}
      <div hidden={step !== 3} className={step === 3 ? "flex-1" : undefined}>
        <h1 className="text-xl font-semibold text-ink">알림을 설정하세요</h1>
        <p className="mt-1.5 text-sm text-body">중요한 일정을 놓치지 않도록 도와드립니다.</p>
        <div className="mt-6 space-y-2.5">
          {NOTIFY_OPTIONS.map((n) => (
            <label
              key={n.name}
              className="flex items-center justify-between rounded-md border border-hairline bg-surface px-4 py-3.5"
            >
              <span className="text-[0.9375rem] font-medium text-ink">{n.label}</span>
              <input
                type="checkbox"
                name={n.name}
                defaultChecked={n.defaultOn}
                className="h-4 w-4 accent-[#0052ff]"
              />
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          현재 알림은 서비스 내 알림함으로 제공되며, 이메일·앱 푸시 채널은 연동 예정입니다.
        </p>
      </div>

      {/* 이동 버튼 */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft size={16} aria-hidden /> 이전
          </Button>
        )}
        {step < 3 ? (
          <Button type="button" className="flex-1" onClick={() => setStep((s) => s + 1)}>
            다음 <ArrowRight size={16} aria-hidden />
          </Button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}
