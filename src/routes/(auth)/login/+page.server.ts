import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { getMainKv, getEphemeralKv, userKey, pendingAuthKey } from "$lib/server/kv";
import { rateLimit } from "$lib/server/rate-limit";
import { readPublicKey, extractFingerprint } from "$lib/server/pgp";

const LOGIN_RATE_LIMIT = 10;
const CHALLENGE_TTL_SECONDS = 300;
const VERIFY_PATH = "/login/verify";
const RATE_LIMIT_ENDPOINT = "login";
const PENDING_FP_COOKIE_MAX_AGE = 300;

interface PendingAuthRecord {
  readonly nonce: string;
  readonly createdAt: number;
  readonly rememberDevice: boolean;
}

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress, cookies }) => {
    const mainKv = getMainKv(platform);
    const ephemeralKv = getEphemeralKv(platform);
    const ip = getClientAddress();

    const { allowed } = await rateLimit(mainKv, RATE_LIMIT_ENDPOINT, ip, LOGIN_RATE_LIMIT);
    if (!allowed) {
      return fail(429, { error: "Too many attempts. Please wait." });
    }

    const formData = await request.formData();
    const publicKeyArmored = formData.get("publicKey");
    const rememberDeviceRaw = formData.get("rememberDevice");
    const rememberDevice = rememberDeviceRaw === "true";

    if (typeof publicKeyArmored !== "string" || publicKeyArmored.trim().length === 0) {
      return fail(400, { error: "Public key is required." });
    }

    let publicKey;
    try {
      publicKey = await readPublicKey(publicKeyArmored.trim());
    } catch {
      return fail(400, {
        error: "Invalid PGP public key. Please paste an armored public key block."
      });
    }

    const fingerprint = extractFingerprint(publicKey);

    const existingRaw = await mainKv.get(userKey(fingerprint));
    if (!existingRaw) {
      return fail(404, { error: "No account found for this key." });
    }

    const nonce = crypto.randomUUID();

    const pendingAuth: PendingAuthRecord = {
      nonce,
      createdAt: Date.now(),
      rememberDevice
    };

    await ephemeralKv.put(pendingAuthKey(fingerprint), JSON.stringify(pendingAuth), {
      expirationTtl: CHALLENGE_TTL_SECONDS
    });

    cookies.set("pending_fp", fingerprint, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: PENDING_FP_COOKIE_MAX_AGE
    });

    redirect(303, VERIFY_PATH);
  }
};
