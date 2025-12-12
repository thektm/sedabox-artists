import React from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmModal: React.FC<Props> = ({
  open,
  title = "آیا مطمئن هستید؟",
  description = "عملیات قابل بازگشت نیست. آیا می‌خواهید ادامه دهید؟",
  confirmLabel = "بله، خروج",
  cancelLabel = "انصراف",
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center px-4"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      ></div>

      <div className="relative z-80 w-full max-w-xl mx-auto bg-[#0f0f0f] border border-[#282828] rounded-2xl shadow-2xl p-6 sm:p-8 pc-compact transform transition-all duration-200">
        <h3 className="text-white font-extrabold text-lg sm:text-xl text-center">
          {title}
        </h3>
        <p className="text-[#B3B3B3] mt-3 text-sm text-center">{description}</p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="min-w-[120px] px-4 py-2 rounded-lg bg-[#181818] text-[#B3B3B3] hover:bg-[#232323] transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="min-w-[120px] px-4 py-2 rounded-lg bg-[#1DB954] text-black font-semibold hover:bg-[#18b84a] transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

export default ConfirmModal;
