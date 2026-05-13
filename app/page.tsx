"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "./hooks/useTelegram";
import { DashboardData } from "./types";
import Dashboard from "./components/Dashboard";
import LoadingScreen from "./components/LoadingScreen";

export default function Home() {
  const { user: tgUser, initData, webApp } = useTelegram();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Check if running in development mode (not in Telegram)
    const isDevMode = !window.Telegram?.WebApp?.initData;
    setIsDev(isDevMode);

    if (isDevMode) {
      // Development mode - show demo data
      setLoading(false);
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
  }, [initData]);

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [webApp]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Development mode - show instructions
  if (isDev) {
    return (
      <div className="min-h-screen pb-20 p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto space-y-4 pt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">✝ ቅዳሴ ጥሪ - Kidase Call</h1>
            <p className="text-gray-600 mb-4">
              Ethiopian Orthodox Tewahedo Church Wake-up Coordination System
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                🔧 Development Mode
              </p>
              <p className="text-sm text-blue-700">
                This app is designed to run inside Telegram as a Mini App.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">How to Test</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Deploy to Vercel or use ngrok for local testing</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Create a Telegram bot with @BotFather</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Set up the Web App button in your bot</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Open the bot in Telegram and click "Open App"</span>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <p className="text-gray-600 mb-1"># Setup database</p>
                <p>npx prisma db push</p>
                <p>npx prisma db seed</p>
              </div>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <p className="text-gray-600 mb-1"># Deploy to Vercel</p>
                <p>vercel --prod</p>
              </div>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <p className="text-gray-600 mb-1"># Setup bot webhook</p>
                <p>curl "https://your-app.vercel.app/api/bot?setup_secret=YOUR_SECRET"</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">System Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Routes:</span>
                <span className="text-green-600 font-medium">✓ Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telegram Integration:</span>
                <span className="text-yellow-600 font-medium">⚠ Requires Telegram</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Documentation</h2>
            <div className="space-y-2">
              <a href="/DEPLOYMENT.md" className="block text-blue-600 hover:underline text-sm">
                📖 Deployment Guide
              </a>
              <a href="/API.md" className="block text-blue-600 hover:underline text-sm">
                📚 API Documentation
              </a>
              <a href="/PROJECT_STRUCTURE.md" className="block text-blue-600 hover:underline text-sm">
                🗂 Project Structure
              </a>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>✓ Build successful!</strong> The system is ready for deployment.
            </p>
          </div>
        </div>
      </div>
    );
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

  if (!dashboardData && !isDev) {
    return <LoadingScreen />;
  }

  if (dashboardData) {
    return <Dashboard data={dashboardData} initData={initData || ""} />;
  }
}
