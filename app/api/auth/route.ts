// app/api/auth/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData } = body;

        if (!initData) {
            return NextResponse.json({ error: "Missing initData" }, { status: 400 });
        }

        // Validate Telegram data
        const validation = validateTelegramWebAppData(initData);

        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
        }

        const telegramUser = validation.user;

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { telegramId: telegramUser.id.toString() },
        });

        if (user) {
            return NextResponse.json({ user });
        }

        // Check if user has a pending request
        let pendingUser = await prisma.pendingUser.findUnique({
            where: { telegramId: telegramUser.id.toString() },
        });

        if (pendingUser) {
            if (pendingUser.status === "PENDING") {
                return NextResponse.json({
                    pending: true,
                    message: "Your request is pending approval from Super Admin"
                }, { status: 202 });
            } else if (pendingUser.status === "REJECTED") {
                return NextResponse.json({
                    error: "Your request was rejected"
                }, { status: 403 });
            }
        }

        // Create new pending user request
        pendingUser = await prisma.pendingUser.create({
            data: {
                telegramId: telegramUser.id.toString(),
                fullName: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
                username: telegramUser.username,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            pending: true,
            message: "Access request submitted. Waiting for Super Admin approval."
        }, { status: 202 });

    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
