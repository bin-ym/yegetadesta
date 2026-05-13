// app/api/tree/dashboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData } = body;

        const validation = validateTelegramWebAppData(initData);
        if (!validation.valid || !validation.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCycle = await prisma.weeklyCycle.findFirst({
            where: { phase: { in: ["PREVIEW", "ACTIVE", "CLOSED"] } },
            orderBy: { createdAt: "desc" },
        });

        if (!currentCycle) {
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
        return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
    }
}
