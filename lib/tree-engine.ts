// lib/tree-engine.ts
// ────────────────────────────────────────────────────────────────

import { prisma } from "./prisma";
import { CallStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { getEthiopianWeekInfo } from "./ethiopian-calendar";

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
// Persist tree (Optimized - Instant bulk inserts, no timeout)
// ────────────────────────────────────────────────────────────────

export async function persistTree(input: BuildInput): Promise<void> {
  const { cycleId, userIds } = input;

  if (userIds.length === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.callEdge.deleteMany({ where: { cycleId } });
      await tx.treeNode.deleteMany({ where: { cycleId } });
    });
    return;
  }

  // Pre-generate all node IDs and parent relationships in memory
  interface PreparedNode {
    id: string;
    userId: string;
    position: string;
    level: number;
    parentNodeId: string | null;
  }

  const nodesToInsert: PreparedNode[] = [];

  for (let i = 0; i < userIds.length; i++) {
    const { level, parentIndex, position } = calculateNodeInfo(i);
    const id = randomUUID();
    const parentNodeId = parentIndex >= 0 ? nodesToInsert[parentIndex].id : null;

    nodesToInsert.push({
      id,
      userId: userIds[i],
      position,
      level,
      parentNodeId,
    });
  }

  // Pre-generate all call edges
  const edgesToInsert = nodesToInsert
    .filter((node) => node.parentNodeId !== null)
    .map((node) => ({
      id: randomUUID(),
      cycleId,
      callerNodeId: node.parentNodeId!,
      calleeNodeId: node.id,
      status: CallStatus.UNCALLED,
      retryCount: 0,
    }));

  // Execute in a single fast atomic batch transaction (only 4 operations)
  const operations: any[] = [
    prisma.callEdge.deleteMany({ where: { cycleId } }),
    prisma.treeNode.deleteMany({ where: { cycleId } }),
  ];

  if (nodesToInsert.length > 0) {
    operations.push(
      prisma.treeNode.createMany({
        data: nodesToInsert.map((n) => ({
          id: n.id,
          cycleId,
          userId: n.userId,
          position: n.position,
          level: n.level,
          parentNodeId: n.parentNodeId,
        })),
      }),
    );
  }

  if (edgesToInsert.length > 0) {
    operations.push(
      prisma.callEdge.createMany({
        data: edgesToInsert,
      }),
    );
  }

  await prisma.$transaction(operations, {
    maxWait: 20000, // 20s max time to wait for a DB connection
    timeout: 45000, // 45s max time for the batch to execute
  });
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
  const { ethWeek, ethYear } = getEthiopianWeekInfo(now);

  const saturday = new Date(now);
  const daysUntilSaturday = (6 - now.getUTCDay() + 7) % 7;

  saturday.setUTCDate(now.getUTCDate() + daysUntilSaturday);
  saturday.setUTCHours(4, 0, 0, 0);

  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate() + 1);
  sunday.setUTCHours(23, 59, 59, 999);

  return prisma.weeklyCycle.create({
    data: {
      weekNumber: ethWeek,
      year: ethYear,
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
  // Only integrate users who are ACTIVE
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== "ACTIVE" || !user.active) {
    return null;
  }

  const cycle = await prisma.weeklyCycle.findFirst({
    where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!cycle) return null;

  // Check if already in cycle tree
  const existing = await prisma.treeNode.findUnique({
    where: {
      cycleId_userId: {
        cycleId: cycle.id,
        userId: user.id,
      },
    },
  });

  if (existing) return existing;

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

// ────────────────────────────────────────────────────────────────
// Remove user from active tree (when marked INACTIVE/SUSPENDED)
// ────────────────────────────────────────────────────────────────

export async function removeUserFromTree(userId: string) {
  const cycles = await prisma.weeklyCycle.findMany({
    where: { phase: { in: ["BUILDING", "PREVIEW", "ACTIVE"] } },
  });

  for (const cycle of cycles) {
    const node = await prisma.treeNode.findUnique({
      where: {
        cycleId_userId: {
          cycleId: cycle.id,
          userId,
        },
      },
      include: {
        children: true,
      },
    });

    if (!node) continue;

    // Delete all call edges connected to this node
    await prisma.callEdge.deleteMany({
      where: {
        OR: [
          { callerNodeId: node.id },
          { calleeNodeId: node.id },
        ],
      },
    });

    // Re-link children to parent if exists
    if (node.children.length > 0) {
      await prisma.treeNode.updateMany({
        where: { parentNodeId: node.id },
        data: { parentNodeId: node.parentNodeId },
      });

      if (node.parentNodeId) {
        for (const child of node.children) {
          await prisma.callEdge.create({
            data: {
              cycleId: cycle.id,
              callerNodeId: node.parentNodeId,
              calleeNodeId: child.id,
              status: CallStatus.UNCALLED,
            },
          });
        }
      }
    }

    // Delete node itself
    await prisma.treeNode.delete({
      where: { id: node.id },
    });
  }
}

