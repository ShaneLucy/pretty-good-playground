import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

const DASHBOARD_PATH = "/dashboard";

export const load: LayoutServerLoad = ({ locals }) => {
  if (locals.user) {
    redirect(303, DASHBOARD_PATH);
  }
  return {};
};
