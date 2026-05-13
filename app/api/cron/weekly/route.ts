// app/api/cron/weekly/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWeeklyCycle, persistTree } from "@/lib/tree-engine";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");

        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case "build":
                return await buildCycle();
            case "preview":
                return await activatePreview();
            case "activate":
                return await activateCycle();
            case "close":
                return await closeCycle();
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
    }
}

async function buildCycle() {
    const cycle = await createWeeklyCycle();

    const activeUsers = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
    });

    await persistTree({
        cycleId: cycle.id,
        userIds: activeUsers.map((u) => u.id),
    });

    return NextResponse.json({ success: true, cycle });
}

async function activatePreview() {
    const cycle = await prisma.weeklyCycle.findFirst({
        where: { phase: "BUILDING" },
        orderBy: { createdAt: "desc" },
    });

    if (!cycle) {
        return NextResponse.json({ error: "No cycle to preview" }, { status: 404 });
    }

    const updated = await prisma.weeklyCycle.update({
        where: { id: cycle.id },
        data: {
            phase: "PREVIEW",
            previewAt: new Date(),
        },
    });

    return NextResponse.json({ success: true, cycle: updated });
}

async function activateCycle() {
    const cycle = await prisma.weeklyCycle.findFirst({
        where: { phase: "PREVIEW" },
        orderBy: { createdAt: "desc" },
    });

    if (!cycle) {
        return NextResponse.json({ error: "No cycle to activate" }, { status: 404 });
    }

    const updated = await prisma.weeklyCycle.update({
        where: { id: cycle.id },
        data: {
            phase: "ACTIVE",
            startDate: new Date(),
        },
    });

    return NextResponse.json({ success: true, cycle: updated });
}

async function closeCycle() {
    const cycle = await prisma.weeklyCycle.findFirst({
        where: { phase: "ACTIVE" },
        orderBy: { createdAt: "desc" },
    });

    if (!cycle) {
        return NextResponse.json({ error: "No cycle to close" }, { status: 404 });
    }

    const updated = await prisma.weeklyCycle.update({
        where: { id: cycle.id },
        data: {
            phase: "CLOSED",
            endDate: new Date(),
            isLocked: true,
        },
    });

    // Create snapshot
    const nodes = await prisma.treeNode.findMany({
        where: { cycleId: cycle.id },
        include: { user: true },
    });

    const edges = await prisma.callEdge.findMany({
        where: { cycleId: cycle.id },
    });

    const totalCalls = edges.length;
    const answeredCalls = edges.filter((e) => e.status === "ANSWERED").length;
    const noAnswerCalls = edges.filter((e) => e.status === "NO_ANSWER").length;

    await prisma.weeklySnapshot.create({
        data: {
            cycleId: cycle.id,
            weekNumber: cycle.weekNumber,
            year: cycle.year,
            totalMembers: nodes.length,
            totalCalls,
            answeredCalls,
            noAnswerCalls,
            participationPct: totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0,
            treeSnapshot: nodes,
            callLog: edges,
        },
    });

    return NextResponse.json({ success: true, cycle: updated });
}
