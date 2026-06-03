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
      console.log("User not found, checking pending status...");

      // Check if user has a pending request
      const pendingUser = await prisma.pendingUser.findUnique({
        where: { telegramId: validation.user.id.toString() },
      });

      if (pendingUser) {
        if (pendingUser.status === "PENDING") {
          return NextResponse.json(
            {
              pending: true,
              message: "Your request is pending approval from Super Admin",
            },
            { status: 202 },
          );
        } else if (pendingUser.status === "REJECTED") {
          return NextResponse.json(
            {
              error: "Your request was rejected",
            },
            { status: 403 },
          );
        }
      }

      // Create new pending user request
      await prisma.pendingUser.create({
        data: {
          telegramId: validation.user.id.toString(),
          fullName:
            `${validation.user.first_name} ${validation.user.last_name || ""}`.trim(),
          username: validation.user.username,
          status: "PENDING",
        },
      });

      console.log("Pending user request created");

      return NextResponse.json(
        {
          pending: true,
          message:
            "Access request submitted. Waiting for Super Admin approval.",
        },
        { status: 202 },
      );
    }

    console.log("Fetching current cycle...");
    const currentCycle = await prisma.weeklyCycle.findFirst({
      where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE", "CLOSED"] } },
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
      { status: 500 },
    );
  }
}
