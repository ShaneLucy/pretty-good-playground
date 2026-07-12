import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const HOME_PATH = "/";
const SESSION_COOKIE = "session";

export const GET: RequestHandler = ({ cookies }) => {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  redirect(303, HOME_PATH);
};
