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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    const confirmation = String(data.get("confirmation"));

    if (password !== confirmation) {
      setLoading(false);
      toast.error("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      toast.error("Supabase is not configured.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least eight characters." footer={null}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <div>
          <Label htmlFor="confirmation">Confirm password</Label>
          <Input id="confirmation" name="confirmation" type="password" minLength={8} required />
        </div>
        <Button disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
