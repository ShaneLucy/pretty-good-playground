import { describe, it, expect } from "vitest";
import { GET } from "../../../src/routes/logout/+server";

const HOME_PATH = "/";
const SESSION_COOKIE = "session";

function makeCookies(cookieMap: Map<string, string>) {
  return {
    get: (name: string) => cookieMap.get(name) ?? undefined,
    set: (name: string, value: string) => cookieMap.set(name, value),
    delete: (name: string) => cookieMap.delete(name),
    getAll: () => [...cookieMap.entries()].map(([name, value]) => ({ name, value })),
    serialize: () => ""
  };
}

describe("GET /logout", () => {
  it("redirects to / with a 303 status", () => {
    const cookieMap = new Map([[SESSION_COOKIE, "some-jwt"]]);

    let redirectedTo: string | null = null;
    let redirectStatus: number | null = null;
    try {
      GET({
        cookies: makeCookies(cookieMap) as unknown as Parameters<typeof GET>[0]["cookies"]
      } as unknown as Parameters<typeof GET>[0]);
    } catch (e) {
      if (typeof e === "object" && e !== null && "location" in e && "status" in e) {
        const err = e as Record<string, unknown>;
        redirectedTo = err.location as string;
        redirectStatus = err.status as number;
      }
    }

    expect(redirectedTo).toBe(HOME_PATH);
    expect(redirectStatus).toBe(303);
  });

  it("deletes the session cookie", () => {
    const cookieMap = new Map([[SESSION_COOKIE, "some-jwt"]]);
    const deleted: string[] = [];

    const cookies = {
      ...makeCookies(cookieMap),
      delete: (name: string) => {
        deleted.push(name);
        cookieMap.delete(name);
      }
    };

    try {
      GET({
        cookies: cookies as unknown as Parameters<typeof GET>[0]["cookies"]
      } as unknown as Parameters<typeof GET>[0]);
    } catch {
      // redirect throws — expected
    }

    expect(deleted).toContain(SESSION_COOKIE);
  });
});
