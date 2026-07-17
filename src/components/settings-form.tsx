"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input, Label, Select } from "@/components/ui/input";
import type { Currency } from "@/types";

export function SettingsForm({
  fullName,
  email,
  currency,
}: {
  fullName: string;
  email: string;
  currency: Currency;
}) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setErrors({});
    setFormError("");
    try {
      const result = await updateProfile(new FormData(form));
      if (!result.ok) {
        const nextErrors = result.fieldErrors ?? {};
        setErrors(nextErrors);
        setFormError(result.message);
        toast.error(result.message);
        const firstField = Object.keys(nextErrors)[0];
        if (firstField) (form.elements.namedItem(firstField) as HTMLElement | null)?.focus();
        return;
      }
      toast.success("Settings saved");
    } catch {
      const message = "The request could not be completed. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const error = (name: string) => errors[name]?.[0];

  return (
    <form onSubmit={submit}>
      <Card className="max-w-3xl">
        <CardContent className="space-y-6">
          <div>
            <h2 className="font-semibold">Workspace profile</h2>
            <p className="text-sm text-slate-500">
              The reporting currency becomes immutable after the first shipment to preserve FX
              snapshots.
            </p>
          </div>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" name="full_name" error={error("full_name")}>
              <Input id="full_name" name="full_name" required defaultValue={fullName} />
            </FormField>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <FormField
              label="Reporting currency"
              name="reporting_currency"
              error={error("reporting_currency")}
            >
              <Select id="reporting_currency" name="reporting_currency" defaultValue={currency}>
                <option>PLN</option>
                <option>EUR</option>
                <option>USD</option>
              </Select>
            </FormField>
          </div>
          <Button disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        </CardContent>
      </Card>
    </form>
  );
}
