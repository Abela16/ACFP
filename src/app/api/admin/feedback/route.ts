import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromCookie } from "@/lib/auth";
import { CATEGORY_TO_DEPARTMENT } from "@/lib/constants";
import { FeedbackRecord, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getAdminSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const whereParts: string[] = ["f.deleted = 0"];
  const params: string[] = [];

  if (session.department !== "Administration") {
    const categories = Object.entries(CATEGORY_TO_DEPARTMENT)
      .filter(([, department]) => department === session.department)
      .map(([cat]) => cat);
    whereParts.push(`f.category IN (${categories.map(() => "?").join(",")})`);
    params.push(...categories);
  }

  if (category) {
    whereParts.push("f.category = ?");
    params.push(category);
  }
  if (status) {
    whereParts.push("f.status = ?");
    params.push(status);
  }

  const rows = db
    .prepare(`
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
      ORDER BY f.created_at DESC
      LIMIT 400
    `)
    .all(...params) as Array<FeedbackRecord & { response_message?: string | null }>;

  return NextResponse.json({
    items: rows.map((row) => ({
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
      assignedDepartment: row.assigned_department,
      responseMessage: row.response_message ?? null,
      createdAt: row.created_at,
    })),
  });
}
