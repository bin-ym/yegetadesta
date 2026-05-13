// app/api/setup/route.ts
// One-time setup endpoint to initialize the system

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createWeeklyCycle, persistTree } from "@/lib/tree-engine";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { secret } = body;

        // Verify secret
        if (secret !== CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Starting setup...");

        // Check if already setup
        const existingUsers = await prisma.user.count();
        const existingCycles = await prisma.weeklyCycle.count();

        if (existingUsers > 0 && existingCycles > 0) {
            return NextResponse.json({
                message: "System already initialized",
                users: existingUsers,
                cycles: existingCycles,
            });
        }

        // Create sample users if none exist
        if (existingUsers === 0) {
            console.log("Creating sample users...");

            const sampleUsers = [
                {
                    telegramId: "1000000001",
                    fullName: "አለሙ ተፈሪ",
                    baptismName: "ሚካኤል",
                    phoneNumber: "+251911000001",
                    address: "ቦሌ",
                    role: "ADMIN" as const,
                },
                {
                    telegramId: "1000000002",
                    fullName: "ብርሃኑ ወልዴ",
                    baptismName: "ገብርኤል",
                    phoneNumber: "+251911000002",
                    address: "ፒያሳ",
                    role: "MEMBER" as const,
                },
                {
                    telegramId: "1000000003",
                    fullName: "ቅዱስ አሰፋ",
                    baptismName: "ኡራኤል",
                    phoneNumber: "+251911000003",
                    address: "ካዛንቺስ",
                    role: "MEMBER" as const,
                },
                {
                    telegramId: "1000000004",
                    fullName: "ዲያቆን ቴዎድሮስ",
                    baptismName: "ቴዎድሮስ",
                    phoneNumber: "+251911000004",
                    address: "4 ኪሎ",
                    role: "MEMBER" as const,
                },
                {
                    telegramId: "1000000005",
                    fullName: "ህብረት ሙሉጌታ",
                    baptismName: "ዮሐንስ",
                    phoneNumber: "+251911000005",
                    address: "ሜክሲኮ",
                    role: "MEMBER" as const,
                },
            ];

            await prisma.user.createMany({
                data: sampleUsers,
            });

            console.log(`Created ${sampleUsers.length} sample users`);
        }

        // Get all active users
        const users = await prisma.user.findMany({
            where: { status: "ACTIVE" },
            orderBy: { joinedAt: "asc" },
        });

        console.log(`Found ${users.length} active users`);

        // Create weekly cycle
        console.log("Creating weekly cycle...");
        const cycle = await createWeeklyCycle();

        // Build tree
        console.log("Building call tree...");
        await persistTree({
            cycleId: cycle.id,
            userIds: users.map((u) => u.id),
        });

        // Update cycle to PREVIEW phase so users can see it
        await prisma.weeklyCycle.update({
            where: { id: cycle.id },
            data: {
                phase: "PREVIEW",
                previewAt: new Date(),
            },
        });

        console.log("Setup complete!");

        return NextResponse.json({
            success: true,
            message: "System initialized successfully",
            users: users.length,
            cycle: {
                id: cycle.id,
                weekNumber: cycle.weekNumber,
                year: cycle.year,
                phase: "PREVIEW",
            },
        });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json(
            {
                error: "Setup failed",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");

        if (secret !== CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.count();
        const cycles = await prisma.weeklyCycle.count();
        const nodes = await prisma.treeNode.count();
        const edges = await prisma.callEdge.count();

        return NextResponse.json({
            status: "ok",
            users,
            cycles,
            nodes,
            edges,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Failed to get status",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
