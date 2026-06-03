import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    if (initData) {
      if (initData === "web-bypass-token") {
        // Web bypass allowed for GET tree
      } else {
        const validation = validateTelegramWebAppData(initData);
        if (!validation.valid || !validation.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    }

    const currentCycle = await prisma.weeklyCycle.findFirst({
      where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE", "CLOSED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!currentCycle) {
      return NextResponse.json({ error: "No active cycle" }, { status: 404 });
    }

    const treeNodes = await prisma.treeNode.findMany({
      where: { cycleId: currentCycle.id },
      include: {
        user: true,
        parent: { include: { user: true } },
        children: { include: { user: true } },
      },
      orderBy: { position: "asc" },
    });

    const callEdges = await prisma.callEdge.findMany({
      where: { cycleId: currentCycle.id },
      include: {
        callerNode: { include: { user: true } },
        calleeNode: { include: { user: true } },
      },
    });

    return NextResponse.json({
      cycle: currentCycle,
      nodes: treeNodes,
      edges: callEdges,
    });
  } catch (error) {
    console.error("Tree fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tree" },
      { status: 500 },
    );
  }
}
