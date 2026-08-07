import React, { createContext, useContext, ReactNode } from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";
import { toPersianMessage } from "../lib/faMessages";

type ToastType = "success" | "error" | "info";

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("هوک پیام‌ها باید داخل فراهم‌کننده پیام‌ها استفاده شود.");
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const showToast = (
    message: string,
    type: ToastType = "success",
    duration = 4000,
  ) => {
    const localizedMessage = toPersianMessage(message, "پیامی برای نمایش وجود ندارد.");
    const baseOpts = {
      duration,
      style: {
        background: "#181818",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 16px",
        fontWeight: 600,
        direction: "rtl" as const,
        textAlign: "right" as const,
        boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
        cursor: "pointer",
      } as React.CSSProperties,
      position: "bottom-center" as const,
    };

    if (type === "success") toast.success(localizedMessage, baseOpts);
    else if (type === "error") toast.error(localizedMessage, baseOpts);
    else toast(localizedMessage, baseOpts);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster position="bottom-center">
        {(t) => (
          <div onClick={() => toast.dismiss(t.id)}>
            <ToastBar toast={t} />
          </div>
        )}
      </Toaster>
    </ToastContext.Provider>
  );
};
