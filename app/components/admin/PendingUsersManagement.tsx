"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, User } from "lucide-react";

interface PendingUser {
    id: string;
    telegramId: string;
    fullName: string;
    username: string | null;
    requestedAt: string;
}

interface Props {
    initData: string | null;
}

export default function PendingUsersManagement({ initData }: Props) {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch("/api/admin/pending-users", {
                headers: {
                    "x-telegram-init-data": initData || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data.pendingUsers);
            }
        } catch (error) {
            console.error("Error fetching pending users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (pendingUserId: string, action: "approve" | "reject") => {
        setProcessing(pendingUserId);

        try {
            const response = await fetch("/api/admin/pending-users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    initData,
                    pendingUserId,
                    action,
                }),
            });

            if (response.ok) {
                // Remove from list
                setPendingUsers(pendingUsers.filter((u) => u.id !== pendingUserId));
            } else {
                alert("Failed to process request");
            }
        } catch (error) {
            console.error("Error processing request:", error);
            alert("Error processing request");
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    if (pendingUsers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No pending user requests</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Pending User Requests ({pendingUsers.length})
                </h3>
            </div>

            <div className="divide-y">
                {pendingUsers.map((user) => (
                    <div key={user.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{user.fullName}</p>
                                    <p className="text-sm text-gray-500">
                                        @{user.username || "no_username"} • Telegram ID: {user.telegramId}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Requested: {new Date(user.requestedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(user.id, "approve")}
                                    disabled={processing === user.id}
                                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(user.id, "reject")}
                                    disabled={processing === user.id}
                                    className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
