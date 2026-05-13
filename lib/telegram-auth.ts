// lib/telegram-auth.ts

import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface ValidationResult {
    valid: boolean;
    user?: TelegramUser;
}

export function validateTelegramWebAppData(initData: string): ValidationResult {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get("hash");
        params.delete("hash");

        if (!hash) {
            return { valid: false };
        }

        // Sort params alphabetically
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        // Create secret key
        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(BOT_TOKEN)
            .digest();

        // Calculate hash
        const calculatedHash = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");

        if (calculatedHash !== hash) {
            return { valid: false };
        }

        // Parse user data
        const userParam = params.get("user");
        if (!userParam) {
            return { valid: false };
        }

        const user: TelegramUser = JSON.parse(userParam);

        return { valid: true, user };
    } catch (error) {
        console.error("Telegram auth validation error:", error);
        return { valid: false };
    }
}
