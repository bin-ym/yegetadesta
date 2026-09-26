// app/api/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";
import { integrateUserIntoTree } from "@/lib/tree-engine";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, fullName, baptismName, phoneNumber, address } = body;

    if (!initData) {
      return NextResponse.json({ error: "Missing auth data" }, { status: 401 });
    }

    const validation = validateTelegramWebAppData(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Normalize empty strings to null
    const normalize = (v: string | undefined | null) =>
      v && v.trim() !== "" ? v.trim() : null;

    const existingUser = await prisma.user.findUnique({
      where: { telegramId: validation.user.id.toString() },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Merge submitted values with existing ones so partial updates still
    // count toward profile completeness
    const merged = {
      fullName: normalize(fullName) ?? existingUser.fullName,
      baptismName: normalize(baptismName) ?? existingUser.baptismName,
      phoneNumber: normalize(phoneNumber) ?? existingUser.phoneNumber,
      address: normalize(address) ?? existingUser.address,
    };

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        fullName: merged.fullName,
        baptismName: merged.baptismName,
        phoneNumber: merged.phoneNumber,
        address: merged.address,
      },
    });

    // AUTO-ACTIVATE: when the profile is complete (baptism name, phone
    // number and address all filled in), the user becomes ACTIVE and is
    // integrated into the current call tree cycle.
    const profileComplete = Boolean(
      merged.baptismName && merged.phoneNumber && merged.address,
    );

    if (profileComplete && updatedUser.status === "INACTIVE") {
      const activatedUser = await prisma.user.update({
        where: { id: updatedUser.id },
        data: { status: "ACTIVE" },
      });

      // Add to the current cycle's tree (same behavior as before)
      try {
        await integrateUserIntoTree(updatedUser.id);
      } catch (treeErr) {
        console.error("Auto-add tree on activation error:", treeErr);
      }

      return NextResponse.json(activatedUser);
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error?.code === "P2002") {
      const field = error?.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `The ${field} is already used by another user.` },
        { status: 409 },
      );
    }
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
