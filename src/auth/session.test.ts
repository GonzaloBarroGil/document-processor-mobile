import { beforeEach, describe, expect, it } from "vitest";

import { sessionStore } from "./session";

describe("sessionStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and reads the token pair", () => {
    sessionStore.save({ accessToken: "access-1", refreshToken: "refresh-1" });

    expect(sessionStore.getAccessToken()).toBe("access-1");
    expect(sessionStore.getRefreshToken()).toBe("refresh-1");
  });

  it("clears the token pair", () => {
    sessionStore.save({ accessToken: "access-1", refreshToken: "refresh-1" });

    sessionStore.clear();

    expect(sessionStore.getAccessToken()).toBeNull();
    expect(sessionStore.getRefreshToken()).toBeNull();
  });
});
