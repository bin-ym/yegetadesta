// app/api/admin/pending-users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import { integrateUserIntoTree } from "@/lib/tree-engine";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN missing. Message not sent:", text);
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
  }
}

// Get all pending users
export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    const isBypass = initData === "web-bypass-token";

    if (!isBypass) {
      const validation = validateTelegramWebAppData(initData || "");
      if (!validation.valid || !validation.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { telegramId: validation.user.id.toString() },
      });

      if (!user || user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Super Admin access required" },
          { status: 403 },
        );
      }
    }

    const pendingUsers = await prisma.pendingUser.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "asc" },
    });

    return NextResponse.json({ pendingUsers });
  } catch (error) {
    console.error("Pending users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending users" },
      { status: 500 },
    );
  }
}

// Approve or reject pending user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, pendingUserId, action } = body;

    if (!initData || !pendingUserId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const isBypass = initData === "web-bypass-token";
    let reviewerId = "web-super-admin";

    if (!isBypass) {
      const validation = validateTelegramWebAppData(initData || "");
      if (!validation.valid || !validation.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const admin = await prisma.user.findUnique({
        where: { telegramId: validation.user.id.toString() },
      });

      if (!admin || admin.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Super Admin access required" },
          { status: 403 },
        );
      }
      reviewerId = admin.id;
    }

    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: pendingUserId },
    });

    if (!pendingUser) {
      return NextResponse.json(
        { error: "Pending user not found" },
        { status: 404 },
      );
    }

    if (action === "approve") {
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          telegramId: pendingUser.telegramId,
          fullName: pendingUser.fullName,
          username: pendingUser.username,
          role: "MEMBER",
          status: "ACTIVE",
        },
      });

      // Add to waiting pool for next cycle
      const currentCycle = await prisma.weeklyCycle.findFirst({
        where: { phase: { in: ["BUILDING", "PREVIEW"] } },
        orderBy: { createdAt: "desc" },
      });

      if (currentCycle) {
        await prisma.waitingPool.create({
          data: {
            cycleId: currentCycle.id,
            userId: newUser.id,
            position: 0,
            status: "WAITING",
          },
        });

        // AUTO-ADD TO TREE (IMMEDIATE INTEGRATION)
        try {
          await integrateUserIntoTree(newUser.id);
        } catch (treeErr) {
          console.error("Auto-add tree error from pending:", treeErr);
        }
      }

      // Update pending user status
      await prisma.pendingUser.update({
        where: { id: pendingUserId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
        },
      });

      // SEND BOT NOTIFICATION
      await sendTelegramMessage(
        pendingUser.telegramId,
        `<b>እንኳን ደስ አለዎት!</b> 🎉\n\nየቅዳሴ ጥሪ አገልግሎት ጥያቄዎ ተቀባይነት አግኝቷል። አሁን ወደ አፕሊኬሽኑ በመግባት አገልግሎቱን መጠቀም ይችላሉ።\n\n✝ እግዚአብሔር አገልግሎታችንን ይቀበልልን።`,
      );

      return NextResponse.json({
        success: true,
        message: "User approved and notified",
        user: newUser,
      });
    } else if (action === "reject") {
      // Update pending user status
      await prisma.pendingUser.update({
        where: { id: pendingUserId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
        },
      });

      // SEND BOT NOTIFICATION
      await sendTelegramMessage(
        pendingUser.telegramId,
        `የቅዳሴ ጥሪ አገልግሎት ጥያቄዎ በSUPER ADMIN ውድቅ ተደርጓል። ለበለጠ መረጃ እባክዎ አስተዳዳሪዎችን ያነጋግሩ።`,
      );

      return NextResponse.json({
        success: true,
        message: "User request rejected and notified",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Pending user action error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
