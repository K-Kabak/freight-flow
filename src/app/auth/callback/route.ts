import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeDestination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function publicOrigin(request: Request) {
  const fallback = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : fallback.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = publicOrigin(request);
  const code = url.searchParams.get("code");
  const destination = safeDestination(url.searchParams.get("next"));

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
