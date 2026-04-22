import { NextResponse } from "next/server";

import { getAdminSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSessionFromCookie();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    admin: {
      id: session.adminId,
      username: session.username,
      department: session.department,
    },
  });
}
