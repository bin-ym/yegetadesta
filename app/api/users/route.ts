// app/api/users/route.ts

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

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Users fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData, userId, updates } = body;

        const validation = validateTelegramWebAppData(initData);
        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
        });

        // Only SUPER_ADMIN can update roles
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates,
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("User update error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
