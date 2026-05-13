// app/api/bot/route.ts

import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text;

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
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Bot webhook error:", error);
        return NextResponse.json({ ok: false }, { status: 500 });
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
        const webhookUrl = `${APP_URL}/api/bot`;
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`
        );
        const data = await response.json();

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

async function sendMessage(chatId: number, text: string, options: any = {}) {
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
