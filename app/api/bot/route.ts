// app/api/bot/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { integrateUserIntoTree, removeUserFromTree } from "@/lib/tree-engine";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

interface TelegramCallbackQuery {
    id: string;
    data?: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number };
}

interface TelegramMessage {
    chat: { id: number; type?: string };
    from?: { id: number };
    text?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, callback_query: callbackQuery } = body;

        if (callbackQuery) {
            await handleStatusCallback(callbackQuery);
            return NextResponse.json({ ok: true });
        }

        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const telegramMessage = message as TelegramMessage;
        const chatId = telegramMessage.chat.id;
        const text = telegramMessage.text;

        if (text === "/start") {
            await sendMessage(chatId, "ቅዳሴ ጥሪ - Kidase Call\n\nWelcome! Click the button below to open the app.", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📱 Open App",
                                web_app: { url: APP_URL || "" },
                            },
                        ],
                    ],
                },
            });
        } else if (text && telegramMessage.from) {
            await handleDeactivationReason(telegramMessage, text);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Bot webhook error:", error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

async function handleStatusCallback(callbackQuery: TelegramCallbackQuery) {
    const match = /^member_status:([^:]+):(yes|no)$/.exec(callbackQuery.data || "");
    if (!match) {
        await telegramApi("answerCallbackQuery", {
            callback_query_id: callbackQuery.id,
            text: "This response is no longer available.",
            show_alert: true,
        });
        return;
    }

    const user = await prisma.user.findUnique({ where: { id: match[1] } });
    if (!user || user.telegramId !== callbackQuery.from.id.toString()) {
        await telegramApi("answerCallbackQuery", {
            callback_query_id: callbackQuery.id,
            text: "This question is not linked to your account.",
            show_alert: true,
        });
        return;
    }

    const chatId = callbackQuery.message?.chat.id ?? callbackQuery.from.id;
    const status = match[2] === "yes" ? "ACTIVE" : "INACTIVE";
    await telegramApi("answerCallbackQuery", {
        callback_query_id: callbackQuery.id,
        text: "Saving your answer...",
    });

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                status,
                active: status === "ACTIVE",
                deactivationReason: null,
                deactivationReasonRequestedAt:
                    status === "INACTIVE" ? new Date() : null,
            },
        });

        if (status === "ACTIVE") {
            await integrateUserIntoTree(user.id);
        } else {
            await removeUserFromTree(user.id);
        }
    } catch (error) {
        console.error("Save Telegram status response error:", error);
        await telegramApi("sendMessage", {
            chat_id: chatId,
            text: "Sorry, we could not save your response. Please contact an administrator.",
        });
        return;
    }

    const answer = match[2] === "yes" ? "YES" : "NO";
    await telegramApi("sendMessage", {
        chat_id: chatId,
        text: answer === "YES"
            ? "🙏 እናመሰግናለን!\n\nየየጌታ ደስታ የቅዳሴ ጥሪ አገልግሎቱን ለመቀጠል ስለወሰኑ።\n\n✝️ እግዚአብሔር አገልግሎታችንን ይቀበልልን።"
            : "🙏 እሺ፣ ስለነበረዎት ተሳትፎ እናመሰግናለን።\n\nከፈለጉ በማንኛውም ጊዜ ተመልሰው አገልግሎቱን መጀመር ይችላሉ። ✝️",
    });

    if (answer === "NO") {
        await telegramApi("sendMessage", {
            chat_id: chatId,
            text: "📝 እባክዎ አገልግሎቱን ላለመቀጠል የወሰኑበትን ምክንያት ይጻፉልን።",
            reply_markup: {
                force_reply: true,
                input_field_placeholder: "ምክንያትዎን ይጻፉ",
            },
        });
    }

    if (callbackQuery.message) {
        await telegramApi("editMessageText", {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: `Response received: ${answer}. Your status is now ${status}.`,
            reply_markup: { inline_keyboard: [] },
        });
    }
}

async function handleDeactivationReason(message: TelegramMessage, text: string) {
    const reason = text.trim();
    if (reason.startsWith("/")) return;

    const telegramId = message.from?.id.toString();
    if (!telegramId) return;

    const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true, deactivationReasonRequestedAt: true },
    });
    if (!user?.deactivationReasonRequestedAt) return;

    if (reason.length < 3 || reason.length > 1000) {
        await telegramApi("sendMessage", {
            chat_id: message.chat.id,
            text: "እባክዎ ምክንያትዎን ከ3 እስከ 1000 ቁምፊዎች ባሉት መልእክት ይላኩ።",
        });
        return;
    }

    const result = await prisma.user.updateMany({
        where: {
            id: user.id,
            deactivationReasonRequestedAt: { not: null },
        },
        data: {
            deactivationReason: reason,
            deactivationReasonRequestedAt: null,
        },
    });

    if (result.count === 1) {
        await telegramApi("sendMessage", {
            chat_id: message.chat.id,
            text: "🙏 ምክንያትዎን ስላጋሩን እናመሰግናለን።",
        });
    }
}

async function telegramApi(
    method: string,
    payload: Record<string, unknown>,
): Promise<boolean> {
    if (!BOT_TOKEN) {
        console.error(`Cannot call Telegram ${method}: bot token is missing`);
        return false;
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
            {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            },
        );
        const result = await response.json().catch(() => null) as
            | { ok?: boolean; description?: string }
            | null;
        if (!response.ok || !result?.ok) {
            console.error(
                `Telegram ${method} failed:`,
                result?.description || response.status,
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Telegram ${method} request error:`, error);
        return false;
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const setupSecret = searchParams.get("setup_secret");

        if (setupSecret !== CRON_SECRET) {
            return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
        }

        // Set webhook
        if (!BOT_TOKEN || !APP_URL) {
            return NextResponse.json(
                { error: "Bot token and app URL must be configured" },
                { status: 503 },
            );
        }

        const webhookUrl = `${APP_URL}/api/bot`;
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: webhookUrl,
                    allowed_updates: ["message", "callback_query"],
                }),
            },
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
            return NextResponse.json(
                { error: data.description || "Failed to configure webhook" },
                { status: 502 },
            );
        }

        // Set bot commands
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                commands: [
                    { command: "start", description: "Start the bot" },
                ],
            }),
        });

        return NextResponse.json({ success: true, webhook: data });
    } catch (error) {
        console.error("Bot setup error:", error);
        return NextResponse.json({ error: "Setup failed" }, { status: 500 });
    }
}

async function sendMessage(
    chatId: number,
    text: string,
    options: Record<string, unknown> = {},
) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            ...options,
        }),
    });
}
