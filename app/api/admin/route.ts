// app/api/admin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function GET(req: NextRequest) {
    try {
        const initData = req.headers.get("x-telegram-init-data");

        if (!initData) {
            return NextResponse.json({ error: "Missing auth data" }, { status: 401 });
        }

        const validation = validateTelegramWebAppData(initData);
        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const totalMembers = await prisma.user.count();
        const activeMembers = await prisma.user.count({
            where: { status: "ACTIVE" },
        });

        const currentCycle = await prisma.weeklyCycle.findFirst({
            where: { phase: { in: ["PREVIEW", "ACTIVE", "CLOSED"] } },
            orderBy: { createdAt: "desc" },
        });

        let stats = {
            totalMembers,
            activeMembers,
            waitingPoolSize: 0,
            currentCycle,
            totalCalls: 0,
            answeredCalls: 0,
            noAnswerCalls: 0,
            participationRate: 0,
        };

        if (currentCycle) {
            const waitingPoolSize = await prisma.waitingPool.count({
                where: {
                    cycleId: currentCycle.id,
                    status: "WAITING",
                },
            });

            const callStats = await prisma.callEdge.groupBy({
                by: ["status"],
                where: { cycleId: currentCycle.id },
                _count: true,
            });

            const totalCalls = callStats.reduce((sum, stat) => sum + stat._count, 0);
            const answeredCalls = callStats.find((s) => s.status === "ANSWERED")?._count || 0;
            const noAnswerCalls = callStats.find((s) => s.status === "NO_ANSWER")?._count || 0;

            const participationRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;

            stats = {
                ...stats,
                waitingPoolSize,
                totalCalls,
                answeredCalls,
                noAnswerCalls,
                participationRate,
            };
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
