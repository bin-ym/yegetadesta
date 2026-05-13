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
    ready: () => void;
    expand: () => void;
    close: () => void;
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
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            setWebApp(tg);
            setUser(tg.initDataUnsafe.user || null);
            setInitData(tg.initData);
        }
    }, []);

    return { webApp, user, initData };
}
