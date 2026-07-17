import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function safeDestination(value: string | null, origin: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return "/dashboard";
    }

    const destination = new URL(value, origin);
    return destination.origin === origin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const destination = safeDestination(url.searchParams.get("next"), origin);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_callback_code", origin));
  }

  const supabase = await createClient();
  const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {
    error: new Error("Supabase is not configured"),
  };

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid_callback", origin));
  }

  return NextResponse.redirect(new URL(destination, origin));
}
