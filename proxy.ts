import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Pages that don't require authentication
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to get the actual path
  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, "") || "/";

  // Allow public routes
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  if (!isPublic) {
    // For protected routes, check for a cookie or just let client-side handle it
    // (client-side auth guard in layout is the primary protection)
    // We honour the intl middleware first
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except static files, _next, and api routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
