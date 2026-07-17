"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    const confirmation = String(data.get("confirmation"));

    if (password !== confirmation) {
      setLoading(false);
      const message = "Passwords do not match.";
      setFormError(message);
      toast.error(message);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      const message = "Supabase is not configured.";
      setFormError(message);
      toast.error(message);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const message = "The password could not be updated. Request a new recovery link.";
        setFormError(message);
        toast.error(message);
        return;
      }

      toast.success("Password updated");
      router.push("/dashboard");
      router.refresh();
    } catch {
      const message = "The password could not be updated. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least eight characters." footer={null}>
      <form onSubmit={submit} className="space-y-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <Label htmlFor="confirmation">Confirm password</Label>
          <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <Button disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
