// app/api/calls/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { initData, callEdgeId, status } = body;

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

        const callEdge = await prisma.callEdge.findUnique({
            where: { id: callEdgeId },
            include: {
                callerNode: true,
                cycle: true,
            },
        });

        if (!callEdge) {
            return NextResponse.json({ error: "Call edge not found" }, { status: 404 });
        }

        // Verify user owns this call edge
        if (callEdge.callerNode.userId !== user.id) {
            return NextResponse.json({ error: "Not authorized to update this call" }, { status: 403 });
        }

        // Verify cycle is active
        if (callEdge.cycle.phase !== "ACTIVE") {
            return NextResponse.json({ error: "Cycle is not active" }, { status: 400 });
        }

        // Update call status
        const updateData: any = { status };

        if (status === "CALLED" && !callEdge.calledAt) {
            updateData.calledAt = new Date();
            updateData.retryCount = callEdge.retryCount + 1;
        }

        if (status === "ANSWERED" && !callEdge.answeredAt) {
            updateData.answeredAt = new Date();
            if (!callEdge.calledAt) {
                updateData.calledAt = new Date();
            }
        }

        const updatedCallEdge = await prisma.callEdge.update({
            where: { id: callEdgeId },
            data: updateData,
            include: {
                callerNode: { include: { user: true } },
                calleeNode: { include: { user: true } },
            },
        });

        return NextResponse.json({ callEdge: updatedCallEdge });
    } catch (error) {
        console.error("Call update error:", error);
        return NextResponse.json({ error: "Failed to update call" }, { status: 500 });
    }
}
