"use client";

import { useState } from "react";
import { Clock, CheckCircle, RefreshCw } from "lucide-react";

export default function PendingAccessScreen() {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<"approved" | "still_pending" | "rejected" | null>(null);

    const checkStatus = async () => {
        const initData = window.Telegram?.WebApp?.initData || "";
        if (!initData) return;

        setChecking(true);
        try {
            const response = await fetch("/api/tree/dashboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData }),
            });
            const data = await response.json();

            if (data.notRegistered && data.pending) {
                setResult("still_pending");
            } else if (data.error === "Your request was rejected") {
                setResult("rejected");
            } else if (data.user || data.profileIncomplete) {
                // Approved (user record now exists)
                window.location.reload();
                return;
            } else {
                setResult("still_pending");
            }
        } catch {
            setResult("still_pending");
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                    <Clock className="w-10 h-10 text-orange-600 animate-pulse" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Access Request Pending
                </h1>

                <p className="text-gray-600 mb-6">
                    Your request to join Kidase Call has been submitted and is waiting for approval from the Super Admin.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                                What happens next?
                            </p>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Super Admin will review your request</li>
                                <li>• Once approved, complete your profile to activate</li>
                                <li>• You'll receive access to all features</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {result === "still_pending" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-800">
                            ⏳ Still waiting for approval. Please check back later.
                        </p>
                    </div>
                )}

                {result === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                            ❌ Your request was rejected. Please contact the administrator.
                        </p>
                    </div>
                )}

                <button
                    onClick={checkStatus}
                    disabled={checking}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-md"
                >
                    <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                    {checking ? "Checking..." : "Check Approval Status"}
                </button>
            </div>
        </div>
    );
}
