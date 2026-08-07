import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type ConfirmTone = "primary" | "danger";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const ConfirmModal: React.FC<Props> = ({
  open,
  title = "تأیید عملیات",
  description = "آیا از ادامه این عملیات مطمئن هستید؟",
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  tone = "primary",
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => cancelButtonRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open || typeof document === "undefined") return null;

  const destructive = tone === "danger";
  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" dir="rtl">
      <button
        type="button"
        aria-label="بستن پنجره تأیید"
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
        disabled={loading}
        onClick={() => !loading && onCancel()}
      />

      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-[#303030] bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="p-6 sm:p-7">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${destructive ? "bg-red-500/12 text-red-400" : "bg-[#1DB954]/12 text-[#1DB954]"}`}>
            {destructive ? <AlertTriangle className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
          </div>
          <h3 id={titleId} className="text-center text-xl font-black text-white">
            {title}
          </h3>
          <p id={descriptionId} className="mx-auto mt-3 max-w-md text-center text-sm leading-7 text-[#aaa]">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#292929] bg-[#0d0d0d] p-4 sm:p-5">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#343434] bg-[#191919] px-4 font-bold text-[#d0d0d0] transition hover:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-black transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-red-500 text-white hover:bg-red-400 focus:ring-red-400/35" : "bg-[#1DB954] text-black hover:bg-[#1ed760] focus:ring-[#1DB954]/35"}`}
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? "در حال انجام..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ConfirmModal;
