// app/types/index.ts

import { Role, MemberStatus, CyclePhase, CallStatus, PoolStatus } from "@prisma/client";

export type { Role, MemberStatus, CyclePhase, CallStatus, PoolStatus };

export interface User {
    id: string;
    telegramId: string;
    fullName: string;
    baptismName: string | null;
    phoneNumber: string | null;
    username: string | null;
    address: string | null;
    role: Role;
    status: MemberStatus;
    active: boolean;
    joinedAt: Date;
}

export interface WeeklyCycle {
    id: string;
    weekNumber: number;
    year: number;
    phase: CyclePhase;
    generatedAt: Date | null;
    previewAt: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    isLocked: boolean;
}

export interface TreeNode {
    id: string;
    cycleId: string;
    userId: string;
    position: string;
    parentNodeId: string | null;
    level: number;
    user: User;
    parent?: TreeNode;
    children?: TreeNode[];
}

export interface CallEdge {
    id: string;
    cycleId: string;
    callerNodeId: string;
    calleeNodeId: string;
    status: CallStatus;
    calledAt: Date | null;
    answeredAt: Date | null;
    retryCount: number;
    callerNode: TreeNode;
    calleeNode: TreeNode;
}

export interface DashboardData {
    user: User;
    currentCycle: WeeklyCycle | null;
    myNode: TreeNode | null;
    myParent: TreeNode | null;
    myChildren: TreeNode[];
    myOutgoingCalls: CallEdge[];
    myIncomingCall: CallEdge | null;
}

export interface AdminStats {
    totalMembers: number;
    activeMembers: number;
    waitingPoolSize: number;
    currentCycle: WeeklyCycle | null;
    totalCalls: number;
    answeredCalls: number;
    noAnswerCalls: number;
    participationRate: number;
}

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramWebAppInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
}
