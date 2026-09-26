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
              notRegistered: true,
              pending: true,
              message: "Your request is pending approval from Super Admin",
            },
            { status: 200 },
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

      // Don't auto-create pending — let the CTA flow handle it
      console.log("User not registered — returning notRegistered");

      return NextResponse.json(
        {
          notRegistered: true,
          message:
            "User not registered. Use the CTA button to send a join request.",
        },
        { status: 200 },
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
    const [myParent, myChildren, myOutgoingCalls, myIncomingCall] =
      await Promise.all([
        myNode.parentNodeId
          ? prisma.treeNode.findUnique({
              where: { id: myNode.parentNodeId },
              include: { user: true },
            })
          : Promise.resolve(null),
        prisma.treeNode.findMany({
          where: { parentNodeId: myNode.id },
          include: { user: true },
        }),
        prisma.callEdge.findMany({
          where: { callerNodeId: myNode.id },
          include: {
            calleeNode: { include: { user: true } },
          },
        }),
        prisma.callEdge.findFirst({
          where: { calleeNodeId: myNode.id },
          include: {
            callerNode: { include: { user: true } },
          },
        }),
      ]);

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
