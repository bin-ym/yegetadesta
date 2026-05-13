"use client";

import { useState } from "react";
import { DashboardData, CallStatus } from "../types";
import { Phone, CheckCircle, XCircle, Clock } from "lucide-react";

interface DashboardProps {
  data: DashboardData;
  initData: string;
}

export default function Dashboard({ data, initData }: DashboardProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const { user, currentCycle, myNode, myParent, myChildren, myOutgoingCalls, myIncomingCall } = data;

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

  if (!currentCycle) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">✝ ቅዳሴ ጥሪ</h2>
            <p className="text-gray-600">No active cycle yet. Check back soon!</p>
          </div>
        </div>
      </div>
    );
  }

  if (!myNode) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">✝ ቅዳሴ ጥሪ</h2>
            <p className="text-gray-600 mb-4">
              Welcome, {user.fullName}! You're in the waiting pool for the next cycle.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                You'll be assigned a position in the call tree for the next weekly cycle.
              </p>
            </div>
          </div>
        </div>
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

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">✝ ቅዳሴ ጥሪ</h1>
          <p className="text-gray-600">Week {currentCycle.weekNumber}, {currentCycle.year}</p>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              currentCycle.phase === "ACTIVE" ? "bg-green-100 text-green-800" :
              currentCycle.phase === "PREVIEW" ? "bg-blue-100 text-blue-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {currentCycle.phase}
            </span>
          </div>
        </div>

        {/* User Position */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Your Position</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
              {myNode.position}
            </div>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-gray-500">Level {myNode.level}</p>
            </div>
          </div>
        </div>

        {/* Parent */}
        {myParent && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Your Caller</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                {myParent.position}
              </div>
              <div className="flex-1">
                <p className="font-medium">{myParent.user.fullName}</p>
                {myParent.user.phoneNumber && (
                  <p className="text-sm text-gray-500">{myParent.user.phoneNumber}</p>
                )}
              </div>
              {myIncomingCall && (
                <div className={getStatusColor(myIncomingCall.status)}>
                  {getStatusIcon(myIncomingCall.status)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Children to Call */}
        {myOutgoingCalls.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Your Responsibility</h2>
            <p className="text-sm text-gray-600 mb-4">
              Call these members on Saturday night (4:00 AM)
            </p>
            <div className="space-y-3">
              {myOutgoingCalls.map((call) => (
                <div key={call.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {call.calleeNode.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{call.calleeNode.user.fullName}</p>
                      {call.calleeNode.user.phoneNumber && (
                        <a
                          href={`tel:${call.calleeNode.user.phoneNumber}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {call.calleeNode.user.phoneNumber}
                        </a>
                      )}
                    </div>
                    <div className={getStatusColor(call.status)}>
                      {getStatusIcon(call.status)}
                    </div>
                  </div>

                  {currentCycle.phase === "ACTIVE" && call.status !== "ANSWERED" && (
                    <div className="flex gap-2">
                      {call.status === "UNCALLED" && (
                        <button
                          onClick={() => updateCallStatus(call.id, "CALLED")}
                          disabled={updating === call.id}
                          className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium"
                        >
                          Mark as Called
                        </button>
                      )}
                      <button
                        onClick={() => updateCallStatus(call.id, "ANSWERED")}
                        disabled={updating === call.id}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                      >
                        Answered
                      </button>
                      <button
                        onClick={() => updateCallStatus(call.id, "NO_ANSWER")}
                        disabled={updating === call.id}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                      >
                        No Answer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Remember:</strong> Every member is both a caller and responder. 
            No one is forgotten in spiritual responsibility.
          </p>
        </div>
      </div>
    </div>
  );
}
