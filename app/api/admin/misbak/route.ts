// app/api/admin/misbak/route.ts

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MISBAK_FILE = path.join(process.cwd(), "public", "data", "misbak.json");

// GET - Fetch all misbak data
export async function GET() {
    try {
        const fileContent = await fs.readFile(MISBAK_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading misbak data:", error);
        return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
    }
}

// POST - Add or update misbak data
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { data } = body;

        if (!data) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // Write to file
        await fs.writeFile(MISBAK_FILE, JSON.stringify(data, null, 2), "utf-8");

        return NextResponse.json({ success: true, message: "Misbak data saved successfully" });
    } catch (error) {
        console.error("Error saving misbak data:", error);
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}

// DELETE - Delete a misbak entry
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Read current data
        const fileContent = await fs.readFile(MISBAK_FILE, "utf-8");
        const data = JSON.parse(fileContent);

        // Filter out the item to delete
        const updatedData = data.filter((item: any) => item.id !== parseInt(id));

        // Write back to file
        await fs.writeFile(MISBAK_FILE, JSON.stringify(updatedData, null, 2), "utf-8");

        return NextResponse.json({ success: true, message: "Misbak entry deleted" });
    } catch (error) {
        console.error("Error deleting misbak entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
