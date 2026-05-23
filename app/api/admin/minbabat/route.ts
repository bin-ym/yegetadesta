// app/api/admin/minbabat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MINBABAT_FILE = path.join(process.cwd(), "public", "data", "minbabat.json");

// GET - Fetch all minbabat data
export async function GET() {
    try {
        const fileContent = await fs.readFile(MINBABAT_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading minbabat data:", error);
        return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
    }
}

// POST - Add or update minbabat data
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Write to file
        await fs.writeFile(MINBABAT_FILE, JSON.stringify(data, null, 2), "utf-8");

        return NextResponse.json({ success: true, message: "Minbabat data saved successfully" });
    } catch (error) {
        console.error("Error saving minbabat data:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}
