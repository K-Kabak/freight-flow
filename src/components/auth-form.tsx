"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password") || "");
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      toast.info("Authentication is unavailable in demo mode.");
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);

      toast.success("Welcome back");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);

      if (data.session) {
        toast.success("Account created");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.success("Check your inbox to confirm your account");
      }
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your inbox");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required placeholder="you@company.com" />
      </div>
      {mode !== "reset" && (
        <div>
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-xs font-semibold text-emerald-700">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>
      )}
      <Button disabled={loading} className="w-full">
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create account"
              : "Send reset link"}
      </Button>
    </form>
  );
}
