// app/api/tree/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData } = body;

        console.log("Dashboard request received");

        if (!initData) {
            console.error("Missing initData");
            return NextResponse.json({ error: "Missing initData" }, { status: 400 });
        }

        console.log("Validating Telegram data...");
        const validation = validateTelegramWebAppData(initData);

        if (!validation.valid || !validation.user) {
            console.error("Invalid Telegram data");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("User validated:", validation.user.id);

        const user = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
        });

        if (!user) {
            console.log("User not found, creating new user...");

            // Auto-register new user
            const newUser = await prisma.user.create({
                data: {
                    telegramId: validation.user.id.toString(),
                    fullName: `${validation.user.first_name} ${validation.user.last_name || ""}`.trim(),
                    username: validation.user.username,
                    role: "MEMBER",
                    status: "ACTIVE",
                },
            });

            console.log("New user created:", newUser.id);

            // Add to waiting pool if there's an active cycle
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
                console.log("User added to waiting pool");
            }

            return NextResponse.json({
                user: newUser,
                currentCycle: null,
                myNode: null,
                myParent: null,
                myChildren: [],
                myOutgoingCalls: [],
                myIncomingCall: null,
            });
        }

        console.log("Fetching current cycle...");
        const currentCycle = await prisma.weeklyCycle.findFirst({
            where: { phase: { in: ["PREVIEW", "ACTIVE", "CLOSED"] } },
            orderBy: { createdAt: "desc" },
        });

        if (!currentCycle) {
            console.log("No active cycle found");
            return NextResponse.json({
                user,
                currentCycle: null,
                myNode: null,
                myParent: null,
                myChildren: [],
                myOutgoingCalls: [],
                myIncomingCall: null,
            });
        }

        console.log("Fetching user node...");
        const myNode = await prisma.treeNode.findUnique({
            where: {
                cycleId_userId: {
                    cycleId: currentCycle.id,
                    userId: user.id,
                },
            },
            include: { user: true },
        });

        if (!myNode) {
            console.log("User not in current cycle tree");
            return NextResponse.json({
                user,
                currentCycle,
                myNode: null,
                myParent: null,
                myChildren: [],
                myOutgoingCalls: [],
                myIncomingCall: null,
            });
        }

        console.log("Fetching tree relationships...");
        const myParent = myNode.parentNodeId
            ? await prisma.treeNode.findUnique({
                where: { id: myNode.parentNodeId },
                include: { user: true },
            })
            : null;

        const myChildren = await prisma.treeNode.findMany({
            where: { parentNodeId: myNode.id },
            include: { user: true },
        });

        const myOutgoingCalls = await prisma.callEdge.findMany({
            where: { callerNodeId: myNode.id },
            include: {
                calleeNode: { include: { user: true } },
            },
        });

        const myIncomingCall = await prisma.callEdge.findFirst({
            where: { calleeNodeId: myNode.id },
            include: {
                callerNode: { include: { user: true } },
            },
        });

        console.log("Dashboard data fetched successfully");
        return NextResponse.json({
            user,
            currentCycle,
            myNode,
            myParent,
            myChildren,
            myOutgoingCalls,
            myIncomingCall,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch dashboard",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
