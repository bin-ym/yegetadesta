"use client";

import { BookOpen, Calendar } from "lucide-react";
import { useState } from "react";

export default function MinbabatPage() {
    const [selectedDay, setSelectedDay] = useState("እሁድ");

    const readings = {
        እሁድ: {
            oldTestament: "ዘፍጥረት 1:1-31",
            psalm: "መዝሙረ ዳዊት 23",
            epistle: "ሮሜ 8:1-17",
            gospel: "ማቴዎስ 5:1-12",
        },
        ሰኞ: {
            oldTestament: "ዘፍጥረት 2:1-25",
            psalm: "መዝሙረ ዳዊት 24",
            epistle: "ሮሜ 8:18-39",
            gospel: "ማቴዎስ 5:13-20",
        },
        ማክሰኞ: {
            oldTestament: "ዘፍጥረት 3:1-24",
            psalm: "መዝሙረ ዳዊት 25",
            epistle: "ሮሜ 9:1-18",
            gospel: "ማቴዎስ 5:21-26",
        },
        ረቡዕ: {
            oldTestament: "ዘፍጥረት 4:1-26",
            psalm: "መዝሙረ ዳዊት 26",
            epistle: "ሮሜ 9:19-33",
            gospel: "ማቴዎስ 5:27-32",
        },
        ሐሙስ: {
            oldTestament: "ዘፍጥረት 5:1-32",
            psalm: "መዝሙረ ዳዊት 27",
            epistle: "ሮሜ 10:1-21",
            gospel: "ማቴዎስ 5:33-37",
        },
        አርብ: {
            oldTestament: "ዘፍጥረት 6:1-22",
            psalm: "መዝሙረ ዳዊት 28",
            epistle: "ሮሜ 11:1-24",
            gospel: "ማቴዎስ 5:38-42",
        },
        ቅዳሜ: {
            oldTestament: "ዘፍጥረት 7:1-24",
            psalm: "መዝሙረ ዳዊት 29",
            epistle: "ሮሜ 11:25-36",
            gospel: "ማቴዎስ 5:43-48",
        },
    };

    const days = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];

    const currentReading = readings[selectedDay as keyof typeof readings];

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

                {/* Day Selector */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <h2 className="font-semibold text-gray-900">የቀን ምርጫ</h2>
                    </div>
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

                {/* Readings */}
                <div className="space-y-3">
                    {/* Old Testament */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">
                            ብሉይ ኪዳን
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                            {currentReading.oldTestament}
                        </p>
                    </div>

                    {/* Psalm */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">
                            መዝሙር
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                            {currentReading.psalm}
                        </p>
                    </div>

                    {/* Epistle */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">
                            ሐዋርያት
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                            {currentReading.epistle}
                        </p>
                    </div>

                    {/* Gospel */}
                    <div className="bg-white rounded-lg shadow p-5 border-2 border-green-200">
                        <h3 className="text-sm font-semibold text-green-700 mb-2">
                            ወንጌል
                        </h3>
                        <p className="text-lg font-medium text-gray-900">
                            {currentReading.gospel}
                        </p>
                    </div>
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
