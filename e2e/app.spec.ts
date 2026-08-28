import { expect, test, type Page } from "@playwright/test";

async function mockApi(page: Page): Promise<void> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const pathname = new URL(request.url()).pathname;

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    const respond = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    if (pathname === "/api/v1/auth/login" && method === "POST") {
      return respond(200, {
        access_token: "access-token",
        refresh_token: "refresh-token",
        token_type: "bearer",
        expires_in: 900,
      });
    }

    if (pathname === "/api/v1/documents" && method === "POST") {
      return respond(200, { document_id: "d1", status: "PENDING" });
    }

    return route.continue();
  });
}

test("login → capture → sync", async ({ page }) => {
  await mockApi(page);

  await page.goto("/");
  await page.getByLabel("Username").fill("reviewer");
  await page.getByLabel("Password").fill("s3cret");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Document Processor" })).toBeVisible();
  await expect(page.getByText("0 pending")).toBeVisible();

  await page.getByRole("button", { name: "Capture" }).click();
  await expect(page.getByText("1 pending")).toBeVisible();

  await page.getByRole("button", { name: "Sync" }).click();
  await expect(page.getByText("0 pending")).toBeVisible();
});
