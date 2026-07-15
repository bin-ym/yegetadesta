// app/api/admin/misbak/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all misbak data
export async function GET() {
  try {
    const data = await prisma.misbak.findMany({
      orderBy: {
        id: "asc",
      },
    });
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

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Missing or invalid data" },
        { status: 400 },
      );
    }

    // Delete all existing records and insert new ones in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.misbak.deleteMany();

      if (data.length > 0) {
        // Strip IDs and let auto-increment handle them
        const entries = data.map((item: any) => ({
          date: item.date,
          dayOfWeek: item.dayOfWeek || "",
          geez: item.geez || "",
          translation: item.translation || "",
          liturgy: item.liturgy || "",
        }));
        await tx.misbak.createMany({
          data: entries,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Misbak data saved successfully",
    });
  } catch (error) {
    console.error("Error saving misbak data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// PATCH - Update a single misbak entry
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, date, dayOfWeek, geez, translation, liturgy } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const updated = await prisma.misbak.update({
      where: { id: parseInt(id) },
      data: {
        date,
        dayOfWeek: dayOfWeek || "",
        geez: geez || "",
        translation: translation || "",
        liturgy: liturgy || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Misbak entry updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating misbak entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 },
    );
  }
}

// PUT - Add a single misbak entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, dayOfWeek, geez, translation, liturgy } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!geez && !translation) {
      return NextResponse.json(
        { error: "At least one of Geez text or Translation is required" },
        { status: 400 },
      );
    }

    const created = await prisma.misbak.create({
      data: {
        date,
        dayOfWeek: dayOfWeek || "",
        geez: geez || "",
        translation: translation || "",
        liturgy: liturgy || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Misbak entry created",
      data: created,
    });
  } catch (error) {
    console.error("Error creating misbak entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 },
    );
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

    await prisma.misbak.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Misbak entry deleted",
    });
  } catch (error) {
    console.error("Error deleting misbak entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 },
    );
  }
}
