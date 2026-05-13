// prisma/seed.ts

import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { createWeeklyCycle, persistTree } from "../lib/tree-engine";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MEMBERS = [
  {
    fullName: "አለሙ ተፈሪ",
    baptismName: "ሚካኤል",
    phoneNumber: "+251911000001",
    address: "ቦሌ",
  },

  {
    fullName: "ብርሃኑ ወልዴ",
    baptismName: "ገብርኤል",
    phoneNumber: "+251911000002",
    address: "ፒያሳ",
  },

  {
    fullName: "ቅዱስ አሰፋ",
    baptismName: "ኡራኤል",
    phoneNumber: "+251911000003",
    address: "ካዛንቺስ",
  },

  {
    fullName: "ዲያቆን ቴዎድሮስ",
    baptismName: "ቴዎድሮስ",
    phoneNumber: "+251911000004",
    address: "4 ኪሎ",
  },

  {
    fullName: "ህብረት ሙሉጌታ",
    baptismName: "ዮሐንስ",
    phoneNumber: "+251911000005",
    address: "ሜክሲኮ",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.callEdge.deleteMany();
  await prisma.treeNode.deleteMany();
  await prisma.weeklySnapshot.deleteMany();
  await prisma.waitingPool.deleteMany();
  await prisma.weeklyCycle.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑 Database cleaned");

  const users = await Promise.all(
    MEMBERS.map((member, index) =>
      prisma.user.create({
        data: {
          telegramId: `100000000${index + 1}`,
          fullName: member.fullName,
          baptismName: member.baptismName,
          phoneNumber: member.phoneNumber,
          address: member.address,
          role: index === 0 ? Role.ADMIN : Role.MEMBER,
        },
      }),
    ),
  );

  console.log(`👥 ${users.length} users created`);

  const cycle = await createWeeklyCycle();
  const cycleId = cycle.id;

  console.log("📅 Weekly cycle created");

  await persistTree({
    cycleId,
    userIds: users.map((u) => u.id),
  });

  console.log("🌳 Tree persisted");

  console.log("✅ Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
