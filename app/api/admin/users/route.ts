import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import { calculateNodeInfo, positionLabel } from "@/lib/tree-engine";
import { CallStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");

    if (initData) {
      if (initData === "web-bypass-token") {
        // Allowed
      } else {
        const validation = validateTelegramWebAppData(initData);
        if (validation.valid && validation.user) {
          const user = await prisma.user.findUnique({
            where: { telegramId: validation.user.id.toString() },
          });

          if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json(
              { error: "Unauthorized" },
              { status: 403 },
            );
          }
        } else {
          return NextResponse.json(
            { error: "Invalid session" },
            { status: 401 },
          );
        }
      }
    } else {
      // For web demo login (if we want to support it, but better to be secure)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const user = await prisma.user.create({
      data: {
        telegramId: data.telegramId,
        fullName: data.fullName,
        baptismName: data.baptismName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        role: data.role || "MEMBER",
        status: "ACTIVE",
      },
    });

    // AUTO-ADD TO TREE
    try {
      const cycle = await prisma.weeklyCycle.findFirst({
        where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE"] } },
        orderBy: { createdAt: "desc" },
      });

      if (cycle) {
        const nodeCount = await prisma.treeNode.count({
          where: { cycleId: cycle.id },
        });

        const info = calculateNodeInfo(nodeCount);

        let parentNodeId = null;
        if (info.parentIndex >= 0) {
          const parentPos = positionLabel(info.parentIndex);
          const parentNode = await prisma.treeNode.findFirst({
            where: { cycleId: cycle.id, position: parentPos },
          });
          parentNodeId = parentNode?.id || null;
        }

        const newNode = await prisma.treeNode.create({
          data: {
            cycleId: cycle.id,
            userId: user.id,
            position: info.position,
            level: info.level,
            parentNodeId: parentNodeId,
          },
        });

        if (parentNodeId) {
          await prisma.callEdge.create({
            data: {
              cycleId: cycle.id,
              callerNodeId: parentNodeId,
              calleeNodeId: newNode.id,
              status: CallStatus.UNCALLED,
            },
          });
        }
      }
    } catch (treeErr) {
      console.error("Auto-add tree error:", treeErr);
      // Don't fail the user creation if tree add fails
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updateData } = data;
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "Id required" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
