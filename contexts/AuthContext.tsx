import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  API_BASE_URL,
  ApiError,
  apiRequest,
  artistSession,
  artistSessionEventName,
  refreshArtistSession,
  logoutArtistSession,
} from "../lib/api";
import { getPersianPayloadMessage, toPersianMessage } from "../lib/faMessages";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  artistName?: string;
  artistProfileImage?: string;
  verificationStatus?: VerificationStatus;
  verificationType?: "new" | "existing";
  verificationData?: any;
}

interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OtpDispatchResult {
  status: string;
  resendAfterSeconds?: number;
  expiresInSeconds?: number;
}

export interface ArtistResetVerificationResult {
  status: string;
  resetToken: string;
  expiresInSeconds?: number;
}

class ApiRequestError extends Error {
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  verificationStatus: VerificationStatus;
  showVerificationModal: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<unknown>;
  sendOtp: (phone: string) => Promise<OtpDispatchResult>;
  resendArtistVerificationOtp: (phone: string) => Promise<OtpDispatchResult>;
  resendArtistPasswordResetOtp: (phone: string) => Promise<OtpDispatchResult>;
  verifyArtistVerificationOtp: (phone: string, otp: string) => Promise<any>;
  verifyArtistPasswordResetOtp: (
    phone: string,
    otp: string,
  ) => Promise<ArtistResetVerificationResult>;
  resetPassword: (
    phone: string,
    resetToken: string,
    newPassword: string,
  ) => Promise<unknown>;
  submitVerification: (data: any, type: "new" | "existing") => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setCurrentPhone: (phone: string | null) => void;
  recheckVerification: () => Promise<VerificationStatus>;
  devAcceptVerification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = API_BASE_URL;

const parseApiError = (data: unknown, statusCode: number): ApiRequestError => {
  const record = data && typeof data === "object" ? data as Record<string, any> : {};
  const error = record.error && typeof record.error === "object" ? record.error : {};
  const code =
    typeof error.code === "string"
      ? error.code
      : typeof record.code === "string"
        ? record.code
        : undefined;
  const retryAfter = Number(error.retry_after_seconds ?? record.retry_after_seconds ?? 0);
  const fallback = statusCode >= 500
    ? "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید."
    : "انجام درخواست ممکن نشد. لطفاً دوباره تلاش کنید.";
  return new ApiRequestError(
    getPersianPayloadMessage(data, fallback),
    code,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  );
};

const normalizeAuthCaughtError = (
  error: unknown,
  fallback: string,
): ApiRequestError => {
  if (error instanceof ApiRequestError) {
    return new ApiRequestError(
      toPersianMessage(error.message, fallback, error.code),
      error.code,
      error.retryAfterSeconds,
    );
  }

  const sourceMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return new ApiRequestError(toPersianMessage(sourceMessage, fallback));
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("هوک احراز هویت باید داخل فراهم‌کننده احراز هویت استفاده شود.");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const parseAuthResponseBody = async (response: Response): Promise<unknown> => {
    const raw = await response.text().catch(() => "");
    if (!raw.trim()) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return raw.trim();
    }
  };

  // درخواست‌های عمومی احراز هویت با قرارداد خطای پایدار و پیام فارسی.
  const apiCall = async (
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
    params?: Record<string, string>,
  ) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value),
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "fa",
    };

    // These are public authentication endpoints. Never attach a stored access
    // token: an expired token can make DRF reject an AllowAny request with 401.

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiRequestError(
        "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
        "NETWORK_ERROR",
      );
    }

    const data = await parseAuthResponseBody(response);
    if (!response.ok) throw parseApiError(data, response.status);
    return data;
  };

  // Fetch existing artist auth submission through the shared authenticated client.
  const fetchArtistAuth = async () => {
    try {
      return await apiRequest<any>("/artist/auth/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  };

  // Hydrate the persisted session immediately. Network/server failures never log the artist out.
  useEffect(() => {
    let disposed = false;

    const applyStoredSession = () => {
      const storedUser = artistSession.user<User>();
      const hasCredentials = Boolean(artistSession.access() || artistSession.refresh());
      if (!storedUser || !hasCredentials) {
        setUser(null);
        setIsLoggedIn(false);
        setVerificationStatus("none");
        setShowVerificationModal(false);
        return null;
      }
      setUser(storedUser);
      setIsLoggedIn(true);
      setVerificationStatus(storedUser.verificationStatus || "none");
      return storedUser;
    };

    const checkAuth = async () => {
      setIsInitializing(true);
      let storedUser = applyStoredSession();
      if (!storedUser && artistSession.refresh()) {
        const recovery = await refreshArtistSession();
        if (recovery === "refreshed") storedUser = applyStoredSession();
        else if (recovery === "expired") artistSession.clear();
      }
      if (!storedUser) {
        if (!disposed) setIsInitializing(false);
        return;
      }

      try {
        if (!artistSession.access() && artistSession.refresh()) {
          const result = await refreshArtistSession();
          if (result === "expired") {
            artistSession.clear();
            applyStoredSession();
            return;
          }
          if (result === "temporary_failure") return;
        }

        const auth = await fetchArtistAuth();
        if (disposed || !artistSession.user<User>()) return;
        const currentUser = artistSession.user<User>() || storedUser;
        if (auth) {
          const updatedUser: User = {
            ...currentUser,
            verificationStatus: auth.is_verified ? "approved" : "pending",
            verificationData: auth,
          };
          artistSession.updateUser(updatedUser);
          setUser(updatedUser);
          setVerificationStatus(updatedUser.verificationStatus || "none");
        } else {
          const clearedUser = { ...currentUser } as User;
          delete (clearedUser as any).verificationData;
          clearedUser.verificationStatus = "none";
          artistSession.updateUser(clearedUser);
          setUser(clearedUser);
          setVerificationStatus("none");
        }
      } catch {
        // Keep the persisted session intact on network errors, server errors and non-terminal request failures.
        if (!disposed) applyStoredSession();
      } finally {
        if (!disposed) setIsInitializing(false);
      }
    };

    const syncSession = () => {
      if (!disposed) applyStoredSession();
    };
    window.addEventListener(artistSessionEventName, syncSession);
    window.addEventListener("storage", syncSession);
    void checkAuth();

    return () => {
      disposed = true;
      window.removeEventListener(artistSessionEventName, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  // Show verification modal for first-time logged in users
  useEffect(() => {
    if (isLoggedIn && verificationStatus === "none" && !isInitializing) {
      setShowVerificationModal(true);
    }
  }, [isLoggedIn, verificationStatus, isInitializing]);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = (await apiCall(
        "/auth/login/password/",
        "POST",
        {
          phone,
          password,
        },
        { artist: "true" },
      )) as AuthSessionResponse;

      const { accessToken, refreshToken, user: userData } = data;

      artistSession.save(accessToken, refreshToken, userData);

      // Set basic user state first
      setUser(userData);
      setIsLoggedIn(true);

      // Immediately check for any existing artist auth on the server
      try {
        const auth = await fetchArtistAuth();
        if (auth) {
          // There's an existing submission on server — update user and verification status
          const updatedUser = {
            ...userData,
            verificationStatus: auth.is_verified ? "approved" : "pending",
            verificationData: auth,
          } as User;
          artistSession.updateUser(updatedUser);
          setUser(updatedUser);
          setVerificationStatus(updatedUser.verificationStatus || "none");
          // If there's an auth (pending or approved), do not show the initial artist verify modal
          setShowVerificationModal(false);
        } else {
          // No submission found — ensure modal to prompt artist verification is shown
          const clearedUser = { ...userData } as User;
          delete (clearedUser as any).verificationData;
          clearedUser.verificationStatus = "none";
          artistSession.updateUser(clearedUser);
          setUser(clearedUser);
          setVerificationStatus("none");
          setShowVerificationModal(true);
        }
      } catch (err) {
        // If fetchArtistAuth fails, fall back to userData's reported status
        console.error("login: fetchArtistAuth failed:", err);
        setVerificationStatus(userData.verificationStatus || "none");
      }
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerification = async (data: any, type: "new" | "existing") => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append(
        "auth_type",
        type === "new" ? "fresh_artist" : "existing_artist",
      );

      if (type === "existing" && data.selectedArtist) {
        formData.append("artist_claimed", data.selectedArtist.id);
      }

      // Map UI fields to API fields
      formData.append("first_name", data.firstName);
      if (data.firstNameEn) formData.append("first_name_en", data.firstNameEn);
      formData.append("last_name", data.lastName);
      if (data.lastNameEn) formData.append("last_name_en", data.lastNameEn);
      formData.append(
        "stage_name",
        type === "new"
          ? data.artisticName
          : data.selectedArtist?.artistic_name ||
              data.selectedArtist?.name ||
              "",
      );
      const stageNameEn =
        type === "new"
          ? data.artisticNameEn
          : data.selectedArtist?.artistic_name_en || data.selectedArtist?.name_en || "";
      if (stageNameEn) formData.append("stage_name_en", stageNameEn);

      formData.append("birth_date", data.birthDate);
      formData.append("national_id", data.nationalId);
      formData.append("phone_number", data.phoneNumber);
      formData.append("city", data.city);

      if (data.email) formData.append("email", data.email);
      if (data.address) formData.append("address", data.address);
      if (data.bio || data.additionalInfo) {
        formData.append("biography", data.bio || data.additionalInfo);
      }
      if (data.bioEn) formData.append("biography_en", data.bioEn);
      if (data.profileFile) formData.append("profile_image", data.profileFile);

      if (data.idCardFile) {
        formData.append("national_id_image", data.idCardFile);
      }

      const submissionExists = (error: unknown) => {
        if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 409)) return false;
        const details = error.details as any;
        return details?.error?.code === "SUBMISSION_EXISTS"
          || details?.code === "SUBMISSION_EXISTS"
          || String(details?.error || "").includes("exists")
          || String(details?.message || "").includes("exists")
          || String(details?.non_field_errors || "").includes("Submission already exists");
      };

      try {
        await apiRequest("/artist/auth/", { method: "POST", body: formData });
      } catch (requestError) {
        if (!submissionExists(requestError)) throw requestError;
        await apiRequest("/artist/auth/", { method: "PATCH", body: formData });
      }

      const updatedUser: User = {
        ...user!,
        verificationStatus: "pending",
        verificationType: type,
        verificationData: data,
      };

      // Update localStorage
      artistSession.updateUser(updatedUser);

      setUser(updatedUser);
      setVerificationStatus("pending");
      setShowVerificationModal(false);
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "ارسال درخواست انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/register/",
        "POST",
        {
          phone,
          password,
        },
        { artist: "true" },
      );

      // Move to OTP verification and keep the phone across a page refresh.
      setCurrentPhone(phone);
      setOtpVerified(false);
      sessionStorage.setItem("sedabox_artist_verify_phone", phone);
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string): Promise<OtpDispatchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/password/forgot/",
        "POST",
        { phone },
      );
      setCurrentPhone(phone);
      setOtpVerified(false);
      sessionStorage.setItem("sedabox_artist_reset_phone", phone);
      sessionStorage.removeItem("sedabox_artist_verify_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data as OtpDispatchResult;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const resendArtistVerificationOtp = async (
    phone: string,
  ): Promise<OtpDispatchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/verify/resend/",
        "POST",
        { phone },
      );
      setCurrentPhone(phone);
      sessionStorage.setItem("sedabox_artist_verify_phone", phone);
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data as OtpDispatchResult;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "ارسال دوباره کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const resendArtistPasswordResetOtp = async (
    phone: string,
  ): Promise<OtpDispatchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/password/forgot/",
        "POST",
        { phone },
      );
      setCurrentPhone(phone);
      sessionStorage.setItem("sedabox_artist_reset_phone", phone);
      sessionStorage.removeItem("sedabox_artist_verify_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data as OtpDispatchResult;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "ارسال دوباره کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyArtistPasswordResetOtp = async (
    phone: string,
    otp: string,
  ): Promise<ArtistResetVerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = (await apiCall(
        "/auth/artist/password/verify/",
        "POST",
        { phone, otp },
      )) as ArtistResetVerificationResult;
      setCurrentPhone(phone);
      setOtpVerified(true);
      sessionStorage.setItem("sedabox_artist_reset_phone", phone);
      sessionStorage.setItem("sedabox_artist_reset_token", data.resetToken);
      sessionStorage.removeItem("sedabox_artist_verify_phone");
      return data;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "کد بازیابی رمز عبور معتبر نیست.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyArtistVerificationOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = (await apiCall(
        "/auth/verify/",
        "POST",
        { phone, otp },
        { artist: "true" },
      )) as AuthSessionResponse;
      const { accessToken, refreshToken, user: userData } = data;
      artistSession.save(accessToken, refreshToken, userData);
      setCurrentPhone(phone);
      setUser(userData);
      setIsLoggedIn(true);
      setVerificationStatus(userData.verificationStatus || "none");
      setOtpVerified(true);
      sessionStorage.removeItem("sedabox_artist_verify_phone");
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "کد تأیید حساب معتبر نیست.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    phone: string,
    resetToken: string,
    newPassword: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/password/reset/",
        "POST",
        { phone, resetToken, newPassword },
      );
      setOtpVerified(false);
      setCurrentPhone(null);
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data;
    } catch (err: unknown) {
      const normalized = normalizeAuthCaughtError(
        err,
        "تغییر رمز عبور هنرمند انجام نشد.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutArtistSession();
    sessionStorage.removeItem("sedabox_artist_verify_phone");
    sessionStorage.removeItem("sedabox_artist_reset_phone");
    sessionStorage.removeItem("sedabox_artist_reset_token");
    setUser(null);
    setIsLoggedIn(false);
    setOtpVerified(false);
    setCurrentPhone(null);
    setVerificationStatus("none");
    setShowVerificationModal(false);
  };

  const clearError = () => {
    setError(null);
  };

  const devAcceptVerification = () => {
    if (user) {
      const updatedUser: User = {
        ...user,
        verificationStatus: "approved",
      };
      artistSession.updateUser(updatedUser);
      setUser(updatedUser);
      setVerificationStatus("approved");
    }
  };

  const recheckVerification = async (): Promise<VerificationStatus> => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = await fetchArtistAuth();
      if (auth) {
        const status: VerificationStatus = auth.is_verified
          ? "approved"
          : "pending";
        if (user) {
          const updatedUser: User = {
            ...user,
            verificationStatus: status,
            verificationData: auth,
          };
          artistSession.updateUser(updatedUser);
          setUser(updatedUser);
        }
        setVerificationStatus(status);
        setShowVerificationModal(!auth.is_verified);
        return status;
      } else {
        if (user) {
          const clearedUser = { ...user } as User;
          delete (clearedUser as any).verificationData;
          clearedUser.verificationStatus = "none";
          artistSession.updateUser(clearedUser);
          setUser(clearedUser);
        }
        setVerificationStatus("none");
        setShowVerificationModal(true);
        return "none";
      }
    } catch (err: unknown) {
      console.error("recheckVerification error:", err);
      const normalized = normalizeAuthCaughtError(
        err,
        "بررسی وضعیت احراز هویت انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setError(normalized.message);
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        isInitializing,
        error,
        verificationStatus,
        showVerificationModal,
        login,
        register,
        sendOtp,
        resendArtistVerificationOtp,
        resendArtistPasswordResetOtp,
        verifyArtistVerificationOtp,
        verifyArtistPasswordResetOtp,
        resetPassword,
        submitVerification,
        logout,
        clearError,
        setCurrentPhone,
        recheckVerification,
        devAcceptVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
