"use client";

import { usePathname, useRouter } from "next/navigation";
import { Book, Phone, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is authorized (has Telegram data)
    if (typeof window !== "undefined") {
      const hasTelegramData = window.Telegram?.WebApp?.initData;
      setIsAuthorized(!!hasTelegramData);
    }
  }, []);

  // Hide BottomNav on admin page
  if (pathname === "/admin") {
    return null;
  }

  const navItems = [
    {
      name: "ምስባክ",
      path: "/misbak",
      icon: Book,
      requiresAuth: false,
    },
    {
      name: "መደዋወያ",
      path: "/",
      icon: Phone,
      requiresAuth: true, // Only show for authorized users
    },
    {
      name: "ምንባባት",
      path: "/minbabat",
      icon: BookOpen,
      requiresAuth: false,
    },
  ];

  // Filter nav items based on authorization
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthorized
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
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
        })}
      </div>
    </nav>
  );
}
