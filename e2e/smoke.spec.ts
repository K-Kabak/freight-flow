import { expect,test } from "@playwright/test";
test("authentication screen is responsive",async({page})=>{await page.goto("/login");await expect(page.getByRole("heading",{name:"Welcome back"})).toBeVisible();await expect(page.getByLabel("Email address")).toBeVisible()});
