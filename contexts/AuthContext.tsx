import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  artistName?: string;
  verificationStatus?: VerificationStatus;
  verificationType?: "new" | "existing";
  verificationData?: any;
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
  register: (name: string, phone: string, password: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  resetPassword: (
    phone: string,
    otp: string,
    newPassword: string
  ) => Promise<void>;
  submitVerification: (data: any, type: "new" | "existing") => Promise<void>;
  logout: () => void;
  clearError: () => void;
  devAcceptVerification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
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
  const [resetMode, setResetMode] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsInitializing(true);
      const savedUser = localStorage.getItem("sedabox_user");
      const savedToken = localStorage.getItem("sedabox_token");

      if (savedUser && savedToken) {
        try {
          // Simulate API verification delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsLoggedIn(true);
          setVerificationStatus(parsedUser.verificationStatus || "none");
        } catch (err) {
          console.error("Failed to parse saved user:", err);
          localStorage.removeItem("sedabox_user");
          localStorage.removeItem("sedabox_token");
        }
      }
      setIsInitializing(false);
    };

    checkAuth();
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
      // Mock API call - accepts any input
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: phone,
        phone: phone,
        verificationStatus: "none",
      };

      // Save to localStorage
      localStorage.setItem("sedabox_user", JSON.stringify(mockUser));
      localStorage.setItem("sedabox_token", `token_${Date.now()}`);

      setUser(mockUser);
      setIsLoggedIn(true);
      setVerificationStatus("none");
    } catch (err) {
      setError("خطا در ورود. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerification = async (data: any, type: "new" | "existing") => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API call - simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updatedUser: User = {
        ...user!,
        verificationStatus: "pending",
        verificationType: type,
        verificationData: data,
      };

      // Update localStorage
      localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      setVerificationStatus("pending");
      setShowVerificationModal(false);
    } catch (err) {
      setError("خطا در ارسال درخواست. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API call - accepts any input
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Move to OTP verification
      setCurrentPhone(phone);
      setOtpVerified(false);
    } catch (err) {
      setError("خطا در ثبت نام. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentPhone(phone);
      setOtpVerified(false);
    } catch (err) {
      setError("خطا در ارسال کد. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API call - accepts any 4-digit code
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOtpVerified(true);
    } catch (err) {
      setError("کد تأیید نادرست است.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    phone: string,
    otp: string,
    newPassword: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Auto-login after password reset
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: phone,
        phone: phone,
        verificationStatus: "none",
      };

      localStorage.setItem("sedabox_user", JSON.stringify(mockUser));
      localStorage.setItem("sedabox_token", `token_${Date.now()}`);

      setUser(mockUser);
      setIsLoggedIn(true);
      setVerificationStatus("none");
      setResetMode(false);
      setOtpVerified(false);
      setCurrentPhone(null);
    } catch (err) {
      setError("خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sedabox_user");
    localStorage.removeItem("sedabox_token");
    setUser(null);
    setIsLoggedIn(false);
    setOtpVerified(false);
    setCurrentPhone(null);
    setResetMode(false);
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
      localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setVerificationStatus("approved");
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
        verifyOtp,
        resetPassword,
        submitVerification,
        logout,
        clearError,
        devAcceptVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
