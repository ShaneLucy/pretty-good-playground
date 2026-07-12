import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { getMainKv, userKey, progressKey } from "$lib/server/kv";
import { rateLimit } from "$lib/server/rate-limit";
import { readPublicKey, extractFingerprint } from "$lib/server/pgp";
import { writeFlash } from "$lib/server/flash";
import { createEmptyProgress } from "$lib/server/progress";
import type { UserRecord } from "$lib/shared/types";

const REGISTER_RATE_LIMIT = 5;
const DISPLAY_NAME_MAX_LENGTH = 50;
const LOGIN_PATH = "/login";
const RATE_LIMIT_ENDPOINT = "register";

export const actions: Actions = {
  default: async ({ request, platform, getClientAddress }) => {
    const kv = getMainKv(platform);
    const ip = getClientAddress();

    const { allowed } = await rateLimit(kv, RATE_LIMIT_ENDPOINT, ip, REGISTER_RATE_LIMIT);
    if (!allowed) {
      return fail(429, { error: "Too many attempts. Please wait.", field: undefined });
    }

    const formData = await request.formData();
    const displayName = formData.get("displayName");
    const publicKeyArmored = formData.get("publicKey");

    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return fail(400, { field: "displayName", error: "Display name is required." });
    }
    if (displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
      return fail(400, {
        field: "displayName",
        error: `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
      });
    }
    if (typeof publicKeyArmored !== "string" || publicKeyArmored.trim().length === 0) {
      return fail(400, { field: "publicKey", error: "Public key is required." });
    }

    let publicKey;
    try {
      publicKey = await readPublicKey(publicKeyArmored.trim());
    } catch {
      return fail(400, {
        field: "publicKey",
        error: "Invalid PGP public key. Please paste an armored public key block."
      });
    }

    const fingerprint = extractFingerprint(publicKey);

    const existingRaw = await kv.get(userKey(fingerprint));
    if (existingRaw) {
      return fail(400, {
        error: "A key with this fingerprint is already registered.",
        field: undefined
      });
    }

    const record: UserRecord = {
      fingerprint,
      displayName: displayName.trim(),
      publicKey: publicKeyArmored.trim(),
      registeredAt: new Date().toISOString(),
      profilePublic: false
    };

    const emptyProgress = createEmptyProgress(fingerprint);

    await Promise.all([
      kv.put(userKey(fingerprint), JSON.stringify(record)),
      kv.put(progressKey(fingerprint), JSON.stringify(emptyProgress))
    ]);

    await writeFlash(kv, fingerprint, {
      type: "success",
      message: "Account created! Sign in with your key."
    });

    redirect(303, LOGIN_PATH);
  }
};
