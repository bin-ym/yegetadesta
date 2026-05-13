"use client";

import { BookOpen, Calendar } from "lucide-react";
import { useState } from "react";

export default function MinbabatPage() {
    const [selectedDay, setSelectedDay] = useState("እሁድ");
    const [selectedCategory, setSelectedCategory] = useState("የሐዋሪያት ስራ");

    const categories = [
        "የቅዱስ ጳውሎስ መልዕክት",
        "መልዕክታት",
        "የሐዋሪያት ስራ",
        "ወንጌል",
    ];

    const readings = {
        እሁድ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 8:1-17",
                content:
                    "ስለዚህ አሁን በክርስቶስ ኢየሱስ ላሉት ምንም ፍርድ የለም። የመንፈስ ህግ በክርስቶስ ኢየሱስ ከኃጢአት ህግና ከሞት ነፃ አወጣኝና።",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 1:1-12",
                content: "የኢየሱስ ክርስቶስ ሐዋርያ የሆነው ጴጥሮስ...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 2:1-13",
                content:
                    "የጰንጠቆስጤ በዓል ሲደርስ ሁሉም በአንድ ቦታ ተሰብስበው ነበር። በድንገት ከሰማይ ጠንካራ ነፋስ እንደሚነፍስ የሚመስል ድምፅ መጣ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:1-12",
                content:
                    "ብዙ ሰዎችን ባየ ጊዜ ወደ ተራራ ወጣ። ተቀምጦም ደቀ መዛሙርቱ ወደ እርሱ መጡ። አፉንም ከፍቶ እንዲህ ብሎ አስተማራቸው፦ መንፈሳቸው ድሀ የሆኑ ብፁዓን ናቸው...",
            },
        },
        ሰኞ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 8:18-39",
                content: "የአሁኑ ጊዜ መከራ ከሚገለጥልን ክብር ጋር እንደማይወዳደር አስባለሁ...",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 1:13-25",
                content: "ስለዚህ የአእምሮአችሁን ወገብ አስሩ...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 2:14-36",
                content: "ጴጥሮስ ከአስራ አንዱ ጋር ቆሞ ድምፁን ከፍ አድርጎ እንዲህ አለ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:13-20",
                content: "እናንተ የምድር ጨው ናችሁ። ጨው ጣዕሙን ቢያጣ በምን ይጣፋል?",
            },
        },
        ማክሰኞ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 9:1-18",
                content: "በክርስቶስ እውነትን እናገራለሁ አልዋሸም...",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 2:1-10",
                content: "ስለዚህ ክፋትንና ሁሉንም ተንኮልን...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 2:37-47",
                content: "ይህን ሲሰሙ በልባቸው ተወጉ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:21-26",
                content: "አትግደል ተብሎ ለቀደምቶች መነገራቸውን ሰምታችኋል...",
            },
        },
        ረቡዕ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 9:19-33",
                content: "ታዲያ ለምን ይወቅሳል ትለኛለህ? ፈቃዱን ማን ተቃወመ?",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 2:11-25",
                content: "ወዳጆቼ ሆይ፣ እንደ መጻተኞችና እንደ ተጓዦች...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 3:1-10",
                content: "ጴጥሮስና ዮሐንስ በዘጠኝ ሰዓት ወደ መቅደስ ለመጸለይ ወጡ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:27-32",
                content: "አታመንዝር ተብሎ መነገሩን ሰምታችኋል...",
            },
        },
        ሐሙስ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 10:1-21",
                content: "ወንድሞች ሆይ፣ የልቤ ምኞትና ለእግዚአብሔር ለእስራኤል የምለምነው ይድኑ ዘንድ ነው...",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 3:1-12",
                content: "እንዲሁም ሚስቶች ለባሎቻችሁ ተገዙ...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 3:11-26",
                content: "ሰውየው ጴጥሮስንና ዮሐንስን ሲያዝ ሕዝቡ ሁሉ በመደነቅ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:33-37",
                content: "እንደገና አትምሉ ተብሎ ለቀደምቶች መነገራቸውን ሰምታችኋል...",
            },
        },
        አርብ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 11:1-24",
                content: "ታዲያ እግዚአብሔር ሕዝቡን ጣለው እላለሁ? በፍፁም አይደለም!",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 3:13-22",
                content: "ለበጎ ነገር ቢቀናነቱ ማን ይጎዳችኋል?",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 4:1-12",
                content: "ከሕዝቡ ጋር እያወሩ እያሉ ካህናትና የመቅደሱ አለቃ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:38-42",
                content: "ዓይን ስለ ዓይን ጥርስ ስለ ጥርስ ተብሎ መነገሩን ሰምታችኋል...",
            },
        },
        ቅዳሜ: {
            "የቅዱስ ጳውሎስ መልዕክት": {
                title: "ሮሜ 11:25-36",
                content: "ወንድሞች ሆይ፣ በራሳችሁ ጥበበኞች እንዳትሆኑ ይህን ምሥጢር እንድታውቁ እወዳለሁ...",
            },
            መልዕክታት: {
                title: "1 ጴጥሮስ 4:1-11",
                content: "ስለዚህ ክርስቶስ በሥጋ ስለተሰቃየ እናንተም በዚሁ አስተሳሰብ ታጠቁ...",
            },
            "የሐዋሪያት ስራ": {
                title: "የሐዋሪያት ስራ 4:13-22",
                content: "የጴጥሮስና የዮሐንስ ድፍረት ባዩ ጊዜ...",
            },
            ወንጌል: {
                title: "ማቴዎስ 5:43-48",
                content: "ባልንጀራህን ውደድ ጠላትህንም ጥላ ተብሎ መነገሩን ሰምታችኋል...",
            },
        },
    };

    const days = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];

    const currentReading =
        readings[selectedDay as keyof typeof readings][
        selectedCategory as keyof (typeof readings)["እሁድ"]
        ];

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

                {/* Category Selector */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors text-right ${selectedCategory === category
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reading Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-semibold text-green-700 mb-3">
                        {selectedCategory}
                    </h3>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        {currentReading.title}
                    </h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                            {currentReading.content}
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
