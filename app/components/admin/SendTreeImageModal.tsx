"use client";

import { useState, useEffect } from "react";
import {
  X,
  Send,
  Download,
  Users,
  Layers,
  UserCheck,
  CheckSquare,
  Square,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface SendTreeImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  initData?: string;
}

export default function SendTreeImageModal({
  isOpen,
  onClose,
  imageUrl,
  initData,
}: SendTreeImageModalProps) {
  const [recipientType, setRecipientType] = useState<"all" | "level" | "selected">("all");
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [caption, setCaption] = useState(
    `🌿 <b>የቅዳሴ ጥሪ ሳምንታዊ መረብ (Call Tree Diagram)</b> 🌿\n\nየዚህ ሳምንት የጥሪ ቅደም ተከተል ተዘጋጅቷል። እባክዎን የእርስዎን ተረኛ በመመልከት በሰዓቱ ይደውሉ።\n\n✝ <i>እግዚአብሔር አገልግሎታችንን ይቀበልልን!</i>`,
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    total?: number;
    sentCount?: number;
    failedCount?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setResult(null);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: initData ? { "x-telegram-init-data": initData } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Only active users
        const activeUsers = data.filter(
          (u: any) => u.status === "ACTIVE" && u.active !== false,
        );
        setUsers(activeUsers);
        // Default select all active users
        setSelectedUserIds(activeUsers.map((u: any) => u.id));
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `kidase_call_tree_${new Date().toISOString().split("T")[0]}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handleToggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedUserIds(filteredUsers.map((u) => u.id));
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.baptismName &&
        u.baptismName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phoneNumber && u.phoneNumber.includes(searchQuery)),
  );

  const handleSend = async () => {
    if (!imageUrl) {
      alert("No image generated.");
      return;
    }

    if (recipientType === "selected" && selectedUserIds.length === 0) {
      alert("Please select at least one user to send to.");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/send-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: initData || "web-bypass-token",
          imageBase64: imageUrl,
          recipientType,
          selectedUserIds: recipientType === "selected" ? selectedUserIds : undefined,
          selectedLevel: recipientType === "level" ? selectedLevel : undefined,
          caption,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          total: data.total,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to send image.",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Network error.",
      });
    } finally {
      setSending(false);
    }
  };

  // Count available telegram accounts
  const validTelegramUsersCount = users.filter(
    (u) => u.telegramId && !u.telegramId.startsWith("pending_"),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 to-green-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Send Tree Image to Telegram
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </h2>
              <p className="text-green-200 text-xs mt-0.5">
                የጥሪ መረብ ምስል ለተጠቃሚዎች በቴሌግራም መላኪያ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Result Alert */}
          {result && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                result.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {result.success ? "Successfully Sent!" : "Failed to Send"}
                </p>
                <p className="text-xs mt-1">
                  {result.success
                    ? `Sent image to ${result.sentCount} out of ${result.total} members.${
                        result.failedCount && result.failedCount > 0
                          ? ` (${result.failedCount} failed to deliver)`
                          : ""
                      }`
                    : result.message}
                </p>
              </div>
            </div>
          )}

          {/* Grid of Preview & Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Image Preview & Download */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>📸</span> Image Preview
                </h3>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-semibold bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors border border-green-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save PNG
                </button>
              </div>

              <div className="bg-neutral-900 rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] flex items-center justify-center p-3 shadow-inner">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Generated Tree"
                    className="max-h-full max-w-full object-contain rounded shadow"
                  />
                ) : (
                  <div className="text-gray-400 text-xs flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                    Generating high-res image...
                  </div>
                )}
              </div>

              {/* Caption Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Telegram Message Caption (ጽሑፍ)
                </label>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all leading-relaxed"
                  placeholder="Enter message caption..."
                />
              </div>
            </div>

            {/* Right: Recipient Selection */}
            <div className="space-y-4 flex flex-col">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>👥</span> Choose Recipients (ተቀባዮች)
              </h3>

              {/* Recipient Mode Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRecipientType("all")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    recipientType === "all"
                      ? "bg-white text-green-800 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Members
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType("level")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    recipientType === "level"
                      ? "bg-white text-green-800 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  By Level
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType("selected")}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    recipientType === "selected"
                      ? "bg-white text-green-800 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Select Specific
                </button>
              </div>

              {/* Recipient Mode Details */}
              {recipientType === "all" && (
                <div className="p-4 bg-green-50/70 border border-green-200 rounded-xl text-xs text-green-900 space-y-2 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-green-800">
                    <Users className="w-4 h-4" /> Send to All Active Members
                  </div>
                  <p>
                    The generated tree image will be sent as a private Telegram message to all <b>{validTelegramUsersCount}</b> active members who have linked their Telegram account.
                  </p>
                  <div className="text-[11px] text-green-700 bg-white/80 p-2.5 rounded-lg border border-green-100">
                    💡 Unlinked members will receive it automatically once they open the Telegram bot.
                  </div>
                </div>
              )}

              {recipientType === "level" && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 flex-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Tree Level / Group:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { level: 0, label: "Level 0 (Root / መሪ)" },
                      { level: 1, label: "Level 1 (Sub-leaders)" },
                      { level: 2, label: "Level 2 (Chains)" },
                      { level: 3, label: "Level 3" },
                      { level: 4, label: "Level 4" },
                      { level: 5, label: "Level 5+" },
                    ].map((item) => (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => setSelectedLevel(item.level)}
                        className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                          selectedLevel === item.level
                            ? "bg-green-700 text-white border-green-700 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === "selected" && (
                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 max-h-72">
                  {/* Search and Select Actions */}
                  <div className="p-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[11px] text-green-700 hover:underline px-1.5 py-1 font-semibold"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[11px] text-gray-500 hover:underline px-1.5 py-1"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* List of Users */}
                  <div className="overflow-y-auto divide-y divide-gray-100 flex-1 custom-scrollbar text-xs">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-xs">
                        No members found
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        const hasTelegram =
                          user.telegramId && !user.telegramId.startsWith("pending_");

                        return (
                          <div
                            key={user.id}
                            onClick={() => handleToggleUser(user.id)}
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected ? "bg-green-50/60" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-green-700 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {user.fullName}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  {user.baptismName || user.phoneNumber || "No details"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                hasTelegram
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {hasTelegram ? "Telegram Linked" : "No Telegram"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {recipientType === "selected" ? (
              <span>
                Selected: <b>{selectedUserIds.length}</b> members
              </span>
            ) : recipientType === "all" ? (
              <span>
                Targeting <b>{validTelegramUsersCount}</b> active members
              </span>
            ) : (
              <span>Targeting members in Level {selectedLevel}</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !imageUrl}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#166534] to-green-800 text-white font-semibold rounded-xl hover:from-green-900 hover:to-emerald-950 transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending via Telegram...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Image Now (ላክ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
