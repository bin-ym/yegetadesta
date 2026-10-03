// app/components/Dashboard.tsx

"use client";

import { useState, useEffect } from "react";
import { DashboardData, CallStatus } from "../types";
import {
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  PhoneCall,
  History,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import ProfileCompletionModal from "./ProfileCompletionModal";
import { getEthiopianWeekInfo } from "@/lib/ethiopian-calendar";

interface DashboardProps {
  data: DashboardData;
  initData: string;
  openProfileEditor?: boolean;
}

export default function Dashboard({
  data,
  initData,
  openProfileEditor = false,
}: DashboardProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pastCycles, setPastCycles] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(openProfileEditor);

  const {
    user,
    currentCycle,
    myNode,
    myParent,
    myChildren,
    myOutgoingCalls,
    myIncomingCall,
  } = data;

  const ethWeekInfo = getEthiopianWeekInfo();

  useEffect(() => {
    // Fetch past cycles
    async function fetchHistory() {
      try {
        const response = await fetch("/api/history", {
          headers: {
            "x-telegram-init-data": initData,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPastCycles(data.snapshots || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    }
    fetchHistory();
  }, [initData]);

  // Robust profile completeness check (safe for null/undefined)
  const isProfileIncomplete =
    !user.fullName ||
    user.fullName.trim() === "" ||
    !user.baptismName ||
    (user.baptismName || "").trim() === "" ||
    !user.phoneNumber ||
    (user.phoneNumber || "").trim() === "" ||
    !user.address ||
    (user.address || "").trim() === "";

  const shouldShowModal = showProfileModal || isProfileIncomplete;

  const updateCallStatus = async (callEdgeId: string, status: CallStatus) => {
    setUpdating(callEdgeId);
    try {
      const response = await fetch("/api/calls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, callEdgeId, status }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update call:", error);
    } finally {
      setUpdating(null);
    }
  };

  const makePhoneCall = (phoneNumber: string, name: string) => {
    if (confirm(`ወደ ${name} መደወል ይፈልጋሉ?`)) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  // Profile Modal reusable element
  const ProfileModalElement = shouldShowModal ? (
    <ProfileCompletionModal
      initData={initData}
      profile={user}
      onCompleteAction={() => {
        setShowProfileModal(false);
        window.location.reload();
      }}
    />
  ) : null;

  if (!currentCycle) {
    return (
      <div className="min-h-screen pb-20 p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">✝ ቅዳሴ ጥሪ</h2>
            <p className="text-gray-600">
              No active cycle yet. Check back soon!
            </p>
          </div>
        </div>
        {ProfileModalElement}
      </div>
    );
  }

  if (!myNode) {
    return (
      <div className="min-h-screen pb-20 p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">✝ ቅዳሴ ጥሪ</h2>
            <p className="text-gray-600 mb-4">
              Welcome, {user.fullName}! You're in the waiting pool for the next
              cycle.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                You'll be assigned a position in the call tree for the next
                weekly cycle.
              </p>
            </div>
          </div>
        </div>
        {ProfileModalElement}
      </div>
    );
  }

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "ANSWERED":
        return "text-green-600";
      case "NO_ANSWER":
        return "text-red-600";
      case "CALLED":
        return "text-yellow-600";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBg = (status: CallStatus) => {
    switch (status) {
      case "ANSWERED":
        return "bg-green-50 border-green-200";
      case "NO_ANSWER":
        return "bg-red-50 border-red-200";
      case "CALLED":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: CallStatus) => {
    switch (status) {
      case "ANSWERED":
        return <CheckCircle className="w-5 h-5" />;
      case "NO_ANSWER":
        return <XCircle className="w-5 h-5" />;
      case "CALLED":
        return <Clock className="w-5 h-5" />;
      default:
        return <Phone className="w-5 h-5" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "BUILDING":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "ACTIVE":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "PREVIEW":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "CLOSED":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen pb-20 p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header with Ethiopian Calendar Cycle Info */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">✝ ቅዳሴ ጥሪ</h1>
              <p className="text-blue-100 text-sm font-medium mt-0.5">
                {ethWeekInfo.formatted}
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <History className="w-6 h-6" />
            </button>
          </div>
          <div
            className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide ${getPhaseColor(currentCycle.phase)}`}
          >
            {currentCycle.phase}
          </div>
        </div>

        {/* History Section */}
        {showHistory && pastCycles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              Past Weeks
            </h2>
            <div className="space-y-3">
              {pastCycles.slice(0, 5).map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-900">
                      ሳምንት {snapshot.weekNumber}, {snapshot.year} ዓ.ም.
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(snapshot.createdAt).toLocaleDateString("am-ET")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Members</p>
                      <p className="font-semibold text-gray-900">
                        {snapshot.totalMembers}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Answered</p>
                      <p className="font-semibold text-green-600">
                        {snapshot.answeredCalls}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-xs">Rate</p>
                      <p className="font-semibold text-blue-600">
                        {snapshot.participationPct.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. YOUR RESPONSIBILITY (APPEARS FIRST) */}
        {myOutgoingCalls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                የእርስዎ ኃላፊነት (Your Responsibility)
              </h2>
              <span className="text-xs font-semibold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                {myOutgoingCalls.length} አባላት
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              በእሁድ ንጋት (ቅዳሜ ምሽት 10:00 ሰዓት) የሚደውሉላቸው አባላት
            </p>
            <div className="space-y-3">
              {myOutgoingCalls.map((call) => (
                <div
                  key={call.id}
                  className={`border rounded-xl p-4 transition-all ${getStatusBg(call.status)}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
                      {call.calleeNode.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {call.calleeNode.user.fullName}
                      </p>
                      {call.calleeNode.user.baptismName && (
                        <p className="text-xs text-green-600">
                          ✝ {call.calleeNode.user.baptismName}
                        </p>
                      )}
                      {call.calleeNode.user.phoneNumber && (
                        <button
                          onClick={() =>
                            makePhoneCall(
                              call.calleeNode.user.phoneNumber!,
                              call.calleeNode.user.fullName,
                            )
                          }
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-1 font-mono font-medium"
                        >
                          <PhoneCall className="w-4 h-4" />
                          {call.calleeNode.user.phoneNumber}
                        </button>
                      )}
                    </div>
                    <div className={getStatusColor(call.status)}>
                      {getStatusIcon(call.status)}
                    </div>
                  </div>

                  {currentCycle.phase === "ACTIVE" &&
                    call.status !== "ANSWERED" && (
                      <div className="flex gap-2">
                        {call.status === "UNCALLED" && (
                          <button
                            onClick={() => updateCallStatus(call.id, "CALLED")}
                            disabled={updating === call.id}
                            className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-xs font-semibold shadow-sm transition-colors"
                          >
                            Mark as Called
                          </button>
                        )}
                        <button
                          onClick={() => updateCallStatus(call.id, "ANSWERED")}
                          disabled={updating === call.id}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs font-semibold shadow-sm transition-colors"
                        >
                          ✓ Answered
                        </button>
                        <button
                          onClick={() => updateCallStatus(call.id, "NO_ANSWER")}
                          disabled={updating === call.id}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs font-semibold shadow-sm transition-colors"
                        >
                          ✗ No Answer
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. WHO WILL CALL YOU (APPEARS NEXT) */}
        {myParent && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200">
            <h2 className="text-lg font-bold mb-1 text-purple-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-700" />
              የሚደውልልዎት (Who Will Call You)
            </h2>
            <p className="text-xs text-purple-700 mb-4">
              እርስዎን የሚቀሰቅስዎት አባል
            </p>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                  {myParent.position}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {myParent.user.fullName}
                  </p>
                  {myParent.user.baptismName && (
                    <p className="text-xs text-purple-600 font-medium">
                      ✝ {myParent.user.baptismName}
                    </p>
                  )}
                  {myParent.user.phoneNumber && (
                    <button
                      onClick={() =>
                        makePhoneCall(
                          myParent.user.phoneNumber!,
                          myParent.user.fullName,
                        )
                      }
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-1 font-mono font-medium"
                    >
                      <PhoneCall className="w-4 h-4" />
                      {myParent.user.phoneNumber}
                    </button>
                  )}
                </div>
                {myIncomingCall && (
                  <div className={getStatusColor(myIncomingCall.status)}>
                    {getStatusIcon(myIncomingCall.status)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Notice Card */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm text-blue-900 leading-relaxed">
            <strong>✝ ማስታወሻ:</strong> እያንዳንዱ አባል ደዋይ እና ተደዋይ ነው። በመንፈሳዊ አገልግሎት ውስጥ ማንም አይረሳም።
          </p>
        </div>
      </div>
      {ProfileModalElement}
    </div>
  );
}

