import { NextRequest, NextResponse } from "next/server";

const USER = process.env.BASIC_AUTH_USER;
const PASSWORD = process.env.BASIC_AUTH_PASSWORD;

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const decoded = atob(authHeader.slice("Basic ".length));
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return user === USER && password === PASSWORD;
}

export function middleware(req: NextRequest) {
  // BASIC_AUTH_USER/PASSWORDが未設定の場合は認証をスキップ（ローカル開発用）
  if (!USER || !PASSWORD) {
    return NextResponse.next();
  }

  if (isAuthorized(req)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="doc-planner-ai"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
