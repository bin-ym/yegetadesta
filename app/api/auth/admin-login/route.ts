import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  verifyAdminPassword,
  type AdminSessionRole,
} from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body.role as AdminSessionRole;
    const password = body.password;

    if (
      (role !== "ADMIN" && role !== "SUPER_ADMIN") ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
    }

    const account = await prisma.adminAccount.findUnique({ where: { role } });
    if (!account) {
      return NextResponse.json(
        {
          error:
            "Admin account is not initialized. Configure its password and run db:sync-admin-accounts.",
        },
        { status: 503 },
      );
    }
    if (!verifyAdminPassword(password, account.passwordHash)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await createAdminSession(role);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Admin web login error:", error);
    return NextResponse.json(
      {
        error: "Admin login failed",
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { details: `${error.name}: ${error.message}` }
          : {}),
      },
      { status: 500 },
    );
  }
}