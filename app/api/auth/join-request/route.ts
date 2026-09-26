// app/api/auth/join-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    // Validate Telegram WebApp data
    const validation = validateTelegramWebAppData(initData);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid Telegram authentication data" },
        { status: 401 },
      );
    }

    const telegramUser = validation.user;
    const telegramId = telegramUser.id.toString();
    const fullName = `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim() || "Telegram User";
    const username = telegramUser.username || null;

    // 1. Check if user already exists in User table
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (existingUser) {
      return NextResponse.json({
        registered: true,
        user: existingUser,
        message: "You are already registered.",
      });
    }

    // 2. Check if a pending request already exists
    const existingPending = await prisma.pendingUser.findUnique({
      where: { telegramId },
    });

    if (existingPending) {
      if (existingPending.status === "PENDING") {
        return NextResponse.json(
          {
            pending: true,
            message: "Your request is pending approval from Super Admin.",
          },
          { status: 200 },
        );
      } else if (existingPending.status === "REJECTED") {
        return NextResponse.json(
          {
            rejected: true,
            error: "Your previous request was rejected. Please contact an admin.",
          },
          { status: 403 },
        );
      } else if (existingPending.status === "APPROVED") {
        return NextResponse.json(
          {
            approved: true,
            message: "Your request has been approved. Please open the app to complete your profile.",
          },
          { status: 200 },
        );
      }
    }

    // 3. Create a new PendingUser request with Telegram ID only (no phone required at join time)
    const newPending = await prisma.pendingUser.create({
      data: {
        telegramId,
        fullName,
        username,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      pending: true,
      message: "Access request submitted successfully. Waiting for Super Admin approval.",
      pendingUser: newPending,
    });
  } catch (error: any) {
    console.error("Join request error:", error);
    return NextResponse.json(
      { error: "Failed to submit join request: " + (error.message || "Unknown error") },
      { status: 500 },
    );
  }
}
