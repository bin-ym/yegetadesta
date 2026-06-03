// app/components/ProfileCompletionModal.tsx

"use client";

import { useState } from "react";
import { User, Phone, MapPin, CheckCircle, Type } from "lucide-react";

interface Props {
  initData: string;
  onCompleteAction: () => void;
}

export default function ProfileCompletionModal({
  initData,
  onCompleteAction,
}: Props) {
  const [formData, setFormData] = useState({
    fullName: "",
    baptismName: "",
    phoneNumber: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          ...formData,
        }),
      });

      if (response.ok) {
        onCompleteAction();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-black">
            ፕሮፋይልዎን ያሟሉ
          </h2>
          <p className="text-gray-600 text-sm">
            ለመጀመር እባክዎ የሚከተሉትን መረጃዎች በትክክል ይሙሉ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-500" />
              ሙሉ ስም
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="ለምሳሌ፡ አበበ በቀለ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              ክርስትና ስም
            </label>
            <input
              type="text"
              value={formData.baptismName}
              onChange={(e) =>
                setFormData({ ...formData, baptismName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="ለምሳሌ፡ ኃይለ ማርያም"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              ስልክ ቁጥር
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="09..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              አድራሻ
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="ለምሳሌ፡ አዲስ አበባ"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
          >
            {loading ? "በሂደት ላይ..." : "መረጃውን አረጋግጥ"}
          </button>
        </form>
      </div>
    </div>
  );
}
