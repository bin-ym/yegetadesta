"use client";

import { useState, useEffect, useRef } from "react";
import { Network, RefreshCw, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import LoadingScreen from "../LoadingScreen";
import SendTreeImageModal from "./SendTreeImageModal";
import { toPng } from "html-to-image";

export default function TreeManagement({ initData }: { initData?: string }) {
  const [treeData, setTreeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      const res = await fetch("/api/tree", {
        headers: initData ? { "x-telegram-init-data": initData } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (
      !confirm(
        "Are you sure you want to generate a new random tree cycle? This will randomly allocate active users into new node positions.",
      )
    )
      return;
    setGenerating(true);
    try {
      const res = await fetch("/api/tree/generate", {
        method: "POST",
        headers: initData ? { "x-telegram-init-data": initData } : {},
      });
      if (res.ok) {
        fetchTree(); // Refresh after generation
      } else {
        const errorData = await res.json();
        alert(`Failed to generate tree: ${errorData.error}`);
      }
    } catch (err) {
      alert("Error connecting to generate tree.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenSendModal = async () => {
    if (!treeContainerRef.current || !treeData?.nodes?.length) {
      alert("No tree diagram available to capture.");
      return;
    }

    setCapturing(true);
    setShowSendModal(true);
    setGeneratedImageUrl(null);

    try {
      const node = treeContainerRef.current;
      const scrollWidth = node.scrollWidth || node.offsetWidth;
      const scrollHeight = node.scrollHeight || node.offsetHeight;

      const dataUrl = await toPng(node, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2,
        cacheBust: true,
        width: Math.max(scrollWidth, 1000),
        height: Math.max(scrollHeight, 600),
        style: {
          overflow: "visible",
          maxWidth: "none",
          width: `${Math.max(scrollWidth, 1000)}px`,
          height: `${Math.max(scrollHeight, 600)}px`,
        },
      });

      setGeneratedImageUrl(dataUrl);
    } catch (err) {
      console.error("Failed to capture tree diagram image:", err);
      alert("Failed to render tree image. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const labelToIndex = (label: string): number => {
    if (label.length === 1) return label.charCodeAt(0) - 65;
    const first = (label.charCodeAt(0) - 65 + 1) * 26;
    const second = label.charCodeAt(1) - 65;
    return first + second;
  };

  if (loading) return <LoadingScreen />;

  // Group nodes by level to display hierarchy nicely (only active users)
  const levels: Record<number, any[]> = {};
  if (treeData?.nodes) {
    treeData.nodes
      .filter((node: any) => node.user && node.user.status === "ACTIVE" && node.user.active !== false)
      .forEach((node: any) => {
        if (!levels[node.level]) levels[node.level] = [];
        levels[node.level].push(node);
      });
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Network className="w-6 h-6 text-green-700" />
            የጥሪ መረብ (Call Tree Diagram)
          </h2>
          <p className="text-gray-500 text-sm">የአባላት የጥሪ ቅደም ተከተል ዝርዝር</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {treeData?.nodes?.length > 0 && (
            <button
              onClick={handleOpenSendModal}
              disabled={capturing || generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md active:scale-95 disabled:opacity-50 font-medium text-sm"
            >
              {capturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Image to Telegram (ላክ)
                </>
              )}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || capturing}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#166534] text-white rounded-lg hover:bg-green-900 transition-all shadow-lg disabled:opacity-50 font-medium active:scale-95 text-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            Generate Random Tree
          </button>
        </div>
      </div>

      <div
        ref={treeContainerRef}
        className="bg-[#0a0a0a] min-h-[600px] overflow-auto p-12 custom-scrollbar"
      >
        {!treeData?.nodes?.length ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
            <Network className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">ምንም የጥሪ መረብ አልተገኘም</p>
            <p className="text-sm opacity-60 mt-2">
              Generate የሚለውን ቁልፍ በመጫን ይጀምሩ
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center min-w-max gap-12 relative pb-20">
            {Object.keys(levels).map((levelStr) => {
              const level = parseInt(levelStr);
              const nodes = levels[level];

              // Special handling for Level 2+ to ensure 4-chain alignment
              const displayNodes =
                level >= 2
                  ? Array(4)
                      .fill(null)
                      .map((_, idx) => {
                        return (
                          nodes.find((n) => {
                            const i = labelToIndex(n.position);
                            return (i - 3) % 4 === idx;
                          }) || null
                        );
                      })
                  : nodes;

              return (
                <div key={level} className="flex justify-center gap-8">
                  {displayNodes.map((node, i) => {
                    const nodeIndex = node ? labelToIndex(node.position) : -1;
                    return (
                      <div
                        key={node?.id || `empty-${level}-${i}`}
                        className="flex flex-col items-center relative z-10 w-52"
                      >
                        {node ? (
                          <>
                            {/* Parent Connector (from above) */}
                            {level > 0 && (
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-yellow-400">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-yellow-500" />
                              </div>
                            )}

                            <div className="bg-white border-[2.5px] border-[#166534] rounded-sm py-3 px-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)] w-full text-center transform transition duration-300 hover:scale-105 hover:shadow-green-900/20">
                              <div className="font-bold text-[17px] text-gray-900 mb-1 leading-tight tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                                {node.user?.fullName || "ያልተመደበ"}
                              </div>
                              <div className="text-[13px] text-gray-600 font-medium mb-1">
                                ({node.user?.baptismName || "ስም የለም"})
                              </div>
                              <div className="text-[14px] text-gray-800 font-semibold font-mono">
                                {node.user?.phoneNumber || "-"}
                              </div>
                            </div>

                            {/* Child Connector Lines (to below) */}
                            {level < Object.keys(levels).length - 1 && (
                              <div className="flex flex-col items-center">
                                <div className="w-px h-12 bg-yellow-400 mt-0" />
                              </div>
                            )}

                            {/* Horizontal Branches for Level 0 and 1 */}
                            {(level === 0 || level === 1) && (
                              <div className="absolute top-[136px] left-1/2 -translate-x-1/2 w-[calc(100%+32px)] h-px bg-yellow-400 z-0" />
                            )}
                          </>
                        ) : (
                          <div className="w-52 h-20" /> // Spacer for empty slots in chains
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Tree Image Modal */}
      <SendTreeImageModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        imageUrl={generatedImageUrl}
        initData={initData}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}
