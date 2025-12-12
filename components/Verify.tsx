import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { Eye, EyeOff } from "lucide-react";

const Verify: React.FC = () => {
  const { navigateTo, currentParams } = useNavigation();
  const { verifyOtp, resetPassword, isLoading, error } = useAuth();
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Password reset state
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPasswordInputRef = useRef<HTMLInputElement>(null);

  const isResetMode = currentParams?.mode === "reset";
  const phone = currentParams?.phone;

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Auto-focus password input when switching steps
  useEffect(() => {
    if (isPasswordStep && newPasswordInputRef.current) {
      newPasswordInputRef.current.focus();
    }
  }, [isPasswordStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and max 4 characters
    const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
    setOtp(digitsOnly);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage("");

    if (otp.length !== 4) {
      setLocalError("کد تأیید باید 4 رقم باشد");
      return;
    }

    try {
      await verifyOtp(otp);

      if (isResetMode) {
        setSuccessMessage(
          "کد تأیید صحیح است. لطفاً رمز عبور جدید را وارد کنید."
        );
        setIsPasswordStep(true);
      } else {
        setSuccessMessage("تأیید موفق! درحال هدایت...");
        setTimeout(() => {
          navigateTo("home");
        }, 500);
      }
    } catch (err) {
      setLocalError(error || "کد تأیید نادرست است");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage("");

    if (!newPassword.trim()) {
      setLocalError("لطفاً رمز عبور جدید را وارد کنید");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("رمز عبور و تأیید آن مطابقت ندارد");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    try {
      if (phone) {
        await resetPassword(phone, otp, newPassword);
        setSuccessMessage(
          "رمز عبور با موفقیت تغییر کرد. درحال هدایت به صفحه ورود..."
        );
        setTimeout(() => {
          navigateTo("login");
        }, 1500);
      } else {
        setLocalError("شماره تلفن یافت نشد. لطفاً دوباره تلاش کنید.");
      }
    } catch (err) {
      setLocalError(error || "خطا در تغییر رمز عبور");
    }
  };

  const handleResend = () => {
    setTimeLeft(300);
    setCanResend(false);
    setLocalError(null);
    setOtp("");
    setSuccessMessage("کد جدید ارسال شد");
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
            {isPasswordStep ? "تغییر رمز عبور" : "تأیید شماره"}
          </h1>
          <p className="text-[#B3B3B3] text-sm">
            {isPasswordStep
              ? "رمز عبور جدید خود را وارد کنید"
              : "کد 4 رقمی ارسال شده را وارد کنید"}
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

          {/* OTP Form */}
          {!isPasswordStep && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-4 text-center">
                  کد تأیید
                </label>
                <div dir="ltr" className="flex gap-2 justify-center mb-4">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const newOtp = otp.split("");
                        newOtp[index] = e.target.value.replace(/\D/g, "");
                        handleOtpChange(newOtp.join(""));

                        // Auto-focus next input
                        if (
                          e.target.value &&
                          index < 3 &&
                          e.currentTarget.nextElementSibling
                        ) {
                          (
                            e.currentTarget
                              .nextElementSibling as HTMLInputElement
                          ).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otp[index] &&
                          index > 0 &&
                          e.currentTarget.previousElementSibling
                        ) {
                          (
                            e.currentTarget
                              .previousElementSibling as HTMLInputElement
                          ).focus();
                        }
                      }}
                      className="w-12 h-14 bg-[#121212] border border-[#282828] rounded-md text-white text-2xl text-center font-bold focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* Full OTP Input for paste support */}
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  placeholder="یا کد را اینجا بچسبانید"
                  className="w-full px-4 py-3 bg-[#121212] border border-[#282828] rounded-md text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200 text-center tracking-widest"
                  disabled={isLoading}
                  inputMode="numeric"
                />
              </div>

              {/* Timer and Resend */}
              <div className="flex flex-col items-center gap-3">
                {!canResend && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#1DB954]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-[#1DB954] font-semibold">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isLoading}
                  className={`text-sm font-medium transition-colors ${
                    canResend
                      ? "text-[#1DB954] hover:text-[#1ED760]"
                      : "text-[#B3B3B3] cursor-not-allowed"
                  }`}
                >
                  {canResend
                    ? "دوباره ارسال کد"
                    : "منتظر ماندن برای ارسال مجدد"}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || otp.length !== 4}
                className="w-full mt-6 px-4 py-3 bg-[#1DB954] hover:bg-[#1ED760] disabled:bg-[#282828] disabled:text-[#B3B3B3] text-black font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
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
                    درحال تأیید...
                  </>
                ) : (
                  "تأیید"
                )}
              </button>
            </form>
          )}

          {/* Password Form */}
          {isPasswordStep && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    ref={newPasswordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  تأیید رمز عبور
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-[#121212] border border-[#282828] rounded-md text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-3.5 text-[#B3B3B3] hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 px-4 py-3 bg-[#1DB954] hover:bg-[#1ED760] disabled:bg-[#282828] disabled:text-[#B3B3B3] text-black font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
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
                    درحال ذخیره...
                  </>
                ) : (
                  "تغییر رمز عبور"
                )}
              </button>
            </form>
          )}

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigateTo("login")}
              className="text-[#B3B3B3] hover:text-white text-sm transition-colors"
            >
              برگشت به ورود
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#B3B3B3] text-xs mt-8">
          {isPasswordStep
            ? "اگر مشکلی دارید با پشتیبانی تماس بگیرید"
            : "کد تأیید در پیامک برای شما ارسال شده است"}
        </p>
      </div>
    </div>
  );
};

export default Verify;
