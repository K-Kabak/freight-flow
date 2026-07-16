import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const mailpitUrl = "http://127.0.0.1:54324";

test("user registers in the UI and can sign in again", async ({ page }) => {
  const email = `register-${Date.now()}-${test.info().project.name}@example.com`;
  const password = "FreightFlow123!";

  await page.goto("/register");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Operations overview" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("password recovery callback creates a session and updates the password", async ({ page, request }) => {
  const email = `recovery-${Date.now()}-${test.info().project.name}@example.com`;
  const oldPassword = "FreightFlow123!";
  const newPassword = "UpdatedFreight123!";
  const api = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error } = await api.auth.signUp({ email, password: oldPassword });
  expect(error).toBeNull();

  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();

  let messageId = "";
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/messages`);
        const body = (await response.json()) as {
          messages: Array<{ ID: string; To: Array<{ Address: string }> }>;
        };
        messageId = body.messages.find((message) =>
          message.To.some((recipient) => recipient.Address === email),
        )?.ID ?? "";
        return messageId;
      },
      { timeout: 10_000 },
    )
    .not.toBe("");

  const messageResponse = await request.get(`${mailpitUrl}/api/v1/message/${messageId}`);
  const message = (await messageResponse.json()) as { HTML: string; Text: string };
  const content = message.HTML || message.Text;
  const recoveryUrl = content
    .match(/https?:\/\/[^\s"'<>]+/)?.[0]
    ?.replaceAll("&amp;", "&");
  expect(recoveryUrl).toBeTruthy();

  await page.goto(recoveryUrl!);
  await expect(page).toHaveURL(/reset-password/);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByLabel("Confirm password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
});
