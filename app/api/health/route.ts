// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        const userCount = await prisma.user.count();
        const cycleCount = await prisma.weeklyCycle.count();

        return NextResponse.json({
            status: "ok",
            database: "connected",
            users: userCount,
            cycles: cycleCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json(
            {
                status: "error",
                database: "disconnected",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
