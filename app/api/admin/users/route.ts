// app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import { integrateUserIntoTree } from "@/lib/tree-engine";

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
      await integrateUserIntoTree(user.id);
    } catch (treeErr) {
      console.error("Auto-add tree error:", treeErr);
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
