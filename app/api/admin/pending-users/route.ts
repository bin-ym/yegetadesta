// app/api/admin/pending-users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

// Get all pending users
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

        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
        }

        const pendingUsers = await prisma.pendingUser.findMany({
            where: { status: "PENDING" },
            orderBy: { requestedAt: "asc" },
        });

        return NextResponse.json({ pendingUsers });
    } catch (error) {
        console.error("Pending users fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch pending users" }, { status: 500 });
    }
}

// Approve or reject pending user
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData, pendingUserId, action } = body;

        if (!initData || !pendingUserId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validation = validateTelegramWebAppData(initData);
        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
        });

        if (!admin || admin.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
        }

        const pendingUser = await prisma.pendingUser.findUnique({
            where: { id: pendingUserId },
        });

        if (!pendingUser) {
            return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
        }

        if (action === "approve") {
            // Create the user
            const newUser = await prisma.user.create({
                data: {
                    telegramId: pendingUser.telegramId,
                    fullName: pendingUser.fullName,
                    username: pendingUser.username,
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
                        userId: newUser.id,
                        position: 0,
                        status: "WAITING",
                    },
                });
            }

            // Update pending user status
            await prisma.pendingUser.update({
                where: { id: pendingUserId },
                data: {
                    status: "APPROVED",
                    reviewedAt: new Date(),
                    reviewedBy: admin.id,
                },
            });

            return NextResponse.json({
                success: true,
                message: "User approved and added to next pool",
                user: newUser
            });
        } else if (action === "reject") {
            // Update pending user status
            await prisma.pendingUser.update({
                where: { id: pendingUserId },
                data: {
                    status: "REJECTED",
                    reviewedAt: new Date(),
                    reviewedBy: admin.id,
                },
            });

            return NextResponse.json({
                success: true,
                message: "User request rejected"
            });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Pending user action error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
