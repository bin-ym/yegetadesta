-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CyclePhase" AS ENUM ('BUILDING', 'PREVIEW', 'ACTIVE', 'CLOSED', 'HISTORY');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('UNCALLED', 'CALLED', 'ANSWERED', 'NO_ANSWER');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('WAITING', 'ASSIGNED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "baptismName" TEXT,
    "phoneNumber" TEXT,
    "username" TEXT,
    "address" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyCycle" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "phase" "CyclePhase" NOT NULL DEFAULT 'BUILDING',
    "generatedAt" TIMESTAMP(3),
    "previewAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeNode" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEdge" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "callerNodeId" TEXT NOT NULL,
    "calleeNodeId" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'UNCALLED',
    "calledAt" TIMESTAMP(3),
    "answeredAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitingPool" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PoolStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitingPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySnapshot" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "totalCalls" INTEGER NOT NULL,
    "answeredCalls" INTEGER NOT NULL,
    "noAnswerCalls" INTEGER NOT NULL,
    "participationPct" DOUBLE PRECISION NOT NULL,
    "treeSnapshot" JSONB NOT NULL,
    "callLog" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "WeeklyCycle_phase_idx" ON "WeeklyCycle"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCycle_weekNumber_year_key" ON "WeeklyCycle"("weekNumber", "year");

-- CreateIndex
CREATE INDEX "TreeNode_cycleId_idx" ON "TreeNode"("cycleId");

-- CreateIndex
CREATE INDEX "TreeNode_userId_idx" ON "TreeNode"("userId");

-- CreateIndex
CREATE INDEX "TreeNode_parentNodeId_idx" ON "TreeNode"("parentNodeId");

-- CreateIndex
CREATE INDEX "TreeNode_position_idx" ON "TreeNode"("position");

-- CreateIndex
CREATE UNIQUE INDEX "TreeNode_cycleId_userId_key" ON "TreeNode"("cycleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TreeNode_cycleId_position_key" ON "TreeNode"("cycleId", "position");

-- CreateIndex
CREATE INDEX "CallEdge_cycleId_idx" ON "CallEdge"("cycleId");

-- CreateIndex
CREATE INDEX "CallEdge_callerNodeId_idx" ON "CallEdge"("callerNodeId");

-- CreateIndex
CREATE INDEX "CallEdge_calleeNodeId_idx" ON "CallEdge"("calleeNodeId");

-- CreateIndex
CREATE INDEX "CallEdge_status_idx" ON "CallEdge"("status");

-- CreateIndex
CREATE INDEX "WaitingPool_cycleId_idx" ON "WaitingPool"("cycleId");

-- CreateIndex
CREATE INDEX "WaitingPool_status_idx" ON "WaitingPool"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WaitingPool_cycleId_userId_key" ON "WaitingPool"("cycleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySnapshot_cycleId_key" ON "WeeklySnapshot"("cycleId");

-- CreateIndex
CREATE INDEX "WeeklySnapshot_weekNumber_idx" ON "WeeklySnapshot"("weekNumber");

-- CreateIndex
CREATE INDEX "WeeklySnapshot_year_idx" ON "WeeklySnapshot"("year");

-- AddForeignKey
ALTER TABLE "TreeNode" ADD CONSTRAINT "TreeNode_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeNode" ADD CONSTRAINT "TreeNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeNode" ADD CONSTRAINT "TreeNode_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "TreeNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEdge" ADD CONSTRAINT "CallEdge_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEdge" ADD CONSTRAINT "CallEdge_callerNodeId_fkey" FOREIGN KEY ("callerNodeId") REFERENCES "TreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEdge" ADD CONSTRAINT "CallEdge_calleeNodeId_fkey" FOREIGN KEY ("calleeNodeId") REFERENCES "TreeNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingPool" ADD CONSTRAINT "WaitingPool_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingPool" ADD CONSTRAINT "WaitingPool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySnapshot" ADD CONSTRAINT "WeeklySnapshot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
