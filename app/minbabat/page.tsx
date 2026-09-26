"use client";

import { BookOpen, Calendar, Phone, UserPlus, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentWeekEthiopianDates } from "@/lib/ethiopian-calendar";

export default function MinbabatPage() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("እሁድ");
  const [weekDates, setWeekDates] = useState<{ [key: string]: any }>({});
  const [readings, setReadings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<"loading" | "registered" | "none" | "pending">("loading");
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get Ethiopian dates for current week
    const dates = getCurrentWeekEthiopianDates();
    setWeekDates(dates);

    // Set today as default (Monday-based)
    const today = new Date();
    const dayNames = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"];
    const gregorianDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayBasedDay = gregorianDay === 0 ? 6 : gregorianDay - 1; // Convert to Monday = 0
    setSelectedDay(dayNames[mondayBasedDay]);

    // Check user status
    checkUserStatus();

    // Fetch readings data
    fetch("/api/admin/minbabat")
      .then((res) => res.json())
      .then((data) => {
        setReadings(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading readings data:", error);
        setLoading(false);
      });
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
        setUserStatus("registered");
      } else if (data.pending) {
        setUserStatus("pending");
        setLinkMessage("⏳ Your request is pending approval from Super Admin.");
      } else {
        setUserStatus("none");
      }
    } catch {
      setUserStatus("none");
    }
  };

  const handleJoinRequest = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setLinkMessage("Please open this page in Telegram to join.");
      return;
    }

    setLinkingPhone(true);
    setLinkMessage(null);

    try {
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
            setLinkMessage("✅ Account linked! You can now access the Call Tree.");
            setUserStatus("registered");
          } else if (data.pending) {
            setUserStatus("pending");
            setLinkMessage(null);
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

  const days = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"];
  const categories = ["የቅዱስ ጳውሎስ መልዕክት", "መልዕክታት", "የሐዋሪያት ስራ", "ወንጌል"];

  const currentDate = weekDates[selectedDay];

  const currentEthiopianDate = currentDate
    ? `${currentDate.month} ${currentDate.day} ${currentDate.year}`
    : "";

  // Find the current reading by direct key lookup (API returns { "ሐምሌ 8 2018": { category: {...} } })
  let selectedReadings: any = null;
  if (currentEthiopianDate && readings[currentEthiopianDate]) {
    selectedReadings = readings[currentEthiopianDate];
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-20 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Pending state banner for users who already sent a request */}
        {userStatus === "pending" && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20 p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Request Pending</h3>
                <p className="text-orange-100 text-sm">ጥያቄዎ በመጠባበቅ ላይ ነው</p>
              </div>
            </div>
            <p className="text-orange-50 text-sm">
              Your join request has been submitted and is waiting for Super Admin approval.
            </p>
          </div>
        )}

        {/* CTA Banner for unregistered users */}
        {userStatus === "none" && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-lg shadow-green-500/20 p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Join the Call Tree</h3>
                <p className="text-green-200 text-sm">ምደዋወያ ይቀላቀሉ</p>
              </div>
            </div>
            <p className="text-green-100 text-sm mb-4">
              Connect with your church community through daily prayer calls.
            </p>
            <button
              onClick={handleJoinRequest}
              disabled={linkingPhone}
              className="w-full bg-white text-green-700 font-semibold py-3 rounded-xl hover:bg-green-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
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
        )}

        {/* Success message after linking */}
        {linkMessage && userStatus === "registered" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-800 font-medium">{linkMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-3 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all"
            >
              Go to Call Tree
            </button>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">ምንባባት</h1>
          </div>
          <p className="text-green-100 text-sm">የዕለት ምንባባት - የመጽሐፍ ቅዱስ ንባብ</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">የቀን ምርጫ</h2>
          </div>

          {/* Day of Week */}
          <div>
            <p className="text-xs text-gray-500 mb-2">የሳምንት ቀን</p>
            <div className="grid grid-cols-4 gap-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === day
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Current Ethiopian Date Display */}
          {currentDate && (
            <div className="text-center pt-2 border-t">
              <p className="text-lg font-bold text-gray-900">
                {currentDate.month} {currentDate.day}
              </p>
              <p className="text-xs text-gray-500">{selectedDay}</p>
            </div>
          )}
        </div>

        {/* Category Readings */}
        <div className="space-y-3">
          {categories.map((category) => {
            const currentReading = selectedReadings?.[category];

            if (!currentReading) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow">
                <button
                  className="w-full py-4 px-5 text-right font-medium text-gray-900 hover:bg-gray-50 transition-colors rounded-lg"
                  onClick={(e) => {
                    const content = e.currentTarget.nextElementSibling;
                    if (content) {
                      content.classList.toggle("hidden");
                    }
                  }}
                >
                  {category}
                </button>
                <div className="hidden px-5 pb-5">
                  <h3 className="text-sm font-semibold text-green-700 mb-2">
                    {currentReading.title}
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {currentReading.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>ማስታወሻ:</strong> እነዚህ ምንባባት ለ{selectedDay} የተዘጋጁ ናቸው። በበዓላት
            ጊዜ ምንባባቱ ሊለወጥ ይችላል።
          </p>
        </div>
      </div>
    </div>
  );
}
