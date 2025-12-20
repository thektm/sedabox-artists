import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import PhoneInput from "./PhoneInput";
import TermsModal from "./TermsModal";

const Register: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { register, isLoading, error } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage("");

    if (!phone.trim()) {
      setLocalError("لطفاً شماره تلفن خود را وارد کنید");
      return;
    }
    if (!password.trim()) {
      setLocalError("لطفاً رمز عبور خود را وارد کنید");
      return;
    }
    if (password.length < 6) {
      setLocalError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }
    if (!isTermsAccepted) {
      setLocalError("لطفاً ابتدا شرایط و ضوابط را بپذیرید");
      return;
    }

    try {
      await register("", phone, password);
      setSuccessMessage("ثبت نام موفق! درحال هدایت به تأیید...");
      setTimeout(() => {
        navigateTo("verify");
      }, 500);
    } catch (err) {
      setLocalError(error || "خطا در ثبت نام");
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
            شروع کنید
          </h1>
          <p className="text-[#B3B3B3] text-sm">
            حساب هنرمند خود را در صدا باکس ایجاد کنید
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                شماره تلفن
              </label>
              <div>
                <PhoneInput
                  value={phone}
                  onChange={(v) => setPhone(v)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#121212] border border-[#282828] rounded-md text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-[#B3B3B3] hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 mt-4">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={isTermsAccepted}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setIsTermsModalOpen(true);
                    } else {
                      setIsTermsAccepted(false);
                    }
                  }}
                  className="w-5 h-5 bg-[#121212] border-[#282828] rounded text-[#1DB954] focus:ring-[#1DB954] focus:ring-offset-[#121212] cursor-pointer"
                />
              </div>
              <label
                htmlFor="terms"
                className="text-sm text-[#B3B3B3] cursor-pointer select-none leading-relaxed"
              >
                من{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-[#1DB954] hover:underline font-semibold"
                >
                  شرایط و ضوابط
                </button>{" "}
                استفاده از صدا باکس را مطالعه کرده و می‌پذیرم.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isTermsAccepted}
              className="w-full mt-6 px-4 py-3 bg-[#1DB954] hover:bg-[#1ED760] disabled:bg-[#282828] disabled:text-[#B3B3B3] disabled:cursor-not-allowed text-black font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  درحال پردازش...
                </>
              ) : (
                "ثبت نام"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[#B3B3B3] text-sm">
            <span>قبلاً ثبت نام کردید؟</span>
            <button
              onClick={() => navigateTo("login")}
              className="text-[#1DB954] hover:text-[#1ED760] font-semibold transition-colors"
            >
              ورود کنید
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#B3B3B3] text-xs mt-8">
          با ثبت نام شما شرایط و قوانین استفاده را می‌پذیرید
        </p>
      </div>

      <TermsModal
        open={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onConfirm={() => {
          setIsTermsAccepted(true);
          setIsTermsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Register;
