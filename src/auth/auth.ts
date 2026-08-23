import { apiClient, type components } from "../api/client";
import { sessionStore } from "./session";

export type CurrentUser = components["schemas"]["User"];

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthenticated(): boolean {
  return sessionStore.getAccessToken() !== null;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data, error } = await apiClient.GET("/api/v1/auth/me");

  if (error !== undefined || data === undefined) {
    throw new AuthError("Not authenticated");
  }

  return data;
}

export async function login(username: string, password: string): Promise<void> {
  const { data, error } = await apiClient.POST("/api/v1/auth/login", {
    body: { username, password },
  });

  if (error !== undefined || data === undefined) {
    throw new AuthError("Invalid credentials");
  }

  sessionStore.save({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
}

export async function refreshTokens(): Promise<void> {
  const refreshToken = sessionStore.getRefreshToken();
  if (refreshToken === null) {
    sessionStore.clear();
    throw new AuthError("No active session");
  }

  const { data, error } = await apiClient.POST("/api/v1/auth/refresh", {
    body: { refresh_token: refreshToken },
  });

  if (error !== undefined || data === undefined) {
    sessionStore.clear();
    throw new AuthError("Session expired");
  }

  sessionStore.save({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
}

export function logout(): void {
  sessionStore.clear();
}
