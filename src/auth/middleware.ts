import { apiClient } from "../api/client";
import { refreshTokens } from "./auth";
import { sessionStore } from "./session";

const AUTH_PATHS = ["/auth/login", "/auth/refresh"];

let refreshPromise: Promise<boolean> | null = null;

function dedupeRefresh(): Promise<boolean> {
  if (refreshPromise === null) {
    refreshPromise = refreshTokens()
      .then(() => true)
      .catch(() => {
        sessionStore.clear();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export interface AuthMiddleware {
  onRequest(args: { request: Request }): Promise<Request>;
  onResponse(args: { request: Request; response: Response }): Promise<Response>;
}

export function createAuthMiddleware(): AuthMiddleware {
  return {
    async onRequest({ request }) {
      const token = sessionStore.getAccessToken();
      if (token !== null) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },

    async onResponse({ request, response }) {
      if (response.status !== 401) {
        return response;
      }
      if (AUTH_PATHS.some((path) => request.url.includes(path))) {
        return response;
      }

      const refreshed = await dedupeRefresh();
      if (!refreshed) {
        return response;
      }

      const token = sessionStore.getAccessToken();
      const retry = request.clone();
      if (token !== null) {
        retry.headers.set("Authorization", `Bearer ${token}`);
      }
      return fetch(retry);
    },
  };
}

let attached = false;

export function attachAuthMiddleware(): void {
  if (attached) {
    return;
  }
  attached = true;
  apiClient.use(createAuthMiddleware());
}
