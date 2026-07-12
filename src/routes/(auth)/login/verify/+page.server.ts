import { fail, redirect, type Cookies } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { getMainKv, getEphemeralKv, userKey, pendingAuthKey, type KvStore } from "$lib/server/kv";
import { rateLimit } from "$lib/server/rate-limit";
import { readPublicKey, verifySignature } from "$lib/server/pgp";
import { signJwt } from "$lib/server/auth";
import type { UserRecord } from "$lib/shared/types";

const VERIFY_RATE_LIMIT = 5;
const JWT_EXPIRY = "30d";
const RATE_LIMIT_ENDPOINT = "login-verify";
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";
const PENDING_FP_COOKIE = "pending_fp";
const SESSION_COOKIE = "session";
const SESSION_COOKIE_LONG_MAX_AGE = 2592000;

interface PendingAuthRecord {
  readonly nonce: string;
  readonly createdAt: number;
  readonly rememberDevice: boolean;
}

function parsePendingAuth(raw: string): PendingAuthRecord | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).nonce === "string" &&
      typeof (parsed as Record<string, unknown>).createdAt === "number" &&
      typeof (parsed as Record<string, unknown>).rememberDevice === "boolean"
    ) {
      return parsed as PendingAuthRecord;
    }
    return null;
  } catch {
    return null;
  }
}

function issueSessionCookie(cookies: Cookies, jwt: string, rememberDevice: boolean): void {
  cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    ...(rememberDevice ? { maxAge: SESSION_COOKIE_LONG_MAX_AGE } : {})
  });
}

async function consumePendingAuth(
  ephemeralKv: KvStore,
  fingerprint: string
): Promise<PendingAuthRecord | null> {
  const raw = await ephemeralKv.get(pendingAuthKey(fingerprint));
  await ephemeralKv.delete(pendingAuthKey(fingerprint));
  if (!raw) {
    return null;
  }
  return parsePendingAuth(raw);
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
  const fingerprint = cookies.get(PENDING_FP_COOKIE);
  if (!fingerprint) {
    redirect(303, LOGIN_PATH);
  }

  const ephemeralKv = getEphemeralKv(platform);
  const raw = await ephemeralKv.get(pendingAuthKey(fingerprint));
  if (!raw) {
    redirect(303, LOGIN_PATH);
  }

  const pendingAuth = parsePendingAuth(raw);
  if (!pendingAuth) {
    redirect(303, LOGIN_PATH);
  }

  return { nonce: pendingAuth.nonce };
};

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress, cookies }) => {
    if (!platform) {
      return fail(503, { error: "Service unavailable in this environment." });
    }

    const mainKv = getMainKv(platform);
    const ephemeralKv = getEphemeralKv(platform);
    const ip = getClientAddress();

    const { allowed } = await rateLimit(mainKv, RATE_LIMIT_ENDPOINT, ip, VERIFY_RATE_LIMIT);
    if (!allowed) {
      return fail(429, { error: "Too many attempts. Please wait." });
    }

    const fingerprint = cookies.get(PENDING_FP_COOKIE);
    if (!fingerprint) {
      return fail(400, { error: "Session expired. Please start again." });
    }

    const pendingAuth = await consumePendingAuth(ephemeralKv, fingerprint);
    if (!pendingAuth) {
      return fail(400, { error: "Session expired. Please start again." });
    }

    const formData = await request.formData();
    const signature = formData.get("signature");

    if (typeof signature !== "string" || signature.trim().length === 0) {
      return fail(400, { error: "Signed output is required." });
    }

    const userRaw = await mainKv.get(userKey(fingerprint));
    if (!userRaw) {
      return fail(400, { error: "Account not found. Please register first." });
    }

    const userRecord = JSON.parse(userRaw) as UserRecord;

    let publicKey;
    try {
      publicKey = await readPublicKey(userRecord.publicKey);
    } catch {
      return fail(400, {
        error: "Failed to parse your stored public key. Please contact support."
      });
    }

    const result = await verifySignature({
      armoredSignedMessage: signature.trim(),
      publicKey
    });

    if (!result.valid) {
      return fail(400, {
        error:
          "Signature verification failed. Make sure you signed the correct message with the right key."
      });
    }

    const jwt = await signJwt({ sub: fingerprint }, platform.env.JWT_SECRET, JWT_EXPIRY);

    issueSessionCookie(cookies, jwt, pendingAuth.rememberDevice);
    cookies.delete(PENDING_FP_COOKIE, { path: "/" });

    redirect(303, DASHBOARD_PATH);
  }
};
