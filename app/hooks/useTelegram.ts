"use client";

import { useEffect, useState } from "react";

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface WebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        query_id?: string;
        auth_date?: number;
        hash?: string;
    };
    version?: string;
    platform?: string;
    isExpanded?: boolean;
    viewportHeight?: number;
    viewportStableHeight?: number;
    ready: () => void;
    expand: () => void;
    close: () => void;
    disableClosingConfirmation?: () => void;
    enableClosingConfirmation?: () => void;
    BackButton?: {
        isVisible: boolean;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
    };
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: WebApp;
        };
    }
}

export function useTelegram() {
    const [webApp, setWebApp] = useState<WebApp | null>(null);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [initData, setInitData] = useState<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const initTelegram = () => {
            const tg = window.Telegram?.WebApp;
            if (tg) {
                setWebApp(tg);
                setUser(tg.initDataUnsafe?.user || null);
                setInitData(tg.initData || "");

                // Initialize WebApp and ensure closing is never blocked
                try {
                    tg.ready?.();
                    tg.expand?.();
                    tg.disableClosingConfirmation?.();
                } catch (e) {
                    console.warn("Telegram init warning:", e);
                }
            }
        };

        initTelegram();

        // Handle phone wake up / screen unlock from sleep
        const handleWakeUp = () => {
            if (document.visibilityState === "visible") {
                const tg = window.Telegram?.WebApp;
                if (tg) {
                    try {
                        tg.ready?.();
                        tg.disableClosingConfirmation?.();
                    } catch (e) {
                        console.warn("Telegram wake up re-sync warning:", e);
                    }
                }
            }
        };

        document.addEventListener("visibilitychange", handleWakeUp);
        window.addEventListener("focus", handleWakeUp);

        return () => {
            document.removeEventListener("visibilitychange", handleWakeUp);
            window.removeEventListener("focus", handleWakeUp);
        };
    }, []);

    return { webApp, user, initData };
}

