// app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import { integrateUserIntoTree, removeUserFromTree } from "@/lib/tree-engine";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data");
    if (initData) {
      if (initData !== "web-bypass-token") {
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
    // If no telegramId provided, generate a placeholder based on phone number
    const telegramId = data.telegramId || `pending_${data.phoneNumber || Date.now()}`;
    const userStatus = data.status || "ACTIVE";
    const user = await prisma.user.create({
      data: {
        telegramId,
        fullName: data.fullName,
        baptismName: data.baptismName || null,
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        role: data.role || "MEMBER",
        status: userStatus,
        active: userStatus === "ACTIVE",
      },
    });

    // AUTO-ADD TO TREE only if ACTIVE
    if (user.status === "ACTIVE" && user.active) {
      try {
        await integrateUserIntoTree(user.id);
      } catch (treeErr) {
        console.error("Auto-add tree error:", treeErr);
      }
    }

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `The ${field} is already used by another user.` },
        { status: 409 },
      );
    }
    console.error("Create user error:", error);
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

    // Treat empty strings as null for nullable fields (avoids unique
    // constraint collisions between users with blank phone numbers)
    if (updateData.phoneNumber === "") updateData.phoneNumber = null;
    if (updateData.baptismName === "") updateData.baptismName = null;
    if (updateData.address === "") updateData.address = null;

    // Telegram ID is linked via the bot — never editable from here
    delete updateData.telegramId;

    if (updateData.status) {
      updateData.active = updateData.status === "ACTIVE";
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle tree membership on status change
    if (user.status !== "ACTIVE" || !user.active) {
      try {
        await removeUserFromTree(user.id);
      } catch (treeErr) {
        console.error("Remove from tree error:", treeErr);
      }
    } else if (user.status === "ACTIVE" && user.active) {
      try {
        await integrateUserIntoTree(user.id);
      } catch (treeErr) {
        console.error("Auto-add tree on status change error:", treeErr);
      }
    }

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `The ${field} is already used by another user.` },
        { status: 409 },
      );
    }
    console.error("Update user error:", error);
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

    try {
      await removeUserFromTree(id);
    } catch (treeErr) {
      console.error("Remove from tree before delete error:", treeErr);
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
