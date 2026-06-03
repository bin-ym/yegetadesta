import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWeeklyCycle, persistTree } from "@/lib/tree-engine";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    if (!initData) {
      return NextResponse.json({ error: "Missing auth data" }, { status: 401 });
    }

    let validation;
    if (initData === "web-bypass-token") {
      // Special bypass for web-login demo
      validation = { valid: true, user: { id: "0" } };
    } else {
      validation = validateTelegramWebAppData(initData);
      if (!validation.valid || !validation.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let currentUser;
    if (initData === "web-bypass-token") {
      // Web Admin role is assumed for this bypass
      currentUser = { role: "SUPER_ADMIN" };
    } else {
      currentUser = await prisma.user.findUnique({
        where: { telegramId: validation.user!.id.toString() },
      });
    }

    if (
      !currentUser ||
      (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({ where: { status: "ACTIVE" } });

    // Ensure at least someone is available
    if (users.length === 0) {
      return NextResponse.json(
        { error: "No active users found to generate tree." },
        { status: 400 },
      );
    }

    // Shuffle users to randomize tree nodes
    const shuffled = [...users].sort(() => 0.5 - Math.random());

    let cycle = await prisma.weeklyCycle.findFirst({
      where: { phase: "BUILDING" },
    });
    if (!cycle) {
      cycle = await createWeeklyCycle();
    }

    await persistTree({
      cycleId: cycle.id,
      userIds: shuffled.map((u) => u.id),
    });

    return NextResponse.json({ success: true, cycle });
  } catch (error) {
    console.error("Tree generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate random tree" },
      { status: 500 },
    );
  }
}
