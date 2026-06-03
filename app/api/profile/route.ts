// app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, fullName, baptismName, phoneNumber, address } = body;

    if (!initData) {
      return NextResponse.json({ error: "Missing auth data" }, { status: 401 });
    }

    const validation = validateTelegramWebAppData(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: validation.user.id.toString() },
      data: {
        fullName,
        baptismName,
        phoneNumber,
        address,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
