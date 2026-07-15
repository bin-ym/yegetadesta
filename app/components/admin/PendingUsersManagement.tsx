"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, User, Users, RefreshCw } from "lucide-react";

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
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: "approve" | "reject" } | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
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
    setActionFeedback({ id: pendingUserId, type: action });

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
        setPendingUsers(pendingUsers.filter((u) => u.id !== pendingUserId));
      } else {
        alert("Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("Error processing request");
    } finally {
      setProcessing(null);
      setActionFeedback(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-5 shadow-inner">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500 mb-6">No pending user requests</p>
        <button
          onClick={fetchPendingUsers}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20 p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pending Requests</h3>
              <p className="text-orange-100 text-sm">
                {pendingUsers.length} user{pendingUsers.length !== 1 ? "s" : ""} waiting for approval
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingUsers}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-200"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full transition-all duration-500"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Pending Users List */}
      <div className="space-y-3">
        {pendingUsers.map((user, index) => {
          const isProcessing = processing === user.id;
          const feedback = actionFeedback?.id === user.id ? actionFeedback.type : null;
          const initial = user.fullName.charAt(0).toUpperCase();
          const timeAgo = getTimeAgo(new Date(user.requestedAt));

          return (
            <div
              key={user.id}
              className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all duration-300 ${
                feedback === "approve"
                  ? "scale-95 opacity-0 border-green-400"
                  : feedback === "reject"
                  ? "scale-95 opacity-0 border-red-400"
                  : "hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5"
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
                animation: feedback ? "none" : undefined,
              }}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {initial}
                  </div>
                  {isProcessing && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </p>
                    {user.username && (
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        @{user.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      ID: {user.telegramId}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      {timeAgo}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(user.id, "approve")}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(user.id, "reject")}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
