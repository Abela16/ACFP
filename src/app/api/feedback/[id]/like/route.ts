import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ensureLikeSessionId } from "@/lib/auth";
import { LIKE_SESSION_COOKIE } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { rateLimitCheck } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    return NextResponse.json({ error: "Invalid feedback id." }, { status: 400 });
  }

  const forwardedFor = (await headers()).get("x-forwarded-for") ?? "unknown";
  const allowed = rateLimitCheck(`like:${forwardedFor.split(",")[0]}`, 60, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many like attempts." }, { status: 429 });
  }

  const db = getDb();
  const cookieStore = await cookies();
  const sessionId = ensureLikeSessionId(cookieStore.get(LIKE_SESSION_COOKIE)?.value);
  const exists = db
    .prepare("SELECT id FROM feedback WHERE id = ? AND deleted = 0 LIMIT 1")
    .get(feedbackId) as { id: number } | undefined;
  if (!exists) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  try {
    db.prepare("INSERT INTO feedback_likes (feedback_id, session_id) VALUES (?, ?)").run(feedbackId, sessionId);
    db.prepare("UPDATE feedback SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(feedbackId);
  } catch {
    return NextResponse.json({ error: "Already liked in this session." }, { status: 409 });
  }

  const likedCount = db.prepare("SELECT likes_count FROM feedback WHERE id = ?").get(feedbackId) as { likes_count: number };
  const response = NextResponse.json({ ok: true, likesCount: likedCount.likes_count });
  response.cookies.set(LIKE_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
