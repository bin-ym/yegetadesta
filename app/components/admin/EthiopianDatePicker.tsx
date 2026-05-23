"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { gregorianToEthiopian } from "@/lib/ethiopian-calendar";

interface Props {
    onDateSelect: (date: string, dayOfWeek: string) => void;
    selectedDate?: string;
}

const ethiopianMonths = [
    "መስከረም",
    "ጥቅምት",
    "ኅዳር",
    "ታኅሣሥ",
    "ጥር",
    "የካቲት",
    "መጋቢት",
    "ሚያዝያ",
    "ግንቦት",
    "ሰኔ",
    "ሐምሌ",
    "ነሐሴ",
    "ጳጉሜ",
];

const ethiopianDays = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"];

export default function EthiopianDatePicker({ onDateSelect, selectedDate }: Props) {
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get Ethiopian date for current view
    const ethDate = gregorianToEthiopian(currentDate);
    const currentMonthIndex = ethiopianMonths.indexOf(ethDate.month);

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const days = [];
        const daysInMonth = currentMonthIndex === 12 ? 5 : 30; // Pagume has 5-6 days

        // Get the first day of the month in Gregorian
        const firstDayGregorian = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Calculate offset for the first day
        let startOffset = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const testDate = new Date(currentDate);
            testDate.setDate(testDate.getDate() - (ethDate.day - i));
            const testEthDate = gregorianToEthiopian(testDate);

            if (testEthDate.day === 1 && testEthDate.month === ethDate.month) {
                const dayOfWeek = testDate.getDay();
                startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
                break;
            }
        }

        // Add empty cells for offset
        for (let i = 0; i < startOffset; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const handleDayClick = (day: number) => {
        if (!day) return;

        // Calculate the Gregorian date for this Ethiopian day
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() + (day - ethDate.day));

        const targetEthDate = gregorianToEthiopian(targetDate);
        const dateString = `${targetEthDate.month} ${targetEthDate.day} ${targetEthDate.year}`;

        onDateSelect(dateString, targetEthDate.dayOfWeek);
        setShowCalendar(false);
    };

    const changeMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <input
                    type="text"
                    value={selectedDate || ""}
                    onClick={() => setShowCalendar(!showCalendar)}
                    placeholder="Select Ethiopian Date (e.g., ግንቦት 16 2018)"
                    readOnly
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-900 cursor-pointer"
                />
            </div>

            {showCalendar && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 w-80">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <p className="font-bold text-gray-900">
                                {ethDate.month} {ethDate.year}
                            </p>
                        </div>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {ethiopianDays.map((day) => (
                            <div
                                key={day}
                                className="text-center text-xs font-semibold text-gray-600 py-1"
                            >
                                {day.substring(0, 2)}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => day && handleDayClick(day)}
                                disabled={!day}
                                className={`
                  aspect-square flex items-center justify-center rounded text-sm
                  ${!day ? "invisible" : ""}
                  ${day === ethDate.day
                                        ? "bg-blue-600 text-white font-bold"
                                        : "hover:bg-gray-100 text-gray-900"
                                    }
                  ${!day ? "" : "cursor-pointer"}
                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setShowCalendar(false)}
                        className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
