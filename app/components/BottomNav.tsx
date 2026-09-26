"use client";

import { usePathname, useRouter } from "next/navigation";
import { Book, Phone, BookOpen, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState<"loading" | "full" | "partial" | "none">("loading");

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const hasTelegramData =
        typeof window !== "undefined" && window.Telegram?.WebApp?.initData;

      if (!hasTelegramData) {
        setUserStatus("none");
        return;
      }

      const initData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      const data = await response.json();

      if (data.user) {
        // User exists — check if they have a phone number
        setUserStatus(data.user.phoneNumber ? "full" : "partial");
      } else if (data.notRegistered) {
        setUserStatus("none");
      } else if (data.pending) {
        setUserStatus("partial");
      } else {
        setUserStatus("none");
      }
    } catch {
      setUserStatus("none");
    }
  };

  // Hide BottomNav on admin page
  if (pathname === "/admin") {
    return null;
  }

  const navItems = [
    {
      name: "ምስባክ",
      path: "/misbak",
      icon: Book,
      show: true, // Always show
    },
    {
      name: "መደዋወያ",
      path: "/",
      icon: Phone,
      show: userStatus === "full", // Only show when user has phone number
    },
    {
      name: "ምንባባት",
      path: "/minbabat",
      icon: BookOpen,
      show: true, // Always show
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {userStatus === "loading" ? (
          // Show minimal nav during loading
          <div className="flex justify-around items-center w-full">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.path} className="flex flex-col items-center flex-1 opacity-50">
                  <Icon className="w-6 h-6 mb-1 text-gray-400" />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-xs ${isActive ? "font-semibold" : ""}`}>
                  {item.name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}
