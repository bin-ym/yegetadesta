// app/api/auth/join-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/lib/telegram-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        {
          error: "የTelegram መረጃ አልተገኘም።",
        },
        { status: 400 },
      );
    }

    // Validate Telegram WebApp data
    const validation = validateTelegramWebAppData(initData);

    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        {
          error: "የTelegram ማረጋገጫ መረጃው ትክክል አይደለም።",
        },
        { status: 401 },
      );
    }

    const telegramUser = validation.user;

    const telegramId = telegramUser.id.toString();

    const fullName =
      `${telegramUser.first_name || ""} ${
        telegramUser.last_name || ""
      }`.trim() || "Telegram User";

    const username =
      telegramUser.username || null;

    // ---------------------------------------------
    // 1. Check if user already exists
    // ---------------------------------------------
    const existingUser =
      await prisma.user.findUnique({
        where: {
          telegramId,
        },
      });

    if (existingUser) {
      return NextResponse.json({
        registered: true,
        user: existingUser,
        message:
          "🙏 እርስዎ አስቀድመው ተመዝግበዋል።",
      });
    }

    // ---------------------------------------------
    // 2. Check existing pending request
    // ---------------------------------------------
    const existingPending =
      await prisma.pendingUser.findUnique({
        where: {
          telegramId,
        },
      });

    if (existingPending) {
      // -------------------------------------------
      // PENDING
      // -------------------------------------------
      if (
        existingPending.status === "PENDING"
      ) {
        return NextResponse.json(
          {
            pending: true,
            message:
              "🙏 የመመዝገቢያ ጥያቄዎ በሂደት ላይ ነው።\n\n" +
              "እባክዎ የሱፐር አድሚን ማጽደቅን ይጠብቁ።",
          },
          { status: 200 },
        );
      }

      // -------------------------------------------
      // REJECTED
      // -------------------------------------------
      if (
        existingPending.status === "REJECTED"
      ) {
        return NextResponse.json(
          {
            rejected: true,
            error:
              "የቀድሞ የመመዝገቢያ ጥያቄዎ ውድቅ ተደርጓል።\n\n" +
              "እባክዎ ከአስተዳዳሪ ጋር ይገናኙ።",
          },
          { status: 403 },
        );
      }

      // -------------------------------------------
      // APPROVED
      // -------------------------------------------
      if (
        existingPending.status === "APPROVED"
      ) {
        return NextResponse.json(
          {
            approved: true,
            message:
              "🎉 ጥያቄዎ ተቀባይነት አግኝቷል!\n\n" +
              "እባክዎ አፕሊኬሽኑን ከፍተው " +
              "የፕሮፋይልዎን መረጃ ያሟሉ።",
          },
          { status: 200 },
        );
      }
    }

    // ---------------------------------------------
    // 3. Create new pending request
    // ---------------------------------------------
    const newPending =
      await prisma.pendingUser.create({
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
      message:
        "🙏 የመመዝገቢያ ጥያቄዎ ተልኳል።\n\n" +
        "እባክዎ የሱፐር አድሚን ማጽደቅን ይጠብቁ።",
      pendingUser: newPending,
    });
  } catch (error: any) {
    console.error(
      "Join request error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "የመመዝገቢያ ጥያቄዎን መላክ አልተቻለም። " +
          (error.message || ""),
      },
      { status: 500 },
    );
  }
}