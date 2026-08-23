import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export type { components, paths };

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = createClient<paths>({
  baseUrl,
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(input, init),
});
