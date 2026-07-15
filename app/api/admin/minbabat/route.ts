// app/api/admin/minbabat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all minbabat data
export async function GET() {
  try {
    const data = await prisma.minbabat.findMany({
      orderBy: {
        id: "asc",
      },
    });

    // Transform to the expected format (day -> categories structure)
    const formatted: any = {};
    data.forEach((item) => {
      if (!formatted[item.date]) {
        formatted[item.date] = {};
      }
      formatted[item.date][item.category] = {
        title: item.title,
        content: item.content,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error reading minbabat data:", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

// POST - Add or update minbabat data (bulk)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Transform from day -> categories to flat array
    const entries: any[] = [];
    Object.entries(data).forEach(([date, categories]: [string, any]) => {
      Object.entries(categories).forEach(
        ([category, reading]: [string, any]) => {
          entries.push({
            date,
            category,
            title: reading.title || "",
            content: reading.content || "",
          });
        },
      );
    });

    // Delete all and insert new data in transaction
    await prisma.$transaction(async (tx) => {
      await tx.minbabat.deleteMany();

      if (entries.length > 0) {
        await tx.minbabat.createMany({
          data: entries,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Minbabat data saved successfully",
    });
  } catch (error) {
    console.error("Error saving minbabat data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// PATCH - Update a single minbabat entry
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, category, title, content } = body;

    if (!date || !category) {
      return NextResponse.json(
        { error: "Date and category are required" },
        { status: 400 },
      );
    }

    if (!title && !content) {
      return NextResponse.json(
        { error: "At least one of title or content is required" },
        { status: 400 },
      );
    }

    const updated = await prisma.minbabat.upsert({
      where: {
        date_category: { date, category },
      },
      update: {
        title: title || "",
        content: content || "",
      },
      create: {
        date,
        category,
        title: title || "",
        content: content || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Minbabat entry updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating minbabat entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 },
    );
  }
}

// PUT - Add a single minbabat entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, category, title, content } = body;

    if (!date || !category) {
      return NextResponse.json(
        { error: "Date and category are required" },
        { status: 400 },
      );
    }

    const created = await prisma.minbabat.create({
      data: {
        date,
        category,
        title: title || "",
        content: content || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Minbabat entry created",
      data: created,
    });
  } catch (error) {
    console.error("Error creating minbabat entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 },
    );
  }
}
