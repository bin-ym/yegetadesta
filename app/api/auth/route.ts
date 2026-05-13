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

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { telegramId: telegramUser.id.toString() },
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    telegramId: telegramUser.id.toString(),
                    fullName: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
                    username: telegramUser.username,
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
                        userId: user.id,
                        position: 0,
                        status: "WAITING",
                    },
                });
            }
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
