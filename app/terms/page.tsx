import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl p-5 py-10 md:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} aria-hidden /> 돌아가기
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">이용약관</h1>
      <div className="prose-basic mt-6">
        <p>본 약관은 Chatmore 챗봇 시스템 이용 조건을 규정합니다. (시범 운영 단계의 예시 약관입니다.)</p>
        <h2>1. 서비스 성격</h2>
        <p>
          현재 챗봇 답변은 데모 데이터 기반이며 실제 학사·장학금 정보와 다를 수
          있습니다. 중요한 신청·행정 업무는 반드시 공식 원문과 담당 부서를
          확인한 뒤 진행해 주세요.
        </p>
        <h2>2. 이용자의 의무</h2>
        <ul>
          <li>타인의 개인정보를 입력하거나 수집하는 행위 금지</li>
          <li>서비스의 정상 운영을 방해하는 행위 금지</li>
          <li>서비스 콘텐츠의 무단 복제·배포 금지</li>
        </ul>
        <h2>3. 책임의 한계</h2>
        <p>AI 생성 답변의 완전성을 보장하지 않으며, 이용자가 원문 확인 없이 내린 판단에 대해 책임을 지지 않습니다.</p>
      </div>
    </div>
  );
}
