import React, { useState } from "react";
import { X } from "lucide-react";
import NewArtistTab from "./NewArtistTab";
import ExistingArtistTab from "./ExistingArtistTab";

interface ArtistVerificationModalProps {
  onClose?: () => void;
  onSubmit: (data: any, type: "new" | "existing") => Promise<void>;
}

const ArtistVerificationModal: React.FC<ArtistVerificationModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data, activeTab);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
      dir="rtl"
    >
      <div className="bg-gradient-to-br from-[#181818] to-[#0a0a0a] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-[#282828] animate-[slideUp_0.4s_ease-out]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#1DB954] via-[#1ed760] to-[#1DB954] p-4 md:p-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-9 h-9 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    احراز هویت هنرمند
                  </h2>
                  <p className="text-white/90 text-xs md:text-sm mt-1 font-medium">
                    لطفاً اطلاعات هنری خود را تکمیل کنید
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#121212] border-b border-[#282828] px-4 pt-3 md:px-8 md:pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-3 px-4 md:py-4 md:px-6 rounded-t-2xl font-bold text-sm transition-all duration-300 ${
                activeTab === "new"
                  ? "bg-[#181818] text-white shadow-lg border-t-4 border-[#1DB954]"
                  : "bg-[#0a0a0a] text-[#B3B3B3] hover:bg-[#121212] hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span>ثبت‌نام هنرمند جدید</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("existing")}
              className={`flex-1 py-3 px-4 md:py-4 md:px-6 rounded-t-2xl font-bold text-sm transition-all duration-300 ${
                activeTab === "existing"
                  ? "bg-[#181818] text-white shadow-lg border-t-4 border-[#1DB954]"
                  : "bg-[#0a0a0a] text-[#B3B3B3] hover:bg-[#121212] hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>درخواست حساب هنرمند موجود</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-240px)] custom-scrollbar">
          <div className="p-4 md:p-8">
            {activeTab === "new" ? (
              <NewArtistTab
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            ) : (
              <ExistingArtistTab
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1db954;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1ed760;
        }
      `}</style>
    </div>
  );
};

export default ArtistVerificationModal;
