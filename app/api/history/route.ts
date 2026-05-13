// app/api/history/route.ts

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

        const snapshots = await prisma.weeklySnapshot.findMany({
            include: {
                cycle: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ snapshots });
    } catch (error) {
        console.error("History fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
