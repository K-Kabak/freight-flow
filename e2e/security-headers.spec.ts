import { expect, test } from "@playwright/test";

test("application responses include baseline security headers", async ({ request }) => {
  const response = await request.get("/login");

  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=()",
  );
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});
