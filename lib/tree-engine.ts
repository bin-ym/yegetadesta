// lib/tree-engine.ts
// ────────────────────────────────────────────────────────────────
// Kidase Call Tree Engine
//
// Builds and persists a balanced binary call tree.
//
// Example:
//
//                A
//           /         \
//          B           C
//        /   \       /   \
//       D     E     F     G
//
// Every parent calls its direct children.
// ────────────────────────────────────────────────────────────────

import { prisma } from "./prisma"
import { CallStatus } from "@prisma/client"

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type CyclePhaseType =
  | "BUILDING"
  | "PREVIEW"
  | "ACTIVE"
  | "CLOSED"
  | "HISTORY"

interface BuildInput {
  cycleId: string
  userIds: string[]
}

interface BuiltNode {
  userId: string
  position: string
  label: string
  level: number
  parentPosition: string | null
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function positionLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index)
  }

  const first = String.fromCharCode(
    65 + Math.floor(index / 26) - 1
  )

  const second = String.fromCharCode(
    65 + (index % 26)
  )

  return first + second
}

// ────────────────────────────────────────────────────────────────
// Build in-memory tree structure
// ────────────────────────────────────────────────────────────────

export function buildTreeNodes(
  userIds: string[]
): BuiltNode[] {
  if (userIds.length === 0) {
    return []
  }

  const nodes: BuiltNode[] = []

  for (let i = 0; i < userIds.length; i++) {
    const level = Math.floor(Math.log2(i + 1))

    const parentIndex =
      i > 0
        ? Math.floor((i - 1) / 2)
        : -1

    nodes.push({
      userId: userIds[i],

      position: positionLabel(i),

      label: positionLabel(i),

      level,

      parentPosition:
        parentIndex >= 0
          ? positionLabel(parentIndex)
          : null,
    })
  }

  return nodes
}

// ────────────────────────────────────────────────────────────────
// Persist tree into database
// ────────────────────────────────────────────────────────────────

export async function persistTree(
  input: BuildInput
): Promise<void> {
  const { cycleId, userIds } = input

  const builtNodes = buildTreeNodes(userIds)

  await prisma.$transaction(async (tx) => {
    // Remove old call edges
    await tx.callEdge.deleteMany({
      where: {
        cycleId,
      },
    })

    // Remove old tree nodes
    await tx.treeNode.deleteMany({
      where: {
        cycleId,
      },
    })

    // Create nodes
    await tx.treeNode.createMany({
      data: builtNodes.map((node) => ({
        cycleId,

        userId: node.userId,

        position: node.position,

        level: node.level,
      })),
    })

    // Fetch all nodes once
    const createdNodes =
      await tx.treeNode.findMany({
        where: {
          cycleId,
        },
      })

    // Fast lookup map
    const nodeMap = new Map(
      createdNodes.map((node) => [
        node.position,
        node,
      ])
    )

    // Attach parent references
    for (const node of builtNodes) {
      if (!node.parentPosition) {
        continue
      }

      const parent = nodeMap.get(
        node.parentPosition
      )

      const current = nodeMap.get(
        node.position
      )

      if (!parent || !current) {
        continue
      }

      await tx.treeNode.update({
        where: {
          id: current.id,
        },

        data: {
          parentNodeId: parent.id,
        },
      })
    }

    // Create call edges
    for (const node of builtNodes) {
      if (!node.parentPosition) {
        continue
      }

      const caller = nodeMap.get(
        node.parentPosition
      )

      const callee = nodeMap.get(
        node.position
      )

      if (!caller || !callee) {
        continue
      }

      await tx.callEdge.create({
        data: {
          cycleId,

          callerNodeId: caller.id,

          calleeNodeId: callee.id,

          status: CallStatus.UNCALLED,
        },
      })
    }
  })
}

// ────────────────────────────────────────────────────────────────
// Fetch complete tree
// ────────────────────────────────────────────────────────────────

export async function getTreeForCycle(
  cycleId: string
) {
  return prisma.treeNode.findMany({
    where: {
      cycleId,
    },

    include: {
      user: true,

      parent: {
        include: {
          user: true,
        },
      },

      children: {
        include: {
          user: true,
        },
      },

      outgoingCalls: {
        include: {
          calleeNode: {
            include: {
              user: true,
            },
          },
        },
      },

      incomingCalls: {
        include: {
          callerNode: {
            include: {
              user: true,
            },
          },
        },
      },
    },

    orderBy: [
      {
        level: "asc",
      },

      {
        position: "asc",
      },
    ],
  })
}

// ────────────────────────────────────────────────────────────────
// Get user tree position
// ────────────────────────────────────────────────────────────────

export async function getUserPosition(
  telegramId: string,
  cycleId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      telegramId,
    },
  })

  if (!user) {
    return null
  }

  return prisma.treeNode.findUnique({
    where: {
      cycleId_userId: {
        cycleId,
        userId: user.id,
      },
    },

    include: {
      user: true,

      parent: {
        include: {
          user: true,
        },
      },

      children: {
        include: {
          user: true,
        },
      },

      outgoingCalls: {
        include: {
          calleeNode: {
            include: {
              user: true,
            },
          },
        },
      },

      incomingCalls: {
        include: {
          callerNode: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  })
}

// ────────────────────────────────────────────────────────────────
// Current active cycle
// ────────────────────────────────────────────────────────────────

export async function getCurrentCycle() {
  return prisma.weeklyCycle.findFirst({
    where: {
      isLocked: false,
    },

    orderBy: {
      createdAt: "desc",
    },
  })
}

// ────────────────────────────────────────────────────────────────
// Compute cycle phase
// ────────────────────────────────────────────────────────────────

export function computeCurrentPhase(
  now: Date
): CyclePhaseType {
  const day = now.getUTCDay()

  const hour = now.getUTCHours()

  // Wednesday
  if (day === 3) {
    return "BUILDING"
  }

  // Friday
  if (day === 5) {
    return "PREVIEW"
  }

  // Saturday after 4AM UTC
  if (day === 6 && hour >= 4) {
    return "ACTIVE"
  }

  // Sunday
  if (day === 0) {
    return "CLOSED"
  }

  return "HISTORY"
}

// ────────────────────────────────────────────────────────────────
// Create weekly cycle
// ────────────────────────────────────────────────────────────────

export async function createWeeklyCycle() {
  const now = new Date()

  const year = now.getUTCFullYear()

  const startOfYear = new Date(
    Date.UTC(year, 0, 1)
  )

  const weekNumber = Math.ceil(
    (
      (
        now.getTime() -
        startOfYear.getTime()
      ) /
      86400000 +
      startOfYear.getUTCDay() +
      1
    ) / 7
  )

  // Upcoming Saturday
  const saturday = new Date(now)

  const daysUntilSaturday =
    (6 - now.getUTCDay() + 7) % 7

  saturday.setUTCDate(
    now.getUTCDate() + daysUntilSaturday
  )

  saturday.setUTCHours(4, 0, 0, 0)

  // Sunday end
  const sunday = new Date(saturday)

  sunday.setUTCDate(
    saturday.getUTCDate() + 1
  )

  sunday.setUTCHours(23, 59, 59, 999)

  const cycle =
    await prisma.weeklyCycle.create({
      data: {
        weekNumber,

        year,

        phase: "BUILDING",

        startDate: saturday,

        endDate: sunday,
      },
    })

  return cycle
}