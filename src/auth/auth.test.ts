import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../api/client", () => ({
  apiClient: { POST: vi.fn() },
}));

import { apiClient } from "../api/client";
import {
  AuthError,
  isAuthenticated,
  login,
  logout,
  refreshTokens,
} from "./auth";
import { sessionStore } from "./session";

interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

interface PostResult {
  data?: TokenPair;
  error?: unknown;
  response: Response;
}

type PostMock = Mock<(path: string, init: unknown) => Promise<PostResult>>;

function postMock(): PostMock {
  return apiClient.POST as unknown as PostMock;
}

function tokenPair(access = "access-1", refresh = "refresh-1"): TokenPair {
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 900,
  };
}

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("login stores the token pair on success", async () => {
    postMock().mockResolvedValue({
      data: tokenPair(),
      response: new Response(),
    });

    await login("alice", "s3cret");

    expect(isAuthenticated()).toBe(true);
    expect(sessionStore.getAccessToken()).toBe("access-1");
    expect(sessionStore.getRefreshToken()).toBe("refresh-1");
  });

  it("login throws AuthError on invalid credentials", async () => {
    postMock().mockResolvedValue({
      error: { message: "unauthorized" },
      response: new Response(null, { status: 401 }),
    });

    await expect(login("alice", "wrong")).rejects.toBeInstanceOf(AuthError);
  });

  it("refreshTokens rotates the stored pair", async () => {
    sessionStore.save({ accessToken: "old-access", refreshToken: "old-refresh" });
    postMock().mockResolvedValue({
      data: tokenPair("new-access", "new-refresh"),
      response: new Response(),
    });

    await refreshTokens();

    expect(sessionStore.getAccessToken()).toBe("new-access");
    expect(sessionStore.getRefreshToken()).toBe("new-refresh");
  });

  it("refreshTokens clears the session when there is no refresh token", async () => {
    await expect(refreshTokens()).rejects.toBeInstanceOf(AuthError);
    expect(isAuthenticated()).toBe(false);
  });

  it("logout clears the session", () => {
    sessionStore.save({ accessToken: "access-1", refreshToken: "refresh-1" });

    logout();

    expect(isAuthenticated()).toBe(false);
  });
});
