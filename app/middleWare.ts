import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Demo mode: don't enforce server-side session cookie. The app uses
  // Firebase client-auth for gating UI. Allow all requests through.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
