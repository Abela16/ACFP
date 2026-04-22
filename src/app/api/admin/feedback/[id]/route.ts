import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromCookie } from "@/lib/auth";
import { departmentCanManageCategory, FeedbackRecord, getDb } from "@/lib/db";
import { adminFeedbackUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const feedbackId = Number(id);
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    return NextResponse.json({ error: "Invalid feedback id." }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = adminFeedbackUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
  }

  const db = getDb();
  const feedback = db
    .prepare("SELECT * FROM feedback WHERE id = ? AND deleted = 0 LIMIT 1")
    .get(feedbackId) as FeedbackRecord | undefined;
  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found." }, { status: 404 });
  }

  if (!departmentCanManageCategory(session.department, feedback.category)) {
    return NextResponse.json({ error: "Forbidden for this department." }, { status: 403 });
  }

  if (parsed.data.status) {
    db.prepare("UPDATE feedback SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(parsed.data.status, feedbackId);
  }
  if (typeof parsed.data.flag === "boolean") {
    db.prepare("UPDATE feedback SET flagged = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(parsed.data.flag ? 1 : 0, feedbackId);
  }
  if (parsed.data.assignDepartment) {
    db.prepare("UPDATE feedback SET assigned_department = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(parsed.data.assignDepartment, feedbackId);
  }
  if (parsed.data.responseMessage) {
    db.prepare("INSERT INTO feedback_responses (feedback_id, admin_id, message) VALUES (?, ?, ?)")
      .run(feedbackId, session.adminId, parsed.data.responseMessage.trim());
  }
  if (parsed.data.delete) {
    db.prepare("UPDATE feedback SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(feedbackId);
  }

  return NextResponse.json({ ok: true });
}
