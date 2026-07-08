import { SignJWT, jwtVerify } from "jose";

export async function signJwt(
  payload: { sub: string },
  secret: string,
  expiresIn: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyJwt(token: string, secret: string): Promise<{ sub: string } | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export function makeSessionCookie(jwt: string, rememberDevice: boolean): string {
  const base = `session=${encodeURIComponent(jwt)}; HttpOnly; Secure; SameSite=Strict; Path=/`;
  return rememberDevice ? `${base}; Max-Age=2592000` : base;
}

export function makePendingFpCookie(fingerprint: string): string {
  return `pending_fp=${encodeURIComponent(fingerprint)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=300`;
}

export function clearSessionCookie(): string {
  return `session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function clearPendingFpCookie(): string {
  return `pending_fp=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
