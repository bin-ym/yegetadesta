// lib/tree-engine.ts
// ────────────────────────────────────────────────────────────────

import { prisma } from "./prisma";
import { CallStatus } from "@prisma/client";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type CyclePhaseType =
  | "BUILDING"
  | "PREVIEW"
  | "ACTIVE"
  | "CLOSED"
  | "HISTORY";

interface BuildInput {
  cycleId: string;
  userIds: string[];
}

interface BuiltNode {
  userId: string;
  position: string;
  label: string;
  level: number;
  parentPosition: string | null;
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

export function positionLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }

  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1);

  const second = String.fromCharCode(65 + (index % 26));

  return first + second;
}

export function calculateNodeInfo(i: number) {
  let level: number;
  let parentIndex: number;

  if (i === 0) {
    level = 0;
    parentIndex = -1;
  } else if (i === 1 || i === 2) {
    level = 1;
    parentIndex = 0;
  } else if (i >= 3 && i <= 6) {
    level = 2;
    parentIndex = i === 3 || i === 4 ? 1 : 2;
  } else {
    level = 2 + Math.floor((i - 3) / 4);
    parentIndex = i - 4;
  }

  return { level, parentIndex, position: positionLabel(i) };
}

// ────────────────────────────────────────────────────────────────
// Build tree in memory
// ────────────────────────────────────────────────────────────────

export function buildTreeNodes(userIds: string[]): BuiltNode[] {
  if (userIds.length === 0) return [];

  const nodes: BuiltNode[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const { level, parentIndex, position } = calculateNodeInfo(i);

    nodes.push({
      userId: userIds[i],
      position: positionLabel(i),
      label: positionLabel(i),
      level,
      parentPosition: parentIndex >= 0 ? positionLabel(parentIndex) : null,
    });
  }

  return nodes;
}

// ────────────────────────────────────────────────────────────────
// Persist tree (FIXED - no transaction timeout issues)
// ────────────────────────────────────────────────────────────────

export async function persistTree(input: BuildInput): Promise<void> {
  const { cycleId, userIds } = input;

  const builtNodes = buildTreeNodes(userIds);

  await prisma.$transaction(
    async (tx) => {
      // 1. Clean old data
      await tx.callEdge.deleteMany({ where: { cycleId } });
      await tx.treeNode.deleteMany({ where: { cycleId } });

      // 2. Insert all nodes
      await tx.treeNode.createMany({
        data: builtNodes.map((node) => ({
          cycleId,
          userId: node.userId,
          position: node.position,
          level: node.level,
        })),
      });

      // 3. Fetch inserted nodes once
      const createdNodes = await tx.treeNode.findMany({
        where: { cycleId },
      });

      const nodeMap = new Map(createdNodes.map((n) => [n.position, n]));

      // 4. Prepare batch operations (NO AWAIT INSIDE LOOP)
      const updateOps: any[] = [];
      const edgeOps: any[] = [];

      for (const node of builtNodes) {
        if (!node.parentPosition) continue;

        const parent = nodeMap.get(node.parentPosition);
        const current = nodeMap.get(node.position);

        if (!parent || !current) continue;

        updateOps.push(
          tx.treeNode.update({
            where: { id: current.id },
            data: { parentNodeId: parent.id },
          }),
        );

        edgeOps.push(
          tx.callEdge.create({
            data: {
              cycleId,
              callerNodeId: parent.id,
              calleeNodeId: current.id,
              status: CallStatus.UNCALLED,
            },
          }),
        );
      }

      // 5. Execute in parallel (still inside transaction)
      await Promise.all([...updateOps, ...edgeOps]);
    },
    { timeout: 30000 },
  );
}

// ────────────────────────────────────────────────────────────────
// Fetch full tree
// ────────────────────────────────────────────────────────────────

export async function getTreeForCycle(cycleId: string) {
  return prisma.treeNode.findMany({
    where: { cycleId },
    include: {
      user: true,
      parent: { include: { user: true } },
      children: { include: { user: true } },
      outgoingCalls: {
        include: {
          calleeNode: { include: { user: true } },
        },
      },
      incomingCalls: {
        include: {
          callerNode: { include: { user: true } },
        },
      },
    },
    orderBy: [{ level: "asc" }, { position: "asc" }],
  });
}

// ────────────────────────────────────────────────────────────────
// User position
// ────────────────────────────────────────────────────────────────

export async function getUserPosition(telegramId: string, cycleId: string) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) return null;

  return prisma.treeNode.findUnique({
    where: {
      cycleId_userId: {
        cycleId,
        userId: user.id,
      },
    },
    include: {
      user: true,
      parent: { include: { user: true } },
      children: { include: { user: true } },
      outgoingCalls: {
        include: {
          calleeNode: { include: { user: true } },
        },
      },
      incomingCalls: {
        include: {
          callerNode: { include: { user: true } },
        },
      },
    },
  });
}

// ────────────────────────────────────────────────────────────────
// Cycle helpers (unchanged)
// ────────────────────────────────────────────────────────────────

export async function getCurrentCycle() {
  return prisma.weeklyCycle.findFirst({
    where: { isLocked: false },
    orderBy: { createdAt: "desc" },
  });
}

export function computeCurrentPhase(now: Date): CyclePhaseType {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();

  if (day === 3) return "BUILDING";
  if (day === 5) return "PREVIEW";
  if (day === 6 && hour >= 4) return "ACTIVE";
  if (day === 0) return "CLOSED";

  return "HISTORY";
}

// ────────────────────────────────────────────────────────────────
// Create weekly cycle
// ────────────────────────────────────────────────────────────────

export async function createWeeklyCycle() {
  const now = new Date();
  const year = now.getUTCFullYear();

  const startOfYear = new Date(Date.UTC(year, 0, 1));

  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getUTCDay() +
      1) /
      7,
  );

  const saturday = new Date(now);
  const daysUntilSaturday = (6 - now.getUTCDay() + 7) % 7;

  saturday.setUTCDate(now.getUTCDate() + daysUntilSaturday);
  saturday.setUTCHours(4, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate() + 1);
  sunday.setUTCHours(23, 59, 59, 999);

  return prisma.weeklyCycle.create({
    data: {
      weekNumber,
      year,
      phase: "BUILDING",
      startDate: saturday,
      endDate: sunday,
    },
  });
}

// ────────────────────────────────────────────────────────────────
// Auto-integrate single user
// ────────────────────────────────────────────────────────────────

export async function integrateUserIntoTree(userId: string) {
  const cycle = await prisma.weeklyCycle.findFirst({
    where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!cycle) return null;

  const nodeCount = await prisma.treeNode.count({
    where: { cycleId: cycle.id },
  });

  const info = calculateNodeInfo(nodeCount);

  let parentNodeId = null;
  if (info.parentIndex >= 0) {
    const parentPos = positionLabel(info.parentIndex);
    const parentNode = await prisma.treeNode.findFirst({
      where: { cycleId: cycle.id, position: parentPos },
    });
    parentNodeId = parentNode?.id || null;
  }

  const newNode = await prisma.treeNode.create({
    data: {
      cycleId: cycle.id,
      userId: userId,
      position: info.position,
      level: info.level,
      parentNodeId: parentNodeId,
    },
  });

  if (parentNodeId) {
    await prisma.callEdge.create({
      data: {
        cycleId: cycle.id,
        callerNodeId: parentNodeId,
        calleeNodeId: newNode.id,
        status: CallStatus.UNCALLED,
      },
    });
  }

  return newNode;
}
