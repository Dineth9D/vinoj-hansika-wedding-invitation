import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "wedding_admin";

function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("wedding-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input: string): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  const t = token();
  if (!pw || !t) return null;
  return safeEqual(input, pw) ? t : null;
}

export async function isAdmin(): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const jar = await cookies();
  const c = jar.get(ADMIN_COOKIE)?.value;
  return !!c && safeEqual(c, t);
}
