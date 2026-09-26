"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready?.();
      tg.expand?.();
      tg.disableClosingConfirmation?.();

      // Manage BackButton
      if (pathname === "/" || pathname === "/misbak") {
        tg.BackButton?.hide?.();
      } else {
        tg.BackButton?.show?.();
        const handleBackClick = () => {
          router.back();
        };
        tg.BackButton?.onClick?.(handleBackClick);

        return () => {
          tg.BackButton?.offClick?.(handleBackClick);
        };
      }
    } catch (e) {
      console.warn("Telegram provider setup error:", e);
    }
  }, [pathname, router]);

  return <>{children}</>;
}

