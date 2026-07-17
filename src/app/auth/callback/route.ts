import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const validationOrigin = "https://freightflow.invalid";

export function safeDestination(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) {
      return "/dashboard";
    }

    const destination = new URL(value, validationOrigin);
    return destination.origin === validationOrigin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { location: path } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = safeDestination(url.searchParams.get("next"));

  if (!code) {
    return redirectTo("/login?error=missing_callback_code");
  }

  const supabase = await createClient();
  const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {
    error: new Error("Supabase is not configured"),
  };

  if (error) {
    return redirectTo("/login?error=invalid_callback");
  }

  return redirectTo(destination);
}
