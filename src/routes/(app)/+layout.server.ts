import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

const LOGIN_PATH = "/login";

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) {
    redirect(303, LOGIN_PATH);
  }
  return { user: locals.user };
};
