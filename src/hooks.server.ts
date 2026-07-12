import type { Handle } from "@sveltejs/kit";
import { verifyJwt, clearSessionCookie } from "$lib/server/auth";
import { getMainKv, userKey } from "$lib/server/kv";
import { readAndClearFlash } from "$lib/server/flash";
import type { UserRecord } from "$lib/shared/types";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP_DIRECTIVES,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
} as const;

const SESSION_COOKIE_NAME = "session";

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  const { platform, cookies } = event;

  if (!platform) {
    event.locals.user = null;
    event.locals.flash = null;
    const response = await resolve(event);
    return applySecurityHeaders(response);
  }

  const kv = getMainKv(platform);
  const token = cookies.get(SESSION_COOKIE_NAME);

  if (!token) {
    event.locals.user = null;
    event.locals.flash = null;
    const response = await resolve(event);
    return applySecurityHeaders(response);
  }

  const payload = await verifyJwt(token, platform.env.JWT_SECRET);

  if (!payload) {
    event.setHeaders({ "Set-Cookie": clearSessionCookie() });
    event.locals.user = null;
    event.locals.flash = null;
    const response = await resolve(event);
    return applySecurityHeaders(response);
  }

  const fingerprint = payload.sub;
  const raw = await kv.get(userKey(fingerprint));

  if (!raw) {
    event.setHeaders({ "Set-Cookie": clearSessionCookie() });
    event.locals.user = null;
    event.locals.flash = null;
    const response = await resolve(event);
    return applySecurityHeaders(response);
  }

  const record = JSON.parse(raw) as UserRecord;
  event.locals.user = {
    fingerprint: record.fingerprint,
    displayName: record.displayName,
    publicKey: record.publicKey
  };

  event.locals.flash = await readAndClearFlash(kv, fingerprint);

  const response = await resolve(event);
  return applySecurityHeaders(response);
};
