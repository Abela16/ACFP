import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, Department } from "@/lib/constants";

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "replace-me-in-production";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  adminId: number;
  username: string;
  department: Department;
  exp: number;
};

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createAdminToken(data: Omit<AdminSession, "exp">): string {
  const payload: AdminSession = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token: string | undefined | null): AdminSession | null {
  if (!token) {
    return null;
  }
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as AdminSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromCookie(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminToken(token);
}

export function ensureLikeSessionId(existing: string | undefined): string {
  return existing ?? randomUUID();
}
