import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    if (!initData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (initData === "web-bypass-token") {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const validation = validateTelegramWebAppData(initData);
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
    }

    const { userId } = await req.json();
    if (typeof userId !== "string" || !userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.telegramId || user.telegramId.startsWith("pending_")) {
      return NextResponse.json(
        { error: "This user has not linked a Telegram account" },
        { status: 400 },
      );
    }
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram bot is not configured" },
        { status: 503 },
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: user.telegramId,
    text:
      "🙏 የየጌታ ደስታ የቅዳሴ ጥሪ አገልግሎቱን መጠቀም ይፈልጋሉ?\n\n" +
      "አገልግሎቱን ለመቀጠል ከፈለጉ “አዎ” የሚለውን ይጫኑ።\n\n" +
      "ለመተው ከፈለጉ “አይ” የሚለውን ይጫኑ።",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "አዎ፣ መቀጠል እፈልጋለሁ",
            callback_data: `member_status:${user.id}:yes`,
          },
          {
            text: "አይ፣ መቀጠል አልፈልግም",
            callback_data: `member_status:${user.id}:no`,
          },
        ],
      ],
    },
  }),
      },
    );
    const telegramResult = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !telegramResult.ok) {
      return NextResponse.json(
        { error: telegramResult.description || "Telegram could not deliver the message" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ask user in Telegram error:", error);
    return NextResponse.json(
      { error: "Failed to send Telegram message" },
      { status: 500 },
    );
  }
}