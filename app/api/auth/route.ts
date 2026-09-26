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

        // Check if user has a pending request
        pendingUser = await prisma.pendingUser.findUnique({
            where: { telegramId: telegramUser.id.toString() },
        });

        if (pendingUser) {
            if (pendingUser.status === "PENDING") {
                return NextResponse.json({
                    pending: true,
                    message: "Your request is pending approval from Super Admin"
                }, { status: 200 });
            } else if (pendingUser.status === "REJECTED") {
                return NextResponse.json({
                    error: "Your request was rejected"
                }, { status: 403 });
            }
        }

        // User not found — return not-registered status
        // The frontend will show a CTA button to initiate the request
        return NextResponse.json({
            notRegistered: true,
            message: "User not registered. Click the button to send a join request."
        }, { status: 200 });

    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
