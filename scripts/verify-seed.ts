// scripts/verify-seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
    console.log("\n📊 Database Verification\n");

    const users = await prisma.user.findMany();
    console.log(`✅ Users: ${users.length}`);
    users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.fullName} (${user.baptismName}) - ${user.role}`);
    });

    const cycles = await prisma.weeklyCycle.findMany();
    console.log(`\n✅ Weekly Cycles: ${cycles.length}`);
    cycles.forEach((cycle) => {
        console.log(`   Week ${cycle.weekNumber}, ${cycle.year} - Phase: ${cycle.phase}`);
    });

    const treeNodes = await prisma.treeNode.findMany({
        include: { user: true }
    });
    console.log(`\n✅ Tree Nodes: ${treeNodes.length}`);
    treeNodes.forEach((node) => {
        console.log(`   Position ${node.position}: ${node.user.fullName} (Level ${node.level})`);
    });

    const callEdges = await prisma.callEdge.findMany({
        include: {
            callerNode: { include: { user: true } },
            calleeNode: { include: { user: true } }
        }
    });
    console.log(`\n✅ Call Edges: ${callEdges.length}`);
    callEdges.forEach((edge) => {
        console.log(`   ${edge.callerNode.user.fullName} → ${edge.calleeNode.user.fullName} (${edge.status})`);
    });

    const waitingPool = await prisma.waitingPool.findMany({
        include: { user: true }
    });
    console.log(`\n✅ Waiting Pool: ${waitingPool.length}`);

    console.log("\n✨ Verification complete!\n");

    await prisma.$disconnect();
    await pool.end();
}

verify().catch(console.error);
