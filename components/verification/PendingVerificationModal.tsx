import React from "react";
import { Clock, CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface PendingVerificationModalProps {
  verificationType: "new" | "existing";
  artistName?: string;
}

const PendingVerificationModal: React.FC<PendingVerificationModalProps> = ({
  verificationType,
  artistName,
}) => {
  const { devAcceptVerification } = useAuth();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-md"
      dir="rtl"
    >
      <div className="bg-gradient-to-br from-[#181818] to-[#0a0a0a] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#282828] animate-[slideUp_0.4s_ease-out]">
        {/* Animated Background Pattern */}
        <div className="relative bg-gradient-to-r from-[#1DB954] via-[#1ed760] to-[#1DB954] p-4 md:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              درخواست شما با موفقیت ثبت شد!
            </h2>
            <p className="text-white/90 text-sm md:text-base font-medium">
              {verificationType === "new"
                ? "اطلاعات هنری شما در حال بررسی است"
                : `درخواست احراز مالکیت برای "${artistName}" دریافت شد`}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-8 space-y-3 md:space-y-6">
          {/* Status Timeline */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 md:gap-4 p-3 md:p-5 bg-[#121212] rounded-2xl border border-[#282828]">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">
                  در انتظار بررسی تیم پشتیبانی
                </h3>
                <p className="text-[#B3B3B3] text-sm leading-relaxed">
                  اطلاعات ارسالی شما توسط تیم تخصصی ما در حال بررسی و اعتبارسنجی
                  است. این فرآیند معمولاً بین{" "}
                  <span className="text-white font-semibold">
                    ۲۴ تا ۷۲ ساعت
                  </span>{" "}
                  زمان می‌برد.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-br from-[#1DB954]/20 via-[#1ed760]/10 to-[#1DB954]/20 border border-[#1DB954]/40 rounded-2xl p-3 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg mb-2">نکات مهم</h4>
                <ul className="text-[#B3B3B3] text-sm space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#1DB954] mt-1">•</span>
                    <span>
                      در صورت نیاز به اطلاعات تکمیلی، تیم پشتیبانی با شما تماس
                      خواهد گرفت
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center pt-2 md:pt-4">
            <p className="text-white text-lg font-semibold mb-2">
              از صبر و شکیبایی شما سپاسگزاریم
            </p>
            <p className="text-[#B3B3B3] text-sm">
              ما متعهدیم که بهترین تجربه را برای هنرمندان عزیز و شنوندگان عزیز
              فراهم کنیم
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6 border-t border-[#282828] gap-3 sm:gap-0">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                // Handle recheck logic here
                console.log("Recheck verification");
              }}
              className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#282828] hover:bg-[#404040] text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
            >
              بررسی مجدد
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                // Handle logout logic here
                console.log("Logout");
              }}
              className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </div>

      {/* Dev Floating Button */}
      <button
        onClick={devAcceptVerification}
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg transition-colors z-60"
      >
        DEV : ACCEPTED BY ADMIN
      </button>

      <style jsx>{`
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
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes checkmark {
          0% {
            transform: scale(0) rotate(45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(45deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PendingVerificationModal;
