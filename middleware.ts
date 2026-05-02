import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/middleware";

// ─── Middleware ───────────────────────────────────────────────────────────────
// Refreshes Supabase session cookies on every request.
// Route-level auth guards are handled client-side per dashboard page.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always refresh the Supabase session
  const supabaseResponse = createClient(request);

  // Public routes — pass through as-is
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname === "/"
  ) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
