import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import { toPersianMessage } from "../lib/faMessages";

const DEFAULT_RESEND_SECONDS = 60;

const Verify: React.FC = () => {
  const { navigateTo, currentParams } = useNavigation();
  const {
    verifyArtistVerificationOtp,
    verifyArtistPasswordResetOtp,
    resetPassword,
    resendArtistVerificationOtp,
    resendArtistPasswordResetOtp,
    isLoading,
    error,
    clearError,
  } = useAuth();
  const { showToast } = useToast();

  const [flow] = useState<"reset" | "registration">(() => {
    if (currentParams?.mode === "reset") return "reset";
    if (currentParams?.mode === "registration") return "registration";
    if (typeof window !== "undefined") {
      const resetPhone = sessionStorage.getItem("sedabox_artist_reset_phone");
      const verificationPhone = sessionStorage.getItem("sedabox_artist_verify_phone");
      if (resetPhone && !verificationPhone) return "reset";
    }
    return "registration";
  });
  const isResetMode = flow === "reset";
  const [phone, setPhone] = useState<string | null>(() => {
    if (currentParams?.phone) return currentParams.phone;
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(
      flow === "reset"
        ? "sedabox_artist_reset_phone"
        : "sedabox_artist_verify_phone",
    );
  });
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(
    Number(currentParams?.resendAfterSeconds) || DEFAULT_RESEND_SECONDS,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordStep, setIsPasswordStep] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);

  const canResend = timeLeft <= 0;

  useEffect(() => {
    clearError();
    let resolvedPhone = currentParams?.phone || null;
    if (!resolvedPhone && typeof window !== "undefined") {
      resolvedPhone = sessionStorage.getItem(
        isResetMode
          ? "sedabox_artist_reset_phone"
          : "sedabox_artist_verify_phone",
      );
    }
    if (resolvedPhone) {
      setPhone(resolvedPhone);
    }

    if (isResetMode && typeof window !== "undefined") {
      const savedToken = sessionStorage.getItem("sedabox_artist_reset_token");
      if (savedToken) {
        setResetToken(savedToken);
        setIsPasswordStep(true);
      }
    }
  }, [currentParams?.phone, isResetMode]);

  useEffect(() => {
    if (timeLeft <= 0 || isPasswordStep) return;
    const timer = window.setTimeout(
      () => setTimeLeft((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [timeLeft, isPasswordStep]);

  useEffect(() => {
    if (isPasswordStep) newPasswordInputRef.current?.focus();
  }, [isPasswordStep]);

  const reportError = (message: string) => {
    const localizedMessage = toPersianMessage(message, "انجام عملیات تأیید ممکن نشد.");
    setLocalError(localizedMessage);
    setSuccessMessage("");
    showToast(localizedMessage, "error");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
  };

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, 4));
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage("");

    if (!phone) {
      reportError("شماره تلفن در دسترس نیست. فرایند را از ابتدا شروع کنید.");
      return;
    }
    if (otp.length !== 4) {
      reportError("کد تأیید چهاررقمی را کامل وارد کنید.");
      return;
    }

    try {
      const result = isResetMode
        ? await verifyArtistPasswordResetOtp(phone, otp)
        : await verifyArtistVerificationOtp(phone, otp);
      if (isResetMode) {
        const token = result?.resetToken;
        if (!token) throw new Error("سرور توکن بازنشانی رمز عبور را برنگرداند.");
        setResetToken(token);
        setSuccessMessage("کد تأیید شد. رمز عبور جدید هنرمند را وارد کنید.");
        showToast("کد با موفقیت تأیید شد.", "success");
        setIsPasswordStep(true);
      } else {
        sessionStorage.removeItem("sedabox_artist_verify_phone");
        setSuccessMessage("تأیید حساب انجام شد؛ در حال انتقال…");
        showToast("حساب با موفقیت تأیید شد.", "success");
        navigateTo("home");
      }
    } catch (err: any) {
      reportError(err?.message || "کد تأیید معتبر نیست.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMessage("");

    if (!phone || !resetToken) {
      reportError("نشست بازنشانی رمز عبور در دسترس نیست. کد جدیدی درخواست کنید.");
      setIsPasswordStep(false);
      setTimeLeft(0);
      return;
    }
    if (!newPassword) {
      reportError("رمز عبور جدید را وارد کنید.");
      return;
    }
    if (newPassword.length < 6) {
      reportError("رمز عبور باید حداقل ۶ کاراکتر داشته باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      reportError("رمزهای عبور واردشده یکسان نیستند.");
      return;
    }

    try {
      await resetPassword(phone, resetToken, newPassword);
      setSuccessMessage("رمز عبور هنرمند با موفقیت تغییر کرد.");
      showToast("رمز عبور هنرمند با موفقیت تغییر کرد.", "success");
      navigateTo("login");
    } catch (err: any) {
      const code = err?.code;
      if (
        code === "ARTIST_RESET_TOKEN_INVALID" ||
        code === "ARTIST_RESET_TOKEN_EXPIRED" ||
        code === "ARTIST_RESET_TOKEN_USED"
      ) {
        sessionStorage.removeItem("sedabox_artist_reset_token");
        setResetToken("");
        setIsPasswordStep(false);
        setOtp("");
        setTimeLeft(0);
      }
      reportError(err?.message || "بازنشانی رمز عبور هنرمند انجام نشد.");
    }
  };

  const handleResend = async () => {
    if (!phone || !canResend || isLoading) return;
    clearError();
    setLocalError(null);
    setSuccessMessage("");

    try {
      const result = isResetMode
        ? await resendArtistPasswordResetOtp(phone)
        : await resendArtistVerificationOtp(phone);
      setOtp("");
      setResetToken("");
      setIsPasswordStep(false);
      setTimeLeft(result.resendAfterSeconds ?? DEFAULT_RESEND_SECONDS);
      setSuccessMessage("کد تأیید جدید ارسال شد.");
      showToast("کد تأیید جدید ارسال شد.", "success");
    } catch (err: any) {
      if (err?.retryAfterSeconds) {
        setTimeLeft(err.retryAfterSeconds);
      }
      reportError(err?.message || "ارسال دوباره کد تأیید انجام نشد.");
    }
  };

  const handleBackToLogin = () => {
    clearError();
    if (isResetMode) {
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
    } else {
      sessionStorage.removeItem("sedabox_artist_verify_phone");
    }
    navigateTo("login");
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
            {isPasswordStep ? "تغییر رمز عبور" : "تأیید شماره"}
          </h1>
          <p className="text-[#B3B3B3] text-sm">
            {isPasswordStep
              ? "رمز عبور جدید خود را وارد کنید"
              : "کد 4 رقمی ارسال شده را وارد کنید"}
          </p>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-lg p-6 sm:p-8 shadow-2xl">
          {(localError || error) && (
            <div
              className="mb-6 p-4 bg-[#450A0A] border border-[#B91C1C] rounded-md flex items-center gap-3"
              dir="ltr"
            >
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
              <p className="text-[#EF4444] text-sm text-left">
                {localError || error}
              </p>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-6 p-4 bg-[#0F5132] border border-[#198754] rounded-md flex items-center gap-3"
              dir="ltr"
            >
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
              <p className="text-[#22C55E] text-sm text-left">
                {successMessage}
              </p>
            </div>
          )}

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
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, "");
                        const next = otp.padEnd(4, " ").split("");
                        next[index] = digit;
                        handleOtpChange(next.join("").replace(/ /g, ""));
                        if (digit && index < 3) {
                          (e.currentTarget.nextElementSibling as HTMLInputElement | null)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                          (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData("text");
                        if (/\d{4}/.test(pasted.replace(/\D/g, ""))) {
                          e.preventDefault();
                          handleOtpChange(pasted);
                        }
                      }}
                      className="w-12 h-14 bg-[#121212] border border-[#282828] rounded-md text-white text-2xl text-center font-bold focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                      disabled={isLoading}
                      aria-label={`Verification code digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

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
                    <span className="text-[#1DB954] font-semibold" dir="ltr">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || isLoading || !phone}
                  className={`text-sm font-medium transition-colors ${
                    canResend && phone
                      ? "text-[#1DB954] hover:text-[#1ED760]"
                      : "text-[#B3B3B3] cursor-not-allowed"
                  }`}
                >
                  {canResend ? "دوباره ارسال کد" : "منتظر ماندن برای ارسال مجدد"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 4 || !phone}
                className="w-full mt-6 px-4 py-3 bg-[#1DB954] hover:bg-[#1ED760] disabled:bg-[#282828] disabled:text-[#B3B3B3] text-black font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "تأیید"
                )}
              </button>
            </form>
          )}

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
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-[#121212] border border-[#282828] rounded-md text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    className="absolute left-3 top-3.5 text-[#B3B3B3] hover:text-white transition-colors"
                    disabled={isLoading}
                    aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-[#121212] border border-[#282828] rounded-md text-white placeholder-[#B3B3B3] focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((shown) => !shown)}
                    className="absolute left-3 top-3.5 text-[#B3B3B3] hover:text-white transition-colors"
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 px-4 py-3 bg-[#1DB954] hover:bg-[#1ED760] disabled:bg-[#282828] disabled:text-[#B3B3B3] text-black font-bold rounded-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "تغییر رمز عبور"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-[#B3B3B3] hover:text-white text-sm transition-colors"
            >
              برگشت به ورود
            </button>
          </div>
        </div>

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
