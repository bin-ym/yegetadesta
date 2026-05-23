"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "./hooks/useTelegram";
import { DashboardData } from "./types";
import Dashboard from "./components/Dashboard";
import LoadingScreen from "./components/LoadingScreen";
import PendingAccessScreen from "./components/PendingAccessScreen";

export default function Home() {
  const router = useRouter();
  const { initData, webApp } = useTelegram();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Check if running in Telegram
    const hasTelegramData = window.Telegram?.WebApp?.initData;

    if (!hasTelegramData) {
      // Redirect unauthorized users to Misbak page
      router.replace("/misbak");
      return;
    }

    if (!initData) {
      setLoading(false);
      return;
    }

    async function fetchDashboard() {
      try {
        const response = await fetch("/api/tree/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (response.status === 202) {
          // User is pending approval
          setIsPending(true);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard");
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [initData, router]);

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [webApp]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isPending) {
    return <PendingAccessScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <LoadingScreen />;
  }

  return <Dashboard data={dashboardData} initData={initData || ""} />;
}
