import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import PhoneInput from "./PhoneInput";
import { toPersianMessage } from "../lib/faMessages";

const ForgotPassword: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { sendOtp, isLoading, error, clearError } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!phone.trim()) {
      const message = "شماره تلفن خود را وارد کنید.";
      setLocalError(message);
      showToast(message, "error");
      return;
    }

    try {
      const result = await sendOtp(phone);
      showToast("کد تأیید ارسال شد.", "success");
      navigateTo("verify", {
        mode: "reset",
        phone,
        resendAfterSeconds: result.resendAfterSeconds ?? 60,
      });
    } catch (err: any) {
      const message = toPersianMessage(err?.message, "ارسال کد تأیید انجام نشد.");
      setLocalError(message);
      showToast(message, "error");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#121212] flex items-center justify-center p-4 rtl"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#181818] to-[#121212]"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="صداباکس" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            بازیابی رمز عبور
          </h1>
          <p className="text-[#B3B3B3] text-sm">
            شماره تلفن خود را وارد کنید تا کد تأیید برای شما ارسال شود
          </p>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-lg p-8 shadow-2xl">
          {(localError || error) && (
            <div className="mb-6 p-4 bg-[#450A0A] border border-[#B91C1C] rounded-md flex items-center gap-3" dir="rtl">
              <svg
                className="w-5 h-5 text-[#EF4444] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[#EF4444] text-sm text-right">
                {localError || error}
              </p>
            </div>
          )}

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                شماره تلفن
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                disabled={isLoading}
                className="w-full bg-[#282828] border border-[#3E3E3E] rounded-md px-4 py-3 text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-4 rounded-full transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "ارسال کد تأیید"
              )}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigateTo("login")}
                className="text-[#B3B3B3] hover:text-white text-sm font-medium transition-colors"
              >
                بازگشت به ورود
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
