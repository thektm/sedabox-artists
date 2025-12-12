import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import PhoneInput from "./PhoneInput";

const ForgotPassword: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { sendOtp, isLoading, error } = useAuth();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage("");

    if (!phone.trim()) {
      setLocalError("لطفاً شماره تلفن خود را وارد کنید");
      return;
    }

    try {
      await sendOtp(phone);
      setSuccessMessage("کد تأیید ارسال شد");
      // Navigate to Verify page with reset mode
      setTimeout(() => {
        navigateTo("verify", { mode: "reset", phone: phone });
      }, 500);
    } catch (err) {
      setLocalError(error || "خطا در ارسال کد");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#121212] flex items-center justify-center p-4 rtl"
      dir="rtl"
    >
      {/* Spotify-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#181818] to-[#121212]"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="SedaBox" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            بازیابی رمز عبور
          </h1>
          <p className="text-[#B3B3B3] text-sm">
            شماره تلفن خود را وارد کنید تا کد تأیید برای شما ارسال شود
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#181818] border border-[#282828] rounded-lg p-8 shadow-2xl">
          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-6 p-4 bg-[#450A0A] border border-[#B91C1C] rounded-md flex items-center gap-3">
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
              <p className="text-[#EF4444] text-sm">{localError || error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-[#0F5132] border border-[#198754] rounded-md flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[#22C55E] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-[#22C55E] text-sm">{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                شماره تلفن
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="09123456789"
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
