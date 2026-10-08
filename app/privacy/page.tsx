import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-5 py-10 md:py-14">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} aria-hidden /> 돌아가기
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">개인정보처리방침</h1>
      <div className="prose-basic mt-6">
        <p>
          Chatmore(이하 "서비스")는 개인정보 보호법 등 관련 법령을 준수합니다.
          본 문서는 시범 운영 단계의 예시 방침이며 정식 서비스 시 갱신됩니다.
        </p>
        <h2>1. 수집 항목과 목적</h2>
        <ul>
          <li>계정 정보(이메일, 이름, 소속): 서비스 제공과 맞춤 추천</li>
          <li>질문·대화 기록: 답변 제공, 품질 개선 (설정에서 저장 여부 선택 가능)</li>
          <li>피드백·오류 신고: 답변 품질 개선</li>
        </ul>
        <h2>2. 보유 및 이용 기간</h2>
        <p>회원 탈퇴 또는 수집일로부터 1년 경과 시 지체 없이 파기합니다. 대화 기록은 설정에서 즉시 삭제할 수 있습니다.</p>
        <h2>3. 개인화 데이터 활용</h2>
        <p>맞춤 추천을 위해 관심 분야와 질문 데이터를 활용하며, 설정에서 동의를 철회할 수 있습니다.</p>
        <h2>4. 이용자의 권리</h2>
        <p>설정 화면에서 데이터 다운로드, 대화 기록 삭제, 회원 탈퇴를 이용할 수 있습니다.</p>
        <h2>5. 민감정보 처리</h2>
        <p>챗봇 입력창에 주민등록번호, 비밀번호, 계좌번호 등 민감정보를 입력하지 마세요. 감지된 민감정보 패턴은 저장 전 자동 마스킹됩니다.</p>
      </div>
    </div>
  );
}
