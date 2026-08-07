import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "cropperjs";
import {
  Check,
  Focus,
  ImageIcon,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCcw,
  X,
} from "lucide-react";
import {
  exportCroppedCanvas,
  formatBytesFa,
  getImageFileError,
  type ImageCropRequestOptions,
  type ImageCropResult,
} from "../lib/imageCropper";

interface ImageCropperModalProps {
  file: File;
  options: ImageCropRequestOptions;
  onCancel: () => void;
  onComplete: (result: ImageCropResult) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const EPSILON = 0.000001;

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ file, options, onCancel, onComplete }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const objectUrlRef = useRef<string>("");
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(() => getImageFileError(file, options));
  const [zoomPercent, setZoomPercent] = useState(0);
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const minRatioRef = useRef(0);
  const maxRatioRef = useRef(1);
  const internalZoomRef = useRef(false);

  const square = options.mode === "square";
  const title = options.title || (square ? "تنظیم برش مربعی تصویر" : "تنظیم برش تصویر");
  const description = options.description || (square
    ? "قاب مربعی قفل است. قاب را جابه‌جا کنید یا از لبه‌ها و گوشه‌ها اندازه آن را تغییر دهید."
    : "قاب را جابه‌جا کنید و از هر چهار لبه یا گوشه اندازه آن را تغییر دهید.");

  const inputError = useMemo(() => getImageFileError(file, options), [file, options]);

  const computeMinRatio = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return 0;
    const crop = cropper.getCropBoxData();
    const image = cropper.getImageData();
    if (!image.naturalWidth || !image.naturalHeight || !crop.width || !crop.height) return 0;
    return Math.max(crop.width / image.naturalWidth, crop.height / image.naturalHeight);
  }, []);

  const syncZoomRange = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const canvas = cropper.getCanvasData();
    const image = cropper.getImageData();
    const minRatio = Math.max(computeMinRatio(), EPSILON);
    const currentRatio = image.naturalWidth ? canvas.width / image.naturalWidth : minRatio;
    const maxRatio = Math.max(minRatio * 8, minRatio + EPSILON);
    minRatioRef.current = minRatio;
    maxRatioRef.current = maxRatio;
    const percent = ((clamp(currentRatio, minRatio, maxRatio) - minRatio) / (maxRatio - minRatio)) * 100;
    setZoomPercent(Number.isFinite(percent) ? percent : 0);
  }, [computeMinRatio]);

  const centerCanvasOnCrop = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const crop = cropper.getCropBoxData();
    const canvas = cropper.getCanvasData();
    cropper.setCanvasData({
      left: crop.left + crop.width / 2 - canvas.width / 2,
      top: crop.top + crop.height / 2 - canvas.height / 2,
    });
  }, []);

  const fitCropExactly = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper || !ready) return;
    const minRatio = Math.max(computeMinRatio(), EPSILON);
    internalZoomRef.current = true;
    cropper.zoomTo(minRatio);
    internalZoomRef.current = false;
    centerCanvasOnCrop();
    syncZoomRange();
  }, [centerCanvasOnCrop, computeMinRatio, ready, syncZoomRange]);

  const setInitialCropBox = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper || !ready || square) return;
    const canvas = cropper.getCanvasData();
    const requestedRatio = Number(options.initialAspectRatio || 0);
    if (!Number.isFinite(requestedRatio) || requestedRatio <= 0) {
      cropper.setCropBoxData({ left: canvas.left, top: canvas.top, width: canvas.width, height: canvas.height });
      return;
    }
    const availableWidth = canvas.width * 0.94;
    const availableHeight = canvas.height * 0.94;
    let width = availableWidth;
    let height = width / requestedRatio;
    if (height > availableHeight) {
      height = availableHeight;
      width = height * requestedRatio;
    }
    cropper.setCropBoxData({
      left: canvas.left + (canvas.width - width) / 2,
      top: canvas.top + (canvas.height - height) / 2,
      width,
      height,
    });
  }, [options.initialAspectRatio, ready, square]);

  const maximizeCrop = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper || !ready) return;
    const canvas = cropper.getCanvasData();
    if (square) {
      const side = Math.max(48, Math.min(canvas.width, canvas.height));
      cropper.setCropBoxData({
        left: canvas.left + (canvas.width - side) / 2,
        top: canvas.top + (canvas.height - side) / 2,
        width: side,
        height: side,
      });
    } else {
      cropper.setCropBoxData({
        left: canvas.left,
        top: canvas.top,
        width: canvas.width,
        height: canvas.height,
      });
    }
    fitCropExactly();
  }, [fitCropExactly, ready, square]);

  const reset = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper || !ready) return;
    cropper.reset();
    window.requestAnimationFrame(() => {
      if (!square) setInitialCropBox();
      syncZoomRange();
    });
  }, [ready, setInitialCropBox, square, syncZoomRange]);

  const applyZoomPercent = useCallback((percent: number) => {
    const cropper = cropperRef.current;
    if (!cropper || !ready) return;
    const safe = clamp(percent, 0, 100);
    const minRatio = minRatioRef.current || computeMinRatio();
    const maxRatio = Math.max(maxRatioRef.current, minRatio * 8);
    const ratio = minRatio + (maxRatio - minRatio) * (safe / 100);
    internalZoomRef.current = true;
    cropper.zoomTo(ratio);
    internalZoomRef.current = false;
    setZoomPercent(safe);
  }, [computeMinRatio, ready]);

  useEffect(() => {
    if (inputError || !imageRef.current || !stageRef.current) {
      setReady(false);
      setError(inputError);
      return;
    }

    setReady(false);
    setError(null);
    setCropSize({ width: 0, height: 0 });

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    const image = imageRef.current;
    const stage = stageRef.current;

    let disposed = false;
    let cropper: Cropper | null = null;
    let initFrame = 0;

    const initializeCropper = () => {
      if (disposed || cropper) return;
      if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;

      const bounds = stage.getBoundingClientRect();
      // Cropper.js measures its parent when it is constructed. Initializing while
      // the modal/stage is still 0px wide or high can leave the instance blank.
      if (bounds.width < 40 || bounds.height < 40) return;

      cropper = new Cropper(image, {
        aspectRatio: square ? 1 : Number.NaN,
        viewMode: 1,
        dragMode: "move",
        autoCrop: true,
        autoCropArea: square ? 0.86 : 0.96,
        responsive: true,
        restore: false,
        checkCrossOrigin: false,
        checkOrientation: true,
        modal: true,
        guides: true,
        center: true,
        highlight: false,
        background: false,
        movable: true,
        rotatable: false,
        scalable: false,
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        wheelZoomRatio: 0.08,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        minContainerWidth: 0,
        minContainerHeight: 0,
        minCropBoxWidth: 56,
        minCropBoxHeight: 56,
        ready() {
          if (disposed || !cropper) return;
          const imageData = cropper.getImageData();
          setSourceSize({ width: imageData.naturalWidth, height: imageData.naturalHeight });
          setReady(true);
          setError(null);
          window.requestAnimationFrame(() => {
            if (disposed || !cropper) return;
            if (!square) {
              const canvas = cropper.getCanvasData();
              const requestedRatio = Number(options.initialAspectRatio || 0);
              if (Number.isFinite(requestedRatio) && requestedRatio > 0) {
                const availableWidth = canvas.width * 0.94;
                const availableHeight = canvas.height * 0.94;
                let width = availableWidth;
                let height = width / requestedRatio;
                if (height > availableHeight) {
                  height = availableHeight;
                  width = height * requestedRatio;
                }
                cropper.setCropBoxData({
                  left: canvas.left + (canvas.width - width) / 2,
                  top: canvas.top + (canvas.height - height) / 2,
                  width,
                  height,
                });
              } else {
                cropper.setCropBoxData({ left: canvas.left, top: canvas.top, width: canvas.width, height: canvas.height });
              }
            }
            syncZoomRange();
            confirmRef.current?.focus({ preventScroll: true });
          });
        },
        crop(event) {
          setCropSize({ width: Math.max(0, Math.round(event.detail.width)), height: Math.max(0, Math.round(event.detail.height)) });
        },
        cropend() {
          if (!cropper) return;
          const minRatio = computeMinRatio();
          const canvas = cropper.getCanvasData();
          const imageData = cropper.getImageData();
          const current = imageData.naturalWidth ? canvas.width / imageData.naturalWidth : minRatio;
          if (current + EPSILON < minRatio) {
            internalZoomRef.current = true;
            cropper.zoomTo(minRatio);
            internalZoomRef.current = false;
          }
          syncZoomRange();
        },
        zoom(event) {
          if (!cropper || internalZoomRef.current) return;
          const minRatio = Math.max(computeMinRatio(), EPSILON);
          const maxRatio = Math.max(minRatio * 8, minRatio + EPSILON);
          if (event.detail.ratio < minRatio - EPSILON || event.detail.ratio > maxRatio + EPSILON) {
            event.preventDefault();
            internalZoomRef.current = true;
            cropper.zoomTo(clamp(event.detail.ratio, minRatio, maxRatio));
            internalZoomRef.current = false;
          }
          window.requestAnimationFrame(syncZoomRange);
        },
      });
      cropperRef.current = cropper;
    };

    const scheduleInitialize = () => {
      if (disposed || cropper) return;
      window.cancelAnimationFrame(initFrame);
      // Two frames lets the portal, responsive modal shell, and image dimensions
      // settle before Cropper.js performs its initial measurements.
      initFrame = window.requestAnimationFrame(() => {
        initFrame = window.requestAnimationFrame(initializeCropper);
      });
    };

    const handleImageLoad = () => scheduleInitialize();
    const handleImageError = () => {
      if (disposed) return;
      setReady(false);
      setError("خواندن تصویر انجام نشد. فایل ممکن است خراب یا با فرمت پشتیبانی‌نشده باشد.");
    };

    image.addEventListener("load", handleImageLoad);
    image.addEventListener("error", handleImageError);

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          // Only help the not-yet-created instance wait for a measurable modal.
          // After construction, Cropper.js responsive:true owns resize handling.
          if (!cropper) scheduleInitialize();
        })
      : null;
    resizeObserver?.observe(stage);

    image.src = objectUrl;
    if (image.complete && image.naturalWidth > 0) scheduleInitialize();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(initFrame);
      resizeObserver?.disconnect();
      image.removeEventListener("load", handleImageLoad);
      image.removeEventListener("error", handleImageError);
      cropper?.destroy();
      cropperRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    };
  }, [computeMinRatio, file, inputError, options.initialAspectRatio, square, syncZoomRange]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const onKeyDown = (event: KeyboardEvent) => {
      if (processing) return;
      if (event.key === "Tab") {
        const focusable = Array.from(
          ((modalRef.current as HTMLElement | null)?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ) || []) as Iterable<HTMLElement>,
        ).filter((element: HTMLElement) => !element.hasAttribute("aria-hidden"));
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (!ready || !cropperRef.current) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        applyZoomPercent(zoomPercent + 5);
      } else if (event.key === "-") {
        event.preventDefault();
        applyZoomPercent(zoomPercent - 5);
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void handleConfirm();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.removeEventListener("keydown", onKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyZoomPercent, onCancel, processing, ready, zoomPercent]);

  const handleConfirm = useCallback(async () => {
    const cropper = cropperRef.current;
    if (!cropper || !ready || processing) return;
    setProcessing(true);
    setError(null);
    try {
      const maxDimension = options.maxOutputDimension ?? (square ? 3000 : 3200);
      const cropData = cropper.getData(false);
      const squareSide = square
        ? Math.max(1, Math.floor(Math.min(maxDimension, cropData.width, cropData.height)))
        : 0;
      const canvas = cropper.getCroppedCanvas(square
        ? {
            width: squareSide,
            height: squareSide,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: "high",
          }
        : {
            maxWidth: maxDimension,
            maxHeight: maxDimension,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: "high",
          });
      if (!canvas || !canvas.width || !canvas.height) throw new Error("محدوده برش معتبر نیست. قاب را دوباره تنظیم کنید.");
      if (square && canvas.width !== canvas.height) throw new Error("خروجی این تصویر باید کاملاً مربعی باشد.");
      const outputFile = await exportCroppedCanvas(canvas, file, options);
      onComplete({
        file: outputFile,
        width: canvas.width,
        height: canvas.height,
        sourceWidth: sourceSize.width,
        sourceHeight: sourceSize.height,
      });
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "برش تصویر انجام نشد. لطفاً دوباره تلاش کنید.");
      setProcessing(false);
    }
  }, [file, onComplete, options, processing, ready, sourceSize.height, sourceSize.width, square]);

  if (typeof document === "undefined") return null;

  const modal = (
    <div className="image-cropper-backdrop fixed inset-0 z-[300] flex items-stretch justify-center bg-black/90 backdrop-blur-md sm:items-center sm:p-4" dir="rtl">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-cropper-title"
        className="image-cropper-shell flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden bg-[#101010] shadow-2xl sm:h-[min(900px,calc(100vh-2rem))] sm:max-h-[calc(100vh-2rem)] sm:rounded-3xl sm:border sm:border-[#303030]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#282828] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/12"><ImageIcon className="h-5 w-5 text-[#1DB954]" /></div>
              <div>
                <h2 id="image-cropper-title" className="text-lg font-black text-white sm:text-xl">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#8b8b8b] sm:text-sm">{description}</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={onCancel} disabled={processing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#242424] text-[#aaa] transition hover:bg-[#303030] hover:text-white disabled:opacity-40" aria-label="بستن و انصراف">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="image-cropper-scroll-body flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3 sm:gap-4 sm:p-5">
          <div ref={stageRef} className="image-cropper-stage relative shrink-0 overflow-hidden rounded-2xl border border-[#2d2d2d] bg-[#080808]">
            {inputError ? (
              <div className="flex h-full min-h-[300px] items-center justify-center p-8 text-center"><p className="max-w-lg text-sm leading-7 text-red-300">{inputError}</p></div>
            ) : (
              <>
                <img ref={imageRef} alt="تصویر انتخاب‌شده برای برش" className="block max-w-full" onError={() => setError("خواندن تصویر انجام نشد. فایل ممکن است خراب یا با فرمت پشتیبانی‌نشده باشد.")} />
                {!ready && !error && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b0b0b]"><Loader2 className="h-8 w-8 animate-spin text-[#1DB954]"/><p className="mt-3 text-sm text-[#aaa]">در حال آماده‌سازی تصویر…</p></div>}
              </>
            )}
          </div>

          <div className="grid shrink-0 gap-3 rounded-2xl border border-[#292929] bg-[#181818] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2" dir="ltr">
                <button type="button" onClick={() => applyZoomPercent(zoomPercent - 6)} disabled={!ready || processing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#353535] bg-[#222] text-white hover:bg-[#2d2d2d] disabled:opacity-40" aria-label="کاهش بزرگ‌نمایی"><Minus className="h-4 w-4"/></button>
                <input aria-label="میزان بزرگ‌نمایی تصویر" type="range" min={0} max={100} step={0.5} value={zoomPercent} onChange={(event) => applyZoomPercent(Number(event.target.value))} disabled={!ready || processing} className="min-w-0 flex-1 accent-[#1DB954]" />
                <button type="button" onClick={() => applyZoomPercent(zoomPercent + 6)} disabled={!ready || processing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#353535] bg-[#222] text-white hover:bg-[#2d2d2d] disabled:opacity-40" aria-label="افزایش بزرگ‌نمایی"><Plus className="h-4 w-4"/></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#777]" dir="rtl">
                <span>بزرگ‌نمایی: {Math.round(100 + zoomPercent * 7).toLocaleString("fa-IR")}٪</span>
                {cropSize.width > 0 && <span>برش: {cropSize.width.toLocaleString("fa-IR")} × {cropSize.height.toLocaleString("fa-IR")} پیکسل</span>}
                <span>فایل اولیه: {formatBytesFa(file.size)}</span>
              </div>
            </div>

            <div className="image-cropper-tool-grid grid grid-cols-3 gap-2 sm:flex">
              <button type="button" onClick={fitCropExactly} disabled={!ready || processing} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#353535] bg-[#222] px-3 text-xs font-bold text-white hover:bg-[#2d2d2d] disabled:opacity-40" title="کمترین بزرگ‌نمایی بدون ایجاد فضای خالی"><Focus className="h-4 w-4"/>نمایش کامل</button>
              <button type="button" onClick={maximizeCrop} disabled={!ready || processing} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#353535] bg-[#222] px-3 text-xs font-bold text-white hover:bg-[#2d2d2d] disabled:opacity-40"><Maximize2 className="h-4 w-4"/>بیشترین قاب</button>
              <button type="button" onClick={reset} disabled={!ready || processing} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#353535] bg-[#222] px-3 text-xs font-bold text-white hover:bg-[#2d2d2d] disabled:opacity-40"><RefreshCcw className="h-4 w-4"/>بازنشانی</button>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-center text-[11px] leading-5 text-[#777] sm:text-xs">
            در موبایل با دو انگشت بزرگ‌نمایی را تغییر دهید. با ماوس یا لمس، تصویر را جابه‌جا کنید و قاب را از هر چهار لبه یا گوشه بکشید. محدوده انتخاب هرگز از تصویر واقعی بیرون نمی‌رود.
          </div>
          {error && <div className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">{error}</div>}
        </main>

        <footer className="grid shrink-0 grid-cols-2 items-center gap-3 border-t border-[#282828] bg-[#111] px-4 py-3 sm:flex sm:justify-between sm:px-6 sm:py-4">
          <button type="button" onClick={onCancel} disabled={processing} className="w-full rounded-xl border border-[#383838] bg-[#202020] px-4 py-3 font-bold text-white hover:bg-[#2a2a2a] disabled:opacity-40 sm:w-auto sm:px-5">انصراف</button>
          <button ref={confirmRef} type="button" onClick={() => void handleConfirm()} disabled={!ready || processing || Boolean(inputError)} className="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-3 font-black text-black transition hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-40 sm:px-5">
            {processing ? <Loader2 className="h-5 w-5 animate-spin"/> : <Check className="h-5 w-5"/>}
            {processing ? "در حال ساخت تصویر…" : "تأیید برش"}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ImageCropperModal;
