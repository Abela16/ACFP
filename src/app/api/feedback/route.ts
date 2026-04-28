import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ensureLikeSessionId } from "@/lib/auth";
import { LIKE_SESSION_COOKIE } from "@/lib/constants";
import { createFeedbackPublicId, parseTags, persistAttachment } from "@/lib/feedback";
import { FeedbackRecord, getDb } from "@/lib/db";
import { isContentOffensive } from "@/lib/moderation";
import { rateLimitCheck } from "@/lib/rateLimit";
import { feedbackInputSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function mapFeedbackRow(row: FeedbackRecord & { response_message?: string | null }) {
  return {
    id: row.id,
    feedbackId: row.public_id,
    title: row.title,
    description: row.description,
    category: row.category,
    otherCategory: row.other_category,
    status: row.status,
    likesCount: row.likes_count,
    attachmentPath: row.attachment_path,
    tags: JSON.parse(row.tags_json ?? "[]") as string[],
    flagged: Boolean(row.flagged),
    createdAt: row.created_at,
    responseMessage: row.response_message ?? null,
  };
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const query = searchParams.get("q");
  const sort = searchParams.get("sort") ?? "newest";

  const whereParts: string[] = ["f.deleted = 0"];
  const params: Array<string> = [];

  if (category) {
    whereParts.push("f.category = ?");
    params.push(category);
  }
  if (status) {
    whereParts.push("f.status = ?");
    params.push(status);
  }
  if (query) {
    whereParts.push("(f.public_id LIKE ? OR f.title LIKE ? OR f.description LIKE ?)");
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  let orderBy = "f.created_at DESC";
  if (sort === "likes") {
    orderBy = "f.likes_count DESC, f.created_at DESC";
  } else if (sort === "oldest") {
    orderBy = "f.created_at ASC";
  } else if (sort === "status") {
    orderBy = "f.status ASC, f.created_at DESC";
  }

  const statement = db.prepare(`
    SELECT
      f.*,
      (
        SELECT fr.message
        FROM feedback_responses fr
        WHERE fr.feedback_id = f.id
        ORDER BY fr.created_at DESC
        LIMIT 1
      ) AS response_message
    FROM feedback f
    WHERE ${whereParts.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT 300
  `);

  const rows = statement.all(...params) as Array<FeedbackRecord & { response_message?: string | null }>;
  const cookieStore = await cookies();
  const likeSession = ensureLikeSessionId(cookieStore.get(LIKE_SESSION_COOKIE)?.value);
  const likedRows = db
    .prepare(`
      SELECT feedback_id
      FROM feedback_likes
      WHERE session_id = ?
    `)
    .all(likeSession) as Array<{ feedback_id: number }>;
  const likedFeedback = new Set(likedRows.map((item) => item.feedback_id));

  const response = NextResponse.json({
    items: rows.map((row) => ({ ...mapFeedbackRow(row), likedByCurrentSession: likedFeedback.has(row.id) })),
  });
  if (!cookieStore.get(LIKE_SESSION_COOKIE)) {
    response.cookies.set(LIKE_SESSION_COOKIE, likeSession, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export async function POST(request: NextRequest) {
  const forwardedFor = (await headers()).get("x-forwarded-for") ?? "unknown";
  const rateKey = `submit:${forwardedFor.split(",")[0]}`;
  const allowed = rateLimitCheck(rateKey, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const db = getDb();
  const formData = await request.formData();
  const candidate = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    otherCategory: formData.get("otherCategory") ? String(formData.get("otherCategory")) : undefined,
    tags: parseTags(formData.get("tags") ? String(formData.get("tags")) : null),
  };

  const parsed = feedbackInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  if (parsed.data.category === "Other" && !parsed.data.otherCategory?.trim()) {
    return NextResponse.json({ error: "Please provide a custom category for 'Other'." }, { status: 400 });
  }

  const flagged = isContentOffensive(`${parsed.data.title} ${parsed.data.description}`);

  let attachmentPath: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    try {
      attachmentPath = await persistAttachment(file);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Attachment upload failed." },
        { status: 400 },
      );
    }
  }

  const publicId = createFeedbackPublicId();
  db.prepare(`
    INSERT INTO feedback
      (public_id, title, description, category, other_category, status, likes_count, attachment_path, tags_json, flagged, assigned_department)
    VALUES (?, ?, ?, ?, ?, 'Pending', 0, ?, ?, ?, ?)
  `).run(
    publicId,
    parsed.data.title.trim(),
    parsed.data.description.trim(),
    parsed.data.category,
    parsed.data.otherCategory?.trim() || null,
    attachmentPath,
    JSON.stringify(parsed.data.tags ?? []),
    flagged ? 1 : 0,
    null,
  );

  return NextResponse.json({ ok: true, feedbackId: publicId }, { status: 201 });
}
