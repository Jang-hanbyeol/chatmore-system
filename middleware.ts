import { NextRequest, NextResponse } from "next/server";

/**
 * 라우트 보호 미들웨어 (1차 형식 검사).
 * Edge 런타임 제약으로 서명 검증은 각 레이아웃(서버 컴포넌트)에서 수행하고,
 * 여기서는 쿠키 존재·만료 형식만 확인해 미로그인 접근을 빠르게 차단합니다.
 */
const USER_COOKIE = "chatmore_user_session";
const ADMIN_COOKIE = "chatmore_admin_session";

const PUBLIC_PATHS = ["/login", "/signup", "/privacy", "/terms"];

function looksValid(token: string | undefined): boolean {
  const parts = token?.split(".") ?? [];
  return parts.length === 3 && Number(parts[1]) > Date.now() && parts[2].length > 10;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 영역
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!looksValid(request.cookies.get(ADMIN_COOKIE)?.value)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 공개 경로
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // 사용자 영역
  if (!looksValid(request.cookies.get(USER_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = ""; // 원래 쿼리는 next 안에만 담는다
    // 로그인 후 원래 페이지(쿼리 포함)로 돌아가도록 — 서버에서 safeNextPath 로 재검증
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|fonts|images|uploads|api).*)",
  ],
};
