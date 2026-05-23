"use client";

import { Clock, CheckCircle } from "lucide-react";

export default function PendingAccessScreen() {
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
                                <li>• Once approved, you'll be added to the next pool</li>
                                <li>• You'll receive access to all features</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                        Please check back later or contact the administrator if you have any questions.
                    </p>
                </div>
            </div>
        </div>
    );
}
