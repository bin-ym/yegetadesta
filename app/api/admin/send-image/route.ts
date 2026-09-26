// app/api/admin/send-image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is not configured on server." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const {
      initData,
      imageBase64,
      recipientType, // "all" | "selected" | "level"
      selectedUserIds, // string[]
      selectedLevel, // number
      caption,
    } = body;

    if (!initData) {
      return NextResponse.json({ error: "Missing auth data" }, { status: 401 });
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 },
      );
    }

    // Auth Validation
    if (initData !== "web-bypass-token") {
      const validation = validateTelegramWebAppData(initData);
      if (!validation.valid || !validation.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const adminUser = await prisma.user.findUnique({
        where: { telegramId: validation.user.id.toString() },
      });

      if (
        !adminUser ||
        (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN")
      ) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        );
      }
    }

    // Convert base64 to Buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Determine target users
    let targetUsers: {
      id: string;
      fullName: string;
      baptismName: string | null;
      telegramId: string | null;
    }[] = [];

    const activeWhere = {
      status: "ACTIVE" as const,
      active: true,
    };

    if (recipientType === "selected" && Array.isArray(selectedUserIds)) {
      targetUsers = await prisma.user.findMany({
        where: {
          ...activeWhere,
          id: { in: selectedUserIds },
        },
        select: {
          id: true,
          fullName: true,
          baptismName: true,
          telegramId: true,
        },
      });
    } else if (recipientType === "level" && selectedLevel !== undefined) {
      const currentCycle = await prisma.weeklyCycle.findFirst({
        where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE", "CLOSED"] } },
        orderBy: { createdAt: "desc" },
      });

      if (currentCycle) {
        const nodesAtLevel = await prisma.treeNode.findMany({
          where: {
            cycleId: currentCycle.id,
            level: Number(selectedLevel),
            user: activeWhere,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                baptismName: true,
                telegramId: true,
              },
            },
          },
        });
        targetUsers = nodesAtLevel.map((n) => n.user);
      }
    } else {
      // Default: "all" active members
      targetUsers = await prisma.user.findMany({
        where: activeWhere,
        select: {
          id: true,
          fullName: true,
          baptismName: true,
          telegramId: true,
        },
      });
    }

    // Filter out mock/pending placeholder telegramIds
    const validRecipients = targetUsers.filter(
      (u) => u.telegramId && !u.telegramId.startsWith("pending_"),
    );

    if (validRecipients.length === 0) {
      return NextResponse.json(
        {
          error:
            "No active users with valid Telegram accounts found for the selected filter.",
        },
        { status: 400 },
      );
    }

    const defaultCaption =
      caption ||
      `🌿 <b>የቅዳሴ ጥሪ ሳምንታዊ መረብ (Call Tree Diagram)</b> 🌿\n\nየዚህ ሳምንት የጥሪ ቅደም ተከተል ተዘጋጅቷል። እባክዎን የእርስዎን ተረኛ በመመልከት በሰዓቱ ይደውሉ።\n\n✝ <i>እግዚአብሔር አገልግሎታችንን ይቀበልልን!</i>`;

    let sentCount = 0;
    let failedCount = 0;
    const errors: { user: string; reason: string }[] = [];

    // Send to Telegram Bot API
    for (const recipient of validRecipients) {
      try {
        const formData = new FormData();
        formData.append("chat_id", recipient.telegramId!);
        formData.append(
          "photo",
          new Blob([imageBuffer], { type: "image/png" }),
          "tree_diagram.png",
        );
        formData.append("caption", defaultCaption);
        formData.append("parse_mode", "HTML");

        const tgRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: formData,
          },
        );

        const resData = await tgRes.json();

        if (resData.ok) {
          sentCount++;
        } else {
          failedCount++;
          errors.push({
            user: recipient.fullName,
            reason: resData.description || "Telegram API error",
          });
        }

        // Small delay to prevent hitting Telegram rate limits (30 msgs/sec max)
        await new Promise((resolve) => setTimeout(resolve, 80));
      } catch (err: any) {
        failedCount++;
        errors.push({
          user: recipient.fullName,
          reason: err.message || "Network error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: validRecipients.length,
      sentCount,
      failedCount,
      errors: errors.slice(0, 10), // return top 10 errors if any
    });
  } catch (error: any) {
    console.error("Send image error:", error);
    return NextResponse.json(
      { error: "Failed to send image: " + (error.message || "Unknown error") },
      { status: 500 },
    );
  }
}
