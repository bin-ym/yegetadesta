import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createWeeklyCycle, persistTree } from "./lib/tree-engine";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Fetching active users...");
  const users = await prisma.user.findMany({ where: { status: "ACTIVE" } });
  console.log(`Found ${users.length} active users.`);

  if (users.length === 0) {
    console.log("No active users found.");
    return;
  }

  const shuffled = users.sort(() => 0.5 - Math.random());

  let cycle = await prisma.weeklyCycle.findFirst({
    where: { phase: "BUILDING" },
  });
  if (!cycle) {
    console.log("Creating new cycle...");
    cycle = await createWeeklyCycle();
  } else {
    console.log("Using existing cycle...");
  }

  console.log("Persisting tree...");
  await persistTree({ cycleId: cycle.id, userIds: shuffled.map((u) => u.id) });

  console.log("Tree successfully generated!");
}

main()
  .catch((error) => {
    console.error("Error generating tree:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
