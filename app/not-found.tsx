import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <Logo variant="vertical" height={96} />
      <h1 className="mt-7 text-2xl font-semibold text-ink">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 max-w-md text-body">
        주소가 잘못되었거나 삭제된 페이지입니다. 찾는 정보가 있다면 Chatmore에게
        직접 물어보세요.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/home" className="rounded-md bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-active">
          홈으로
        </Link>
        <Link href="/chat" className="rounded-md bg-strong px-5 py-2.5 font-semibold text-ink hover:bg-hairline">
          챗봇에게 질문
        </Link>
      </div>
    </div>
  );
}
