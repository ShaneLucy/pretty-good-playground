import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { getMainKv, userKey, progressKey } from "$lib/server/kv";
import { writeFlash } from "$lib/server/flash";
import type { UserRecord } from "$lib/shared/types";

const DEREGISTER_CONFIRMATION = "DEREGISTER";
const HOME_PATH = "/";

export const load: PageServerLoad = async ({ locals, platform }) => {
  const kv = getMainKv(platform);
  const { fingerprint } = locals.user!;

  const raw = await kv.get(userKey(fingerprint));
  const userRecord = raw ? (JSON.parse(raw) as UserRecord) : null;

  return {
    armoredPublicKey: userRecord?.publicKey ?? locals.user!.publicKey,
    fingerprint
  };
};

export const actions: Actions = {
  deregister: async ({ request, locals, platform, cookies }) => {
    const formData = await request.formData();
    const confirmation = formData.get("confirmation");

    if (typeof confirmation !== "string" || confirmation !== DEREGISTER_CONFIRMATION) {
      return fail(400, {
        deregisterError: `Type ${DEREGISTER_CONFIRMATION} exactly to confirm.`
      });
    }

    const kv = getMainKv(platform);
    const { fingerprint } = locals.user!;

    await writeFlash(kv, fingerprint, {
      type: "info",
      message: "Your key has been deregistered. Your PGP key itself is unchanged."
    });

    await Promise.all([kv.delete(userKey(fingerprint)), kv.delete(progressKey(fingerprint))]);

    cookies.delete("session", { path: "/" });

    redirect(303, HOME_PATH);
  }
};
