// app/components/JoinRequestScreen.tsx
// Shown on the main screen (/) in Telegram for users who haven't joined yet.
// Mirrors the web "Join the Call Tree" banner from the Misbak page.

"use client";

import { useState } from "react";
import { Phone, UserPlus } from "lucide-react";

interface Props {
  onRequestSent: () => void;
  onLinked: () => void;
}

export default function JoinRequestScreen({ onRequestSent, onLinked }: Props) {
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const handleJoinRequest = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setLinkMessage("Please open this page in Telegram to join.");
      return;
    }

    setLinkingPhone(true);
    setLinkMessage(null);

    try {
      // Request contact access - returns true if user shared their contact
      const granted: boolean = await (tg as any).requestContact();

      if (granted) {
        const phone = (tg.initDataUnsafe?.user as any)?.phone_number;
        if (phone) {
          const initData = tg.initData || "";

          const response = await fetch("/api/auth/link-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData, phoneNumber: phone }),
          });

          const data = await response.json();

          if (data.linked) {
            // Account already existed and got linked — reload into the app
            onLinked();
            return;
          } else if (data.pending) {
            // Request submitted — switch to the pending state
            onRequestSent();
            return;
          } else {
            setLinkMessage("❌ Could not link. Contact the admin.");
          }
        } else {
          setLinkMessage("Could not get your phone number. Try again.");
        }
      } else {
        setLinkMessage("Phone sharing was cancelled.");
      }
      setLinkingPhone(false);
    } catch (err) {
      console.error("Phone request error:", err);
      setLinkMessage("Failed to request phone number. Please try again.");
      setLinkingPhone(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-4">
        {/* App Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Phone className="w-8 h-8" />
            <h1 className="text-2xl font-bold">✝ ቅዳሴ ጥሪ</h1>
          </div>
          <p className="text-blue-100 text-sm">የቅዳሴ ጥሪ አገልግሎት</p>
        </div>

        {/* CTA Banner — same as web */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Join the Call Tree</h3>
              <p className="text-blue-200 text-sm">ምደዋወያ ይቀላቀሉ</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm mb-4">
            Connect with your church community through daily prayer calls.
          </p>
          <button
            onClick={handleJoinRequest}
            disabled={linkingPhone}
            className="w-full bg-white text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            {linkingPhone ? "Connecting..." : "Send Join Request — ይቀላቀሉ"}
          </button>
          {linkMessage && (
            <div className="mt-3 p-3 bg-white/15 rounded-lg text-sm text-center">
              {linkMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
