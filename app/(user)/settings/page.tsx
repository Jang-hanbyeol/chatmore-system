import type { Metadata } from "next";
import { requireOnboardedUser } from "@/lib/auth/guards";
import {
  DangerZone,
  PreferencesForm,
  ProfileForm,
} from "@/components/feedback/SettingsForms";

export const metadata: Metadata = { title: "설정" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">설정</h1>
        <p className="mt-1.5 text-[15px] text-body">
          프로필, 챗봇 응답 방식과 접근성을 설정합니다.
        </p>
      </header>

      <section aria-labelledby="profile" className="rounded-lg border border-hairline bg-surface p-6">
        <h2 id="profile" className="mb-4 font-semibold text-ink">프로필</h2>
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            userType: user.userType,
            department: user.department ?? "",
            grade: user.grade ?? "",
            interests: user.interests ? user.interests.split(",") : [],
          }}
        />
      </section>

      <section aria-labelledby="prefs" className="rounded-lg border border-hairline bg-surface p-6">
        <h2 id="prefs" className="mb-4 font-semibold text-ink">서비스 설정</h2>
        <PreferencesForm
          user={{
            answerLength: user.answerLength,
            autoExpandSources: user.autoExpandSources,
            showSuggestions: user.showSuggestions,
            saveHistory: user.saveHistory,
            allowPersonalization: user.allowPersonalization,
            fontSize: user.fontSize,
            highContrast: user.highContrast,
            reduceMotion: user.reduceMotion,
            language: user.language,
          }}
        />
      </section>

      <section aria-labelledby="privacy-zone" className="rounded-lg border border-hairline bg-surface p-6">
        <h2 id="privacy-zone" className="mb-1.5 font-semibold text-ink">데이터 관리</h2>
        <p className="mb-4 text-sm text-body">
          내 데이터를 내려받거나 대화 기록을 삭제할 수 있습니다.
        </p>
        <DangerZone />
      </section>
    </div>
  );
}
