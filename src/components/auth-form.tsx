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
  const [formError, setFormError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password") || "");
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      const message = "Authentication is unavailable in demo mode.";
      setFormError(message);
      toast.info(message);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const message = "Unable to sign in with these credentials.";
          setFormError(message);
          toast.error(message);
          return;
        }

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
        if (error) {
          const message = "The account could not be created. Check your details and try again.";
          setFormError(message);
          toast.error(message);
          return;
        }

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
      if (error) {
        const message = "A recovery email could not be sent. Please try again later.";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success("Check your inbox");
    } catch {
      const message = "Authentication is temporarily unavailable. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      )}
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
        />
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
            autoComplete={mode === "register" ? "new-password" : "current-password"}
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
