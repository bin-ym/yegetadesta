// app/api/auth/link-phone/route.ts
// Links a user's phone number to their Telegram ID

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData, phoneNumber } = body;

        if (!initData) {
            return NextResponse.json({ error: "Missing initData" }, { status: 400 });
        }

        if (!phoneNumber) {
            return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
        }

        // Validate Telegram data
        const validation = validateTelegramWebAppData(initData);

        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
        }

        const telegramId = validation.user.id.toString();

        // Check if this Telegram ID is already linked to a user
        let user = await prisma.user.findUnique({
            where: { telegramId },
        });

        if (user) {
            // Already linked — update phone if provided
            if (phoneNumber) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { phoneNumber },
                });
            }
            return NextResponse.json({ user, linked: true });
        }

        // Try to find user by phone number
        user = await prisma.user.findFirst({
            where: { phoneNumber },
        });

        if (user) {
            // Found by phone — link the Telegram ID
            user = await prisma.user.update({
                where: { id: user.id },
                data: { telegramId },
            });
            return NextResponse.json({ user, linked: true });
        }

        // No user found with this phone — try creating a pending request
        const telegramUser = validation.user;
        const pendingUser = await prisma.pendingUser.create({
            data: {
                telegramId,
                fullName: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
                username: telegramUser.username,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            pending: true,
            message: "Access request submitted. Waiting for Super Admin approval.",
        }, { status: 202 });

    } catch (error) {
        console.error("Link phone error:", error);
        return NextResponse.json({ error: "Failed to link phone" }, { status: 500 });
    }
}
