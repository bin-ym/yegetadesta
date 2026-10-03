// app/api/bot/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  integrateUserIntoTree,
  removeUserFromTree,
} from "@/lib/tree-engine";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

const TELEGRAM_API_URL = BOT_TOKEN
  ? `https://api.telegram.org/bot${BOT_TOKEN}`
  : null;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TelegramUser {
  id: number;
}

interface TelegramChat {
  id: number;
  type?: string;
}

interface TelegramMessage {
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from: TelegramUser;
  message?: {
    chat: TelegramChat;
    message_id: number;
  };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const START_MESSAGE =
  "✝️ የጌታ ደስታ የቅዳሴ ጥሪ\n\n" +
  "እንኳን ወደ የጌታ ደስታ ቅዳሴ ጥሪ አገልግሎት በሰላም መጡ።\n\n" +
  "አፕሊኬሽኑን ለመክፈት ከታች ያለውን አዝራር ይጫኑ።";

const START_REPLY_MARKUP = () => ({
  inline_keyboard: [
    [
      {
        text: "📱 አፕሊኬሽኑን ክፈት",
        web_app: {
          url: APP_URL ?? "",
        },
      },
    ],
  ],
});

// -----------------------------------------------------------------------------
// Telegram API
// -----------------------------------------------------------------------------

async function telegramApi<T = unknown>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T | null> {
  if (!TELEGRAM_API_URL) {
    console.error(
      `Cannot call Telegram ${method}: TELEGRAM_BOT_TOKEN is missing`,
    );
    return null;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result =
      (await response.json().catch(() => null)) as TelegramApiResponse<T> | null;

    if (!response.ok || !result?.ok) {
      console.error(
        `Telegram ${method} failed:`,
        result?.description ?? `HTTP ${response.status}`,
      );
      return null;
    }

    return result.result ?? null;
  } catch (error) {
    console.error(`Telegram ${method} request error:`, error);
    return null;
  }
}

async function sendMessage(
  chatId: number,
  text: string,
  options: Record<string, unknown> = {},
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    ...options,
  });
}

// -----------------------------------------------------------------------------
// /start
// -----------------------------------------------------------------------------

async function handleStart(chatId: number) {
  if (!APP_URL) {
    console.error("NEXT_PUBLIC_APP_URL is missing");
  }

  await sendMessage(chatId, START_MESSAGE, {
    reply_markup: START_REPLY_MARKUP(),
  });
}

// -----------------------------------------------------------------------------
// Callback: member_status:{userId}:{yes|no}
// -----------------------------------------------------------------------------

async function handleStatusCallback(
  callbackQuery: TelegramCallbackQuery,
): Promise<void> {
  const match = /^member_status:([^:]+):(yes|no)$/.exec(
    callbackQuery.data ?? "",
  );

  if (!match) {
    await telegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "This response is no longer available.",
      show_alert: true,
    });

    return;
  }

  const [, userId, response] = match;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || user.telegramId !== callbackQuery.from.id.toString()) {
    await telegramApi("answerCallbackQuery", {
      callback_query_id: callbackQuery.id,
      text: "This question is not linked to your account.",
      show_alert: true,
    });

    return;
  }

  const chatId = callbackQuery.message?.chat.id ?? callbackQuery.from.id;
  const isActive = response === "yes";
  const status = isActive ? "ACTIVE" : "INACTIVE";
  const profileUrl = APP_URL ? new URL(APP_URL) : null;
  profileUrl?.searchParams.set("editProfile", "1");
  const profileComplete = Boolean(
    user.fullName.trim() &&
      user.baptismName?.trim() &&
      user.phoneNumber?.trim() &&
      user.address?.trim(),
  );

  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQuery.id,
    text: "Saving your answer...",
  });

  if (isActive && !profileComplete) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          participationOptOut: false,
          deactivationReason: null,
          deactivationReasonRequestedAt: null,
          continuationPromptMessageId: null,
        },
      });
    } catch (error) {
      console.error("Clear opt-out after continuation response error:", error);
      await sendMessage(
        chatId,
        "የምላሽዎን ማስቀመጥ አልተሳካም። እባክዎ አስተዳዳሪን ያነጋግሩ።",
      );
      return;
    }

    await sendMessage(
      chatId,
      "አገልግሎቱን ለመቀጠል፣ እባክዎ መጀመሪያ የግል ፕሮፋይልዎን ያጠናቅቁ። ሙሉ ስም፣ የክርስትና ስም፣ ስልክ ቁጥር እና አድራሻ ያስገቡ።",
      profileUrl
        ? {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "መረጃዎን ይሙሉ",
                    web_app: { url: profileUrl.toString() },
                  },
                ],
              ],
            },
          }
        : {},
    );

    if (callbackQuery.message) {
      await telegramApi("editMessageText", {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id,
        text: "🙏 ምላሽዎ ተቀብለናል።",
        reply_markup: { inline_keyboard: [] },
      });
    }

    return;
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        status,
        active: isActive,
        participationOptOut: !isActive,
        deactivationReason: null,
        deactivationReasonRequestedAt: isActive ? null : new Date(),
        continuationPromptMessageId: null,
      },
    });

  } catch (error) {
    console.error("Save Telegram status response error:", error);

    await sendMessage(
      chatId,
      "Sorry, we could not save your response. Please contact an administrator.",
    );

    return;
  }

  try {
    if (isActive) {
      await integrateUserIntoTree(user.id);
    } else {
      await removeUserFromTree(user.id);
    }
  } catch (error) {
    console.error("Update call tree after status response error:", error);
  }

  if (isActive) {
    await sendMessage(
      chatId,
      "🙏 እናመሰግናለን!\n\n" +
        "የየጌታ ደስታ የቅዳሴ ጥሪ አገልግሎቱን ለመቀጠል ስለወሰኑ።\n\n" +
        "✝️ እግዚአብሔር አገልግሎታችንን ይቀበልልን።\n\n" +
        "እባክዎ የግል መረጃዎን ይሙሉ ወይም ያረጋግጡ።",
      profileUrl
        ? {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "መረጃዎን ይሙሉ",
                    web_app: { url: profileUrl.toString() },
                  },
                ],
              ],
            },
          }
        : {},
    );
  } else {
    await sendMessage(
      chatId,
      "📝 እባክዎ አገልግሎቱን ላለመቀጠል የወሰኑበትን ምክንያት ይጻፉልን።",
      {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: "ምክንያትዎን ይጻፉ",
        },
      },
    );
  }

  if (callbackQuery.message) {
    await telegramApi("editMessageText", {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      text:
        isActive
          ? "🙏 ምላሽዎ ተረጋግጧል።\n\n" +
            `የአባልነት ሁኔታዎ አሁን ${status} ሆኗል።`
          : "📝 ምክንያትዎን በመልእክት ይላኩ።",
      reply_markup: {
        inline_keyboard: [],
      },
    });
  }
}

// -----------------------------------------------------------------------------
// Deactivation reason
// -----------------------------------------------------------------------------

async function handleDeactivationReason(
  message: TelegramMessage,
  text: string,
): Promise<void> {
  const reason = text.trim();

  // Ignore commands.
  if (!reason || reason.startsWith("/")) {
    return;
  }

  const telegramId = message.from?.id.toString();

  if (!telegramId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      telegramId,
    },
    select: {
      id: true,
      deactivationReasonRequestedAt: true,
    },
  });

  // User has not been asked for a reason.
  if (!user?.deactivationReasonRequestedAt) {
    return;
  }

  if (reason.length < 3 || reason.length > 1000) {
    await sendMessage(
      message.chat.id,
      "እባክዎ ምክንያትዎን ከ3 እስከ 1000 ቁምፊዎች ባሉት መልእክት ይላኩ።",
    );

    return;
  }

  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      deactivationReasonRequestedAt: {
        not: null,
      },
    },
    data: {
      deactivationReason: reason,
      deactivationReasonRequestedAt: null,
    },
  });

  if (result.count === 1) {
    await sendMessage(
      message.chat.id,
      "🙏 ምክንያትዎን ስላጋሩን እናመሰግናለን።\n\n" +
        "🙏 ምላሽዎ ተረጋግጧል።\n\n" +
        "የአባልነት ሁኔታዎ አሁን INACTIVE ሆኗል።\n\n" +
        "🙏 እሺ፣ ስለነበረዎት ተሳትፎ እናመሰግናለን።\n\n" +
        "ከፈለጉ በማንኛውም ጊዜ ተመልሰው አገልግሎቱን መጀመር ይችላሉ። ✝️",
    );
  }
}

// -----------------------------------------------------------------------------
// Webhook
// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TelegramUpdate;

    // Callback query
    if (body.callback_query) {
      await handleStatusCallback(body.callback_query);

      return NextResponse.json({ ok: true });
    }

    // Ignore updates without a message.
    if (!body.message) {
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    const { chat, text } = message;

    if (text === "/start") {
      await handleStart(chat.id);
    } else if (text && message.from) {
      await handleDeactivationReason(message, text);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bot webhook error:", error);

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      },
    );
  }
}

// -----------------------------------------------------------------------------
// Webhook setup
// GET /api/bot?setup_secret=...
// -----------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const setupSecret = searchParams.get("setup_secret");

    if (!CRON_SECRET || setupSecret !== CRON_SECRET) {
      return NextResponse.json(
        {
          error: "Invalid secret",
        },
        {
          status: 403,
        },
      );
    }

    if (!BOT_TOKEN || !APP_URL) {
      return NextResponse.json(
        {
          error: "Bot token and app URL must be configured",
        },
        {
          status: 503,
        },
      );
    }

    const webhookUrl = `${APP_URL}/api/bot`;

    // Set webhook.
    const webhookResult = await telegramApi<{
      url: string;
      has_custom_certificate: boolean;
      pending_update_count: number;
    }>("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    });

    if (!webhookResult) {
      return NextResponse.json(
        {
          error: "Failed to configure webhook",
        },
        {
          status: 502,
        },
      );
    }

    // Set bot commands.
    const commandsResult = await telegramApi("setMyCommands", {
      commands: [
        {
          command: "start",
          description: "Start the bot",
        },
      ],
    });

    if (!commandsResult) {
      console.warn("Webhook configured, but setMyCommands failed");
    }

    return NextResponse.json({
      success: true,
      webhook: webhookResult,
    });
  } catch (error) {
    console.error("Bot setup error:", error);

    return NextResponse.json(
      {
        error: "Setup failed",
      },
      {
        status: 500,
      },
    );
  }
}