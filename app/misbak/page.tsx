"use client";

import { Book, Calendar } from "lucide-react";
import { useState } from "react";

export default function MisbakPage() {
  const [selectedDate, setSelectedDate] = useState("የግንቦት 2");

  const misbakData = [
    {
      date: "☦️ የግንቦት 2",
      geez: `በልዑ ወጸግቡ ጥቀወወሀቦሙ ለፍትወቶሙወኢያኅጥዖሙ እምዘፈቀዱ። መዝ ፸፯ ፡ ፳፱-፴`,
      translation: `በሉ እጅግም ጠገቡምኞታቸውንም ሰጣቸውከወደዱትም አላሳጣቸውም። መዝ 79፡29-30`,
      liturgy: "ቅዳሴ፦ ዘዲዮስቆሮስ",
    },
    {
      date: "☦️ የግንቦት 3",
      geez: `ወአንተ ፡ እግዚኦ ፡ ረሐቅከ ፡ እምኔየ ፡ ኦ ረድኤትየ ፡ ለረድኤትየ ፡ ተለከፍ። መዝ ፳፪ ፡ ፲፱`,
      translation: `አንተ ግን ጌታዬ ሆይ ከእኔ አትራቅ፤ ረዳቴ ሆይ ለመርዳቴ ቸኩል። መዝ 22፡19`,
      liturgy: "ቅዳሴ፦ ዘዮሐንስ አፈወርቅ",
    },
    {
      date: "☦️ የግንቦት 4",
      geez: `ወአንበርኩ ፡ ውስተ ፡ ቤተ ፡ እግዚአብሔር ፡ በኵሉ ፡ መዋዕለ ፡ ሕይወትየ። መዝ ፳፫ ፡ ፮`,
      translation: `በሕይወቴም ዘመን ሁሉ በእግዚአብሔር ቤት እቀመጣለሁ። መዝ 23፡6`,
      liturgy: "ቅዳሴ፦ ዘማርቆስ",
    },
    {
      date: "☦️ የግንቦት 5",
      geez: `እስመ ፡ ውእቱ ፡ አምላክነ ፡ ወንሕነ ፡ ሕዝቡ ፡ ወአባግዕ ፡ መርዓሁ። መዝ ፺፭ ፡ ፯`,
      translation: `እርሱ አምላካችን ነውና፤ እኛም ሕዝቡ የግጦሹም በጎች ነን። መዝ 95፡7`,
      liturgy: "ቅዳሴ፦ ዘባስልዮስ",
    },
    {
      date: "☦️ የግንቦት 6",
      geez: `ወአነ ፡ በብዝኀት ፡ ምሕረትከ ፡ እባእ ፡ ውስተ ፡ ቤትከ። መዝ ፭ ፡ ፰`,
      translation: `እኔም በምሕረትህ ብዛት ወደ ቤትህ እገባለሁ። መዝ 5፡8`,
      liturgy: "ቅዳሴ፦ ዘግርጎርዮስ",
    },
    {
      date: "☦️ የግንቦት 7",
      geez: `ወአነ ፡ በጽድቅ ፡ እሬኢ ፡ ገጸከ ፡ ወእጸግብ ፡ በአስተርአየ ፡ ክብርከ። መዝ ፲፯ ፡ ፲፭`,
      translation: `እኔም በጽድቅ ፊትህን እመለከታለሁ፤ ክብርህም ሲገለጥ እጠግባለሁ። መዝ 17፡15`,
      liturgy: "ቅዳሴ፦ ዘቂርሎስ",
    },
    {
      date: "☦️ የግንቦት 8",
      geez: `ወአነ ፡ በብዝኀት ፡ ምሕረትከ ፡ እባእ ፡ ውስተ ፡ ቤትከ። መዝ ፭ ፡ ፰`,
      translation: `እኔም በምሕረትህ ብዛት ወደ ቤትህ እገባለሁ። መዝ 5፡8`,
      liturgy: "ቅዳሴ፦ ዘኤጲፋንዮስ",
    },
  ];

  const dates = misbakData.map((item) => item.date);
  const selectedMisbak = misbakData.find((item) => item.date === selectedDate);

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
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">የቀን ምርጫ</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedDate === date
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {/* Misbak Content */}
        {selectedMisbak && (
          <div className="space-y-4">
            {/* Date Header */}
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-2xl font-bold text-blue-700 text-center">
                {selectedMisbak.date}
              </h2>
            </div>

            {/* Geez Text */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                ግዕዝ፡-
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                  {selectedMisbak.geez}
                </p>
              </div>
            </div>

            {/* Translation */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                ትርጉም፡-
              </h3>
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
