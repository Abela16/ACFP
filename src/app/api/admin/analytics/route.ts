import { NextResponse } from "next/server";

import { getAdminSessionFromCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS count
    FROM feedback
    WHERE deleted = 0
    GROUP BY category
    ORDER BY count DESC
  `).all() as Array<{ category: string; count: number }>;

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM feedback
    WHERE deleted = 0
    GROUP BY status
    ORDER BY count DESC
  `).all() as Array<{ status: string; count: number }>;

  const dailyTrend = db.prepare(`
    SELECT DATE(created_at) AS day, COUNT(*) AS count
    FROM feedback
    WHERE created_at >= DATE('now', '-30 day') AND deleted = 0
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `).all() as Array<{ day: string; count: number }>;

  return NextResponse.json({ byCategory, byStatus, dailyTrend });
}
