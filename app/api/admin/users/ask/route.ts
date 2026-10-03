import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/lib/admin-session";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface AskRecipient {
  id: string;
  telegramId: string | null;
  continuationPromptMessageId: number | null;
}

const ASK_TEXT =
  "🙏 የየጌታ ደስታ የቅዳሴ ጥሪ አገልግሎቱን መጠቀም ይፈልጋሉ?\n\n" +
  "አገልግሎቱን ለመቀጠል ከፈለጉ “አዎ” የሚለውን ይጫኑ።\n\n" +
  "ለመተው ከፈለጉ “አይ” የሚለውን ይጫኑ።";

function askReplyMarkup(userId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "አዎ፣ መቀጠል እፈልጋለሁ",
          callback_data: `member_status:${userId}:yes`,
        },
        {
          text: "አይ፣ መቀጠል አልፈልግም",
          callback_data: `member_status:${userId}:no`,
        },
      ],
    ],
  };
}

async function sendOrReplacePrompt(user: AskRecipient): Promise<boolean> {
  if (!BOT_TOKEN || !user.telegramId) return false;

  if (user.continuationPromptMessageId) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegramId,
            message_id: user.continuationPromptMessageId,
            text: ASK_TEXT,
            reply_markup: askReplyMarkup(user.id),
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok) return true;
      if (result.description === "Bad Request: message is not modified") {
        return true;
      }
    } catch (error) {
      console.error("Failed to replace unanswered Telegram prompt:", error);
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: user.telegramId,
          text: ASK_TEXT,
          reply_markup: askReplyMarkup(user.id),
        }),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !result.result?.message_id) return false;

    await prisma.user.update({
      where: { id: user.id },
      data: { continuationPromptMessageId: result.result.message_id },
    });
    return true;
  } catch (error) {
    console.error("Telegram ask delivery failed:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    if (!initData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDevelopmentBypass =
      initData === "web-bypass-token" && process.env.NODE_ENV === "development";
    if (initData && initData !== "web-bypass-token") {
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
    } else if (!isDevelopmentBypass) {
      const role = await verifyAdminSession(
        req.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      );
      if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { userId, audience } = await req.json();
    let recipients: AskRecipient[];

    if (typeof userId === "string" && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          telegramId: true,
          continuationPromptMessageId: true,
        },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      recipients = [user];
    } else if (audience === "all" || audience === "ACTIVE" || audience === "INACTIVE") {
      const users = await prisma.user.findMany({
        where: {
          telegramId: { not: null },
          ...(audience === "all" ? {} : { status: audience }),
        },
        select: {
          id: true,
          telegramId: true,
          continuationPromptMessageId: true,
        },
      });
      recipients = users.filter(
        (user) => user.telegramId && !user.telegramId.startsWith("pending_"),
      );
    } else {
      return NextResponse.json(
        { error: "Choose a user or an All, Active, or Inactive audience" },
        { status: 400 },
      );
    }

    recipients = recipients.filter(
      (user) => user.telegramId && !user.telegramId.startsWith("pending_"),
    );
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No linked Telegram users match this audience" },
        { status: 404 },
      );
    }
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram bot is not configured" },
        { status: 503 },
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let index = 0; index < recipients.length; index += 20) {
      const batch = recipients.slice(index, index + 20);
      const results = await Promise.all(batch.map(sendOrReplacePrompt));

      sentCount += results.filter(Boolean).length;
      failedCount += results.length - results.filter(Boolean).length;
    }

    return NextResponse.json({
      success: failedCount === 0,
      total: recipients.length,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Ask user in Telegram error:", error);
    return NextResponse.json(
      { error: "Failed to send Telegram message" },
      { status: 500 },
    );
  }
}