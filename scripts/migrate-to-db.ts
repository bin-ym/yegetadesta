// scripts/migrate-to-db.ts
// Run this script to migrate misbak and minbabat data from JSON files to database

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting migration...");

    // Migrate Misbak data
    try {
        const misbakPath = path.join(process.cwd(), "public", "data", "misbak.json");
        const misbakData = JSON.parse(fs.readFileSync(misbakPath, "utf-8"));

        console.log(`Found ${misbakData.length} misbak entries`);

        await prisma.misbak.deleteMany(); // Clear existing data

        await prisma.misbak.createMany({
            data: misbakData.map((item: any) => ({
                date: item.date,
                dayOfWeek: item.dayOfWeek || "",
                geez: item.geez || "",
                translation: item.translation || "",
                liturgy: item.liturgy || ""
            }))
        });

        console.log(`✓ Migrated ${misbakData.length} misbak entries`);
    } catch (error) {
        console.error("Error migrating misbak:", error);
    }

    // Migrate Minbabat data
    try {
        const minbabatPath = path.join(process.cwd(), "public", "data", "minbabat.json");
        const minbabatData = JSON.parse(fs.readFileSync(minbabatPath, "utf-8"));

        // Transform from month -> [days] to flat array
        // minbabat.json format: { "Meskerem": [{ "id": 1, "date": "መስከረም 1", "ወንጌል": {...}, "መልዕክታት": {...} }] }
        const entries: any[] = [];
        Object.entries(minbabatData).forEach(([month, days]: [string, any]) => {
            if (Array.isArray(days)) {
                days.forEach((dayObj: any) => {
                    const date = dayObj.date;
                    // Iterate over category keys (skip 'id' and 'date')
                    Object.entries(dayObj).forEach(([category, reading]: [string, any]) => {
                        if (category === 'id' || category === 'date') return;
                        if (reading && typeof reading === 'object' && 'title' in reading) {
                            entries.push({
                                date,
                                category,
                                title: reading.title || "",
                                content: reading.content || ""
                            });
                        }
                    });
                });
            }
        });

        console.log(`Found ${entries.length} minbabat entries`);

        await prisma.minbabat.deleteMany(); // Clear existing data

        if (entries.length > 0) {
            await prisma.minbabat.createMany({
                data: entries
            });
        }

        console.log(`✓ Migrated ${entries.length} minbabat entries`);
    } catch (error) {
        console.error("Error migrating minbabat:", error);
    }

    console.log("Migration completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
