import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(items) { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const guestOnly = path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/forgot-password");
  const authFlow = path.startsWith("/auth/callback") || path.startsWith("/reset-password");
  if (!user && !guestOnly && !authFlow) { const target = request.nextUrl.clone(); target.pathname = "/login"; return NextResponse.redirect(target); }
  if (user && guestOnly) { const target = request.nextUrl.clone(); target.pathname = "/dashboard"; return NextResponse.redirect(target); }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
