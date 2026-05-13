"use client";

import { Book } from "lucide-react";

export default function MisbakPage() {
  const misbakSections = [
    {
      title: "የቅዳሴ ምስባክ",
      content: "የቅዳሴ ምስባክ ይህ ነው...",
      description: "የቅዳሴ ምስባክ ለእሁድ ቅዳሴ",
    },
    {
      title: "የጾም ምስባክ",
      content: "የጾም ምስባክ ይህ ነው...",
      description: "የጾም ምስባክ ለጾም ጊዜ",
    },
    {
      title: "የበዓል ምስባክ",
      content: "የበዓል ምስባክ ይህ ነው...",
      description: "የበዓል ምስባክ ለበዓላት",
    },
  ];

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

        {/* Misbak Sections */}
        {misbakSections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {section.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{section.description}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          </div>
        ))}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ማስታወሻ:</strong> ምስባክ በየቀኑ እና በየበዓሉ ይለያያል። 
            ከመምህራን ጋር በመማከር ትክክለኛውን ምስባክ ይጠቀሙ።
          </p>
        </div>
      </div>
    </div>
  );
}
