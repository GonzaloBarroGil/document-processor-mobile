import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  refreshTokens: vi.fn(),
}));

import { createAuthMiddleware } from "./middleware";
import { sessionStore } from "./session";

describe("createAuthMiddleware", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches the bearer token to authenticated requests", async () => {
    sessionStore.save({ accessToken: "access-1", refreshToken: "refresh-1" });
    const middleware = createAuthMiddleware();

    const request = new Request("http://localhost:8000/api/v1/documents");
    const result = await middleware.onRequest({ request });

    expect(result.headers.get("Authorization")).toBe("Bearer access-1");
  });

  it("does not attach a token when unauthenticated", async () => {
    const middleware = createAuthMiddleware();

    const request = new Request("http://localhost:8000/api/v1/documents");
    const result = await middleware.onRequest({ request });

    expect(result.headers.get("Authorization")).toBeNull();
  });

  it("passes non-401 responses through unchanged", async () => {
    const middleware = createAuthMiddleware();
    const response = new Response("{}", { status: 200 });

    const result = await middleware.onResponse({
      request: new Request("http://localhost:8000/api/v1/documents"),
      response,
    });

    expect(result).toBe(response);
  });

  it("passes 401 responses from auth endpoints through unchanged", async () => {
    const middleware = createAuthMiddleware();
    const response = new Response("{}", { status: 401 });

    const result = await middleware.onResponse({
      request: new Request("http://localhost:8000/api/v1/auth/refresh"),
      response,
    });

    expect(result).toBe(response);
  });
});
