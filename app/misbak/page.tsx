"use client";

import { Book, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentWeekEthiopianDates } from "@/lib/ethiopian-calendar";

interface MisbakData {
  id: number;
  date: string;
  dayOfWeek: string;
  geez: string;
  translation: string;
  liturgy: string;
}

export default function MisbakPage() {
  const [selectedDay, setSelectedDay] = useState("እሁድ");
  const [weekDates, setWeekDates] = useState<{ [key: string]: any }>({});
  const [misbakData, setMisbakData] = useState<MisbakData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get Ethiopian dates for current week
    const dates = getCurrentWeekEthiopianDates();
    setWeekDates(dates);

    // Set today as default
    const today = new Date();
    const dayNames = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
    setSelectedDay(dayNames[today.getDay()]);

    // Fetch misbak data
    fetch("/data/misbak.json")
      .then((res) => res.json())
      .then((data) => {
        setMisbakData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading misbak data:", error);
        setLoading(false);
      });
  }, []);

  const days = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
  const currentDate = weekDates[selectedDay];

  // Find misbak for selected day
  const selectedMisbak = misbakData.find((item) => item.dayOfWeek === selectedDay) || misbakData[0];

  if (loading) {
    return (
      <div className="min-h-screen pb-20 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Book className="w-8 h-8" />
            <h1 className="text-2xl font-bold">ምስባክ</h1>
          </div>
          <p className="text-blue-100 text-sm">
            የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ምስባክ
          </p>
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
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedDay === day
                      ? "bg-blue-600 text-white"
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

        {/* Misbak Content */}
        {selectedMisbak && (
          <div className="space-y-4">
            {/* Geez Text */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">ግዕዝ፡-</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                  {selectedMisbak.geez}
                </p>
              </div>
            </div>

            {/* Translation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">ትርጉም፡-</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedMisbak.translation}
                </p>
              </div>
            </div>

            {/* Liturgy */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium text-center">
                  {selectedMisbak.liturgy}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ማስታወሻ:</strong> ምስባክ በየቀኑ እና በየበዓሉ ይለያያል። ከመምህራን ጋር
            በመማከር ትክክለኛውን ምስባክ ይጠቀሙ።
          </p>
        </div>
      </div>
    </div>
  );
}
