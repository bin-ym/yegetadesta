"use client";

import { BookOpen, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getCurrentWeekEthiopianDates } from "@/lib/ethiopian-calendar";

export default function MinbabatPage() {
    const [selectedDay, setSelectedDay] = useState("እሁድ");
    const [weekDates, setWeekDates] = useState<{ [key: string]: any }>({});
    const [readings, setReadings] = useState<any>({});
    const [loading, setLoading] = useState(true);

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

    const days = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"];
    const categories = [
        "የቅዱስ ጳውሎስ መልዕክት",
        "መልዕክታት",
        "የሐዋሪያት ስራ",
        "ወንጌል",
    ];

    const currentDate = weekDates[selectedDay];

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
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8" />
                        <h1 className="text-2xl font-bold">ምንባባት</h1>
                    </div>
                    <p className="text-green-100 text-sm">
                        የዕለት ምንባባት - የመጽሐፍ ቅዱስ ንባብ
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
                        const currentReading = readings[selectedDay]?.[category];

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
                        <strong>ማስታወሻ:</strong> እነዚህ ምንባባት ለ{selectedDay} የተዘጋጁ ናቸው።
                        በበዓላት ጊዜ ምንባባቱ ሊለወጥ ይችላል።
                    </p>
                </div>
            </div>
        </div>
    );
}
