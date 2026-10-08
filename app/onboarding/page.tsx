import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { Logo } from "@/components/ui/Logo";
import { OnboardingWizard } from "@/components/navigation/OnboardingWizard";

export const metadata: Metadata = { title: "시작 설정" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboarded) redirect("/home");
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-8">
      <div className="mb-6 flex items-center justify-center">
        <Logo variant="horizontal" height={28} priority />
      </div>
      <OnboardingWizard
        defaults={{
          userType: user.userType,
          college: user.college ?? "",
          department: user.department ?? "",
          grade: user.grade ?? "",
          admissionYear: user.admissionYear ?? "",
          interests: user.interests ? user.interests.split(",") : [],
        }}
      />
    </div>
  );
}
