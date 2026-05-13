"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "../hooks/useTelegram";
import { AdminStats } from "../types";
import LoadingScreen from "../components/LoadingScreen";

export default function AdminPage() {
  const { initData } = useTelegram();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initData) return;

    async function fetchStats() {
      try {
        const response = await fetch("/api/admin", {
          headers: {
            "x-telegram-init-data": initData,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin stats");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [initData]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System Overview</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Members</p>
            <p className="text-3xl font-bold">{stats.totalMembers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Active Members</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeMembers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Waiting Pool</p>
            <p className="text-3xl font-bold text-blue-600">{stats.waitingPoolSize}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Participation Rate</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.participationRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {stats.currentCycle && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Current Cycle</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Week:</span>{" "}
                <span className="font-medium">
                  {stats.currentCycle.weekNumber}, {stats.currentCycle.year}
                </span>
              </p>
              <p>
                <span className="text-gray-600">Phase:</span>{" "}
                <span className="font-medium">{stats.currentCycle.phase}</span>
              </p>
              <p>
                <span className="text-gray-600">Total Calls:</span>{" "}
                <span className="font-medium">{stats.totalCalls}</span>
              </p>
              <p>
                <span className="text-gray-600">Answered:</span>{" "}
                <span className="font-medium text-green-600">{stats.answeredCalls}</span>
              </p>
              <p>
                <span className="text-gray-600">No Answer:</span>{" "}
                <span className="font-medium text-red-600">{stats.noAnswerCalls}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
