import { NextRequest, NextResponse } from "next/server";

import { createAdminToken } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";
import { authenticateAdmin } from "@/lib/db";
import { adminLoginSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials format." }, { status: 400 });
  }

  const admin = authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!admin) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = createAdminToken({
    adminId: admin.id,
    username: admin.username,
    department: admin.department,
  });

  const response = NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      username: admin.username,
      department: admin.department,
    },
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
