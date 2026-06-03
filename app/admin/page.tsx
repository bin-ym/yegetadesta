"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "../hooks/useTelegram";
import {
  Shield,
  Lock,
  Users,
  Book,
  BookOpen,
  Clock,
  Network,
} from "lucide-react";
import LoadingScreen from "../components/LoadingScreen";
import UserManagement from "../components/admin/UserManagement";
import ContentManagement from "../components/admin/ContentManagement";
import PendingUsersManagement from "../components/admin/PendingUsersManagement";
import TreeManagement from "../components/admin/TreeManagement";

interface User {
  id: string;
  telegramId: string;
  fullName: string;
  baptismName: string | null;
  phoneNumber: string | null;
  address: string | null;
  role: string;
  status: string;
  joinedAt: string;
}

export default function AdminPage() {
  const { initData } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    "users" | "pending" | "misbak" | "minbabat" | "tree"
  >("users");

  // Login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginRole, setLoginRole] = useState<"SUPER_ADMIN" | "ADMIN">("ADMIN");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const hasTelegramData = window.Telegram?.WebApp?.initData;

    if (hasTelegramData && initData) {
      authenticateViaTelegram();
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, [initData]);

  const authenticateViaTelegram = async () => {
    if (!initData) return;

    try {
      const authResponse = await fetch("/api/tree/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setCurrentUser(authData.user);

        if (
          authData.user.role !== "ADMIN" &&
          authData.user.role !== "SUPER_ADMIN"
        ) {
          setError("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const handleWebLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (loginRole === "SUPER_ADMIN" && password === "superPass") {
      setIsAuthenticated(true);
      setCurrentUser({
        id: "web-super-admin",
        telegramId: "0",
        fullName: "Super Admin",
        baptismName: null,
        phoneNumber: null,
        address: null,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      });
      setShowLogin(false);
      setLoading(false);
    } else if (loginRole === "ADMIN" && password === "adPass") {
      setIsAuthenticated(true);
      setCurrentUser({
        id: "web-admin",
        telegramId: "0",
        fullName: "Admin",
        baptismName: null,
        phoneNumber: null,
        address: null,
        role: "ADMIN",
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      });
      setShowLogin(false);
      setLoading(false);
    } else {
      setLoginError("Invalid password");
    }
  };

  // Login Form
  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600 text-sm">ቅዳሴ ጥሪ - Kidase Call</p>
          </div>

          <form onSubmit={handleWebLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={loginRole}
                onChange={(e) =>
                  setLoginRole(e.target.value as "SUPER_ADMIN" | "ADMIN")
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
            >
              Login
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Demo Credentials:</strong>
                <br />
                Super Admin: superPass
                <br />
                Admin: adPass
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pb-20 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-purple-100 text-sm">
                User & Content Management System
              </p>
            </div>
            <div className="text-right">
              {isSuperAdmin && (
                <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
                  SUPER ADMIN
                </div>
              )}
              <p className="text-sm text-purple-100">{currentUser?.fullName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                activeTab === "users"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                  activeTab === "pending"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Clock className="w-5 h-5" />
                Pending
              </button>
            )}
            <button
              onClick={() => setActiveTab("misbak")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                activeTab === "misbak"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Book className="w-5 h-5" />
              ምስባክ
            </button>
            <button
              onClick={() => setActiveTab("minbabat")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                activeTab === "minbabat"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              ምንባባት
            </button>
            <button
              onClick={() => setActiveTab("tree")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors ${
                activeTab === "tree"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Network className="w-5 h-5" />
              Call Tree
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "users" && (
          <UserManagement
            currentUser={currentUser}
            isSuperAdmin={isSuperAdmin}
            initData={initData || "web-bypass-token"}
          />
        )}

        {activeTab === "pending" && isSuperAdmin && (
          <PendingUsersManagement initData={initData || "web-bypass-token"} />
        )}

        {activeTab === "misbak" && (
          <ContentManagement
            type="misbak"
            isSuperAdmin={isSuperAdmin}
            isAdmin={currentUser?.role === "ADMIN"}
          />
        )}

        {activeTab === "minbabat" && (
          <ContentManagement
            type="minbabat"
            isSuperAdmin={isSuperAdmin}
            isAdmin={currentUser?.role === "ADMIN"}
          />
        )}

        {activeTab === "tree" && (
          <TreeManagement initData={initData || "web-bypass-token"} />
        )}
      </div>
    </div>
  );
}
