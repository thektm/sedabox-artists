import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  CloudUpload,
  Disc3,
  FileAudio,
  ImagePlus,
  Info,
  Library,
  Loader2,
  Music2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { ApiError, apiRequest, apiUpload, getApiErrorMessage, resolveMediaUrl, unwrapList } from "../lib/api";
import { toPersianMessage } from "../lib/faMessages";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import { useImageCropper } from "../contexts/ImageCropperContext";
import SongModal from "./SongModal";
import ConfirmModal from "./ConfirmModal";
import { PartialSong, SongMetadata, TaxonomyOption } from "./types";
import {
  ArtistRelease,
  ReleaseTrackApi,
  ReleaseTrackExtras,
  ReleaseType,
  SharedMetadata,
} from "./releaseTypes";

interface ReleaseComposerProps { releaseId: string; focusTrackId?: number; }
interface RecordingsResponse { results?: ReleaseTrackApi[]; }
interface UploadResponse { message: string; song: ReleaseTrackApi; }
interface UploadStatusResponse {
  state: "processing" | "done" | "failed" | "missing";
  stage?: string;
  message?: string;
  detail?: string;
  code?: string;
  song?: ReleaseTrackApi;
}
interface UploadRow {
  id: string;
  name: string;
  state: "queued" | "uploading" | "processing" | "done" | "error";
  percent: number;
  message?: string;
}
interface PendingUpload {
  id: string;
  file: File;
  title: string;
  title_en: string;
}
interface ArtworkUploadState {
  phase: "idle" | "validating" | "uploading" | "processing" | "done" | "error";
  percent: number;
  previewUrl?: string;
  message?: string;
}

const inputClass = "w-full rounded-xl border border-[#343434] bg-[#1a1a1a] px-3.5 py-3 text-white outline-none transition placeholder:text-[#5f5f5f] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/10";
const labelClass = "mb-2 block text-xs font-black text-[#d7d7d7]";
const stepNames = ["اطلاعات انتشار", "ترک‌لیست و کاور", "جزئیات ترک‌ها", "دسته‌بندی و عوامل", "بازبینی و ارسال"];
const releaseTypeOptions: Array<{ value: ReleaseType; title: string; description: string }> = [
  { value: "single", title: "تک‌آهنگ", description: "یک ترک مستقل" },
  { value: "ep", title: "مینی‌آلبوم", description: "مجموعه کوتاه" },
  { value: "album", title: "آلبوم", description: "انتشار چندترکی" },
  { value: "compilation", title: "مجموعه گردآوری", description: "مجموعه یا گردآوری" },
];
const releaseStatusLabels: Record<ArtistRelease["status"], string> = {
  draft: "پیش‌نویس",
  in_review: "در حال بررسی",
  changes_requested: "نیازمند اصلاح",
  approved: "تأییدشده",
  scheduled: "زمان‌بندی‌شده",
  live: "منتشرشده",
  rejected: "ردشده",
  taken_down: "حذف‌شده",
};

const trackStatusLabels: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار بررسی",
  approved: "تأییدشده",
  published: "منتشرشده",
  rejected: "ردشده",
  deleted: "حذف‌شده",
  processing: "در حال پردازش",
  failed: "ناموفق",
};

const missingMetadataLabels: Record<string, string> = {
  title: "عنوان",
  audio: "فایل صوتی",
  language: "زبان",
  genre: "ژانر",
  composer: "آهنگساز",
  lyricist: "ترانه‌سرا",
  "publishing owner": "مالک نشر",
};

const trackStatusLabel = (value?: string) => trackStatusLabels[String(value || "").toLowerCase()] || "نامشخص";
const missingMetadataLabel = (value: string) => missingMetadataLabels[value] || "اطلاعات تکمیلی";

const listText = (value?: string[]) => (value || []).join(", ");
const textList = (value: string) => value.split(/[,،\n]/).map((item) => item.trim()).filter(Boolean);
const ids = (items?: Array<TaxonomyOption | number>) => (items || []).map((item) => typeof item === "number" ? item : Number(item.id)).filter(Boolean);
const humanBytes = (value: number) => value > 1024 ** 2 ? `${(value / 1024 ** 2).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت` : `${Math.ceil(value / 1024).toLocaleString("fa-IR")} کیلوبایت`;
const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const createUploadId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
const normalizeDateOnly = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";

const recoverUpload = async (
  uploadId: string,
  onState: (message: string) => void,
): Promise<UploadResponse> => {
  const deadline = Date.now() + 16 * 60 * 1000;
  const missingDeadline = Date.now() + 30 * 1000;
  let confirmedByServer = false;
  let lastConnectionError: unknown;
  while (Date.now() < deadline) {
    try {
      const result = await apiRequest<UploadStatusResponse>(`/artist/songs/uploads/${encodeURIComponent(uploadId)}/`);
      confirmedByServer = true;
      if (result.state === "done" && result.song) return { message: "پردازش با موفقیت انجام شد.", song: result.song };
      if (result.state === "failed") throw new ApiError(result.detail || "پردازش فایل صوتی انجام نشد.", 422, result);
      onState(result.message || "سرور همچنان در حال پردازش فایل صوتی است…");
    } catch (error) {
      if (error instanceof ApiError && ![0, 404].includes(error.status) && error.status < 500) throw error;
      lastConnectionError = error;
      if (!confirmedByServer && Date.now() >= missingDeadline) {
        throw new ApiError("فایل به سرور پردازش نرسید. زمان انتظار پراکسی API را بررسی و دوباره بارگذاری کنید.", 0, error);
      }
    }
    await pause(2500);
  }
  if (lastConnectionError instanceof Error) {
    throw new ApiError("سرور نتیجه بارگذاری را تأیید نکرد. فایل تکراری ثبت نشده است؛ یک‌بار دیگر تلاش کنید.", 0, lastConnectionError);
  }
  throw new ApiError("پردازش فایل صوتی در زمان مقرر کامل نشد. دوباره تلاش کنید.");
};

const readImageDimensions = (file: File): Promise<{ width: number; height: number }> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  const cleanup = () => URL.revokeObjectURL(url);
  image.onload = () => {
    const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
    cleanup();
    resolve(dimensions);
  };
  image.onerror = () => {
    cleanup();
    reject(new Error("فایل کاور آسیب دیده یا قابل خواندن نیست."));
  };
  image.src = url;
});

const mapTrackToSong = (track: ReleaseTrackApi): SongMetadata => {
  const featured = track.featured_artists || [];
  const status = track.status || "draft";
  return {
    id: track.id,
    title: track.title || "",
    title_en: track.title_en || "",
    artist: track.artist_name || "",
    featuredArtists: featured,
    featured_artists: featured,
    featured_artist_ids: featured.map((item) => item.id),
    album: track.album_title || "",
    duration: track.duration_display || "0:00",
    plays: "0",
    status,
    approvalStatus: status === "published" || status === "approved" ? "approved" : status === "rejected" ? "rejected" : status === "pending" ? "pending" : "none",
    image: track.cover_image || "",
    audioFile: track.audio_file || track.stream_url,
    releaseDate: track.release_date || "",
    release_date: track.release_date || "",
    genre: (track.genre_ids || []).map((item) => item.title),
    subGenre: (track.sub_genre_ids || []).map((item) => item.title),
    mood: (track.mood_ids || []).map((item) => item.title),
    tags: (track.tag_ids || []).map((item) => item.title),
    genre_ids: ids(track.genre_ids),
    sub_genre_ids: ids(track.sub_genre_ids),
    mood_ids: ids(track.mood_ids),
    tag_ids: ids(track.tag_ids),
    language: track.language || "fa",
    tempo: track.tempo ?? 120,
    energy: track.energy ?? 50,
    danceability: track.danceability ?? 50,
    valence: track.valence ?? 50,
    acousticness: track.acousticness ?? 0,
    instrumentalness: track.instrumentalness ?? 0,
    liveness: Boolean(track.live_performed),
    live_performed: Boolean(track.live_performed),
    speechiness: track.speechiness ?? 0,
    label: track.label || "",
    label_en: track.label_en || "",
    producers: track.producers || [],
    producers_en: track.producers_en || [],
    composers: track.composers || [],
    composers_en: track.composers_en || [],
    lyricists: track.lyricists || [],
    lyricists_en: track.lyricists_en || [],
    lyrics: track.lyrics || "",
    lyrics_en: track.lyrics_en || "",
    description: track.description || "",
    description_en: track.description_en || "",
    credits: track.credits || "",
    credits_en: track.credits_en || "",
    is_single: false,
  };
};

const editablePayload = (release: ArtistRelease) => ({
  title: release.title,
  title_en: release.title_en || "",
  release_type: release.release_type,
  previously_released: Boolean(release.previously_released),
  current_step: release.current_step,
  shared_metadata: release.shared_metadata,
  release_metadata: {
    ...release.release_metadata,
    release_date: normalizeDateOnly(release.release_metadata.release_date),
    original_release_date: normalizeDateOnly(release.release_metadata.original_release_date),
  },
  track_extras: release.track_extras,
  lock_version: release.lock_version,
});

const editableSnapshot = (release: ArtistRelease) => {
  const { lock_version: _lockVersion, ...payload } = editablePayload(release);
  return JSON.stringify(payload);
};

const ReleaseComposer: React.FC<ReleaseComposerProps> = ({ releaseId, focusTrackId }) => {
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const [release, setRelease] = useState<ArtistRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const [taxonomies, setTaxonomies] = useState<{ genres: TaxonomyOption[]; subgenres: TaxonomyOption[]; moods: TaxonomyOption[]; tags: TaxonomyOption[] }>({ genres: [], subgenres: [], moods: [], tags: [] });
  const [recordings, setRecordings] = useState<ReleaseTrackApi[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadRow[]>([]);
  const [artworkUpload, setArtworkUpload] = useState<ArtworkUploadState>({ phase: "idle", percent: 0 });
  const [existingOpen, setExistingOpen] = useState(false);
  const [recordingQuery, setRecordingQuery] = useState("");
  const [selectedExisting, setSelectedExisting] = useState<number[]>([]);
  const [editingTrack, setEditingTrack] = useState<ReleaseTrackApi | null>(null);
  const [editingSong, setEditingSong] = useState(false);
  const [trackToRemove, setTrackToRemove] = useState<ReleaseTrackApi | null>(null);
  const [extrasTrackId, setExtrasTrackId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [reviewEditConfirmOpen, setReviewEditConfirmOpen] = useState(false);
  const lastSnapshot = useRef("");
  const initialized = useRef(false);
  const releaseRef = useRef<ArtistRelease | null>(null);
  const saveQueueRef = useRef<Promise<ArtistRelease | null>>(Promise.resolve(null));
  const artworkRef = useRef<HTMLInputElement>(null);
  const artworkPreviewRef = useRef<string>("");
  const audioRef = useRef<HTMLInputElement>(null);

  const clearArtworkPreview = useCallback(() => {
    if (artworkPreviewRef.current) URL.revokeObjectURL(artworkPreviewRef.current);
    artworkPreviewRef.current = "";
  }, []);

  useEffect(() => () => clearArtworkPreview(), [clearArtworkPreview]);

  const replaceRelease = useCallback((next: ArtistRelease, updateSnapshot = true) => {
    releaseRef.current = next;
    setRelease(next);
    if (updateSnapshot) lastSnapshot.current = editableSnapshot(next);
  }, []);

  const mutateRelease = useCallback((updater: (current: ArtistRelease) => ArtistRelease) => {
    const current = releaseRef.current;
    if (!current) return;
    const next = updater(current);
    releaseRef.current = next;
    setRelease(next);
  }, []);

  const loadRelease = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await apiRequest<ArtistRelease>(`/artist/releases/${releaseId}/`);
      const focusedTrack = focusTrackId ? data.tracks.find((track) => track.id === focusTrackId) : undefined;
      const next = { ...data, current_step: focusedTrack ? 3 : Math.max(1, Math.min(5, data.current_step || 1)) };
      replaceRelease(next);
      if (focusedTrack) {
        setExtrasTrackId(focusedTrack.id);
        if (["draft", "in_review"].includes(data.status)) setEditingTrack(focusedTrack);
      }
      initialized.current = true;
      setExtrasTrackId((current) => current ?? data.track_ids[0] ?? null);
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت پیش‌نویس انتشار انجام نشد."), "error");
    } finally {
      setLoading(false);
    }
  }, [focusTrackId, releaseId, replaceRelease, showToast]);

  const loadRecordings = useCallback(async (query = "", quiet = false) => {
    if (!quiet) setRecordingsLoading(true);
    try {
      const data = await apiRequest<ReleaseTrackApi[] | RecordingsResponse>("/artist/songs/", { query: { q: query.trim() } });
      setRecordings(unwrapList(data).filter((track) => track.status !== "deleted"));
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت فهرست ضبط‌ها انجام نشد."), "error");
    } finally {
      if (!quiet) setRecordingsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { releaseRef.current = release; }, [release]);

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      loadRelease(),
      Promise.all([
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/genres/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/subgenres/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/moods/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/tags/"),
      ]).then(([genres, subgenres, moods, tags]) => {
        if (!cancelled) setTaxonomies({ genres: unwrapList(genres), subgenres: unwrapList(subgenres), moods: unwrapList(moods), tags: unwrapList(tags) });
      }),
      loadRecordings("", true),
    ]).then((results) => results.forEach((result, index) => {
      if (result.status === "rejected" && index > 0) showToast(getApiErrorMessage(result.reason, "بخشی از اطلاعات انتشار دریافت نشد."), "error");
    }));
    return () => { cancelled = true; };
  }, [loadRecordings, loadRelease, showToast]);

  useEffect(() => {
    if (!existingOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRecordingsLoading(true);
      try {
        const data = await apiRequest<ReleaseTrackApi[] | RecordingsResponse>("/artist/songs/", {
          query: { q: recordingQuery.trim() },
          signal: controller.signal,
        });
        setRecordings(unwrapList(data).filter((track) => track.status !== "deleted"));
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") showToast(getApiErrorMessage(error, "جست‌وجوی ضبط‌ها انجام نشد."), "error");
      } finally {
        if (!controller.signal.aborted) setRecordingsLoading(false);
      }
    }, recordingQuery.trim() ? 300 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [existingOpen, recordingQuery, showToast]);



  const persistLatestDraft = useCallback((notifyOnError = true): Promise<ArtistRelease | null> => {
    const queued = saveQueueRef.current.catch(() => null).then(async () => {
      const draft = releaseRef.current;
      if (!draft || !initialized.current || !["draft", "in_review"].includes(draft.status)) return draft;
      const payload = editablePayload(draft);
      const sentSnapshot = editableSnapshot(draft);
      if (sentSnapshot === lastSnapshot.current) return draft;
      setSaving(true);
      try {
        const updated = await apiRequest<ArtistRelease>(`/artist/releases/${draft.id}/`, { method: "PATCH", body: payload });
        const updatedSnapshot = editableSnapshot(updated);
        const current = releaseRef.current;
        const currentSnapshot = current ? editableSnapshot(current) : sentSnapshot;
        const next = current && currentSnapshot !== sentSnapshot
          ? { ...current, lock_version: updated.lock_version, updated_at: updated.updated_at }
          : updated;
        lastSnapshot.current = current && currentSnapshot !== sentSnapshot ? sentSnapshot : updatedSnapshot;
        releaseRef.current = next;
        setRelease(next);
        setSavedAt(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }));
        return next;
      } catch (error) {
        if (notifyOnError) showToast(getApiErrorMessage(error, "ذخیره خودکار انجام نشد. تغییرات ذخیره‌نشده همچنان در این صفحه باقی مانده‌اند."), "error");
        throw error;
      } finally {
        setSaving(false);
      }
    });
    saveQueueRef.current = queued.catch(() => null);
    return queued;
  }, [showToast]);

  useEffect(() => {
    if (!release || !initialized.current || !["draft", "in_review"].includes(release.status)) return;
    const snapshot = editableSnapshot(release);
    if (snapshot === lastSnapshot.current) return;
    const timer = window.setTimeout(() => { void persistLatestDraft().catch(() => undefined); }, 700);
    return () => window.clearTimeout(timer);
  }, [persistLatestDraft, release]);

  useEffect(() => () => {
    const draft = releaseRef.current;
    if (draft && ["draft", "in_review"].includes(draft.status) && editableSnapshot(draft) !== lastSnapshot.current) {
      void persistLatestDraft(false).catch(() => undefined);
    }
  }, [persistLatestDraft]);

  useEffect(() => {
    const warnBeforeClose = (event: BeforeUnloadEvent) => {
      const draft = releaseRef.current;
      const artworkBusy = ["validating", "uploading", "processing"].includes(artworkUpload.phase);
      if (!uploading && !artworkBusy && (!draft || editableSnapshot(draft) === lastSnapshot.current)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeClose);
    return () => window.removeEventListener("beforeunload", warnBeforeClose);
  }, [artworkUpload.phase, uploading]);

  const updateRelease = <K extends keyof ArtistRelease>(key: K, value: ArtistRelease[K]) => mutateRelease((current) => ({ ...current, [key]: value }));
  const updateMetadata = (patch: Partial<ArtistRelease["release_metadata"]>) => mutateRelease((current) => ({ ...current, release_metadata: { ...current.release_metadata, ...patch } }));
  const updateShared = (patch: Partial<SharedMetadata>) => mutateRelease((current) => ({ ...current, shared_metadata: { ...current.shared_metadata, ...patch } }));
  const currentStep = release?.current_step || 1;
  const readOnly = !release || !["draft", "in_review"].includes(release.status);
  const artworkBusy = ["validating", "uploading", "processing"].includes(artworkUpload.phase);
  const pendingReviewEdit = release?.status === "in_review";
  const todayIso = useMemo(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  }, []);

  const goStep = (step: number) => {
    if (!release) return;
    if (uploading || artworkBusy) return showToast("پیش از تغییر مرحله، منتظر پایان بارگذاری فعلی بمانید.", "error");
    updateRelease("current_step", Math.max(1, Math.min(5, step)));
    window.requestAnimationFrame(() => document.getElementById("release-composer-top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const prepareServerMutation = async () => {
    try {
      await persistLatestDraft(false);
      return true;
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره آخرین تغییرات انتشار انجام نشد. دوباره تلاش کنید."), "error");
      return false;
    }
  };

  const leaveComposer = async () => {
    if (uploading || artworkBusy) return showToast("پیش از خروج از این انتشار، منتظر پایان بارگذاری فعلی بمانید.", "error");
    if (release && ["draft", "in_review"].includes(release.status) && !(await prepareServerMutation())) return;
    navigateTo("releases");
  };

  const refreshComposer = async () => {
    if (uploading || artworkBusy) return showToast("پیش از به‌روزرسانی صفحه، منتظر پایان بارگذاری فعلی بمانید.", "error");
    if (release && ["draft", "in_review"].includes(release.status) && !(await prepareServerMutation())) return;
    await loadRelease(true);
  };

  const validateAudioFiles = (files: File[]) => files.filter((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp3", "wav"].includes(ext)) {
      showToast(`${file.name}: فقط فایل‌های MP3 و WAV پشتیبانی می‌شوند.`, "error");
      return false;
    }
    if (!file.size) {
      showToast(`${file.name}: فایل انتخاب‌شده خالی است.`, "error");
      return false;
    }
    if (file.size > 500 * 1024 * 1024) {
      showToast(`${file.name}: حجم فایل باید کمتر از ۵۰۰ مگابایت باشد.`, "error");
      return false;
    }
    return true;
  });

  const selectUploadFiles = (files: File[]) => {
    if (!release || !files.length || readOnly) return;
    if (uploading || artworkBusy) return showToast("منتظر پایان بارگذاری فعلی بمانید.", "error");
    const accepted = validateAudioFiles(files);
    if (audioRef.current) audioRef.current.value = "";
    if (!accepted.length) return;
    if (release.release_type === "single") {
      if (accepted.length > 1 || release.track_ids.length > 0) {
        showToast("انتشار تک‌آهنگ باید دقیقاً یک فایل صوتی داشته باشد.", "error");
        return;
      }
      void uploadFiles(accepted.map((file) => ({
        id: createUploadId(),
        file,
        title: release.title.trim(),
        title_en: (release.title_en || "").trim(),
      })));
      return;
    }
    setPendingUploads(accepted.map((file) => ({ id: createUploadId(), file, title: "", title_en: "" })));
  };

  const uploadFiles = async (items: PendingUpload[]) => {
    if (!release || !items.length || readOnly) return;
    if (uploading || artworkBusy) return showToast("منتظر پایان بارگذاری فعلی بمانید.", "error");
    if (release.release_type !== "single" && items.some((item) => !item.title.trim() && !item.title_en.trim())) {
      showToast("پیش از بارگذاری، برای همه ترک‌ها عنوان فارسی یا انگلیسی وارد کنید.", "error");
      return;
    }
    if (!(await prepareServerMutation())) return;

    setPendingUploads([]);
    setUploading(true);
    setUploadProgress(items.map((item) => ({ id: item.id, name: item.file.name, state: "queued", percent: 0 })));
    const uploadedIds: number[] = [];
    let failed = 0;
    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const file = item.file;
        const updateRow = (patch: Partial<UploadRow>) => setUploadProgress((current) => current.map((row, position) => position === index ? { ...row, ...patch } : row));
        updateRow({ state: "uploading", percent: 0, message: undefined });
        try {
          const form = new FormData();
          const isSingle = release.release_type === "single";
          const trackTitle = isSingle ? release.title.trim() : item.title.trim();
          const trackTitleEn = isSingle ? (release.title_en || "").trim() : item.title_en.trim();
          form.set("title", trackTitle || trackTitleEn);
          form.set("title_en", trackTitleEn);
          form.set("language", "fa");
          form.set("is_single", "false");
          form.set("save_as_draft", "true");
          form.set("audio_file", file);
          const uploadId = createUploadId();
          form.set("upload_id", uploadId);

          let response: UploadResponse;
          try {
            response = await apiUpload<UploadResponse>("/artist/songs/", {
              body: form,
              onProgress: ({ percent, processing }) => updateRow({
                percent,
                state: processing ? "processing" : "uploading",
                message: processing ? "بارگذاری کامل شد و سرور در حال ساخت و ذخیره هر دو کیفیت است…" : undefined,
              }),
            });
          } catch (error) {
            if (!(error instanceof ApiError) || (error.status > 0 && error.status < 500)) throw error;
            updateRow({ state: "processing", percent: 100, message: "پاسخ اتصال قطع شد؛ نتیجه در سرور در حال بررسی است…" });
            response = await recoverUpload(uploadId, (message) => updateRow({ state: "processing", percent: 100, message }));
          }
          uploadedIds.push(response.song.id);
          updateRow({ state: "done", percent: 100, message: "فایل بارگذاری و پردازش شد." });
        } catch (error) {
          failed += 1;
          const message = getApiErrorMessage(error, "بارگذاری انجام نشد.");
          updateRow({ state: "error", message });
          showToast(`${file.name}: ${message}`, "error");
        }
      }

      if (!uploadedIds.length) return showToast("هیچ ترکی بارگذاری نشد. خطاها را بررسی و دوباره تلاش کنید.", "error");
      try {
        const updated = await apiRequest<ArtistRelease>(`/artist/releases/${release.id}/tracks/`, { method: "POST", body: { action: "add", song_ids: uploadedIds, lock_version: releaseRef.current?.lock_version } });
        replaceRelease(updated);
        setExtrasTrackId((current) => current ?? uploadedIds[0] ?? null);
        showToast(`${uploadedIds.length.toLocaleString("fa-IR")} ترک افزوده شد${failed ? ` و بارگذاری ${failed.toLocaleString("fa-IR")} ترک انجام نشد` : ""}.`, failed ? "error" : "success");
      } catch (error) {
        showToast(getApiErrorMessage(error, "ترک‌ها در بخش ضبط‌ها ثبت شدند اما اتصال آن‌ها به این انتشار انجام نشد."), "error");
        return;
      }
      await loadRecordings("", true);
    } catch (error) {
      showToast(getApiErrorMessage(error, "صف بارگذاری به‌طور غیرمنتظره متوقف شد."), "error");
    } finally {
      setUploading(false);
      if (audioRef.current) audioRef.current.value = "";
    }
  };

  const addExisting = async () => {
    if (!release || !selectedExisting.length || !(await prepareServerMutation())) return;
    setSubmitting(true);
    try {
      const updated = await apiRequest<ArtistRelease>(`/artist/releases/${release.id}/tracks/`, { method: "POST", body: { action: "add", song_ids: selectedExisting, lock_version: releaseRef.current?.lock_version } });
      replaceRelease(updated);
      setExistingOpen(false);
      setSelectedExisting([]);
      showToast("ضبط‌های انتخاب‌شده بدون تغییر در انتشار زنده افزوده شدند.", "success");
      await loadRecordings("", true);
    } catch (error) {
      showToast(getApiErrorMessage(error, "افزودن ضبط‌های انتخاب‌شده انجام نشد."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeTrack = async (track: ReleaseTrackApi) => {
    if (!release || readOnly || submitting || !(await prepareServerMutation())) return;
    const activeTracks = release.tracks.filter((item) => item.status !== "deleted");
    const removesLastCollectionTrack = release.release_type !== "single" && activeTracks.length === 1 && activeTracks[0]?.id === track.id;
    setSubmitting(true);
    try {
      const updated = await apiRequest<ArtistRelease & { release_deleted?: boolean }>(`/artist/releases/${release.id}/tracks/`, {
        method: "DELETE",
        body: {
          song_ids: [track.id],
          lock_version: releaseRef.current?.lock_version,
          delete_empty_album: removesLastCollectionTrack,
        },
      });
      setTrackToRemove(null);
      if (updated.release_deleted) {
        showToast("آخرین ترک حذف و پیش‌نویس خالی انتشار نیز پاک شد.", "success");
        navigateTo("releases");
        return;
      }
      replaceRelease(updated);
      showToast("ترک از انتشار حذف شد و فایل آن در بخش ضبط‌ها باقی ماند.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "حذف ترک انجام نشد."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const reorder = async (trackId: number, direction: -1 | 1) => {
    if (!release || readOnly || !(await prepareServerMutation())) return;
    const current = [...release.track_ids];
    const index = current.indexOf(trackId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    const orderedTracks = current
      .map((id) => release.tracks.find((item) => item.id === id))
      .filter((item): item is ReleaseTrackApi => Boolean(item));
    mutateRelease((draft) => ({ ...draft, track_ids: current, tracks: orderedTracks }));
    try {
      const updated = await apiRequest<ArtistRelease>(`/artist/releases/${release.id}/tracks/`, { method: "POST", body: { action: "reorder", ordered_song_ids: current, lock_version: releaseRef.current?.lock_version } });
      replaceRelease(updated);
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره ترتیب جدید ترک‌ها انجام نشد."), "error");
      await loadRelease(true);
    }
  };

  const saveTrack = async (data: PartialSong) => {
    if (!editingTrack || !release || !(await prepareServerMutation())) return;
    setEditingSong(true);
    try {
      const form = new FormData();
      const scalarFields: Array<keyof PartialSong> = [
        "title", "title_en", "description", "description_en", "lyrics", "lyrics_en",
        "tempo", "energy", "danceability", "valence", "acousticness", "instrumentalness",
        "speechiness", "credits", "credits_en",
      ];
      scalarFields.forEach((field) => {
        const value = data[field];
        if (value !== undefined && value !== null) form.set(String(field), String(value));
      });
      if (release.release_type === "single") {
        form.set("title", release.title);
        form.set("title_en", release.title_en || "");
      }
      form.set("is_single", "false");
      form.set("live_performed", String(Boolean(data.live_performed ?? data.liveness)));
      form.set("save_as_draft", "true");
      const addArray = (key: string, values?: unknown[]) => {
        if (values?.length) values.forEach((value) => form.append(key, String(value)));
        else form.append(key, "");
      };
      addArray("featured_artist_ids", data.featured_artist_ids);
      if (data.audio_file) form.set("audio_file", data.audio_file);
      if (data.cover_image) form.set("cover_image", data.cover_image);
      await apiRequest(`/artist/songs/${editingTrack.id}/`, { method: "PATCH", body: form });
      setEditingTrack(null);
      showToast("جزئیات ترک ذخیره شد. دسته‌بندی‌های مشترک همچنان از طریق انتشار مدیریت می‌شوند.", "success");
      await loadRelease(true);
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره جزئیات ترک انجام نشد."), "error");
    } finally {
      setEditingSong(false);
    }
  };

  const updateTrackExtras = (trackId: number, patch: Partial<ReleaseTrackExtras>) => {
    if (!release) return;
    const current = release.track_extras?.[String(trackId)] || {};
    updateRelease("track_extras", { ...release.track_extras, [String(trackId)]: { ...current, ...patch } });
  };



  const uploadArtwork = async (sourceFile?: File) => {
    if (!sourceFile || !release || artworkBusy) return;
    const cropResult = await cropImage(sourceFile, {
      mode: "square",
      title: release.release_type === "single" ? "برش کاور تک‌آهنگ" : "برش کاور انتشار",
      description: "کاور انتشار باید کاملاً مربعی باشد. قاب را روی بخش نهایی تصویر تنظیم کنید.",
      maxSourceBytes: 40 * 1024 * 1024,
      maxOutputBytes: 9.5 * 1024 * 1024,
      maxOutputDimension: 3000,
    });
    if (!cropResult) {
      if (artworkRef.current) artworkRef.current.value = "";
      return;
    }
    const file = cropResult.file;

    clearArtworkPreview();
    const previewUrl = URL.createObjectURL(file);
    artworkPreviewRef.current = previewUrl;
    setArtworkUpload({ phase: "validating", percent: 0, previewUrl, message: "ابعاد مربعی کاور در حال بررسی است…" });

    if (!(await prepareServerMutation())) {
      clearArtworkPreview();
      setArtworkUpload({ phase: "error", percent: 0, message: "ذخیره آخرین تغییرات انتشار انجام نشد." });
      return;
    }

    try {
      const { width, height } = await readImageDimensions(file);
      if (width !== height) throw new Error("کاور باید مربعی باشد.");
      setArtworkUpload((current) => ({ ...current, phase: "uploading", percent: 0, message: "کاور در حال بارگذاری است…" }));
      const form = new FormData();
      form.set("cover_image", file);
      form.set("lock_version", String(releaseRef.current?.lock_version || release.lock_version));
      const updated = await apiUpload<ArtistRelease>(`/artist/releases/${release.id}/artwork/`, {
        body: form,
        onProgress: ({ percent, processing }) => setArtworkUpload((current) => ({
          ...current,
          phase: processing ? "processing" : "uploading",
          percent,
          message: processing ? "کاور در حال ثبت برای انتشار و آهنگ است…" : `کاور در حال بارگذاری است… ${percent.toLocaleString("fa-IR")}٪`,
        })),
      });
      replaceRelease(updated);
      clearArtworkPreview();
      setArtworkUpload({
        phase: "done",
        percent: 100,
        message: updated.release_type === "single"
          ? "کاور برای انتشار تک‌آهنگ و رکورد آهنگ ذخیره شد."
          : "کاور انتشار ذخیره شد و ترک‌های بدون کاور اختصاصی از آن استفاده می‌کنند.",
      });
      showToast(updated.release_type === "single" ? "کاور تک‌آهنگ برای انتشار و آهنگ ذخیره شد." : "کاور انتشار با موفقیت بارگذاری شد.", "success");
    } catch (error) {
      clearArtworkPreview();
      const message = getApiErrorMessage(error, error instanceof Error ? error.message : "بارگذاری کاور انتشار انجام نشد.");
      setArtworkUpload({ phase: "error", percent: 0, message });
      showToast(message, "error");
    } finally {
      if (artworkRef.current) artworkRef.current.value = "";
    }
  };

  const requestValidation = async () => {
    if (!release) throw new Error("پیش‌نویس انتشار در دسترس نیست.");
    const validation = await apiRequest<ArtistRelease["validation"]>(`/artist/releases/${release.id}/validate/`, { method: "POST", body: { lock_version: releaseRef.current?.lock_version } });
    mutateRelease((current) => ({ ...current, validation }));
    return validation;
  };

  const validateRelease = async () => {
    if (!release || submitting) return;
    setSubmitting(true);
    try {
      await persistLatestDraft(false);
      const validation = await requestValidation();
      if (validation.valid) showToast("اعتبارسنجی با موفقیت انجام شد و انتشار آماده ارسال است.", "success");
      else showToast(`${validation.errors.length.toLocaleString("fa-IR")} مورد مسدودکننده باید برطرف شود.`, "error");
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره و اعتبارسنجی آخرین تغییرات انتشار انجام نشد."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRelease = async () => {
    if (!release || submitting || release.status !== "draft") return;
    setSubmitting(true);
    try {
      await persistLatestDraft(false);
      const updated = await apiRequest<ArtistRelease>(`/artist/releases/${release.id}/submit/`, { method: "POST", body: { lock_version: releaseRef.current?.lock_version } });
      replaceRelease(updated);
      showToast("انتشار با موفقیت برای بررسی ارسال شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "ارسال انتشار انجام نشد. موارد مسدودکننده را بررسی کنید."), "error");
      try { await requestValidation(); } catch { /* Preserve the original submission error. */ }
    } finally {
      setSubmitting(false);
    }
  };

  const reopenForEdit = async () => {
    if (!release || !readOnly || cloning) return;
    setCloning(true);
    try {
      const updated = await apiRequest<ArtistRelease>(`/artist/releases/${release.id}/`, {
        method: "PATCH",
        body: {
          reopen_for_edit: true,
          confirm_re_review: true,
          lock_version: release.lock_version,
        },
      });
      replaceRelease(updated);
      setReviewEditConfirmOpen(false);
      showToast("انتشار برای ویرایش باز شد و دوباره در انتظار تأیید قرار گرفت.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "بازگرداندن انتشار به مرحله بررسی انجام نشد."), "error");
    } finally {
      setCloning(false);
    }
  };


  const filteredRecordings = useMemo(() => {
    const needle = recordingQuery.trim().toLowerCase();
    const inRelease = new Set(release?.track_ids || []);
    return recordings.filter((item) => !inRelease.has(item.id) && (!needle || [item.title, item.title_en, item.album_title, item.artist_name].filter(Boolean).join(" ").toLowerCase().includes(needle)));
  }, [recordingQuery, recordings, release?.track_ids]);

  const extrasTrack = release?.tracks.find((track) => track.id === extrasTrackId) || null;
  const extras = extrasTrack ? release?.track_extras?.[String(extrasTrack.id)] || extrasTrack.release_extras || {} : {};


  const focusIssue = (issue: ArtistRelease["validation"]["errors"][number]) => {
    if (issue.track_id) setExtrasTrackId(issue.track_id);
    if (issue.section === "tracklist") return goStep(2);
    if (["tracks", "audio", "rights", "credits"].includes(issue.section) && issue.track_id) return goStep(3);
    if (issue.section === "release" && /title|release type/i.test(issue.message)) return goStep(1);
    if (issue.section === "artwork" || (issue.section === "release" && /artwork|cover|date|copyright|territor/i.test(issue.message))) return goStep(2);
    if (["classification", "taxonomy", "shared"].includes(issue.section) || (issue.section === "release" && /genre|subgenre|mood|tag|language|label|composer|lyricist|producer/i.test(issue.message))) return goStep(4);
    return goStep(5);
  };

  if (loading || !release) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" /></div>;

  const stepContent = () => {
    if (currentStep === 1) return <section className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelClass}>عنوان انتشار (فارسی) *</label><input disabled={readOnly} className={inputClass} value={release.title} onChange={(event) => updateRelease("title", event.target.value)} placeholder="مثلاً شب‌های تهران" /></div>
            <div dir="ltr"><label className={`${labelClass} text-left`}>عنوان انگلیسی انتشار</label><input disabled={readOnly} className={`${inputClass} text-left`} value={release.title_en || ""} onChange={(event) => updateRelease("title_en", event.target.value)} placeholder="عنوان انگلیسی انتشار" /></div>
          </div>
          <div><label className={labelClass}>نوع انتشار</label><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{releaseTypeOptions.map((option) => <button disabled={readOnly} key={option.value} type="button" onClick={() => updateRelease("release_type", option.value)} className={`min-h-24 rounded-xl border p-4 text-right transition ${release.release_type === option.value ? "border-[#1DB954] bg-[#1DB954]/10" : "border-[#303030] bg-[#181818] hover:border-[#4a4a4a]"}`}><p className="font-black text-white" dir="ltr">{option.title}</p><p className="mt-1 text-xs text-[#777]">{option.description}</p></button>)}</div></div>
          <div><label className={labelClass}>سابقه انتشار</label><div className="grid gap-2 sm:grid-cols-2"><button disabled={readOnly} type="button" onClick={() => updateRelease("previously_released", false)} className={`rounded-xl border p-4 text-right ${!release.previously_released ? "border-[#1DB954] bg-[#1DB954]/10" : "border-[#303030] bg-[#181818]"}`}><p className="font-black text-white">انتشار جدید</p><p className="mt-1 text-xs text-[#777]">برای اولین‌بار منتشر می‌شود.</p></button><button disabled={readOnly} type="button" onClick={() => updateRelease("previously_released", true)} className={`rounded-xl border p-4 text-right ${release.previously_released ? "border-[#1DB954] bg-[#1DB954]/10" : "border-[#303030] bg-[#181818]"}`}><p className="font-black text-white">قبلاً منتشرشده</p><p className="mt-1 text-xs text-[#777]">ISRC و تاریخ اصلی را در مراحل بعد وارد کنید.</p></button></div></div>
        </div>
        <aside className="border-r border-[#292929] pr-5 max-lg:border-r-0 max-lg:border-t max-lg:pt-5 max-lg:pr-0">
          <p className="text-xs font-black text-[#777]">هنرمند اصلی</p>
          <div className="mt-3 flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#272727]">{release.primary_artist?.profile_image ? <img src={release.primary_artist.profile_image} alt="" className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-[#777]" />}</div><div><p className="font-black text-white">{release.primary_artist?.name}</p>{release.primary_artist?.name_en && <p className="text-xs text-[#777]" dir="ltr">{release.primary_artist.name_en}</p>}</div></div>
          <div className="mt-6 rounded-xl bg-[#1a1a1a] p-4 text-sm leading-6 text-[#909090]"><Info className="mb-2 h-5 w-5 text-[#1DB954]" />پیش‌نویس از همین حالا روی سرور ذخیره می‌شود. تا زمان ارسال نهایی هیچ آلبوم یا ترک جدیدی در اپ مخاطب نمایش داده نمی‌شود.</div>
        </aside>
      </div>
    </section>;

    if (currentStep === 2) return <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div>
          <label className={labelClass}>{release.release_type === "single" ? "کاور سینگل و آهنگ *" : "کاور انتشار *"}</label>
          <button disabled={readOnly || artworkBusy} onClick={() => artworkRef.current?.click()} className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-[#171717] transition disabled:cursor-not-allowed disabled:opacity-70 ${artworkUpload.phase === "error" ? "border-red-400/60" : artworkBusy || artworkUpload.phase === "done" ? "border-[#1DB954]" : "border-[#3b3b3b] hover:border-[#1DB954]"}`}>
            {(artworkUpload.previewUrl || release.release_metadata.cover_url) ? <img src={artworkUpload.previewUrl || resolveMediaUrl(release.release_metadata.cover_url)} alt="کاور انتشار" className="absolute inset-0 h-full w-full object-cover" /> : <div className="text-center"><ImagePlus className="mx-auto h-9 w-9 text-[#1DB954]" /><p className="mt-3 font-black text-white">بارگذاری کاور</p><p className="mt-1 text-xs text-[#777]">JPG، PNG یا WEBP تا ۱۰ مگابایت</p></div>}
            <span className="absolute inset-0 bg-black/0 transition hover:bg-black/20" />
            {artworkBusy && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-5 text-center backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-[#1DB954]" /><p className="mt-3 text-sm font-black text-white">{artworkUpload.phase === "validating" ? "بررسی تصویر" : artworkUpload.phase === "processing" ? "ثبت روی انتشار و آهنگ" : "در حال بارگذاری"}</p><p className="mt-1 text-xs text-[#b5b5b5]">{artworkUpload.message}</p><div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#1DB954] transition-all" style={{ width: `${artworkUpload.phase === "validating" ? 8 : Math.max(8, artworkUpload.percent)}%` }} /></div><span className="mt-2 text-xs font-black text-white">{artworkUpload.phase === "validating" ? "…" : `${artworkUpload.percent}%`}</span></div>}
          </button>
          <input ref={artworkRef} type="file" hidden accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { const file=event.target.files?.[0]; event.target.value=""; void uploadArtwork(file); }} />
          {artworkUpload.phase !== "idle" && !artworkBusy && <div className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${artworkUpload.phase === "done" ? "border-[#1DB954]/20 bg-[#1DB954]/10 text-[#9ee8b7]" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>{artworkUpload.phase === "done" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}<span>{artworkUpload.message}</span></div>}
          <p className="mt-2 text-xs leading-5 text-[#777]">{release.release_type === "single" ? "این کاور بلافاصله هم روی رکورد انتشار و هم روی رکورد همان آهنگ ذخیره می‌شود." : "این تصویر کاور پیش‌فرض مجموعه است؛ کاور اختصاصی هر ترک برای همان ترک اولویت دارد."}</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelClass}>تاریخ انتشار *</label><input disabled={readOnly} type="date" min={release.previously_released ? undefined : todayIso} dir="ltr" className={`${inputClass} text-left`} value={release.release_metadata.release_date || ""} onChange={(event) => updateMetadata({ release_date: event.target.value })} /></div>
            <div><label className={labelClass}>تاریخ انتشار اصلی</label><input disabled={readOnly} type="date" dir="ltr" className={`${inputClass} text-left`} value={release.release_metadata.original_release_date || ""} onChange={(event) => updateMetadata({ original_release_date: event.target.value })} /></div>
          </div>
          <p className="rounded-xl border border-[#303030] bg-[#181818] px-4 py-3 text-xs leading-5 text-[#8a8a8a]">تاریخ‌ها به‌صورت روز تقویمی ذخیره می‌شوند؛ اختلاف زمان هماهنگ جهانی سرور باعث خطای اشتباه «تاریخ آینده» نخواهد شد.</p>
          <div className="grid gap-4 md:grid-cols-2"><div><label className={labelClass}>℗ مالک ضبط</label><input disabled={readOnly} className={inputClass} value={release.release_metadata.p_copyright || ""} onChange={(event) => updateMetadata({ p_copyright: event.target.value })} placeholder="۱۴۰۵ هنرمند / ناشر" /></div><div><label className={labelClass}>© مالک اثر و کاور</label><input disabled={readOnly} className={inputClass} value={release.release_metadata.c_copyright || ""} onChange={(event) => updateMetadata({ c_copyright: event.target.value })} placeholder="۱۴۰۵ هنرمند / ناشر" /></div></div>
          <ChoiceChips label="قلمروها" options={["WORLDWIDE", "IR", "US", "CA", "EU", "UK", "AE", "TR"]} value={release.release_metadata.territories || []} onChange={(territories) => updateMetadata({ territories })} disabled={readOnly} />
          <div className="grid gap-4 lg:grid-cols-2"><div><label className={labelClass}>توضیحات انتشار (فارسی)</label><textarea disabled={readOnly} rows={3} className={`${inputClass} resize-y`} value={release.release_metadata.description || ""} onChange={(event) => updateMetadata({ description: event.target.value })} /></div><div dir="ltr"><label className={`${labelClass} text-left`}>توضیحات انگلیسی انتشار</label><textarea disabled={readOnly} rows={3} className={`${inputClass} resize-y text-left`} value={release.release_metadata.description_en || ""} onChange={(event) => updateMetadata({ description_en: event.target.value })} /></div></div>
        </div>
      </div>

      {!readOnly && <div className="grid gap-3 lg:grid-cols-2">
        <label onDragOver={(event) => { event.preventDefault(); if (!uploading) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!uploading) selectUploadFiles(Array.from(event.dataTransfer.files)); }} className={`flex min-h-40 cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-5 transition ${dragging ? "border-[#1DB954] bg-[#1DB954]/10" : "border-[#3a3a3a] bg-[#171717] hover:border-[#1DB954]/70"}`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1DB954]/10"><UploadCloud className="h-7 w-7 text-[#1DB954]" /></div>
          <div><p className="text-lg font-black text-white">بارگذاری ترک‌های جدید</p><p className="mt-1 text-sm leading-6 text-[#777]">برای آلبوم، مینی‌آلبوم و مجموعه گردآوری ابتدا عنوان هر فایل را وارد می‌کنید؛ نام فایل هیچ‌وقت به‌عنوان عنوان ترک ذخیره نمی‌شود.</p><button disabled={uploading} type="button" onClick={(event) => { event.preventDefault(); audioRef.current?.click(); }} className="mt-3 text-sm font-black text-[#1DB954] disabled:opacity-40">{uploading ? "در حال بارگذاری..." : "انتخاب فایل‌ها"}</button><input ref={audioRef} type="file" multiple={release.release_type !== "single"} accept=".mp3,.wav,audio/mpeg,audio/wav" hidden onChange={(event) => selectUploadFiles(Array.from(event.target.files || []))} /></div>
        </label>
        <button type="button" onClick={() => setExistingOpen(true)} className="flex min-h-40 items-center gap-4 rounded-2xl border border-[#333] bg-[#171717] p-5 text-right transition hover:border-[#1DB954]/70"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10"><Library className="h-7 w-7 text-blue-300" /></div><div><p className="text-lg font-black text-white">افزودن از ضبط‌ها</p><p className="mt-1 text-sm leading-6 text-[#777]">پیش‌نویس‌ها یا آثار موجود را بدون نمایش در اپ مخاطب به این انتشار اضافه کنید.</p><p className="mt-3 text-sm font-black text-blue-300">جستجو در آرشیو</p></div></button>
      </div>}

      {uploadProgress.length > 0 && <div className="divide-y divide-[#2b2b2b] rounded-xl border border-[#2b2b2b] bg-[#171717]">{uploadProgress.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242424]">{["uploading", "processing"].includes(item.state) ? <Loader2 className="h-4 w-4 animate-spin text-[#1DB954]" /> : item.state === "done" ? <Check className="h-4 w-4 text-[#1DB954]" /> : item.state === "error" ? <AlertCircle className="h-4 w-4 text-red-300" /> : <FileAudio className="h-4 w-4 text-[#777]" />}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold text-white">{item.name}</p><span className="text-xs font-black text-[#aaa]">{item.state === "processing" ? "در حال پردازش فایل…" : item.state === "done" ? "100%" : item.state === "error" ? "ناموفق" : `${item.percent}%`}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#292929]"><div className={`h-full rounded-full transition-all ${item.state === "error" ? "bg-red-400" : "bg-[#1DB954]"}`} style={{ width: `${item.percent}%` }} /></div>{item.message && <p className={`mt-1 text-xs ${item.state === "error" ? "text-red-300" : "text-[#777]"}`}>{item.message}</p>}</div></div>)}</div>}
      <TrackList release={release} readOnly={readOnly} onEdit={(track) => { setEditingTrack(track); setExtrasTrackId(track.id); }} onRemove={(id) => setTrackToRemove(release.tracks.find((track) => track.id === id) || null)} onMove={(id, direction) => void reorder(id, direction)} />
    </section>;

    if (currentStep === 3) return <section className="space-y-4">
      <div className="rounded-xl border border-[#303030] bg-[#181818] p-4"><h2 className="font-black text-white">جزئیات اختصاصی هر ترک</h2><p className="mt-1 text-sm leading-6 text-[#858585]">از ستون ترک‌ها یک مورد را انتخاب کنید. عنوان، عوامل مهمان و کاور اختصاصی در فرم همان ترک ذخیره می‌شوند و روی بقیه ترک‌ها اثر نمی‌گذارند.</p></div>
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-fit overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#161616] xl:sticky xl:top-4">
          <div className="border-b border-[#292929] px-4 py-3 text-xs font-black text-[#777]">ترک‌های انتشار</div>
          <div className="max-h-[560px] space-y-1 overflow-y-auto p-2">{release.tracks.map((track, index) => { const active = track.id === extrasTrack?.id; return <button key={track.id} type="button" onClick={() => setExtrasTrackId(track.id)} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-right transition ${active ? "border-[#1DB954] bg-[#1DB954]/10" : "border-transparent hover:bg-[#202020]"}`}><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252525]">{track.cover_image ? <img src={resolveMediaUrl(track.cover_image)} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5 text-[#666]" />}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-black text-[#1DB954]">ترک {index + 1}</p><p className="truncate font-black text-white">{track.title}</p>{track.title_en && <p className="truncate text-xs text-[#707070]" dir="ltr">{track.title_en}</p>}</div>{active && <Check className="h-4 w-4 shrink-0 text-[#1DB954]" />}</button>; })}</div>
          {!release.tracks.length && <div className="p-8 text-center text-sm text-[#777]">ابتدا در مرحله قبل ترک اضافه کنید.</div>}
        </div>

        <div className="min-h-[360px] rounded-2xl border border-[#2f2f2f] bg-[#161616] p-4 sm:p-5">
          {extrasTrack ? <div className="space-y-5">
            <header className="flex flex-col gap-4 border-b border-[#292929] pb-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#242424]">{extrasTrack.cover_image ? <img src={resolveMediaUrl(extrasTrack.cover_image)} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-8 w-8 text-[#666]" />}</div>
              <div className="min-w-0 flex-1"><p className="text-xs font-black text-[#1DB954]">ترک انتخاب‌شده · ترک {release.track_ids.indexOf(extrasTrack.id) + 1}</p><h3 className="mt-1 truncate text-xl font-black text-white">{extrasTrack.title}</h3>{extrasTrack.title_en && <p className="mt-1 truncate text-sm text-[#777]" dir="ltr">{extrasTrack.title_en}</p>}<div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#252525] px-2.5 py-1 text-[11px] font-bold text-[#aaa]">{extrasTrack.featured_artists?.length || 0} هنرمند مهمان</span><span className="rounded-full bg-[#252525] px-2.5 py-1 text-[11px] font-bold text-[#aaa]">{extrasTrack.own_cover_image ? "کاور اختصاصی" : "کاور انتشار"}</span></div></div>
              <button disabled={readOnly} onClick={() => setEditingTrack(extrasTrack)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-50"><Settings2 className="h-4 w-4" />ویرایش کامل ترک</button>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className={labelClass}>ISRC</label><input disabled={readOnly} dir="ltr" className={`${inputClass} text-left`} value={String(extras.isrc || "")} onChange={(event) => updateTrackExtras(extrasTrack.id, { isrc: event.target.value.toUpperCase() })} placeholder="IR-XXX-26-00001" /></div>
              <div><label className={labelClass}>نسخه</label><input disabled={readOnly} className={inputClass} value={String(extras.version || "")} onChange={(event) => updateTrackExtras(extrasTrack.id, { version: event.target.value })} placeholder="نسخه اصلی / آکوستیک / ریمیکس" /></div>
              <div><label className={labelClass}>مالک نشر</label><input disabled={readOnly} className={inputClass} value={String(extras.publishing_owner || "")} onChange={(event) => updateTrackExtras(extrasTrack.id, { publishing_owner: event.target.value })} /></div>
              <div><label className={labelClass}>شروع پیش‌نمایش (ثانیه)</label><input disabled={readOnly} type="number" min={0} max={Math.max(0, Number(extrasTrack.duration_seconds || 1) - 1)} className={inputClass} value={Number(extras.preview_start || 0)} onChange={(event) => updateTrackExtras(extrasTrack.id, { preview_start: Number(event.target.value) })} /></div>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-[#333] bg-[#1a1a1a] p-4"><span><span className="block text-sm font-black text-white">محتوای صریح</span><span className="mt-1 block text-xs text-[#777]">محتوای صریح برای همین ترک</span></span><input disabled={readOnly} type="checkbox" checked={Boolean(extras.explicit)} onChange={(event) => updateTrackExtras(extrasTrack.id, { explicit: event.target.checked })} className="h-5 w-5 accent-[#1DB954]" /></label>
          </div> : <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><Music2 className="h-10 w-10 text-[#555]" /><p className="mt-3 font-black text-white">یک ترک انتخاب کنید</p><p className="mt-1 text-sm text-[#777]">جزئیات ترک انتخاب‌شده در این بخش نمایش داده می‌شود.</p></div>}
        </div>
      </div>
    </section>;

    if (currentStep === 4) return <section className="space-y-6">
      <div className="rounded-xl border border-[#1DB954]/20 bg-[#1DB954]/10 p-4"><h2 className="font-black text-white">یک منبع کامل برای دسته‌بندی و عوامل</h2><p className="mt-1 text-sm leading-6 text-emerald-100">این اطلاعات دست‌نویس به‌صورت خودکار روی همه ترک‌های این انتشار استفاده می‌شود؛ نیازی به ورود دوباره، کپی از فایل یا کپی بین ترک‌ها نیست.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><label className={labelClass}>زبان</label><select disabled={readOnly} className={inputClass} value={release.shared_metadata.language || "fa"} onChange={(event) => updateShared({ language: event.target.value })}><option value="fa">فارسی</option><option value="en">انگلیسی</option><option value="ar">عربی</option><option value="other">سایر</option></select></div>
        <div><label className={labelClass}>لیبل (فارسی)</label><input disabled={readOnly} className={inputClass} value={release.shared_metadata.label || ""} onChange={(event) => updateShared({ label: event.target.value })} /></div>
        <div dir="ltr"><label className={`${labelClass} text-left`}>نام انگلیسی ناشر</label><input disabled={readOnly} className={`${inputClass} text-left`} value={release.shared_metadata.label_en || ""} onChange={(event) => updateShared({ label_en: event.target.value })} /></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TaxonomySelector label="ژانرها *" items={taxonomies.genres} value={release.shared_metadata.genre_ids} onChange={(value) => updateShared({ genre_ids: value })} disabled={readOnly} />
        <TaxonomySelector label="زیرژانرها" items={taxonomies.subgenres} value={release.shared_metadata.sub_genre_ids} onChange={(value) => updateShared({ sub_genre_ids: value })} disabled={readOnly} />
        <TaxonomySelector label="حال‌وهوا" items={taxonomies.moods} value={release.shared_metadata.mood_ids} onChange={(value) => updateShared({ mood_ids: value })} disabled={readOnly} />
        <TaxonomySelector label="تگ‌ها" items={taxonomies.tags} value={release.shared_metadata.tag_ids} onChange={(value) => updateShared({ tag_ids: value })} disabled={readOnly} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {([ ["producers", "تهیه‌کنندگان"], ["composers", "آهنگسازان"], ["lyricists", "ترانه‌سرایان"], ["producers_en", "تهیه‌کنندگان به انگلیسی"], ["composers_en", "آهنگسازان به انگلیسی"], ["lyricists_en", "ترانه‌سرایان به انگلیسی"] ] as const).map(([key, label]) => <div key={key} dir={key.endsWith("_en") ? "ltr" : "rtl"}><label className={`${labelClass} ${key.endsWith("_en") ? "text-left" : ""}`}>{label}</label><input disabled={readOnly} className={`${inputClass} ${key.endsWith("_en") ? "text-left" : ""}`} value={listText(release.shared_metadata[key])} onChange={(event) => updateShared({ [key]: textList(event.target.value) } as Partial<SharedMetadata>)} placeholder={key.endsWith("_en") ? "نام‌ها را با ویرگول جدا کنید" : "نام‌ها را با ویرگول جدا کنید"} /></div>)}
      </div>
    </section>;



    return <section className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
      ["اطلاعات انتشار", release.validation.summary.release_information, release.title],
      ["کاور", release.validation.summary.artwork, release.validation.summary.artwork ? "آماده" : "نیاز به تکمیل"],
      ["ترک‌لیست", release.validation.summary.track_count > 0, `${release.validation.summary.track_count} ترک`],
      ["فایل‌های صوتی", release.validation.summary.audio_passed, release.validation.summary.audio_passed ? "تأیید شد" : "ناقص"],
      ["متادیتای ترک‌ها", release.validation.summary.complete_tracks === release.validation.summary.track_count && release.validation.summary.track_count > 0, `${release.validation.summary.complete_tracks}/${release.validation.summary.track_count} کامل`],
      ["حقوق", release.validation.summary.rights_warnings === 0, `${release.validation.summary.rights_warnings} هشدار`],
    ].map(([label, complete, value]) => <div key={String(label)} className="flex items-center gap-3 border-b border-[#292929] bg-[#171717] p-4 sm:rounded-xl sm:border"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${complete ? "bg-[#1DB954]/10 text-[#1DB954]" : "bg-amber-500/10 text-amber-300"}`}>{complete ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}</span><div><p className="text-xs text-[#777]">{label}</p><p className="mt-1 font-black text-white">{value}</p></div></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><div><div className="mb-3 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-300" /><h3 className="font-black text-white">خطاهای مسدودکننده</h3><span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-black text-red-300">{release.validation.errors.length}</span></div><div className="space-y-2">{release.validation.errors.length ? release.validation.errors.map((issue, index) => <button key={`${issue.message}-${index}`} onClick={() => focusIssue(issue)} className="flex w-full items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-right"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><span className="text-sm leading-6 text-red-100">{toPersianMessage(issue.message, "بررسی این مورد الزامی است.")}</span></button>) : <div className="rounded-xl border border-[#1DB954]/15 bg-[#1DB954]/10 p-4 text-sm text-emerald-100">هیچ خطای مسدودکننده‌ای وجود ندارد.</div>}</div></div><div><div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h3 className="font-black text-white">هشدارها</h3><span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-black text-amber-300">{release.validation.warnings.length}</span></div><div className="space-y-2">{release.validation.warnings.length ? release.validation.warnings.map((issue, index) => <button key={`${issue.message}-${index}`} onClick={() => focusIssue(issue)} className="flex w-full items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-500/10 p-3 text-right"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><span className="text-sm leading-6 text-amber-100">{toPersianMessage(issue.message, "بررسی این مورد الزامی است.")}</span></button>) : <div className="rounded-xl border border-[#303030] bg-[#171717] p-4 text-sm text-[#888]">هشداری وجود ندارد.</div>}</div></div></div>
      {release.status === "draft" && <div className="flex flex-col gap-3 rounded-2xl border border-[#303030] bg-[#171717] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-white">آماده ارسال نهایی هستید؟</h3><p className="mt-1 text-sm text-[#777]">بعد از ارسال، ساختار انتشار قفل می‌شود و همه ترک‌ها برای بررسی به در انتظار بررسی می‌روند.</p></div><div className="flex gap-2"><button disabled={submitting} onClick={() => void validateRelease()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#222] px-4 py-3 font-black text-white"><RefreshCw className={`h-4 w-4 ${submitting ? "animate-spin" : ""}`} />اعتبارسنجی دوباره</button><button disabled={submitting || !release.validation.valid} onClick={() => void submitRelease()} className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-3 font-black text-black disabled:opacity-40">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}ارسال برای بررسی</button></div></div>}
      {pendingReviewEdit && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" /><div><h3 className="font-black text-white">تغییرات در انتظار بررسی است</h3><p className="mt-1 text-sm leading-6 text-[#aaa]">همه تغییرات این صفحه خودکار ذخیره می‌شوند. انتشار و ترک‌های تغییرکرده تا تأیید دوباره منتشر نمی‌شوند.</p></div></div></div>}
      {readOnly && <div className="flex flex-col gap-4 rounded-2xl border border-[#1DB954]/15 bg-[#1DB954]/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#1DB954]" /><div><h3 className="font-black text-white">وضعیت: {releaseStatusLabels[release.status]}</h3><p className="mt-1 text-sm leading-6 text-[#9a9a9a]">{release.review_note || "برای ویرایش، انتشار باید دوباره به صف بررسی برگردد."}</p>{release.status === "scheduled" && release.scheduled_at && <p className="mt-2 text-xs font-bold text-blue-200">زمان انتشار: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeStyle: "short" }).format(new Date(release.scheduled_at))}</p>}</div></div><button disabled={cloning} onClick={() => setReviewEditConfirmOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-50">{cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}ویرایش و ارسال دوباره</button></div>}
    </section>;
  };

  return <div id="release-composer-top" className="min-h-full w-full pb-28" dir="rtl">
    <header className="sticky top-0 z-30 border-b border-[#272727] bg-[#101010]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="mx-auto flex max-w-[1500px] items-center gap-3"><button onClick={() => void leaveComposer()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222] text-white hover:bg-[#2d2d2d]"><ArrowRight className="h-5 w-5" /></button><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-black text-white sm:text-xl">{release.title || "انتشار بدون عنوان"}</h1><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${readOnly ? "bg-amber-500/10 text-amber-300" : "bg-white/10 text-[#aaa]"}`}>{releaseStatusLabels[release.status]}</span></div><div className="mt-1 flex items-center gap-2 text-[11px] text-[#6f6f6f]">{saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-[#1DB954]" />در حال ذخیره...</> : <><CloudUpload className="h-3.5 w-3.5 text-[#1DB954]" />ذخیره خودکار{savedAt ? ` · ${savedAt}` : ""}</>}</div></div><button disabled={saving || submitting || uploading || artworkBusy} onClick={() => void refreshComposer()} className="flex h-10 disabled:opacity-40 w-10 items-center justify-center rounded-xl bg-[#222] text-white"><RefreshCw className="h-4 w-4" /></button></div></header>

    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8"><nav className="mb-6 overflow-x-auto"><div className="flex min-w-max items-center gap-1 rounded-xl bg-[#171717] p-1 lg:min-w-0">{stepNames.map((name, index) => { const step = index + 1; const active = currentStep === step; const done = step < currentStep; return <button key={name} disabled={uploading || artworkBusy} onClick={() => goStep(step)} className={`flex min-w-36 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-right transition ${active ? "bg-white text-black" : "text-[#858585] hover:bg-[#222] hover:text-white"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${done ? "bg-[#1DB954] text-black" : active ? "bg-black text-white" : "bg-[#292929]"}`}>{done ? <Check className="h-3.5 w-3.5" /> : step}</span><span className="truncate text-xs font-black">{name}</span></button>; })}</div></nav><main className="rounded-2xl border border-[#292929] bg-[#131313] p-4 sm:p-5 lg:p-6">{stepContent()}</main></div>

    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#292929] bg-[#101010]/96 px-4 py-3 backdrop-blur-xl sm:px-6 lg:pr-[calc(16rem+1.5rem)]"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3"><button disabled={currentStep === 1 || uploading || artworkBusy || submitting} onClick={() => goStep(currentStep - 1)} className="inline-flex items-center gap-2 rounded-xl border border-[#343434] bg-[#1d1d1d] px-4 py-2.5 font-black text-white disabled:opacity-30"><ArrowRight className="h-4 w-4" />قبلی</button><div className="hidden text-xs text-[#6f6f6f] sm:block">مرحله {currentStep} از 5 · {release.tracks.length} ترک</div>{currentStep < 5 ? <button disabled={uploading || artworkBusy || submitting} onClick={() => goStep(currentStep + 1)} className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black">بعدی<ArrowLeft className="h-4 w-4" /></button> : pendingReviewEdit ? <span className="rounded-xl bg-amber-400/10 px-4 py-2.5 text-sm font-black text-amber-300">در انتظار بررسی</span> : <button disabled={readOnly || submitting || uploading || artworkBusy || !release.validation.valid} onClick={() => void submitRelease()} className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-40"><Send className="h-4 w-4" />ارسال نهایی</button>}</div></footer>

    {pendingUploads.length > 0 && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/85 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-[#303030] bg-[#121212] sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#292929] p-4 sm:p-5"><div><h2 className="text-xl font-black text-white">عنوان ترک‌ها قبل از بارگذاری</h2><p className="mt-1 text-sm leading-6 text-[#818181]">برای هر فایل حداقل عنوان فارسی یا انگلیسی را وارد کنید. این مقادیر مستقیماً در متادیتای همان آهنگ ذخیره می‌شوند.</p></div><button disabled={uploading} onClick={() => setPendingUploads([])} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#252525] text-white disabled:opacity-40"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">{pendingUploads.map((item, index) => <article key={item.id} className="rounded-2xl border border-[#303030] bg-[#181818] p-4"><div className="mb-3 flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252525] text-sm font-black text-[#1DB954]">{index + 1}</span><div className="min-w-0"><p className="truncate font-black text-white">{item.file.name}</p><p className="mt-1 text-xs text-[#777]">{humanBytes(item.file.size)} · عنوان فقط از ورودی دستی شما ذخیره می‌شود</p></div></div><div className="grid gap-3 md:grid-cols-2"><div><label className={labelClass}>عنوان فارسی</label><input autoFocus={index === 0} className={inputClass} value={item.title} onChange={(event) => setPendingUploads((current) => current.map((row) => row.id === item.id ? { ...row, title: event.target.value } : row))} placeholder="عنوان واقعی ترک" /></div><div dir="ltr"><label className={`${labelClass} text-left`}>عنوان انگلیسی ترک</label><input className={`${inputClass} text-left`} value={item.title_en} onChange={(event) => setPendingUploads((current) => current.map((row) => row.id === item.id ? { ...row, title_en: event.target.value } : row))} placeholder="عنوان واقعی ترک" /></div></div>{!item.title.trim() && !item.title_en.trim() && <p className="mt-2 text-xs font-bold text-amber-300">حداقل یکی از دو عنوان الزامی است.</p>}</article>)}</div>
        <footer className="flex items-center justify-between gap-3 border-t border-[#292929] p-4 sm:p-5"><p className="text-xs text-[#777]">{pendingUploads.length} فایل آماده بارگذاری</p><div className="flex gap-2"><button disabled={uploading} onClick={() => setPendingUploads([])} className="rounded-xl border border-[#343434] bg-[#202020] px-4 py-2.5 font-black text-white disabled:opacity-40">انصراف</button><button disabled={uploading || pendingUploads.some((item) => !item.title.trim() && !item.title_en.trim())} onClick={() => void uploadFiles(pendingUploads)} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-40"><UploadCloud className="h-4 w-4" />شروع بارگذاری</button></div></footer>
      </div>
    </div>}

    <SongModal
      isOpen={Boolean(editingTrack)}
      onClose={() => !editingSong && setEditingTrack(null)}
      onSubmit={saveTrack}
      initialData={editingTrack ? mapTrackToSong(editingTrack) : null}
      initialIsSingle={false}
      isSubmitting={editingSong}
      releaseMode
      fixedTitle={release.release_type === "single" ? { title: release.title, title_en: release.title_en } : undefined}
      fixedReleaseDate={release.release_metadata.release_date}
      submitLabel="ذخیره جزئیات ترک"
    />


    <ConfirmModal
      open={reviewEditConfirmOpen}
      title="ویرایش انتشار منتشرشده"
      description="با ادامه، انتشار و ترک‌های وابسته دوباره در انتظار تأیید قرار می‌گیرند و تغییرات تا تأیید مدیر در اپ نمایش داده نمی‌شوند."
      confirmLabel="باز کردن برای ویرایش"
      cancelLabel="انصراف"
      loading={cloning}
      onCancel={() => !cloning && setReviewEditConfirmOpen(false)}
      onConfirm={() => void reopenForEdit()}
    />

    <ConfirmModal
      open={Boolean(trackToRemove)}
      title="حذف ترک از انتشار"
      description={trackToRemove ? `${trackToRemove.title} از این انتشار حذف می‌شود، اما فایل ضبط‌شده در بخش آهنگ‌ها باقی می‌ماند.${release.release_type !== "single" && release.tracks.filter((track) => track.status !== "deleted").length === 1 ? " این آخرین ترک فعال انتشار است؛ با حذف آن، پیش‌نویس انتشار نیز حذف خواهد شد." : ""}` : ""}
      confirmLabel="حذف از انتشار"
      cancelLabel="انصراف"
      tone="danger"
      loading={submitting}
      onCancel={() => !submitting && setTrackToRemove(null)}
      onConfirm={() => { if (trackToRemove) void removeTrack(trackToRemove); }}
    />

    {existingOpen && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"><div className="flex h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-[#303030] bg-[#121212] sm:rounded-3xl"><header className="flex items-center justify-between border-b border-[#292929] p-4 sm:px-5"><div><h2 className="text-xl font-black text-white">افزودن از ضبط‌ها</h2><p className="mt-1 text-xs text-[#777]">انتخاب آثار منتشرشده، منتشرنشده یا پیش‌نویس</p></div><button onClick={() => setExistingOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252525] text-white"><X className="h-5 w-5" /></button></header><div className="border-b border-[#292929] p-4"><div className="relative"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]" /><input className={`${inputClass} pr-11`} value={recordingQuery} onChange={(event) => setRecordingQuery(event.target.value)} placeholder="جستجو در ضبط‌ها" /></div></div><div className="flex-1 overflow-y-auto p-3 sm:p-4">{recordingsLoading ? <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1DB954]" /></div> : <><div className="space-y-1">{filteredRecordings.map((track) => <label key={track.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selectedExisting.includes(track.id) ? "border-[#1DB954] bg-[#1DB954]/10" : "border-transparent hover:bg-[#1c1c1c]"}`}><input type="checkbox" checked={selectedExisting.includes(track.id)} onChange={() => setSelectedExisting((current) => current.includes(track.id) ? current.filter((id) => id !== track.id) : [...current, track.id])} className="h-5 w-5 accent-[#1DB954]" /><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[#252525]">{track.cover_image ? <img src={resolveMediaUrl(track.cover_image)} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5 text-[#666]" />}</div><div className="min-w-0 flex-1"><p className="truncate font-black text-white">{track.title}</p><p className="mt-1 truncate text-xs text-[#777]">{track.album_title || (track.status === "published" ? "تک‌آهنگ منتشرشده" : track.status === "draft" ? "اطلاعات پیش‌نویس" : "منتشرنشده")}</p></div><span className="rounded-full bg-[#252525] px-2.5 py-1 text-[10px] font-bold text-[#aaa]">{trackStatusLabel(track.status)}</span></label>)}</div>{!filteredRecordings.length && <div className="py-16 text-center text-sm text-[#777]">ضبطی پیدا نشد.</div>}</>}</div><footer className="flex items-center justify-between border-t border-[#292929] p-4"><p className="text-xs text-[#777]">{selectedExisting.length} انتخاب‌شده</p><button disabled={!selectedExisting.length || submitting} onClick={() => void addExisting()} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-40">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}افزودن</button></footer></div></div>}
  </div>;
};

const TrackList: React.FC<{ release: ArtistRelease; readOnly: boolean; onEdit: (track: ReleaseTrackApi) => void; onSelectExtras?: (id: number) => void; onRemove: (id: number) => void; onMove: (id: number, direction: -1 | 1) => void }> = ({ release, readOnly, onEdit, onSelectExtras, onRemove, onMove }) => <div className="overflow-hidden rounded-2xl border border-[#2c2c2c] bg-[#161616]"><div className="hidden grid-cols-[48px_minmax(240px,1fr)_130px_160px_130px] gap-3 border-b border-[#292929] px-4 py-3 text-xs font-black text-[#666] lg:grid"><span>#</span><span>ترک</span><span>فایل</span><span>متادیتا</span><span className="text-left">عملیات</span></div><div className="divide-y divide-[#292929]">{release.tracks.map((track, index) => { const complete = track.metadata_completion >= 80; return <article key={track.id} onClick={() => onSelectExtras?.(track.id)} className="grid gap-3 p-3 transition hover:bg-[#1c1c1c] lg:grid-cols-[48px_minmax(240px,1fr)_130px_160px_130px] lg:items-center lg:px-4"><div className="flex items-center gap-1"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#242424] text-sm font-black text-white">{index + 1}</span></div><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#252525]">{track.cover_image ? <img src={resolveMediaUrl(track.cover_image)} alt="" className="h-full w-full object-cover" /> : <FileAudio className="h-5 w-5 text-[#666]" />}</div><div className="min-w-0"><p className="truncate font-black text-white">{track.title}</p>{track.title_en && <p className="truncate text-xs text-[#727272]" dir="ltr">{track.title_en}</p>}<p className="mt-1 text-[11px] text-[#656565]">{track.duration_display || "0:00"} · {(track.original_format || "audio").toUpperCase()} · {trackStatusLabel(track.status)}</p></div></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${track.has_audio ? "bg-[#1DB954]/10 text-[#1DB954]" : "bg-red-500/10 text-red-300"}`}>{track.has_audio ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{track.has_audio ? "فایل صوتی معتبر" : "فایل صوتی موجود نیست"}</span><div><div className="mb-1 flex items-center justify-between text-[11px]"><span className={complete ? "text-[#1DB954]" : "text-amber-300"}>{track.metadata_completion}%</span><span className="text-[#666]">{complete ? "آماده" : track.missing_metadata?.slice(0, 2).map(missingMetadataLabel).join("، ") || "ناقص"}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292929]"><div className={`h-full rounded-full ${complete ? "bg-[#1DB954]" : "bg-amber-400"}`} style={{ width: `${track.metadata_completion}%` }} /></div></div><div className="flex justify-end gap-1"><button disabled={readOnly || index === 0} onClick={(event) => { event.stopPropagation(); onMove(track.id, -1); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777] hover:bg-[#2a2a2a] hover:text-white disabled:opacity-20"><ArrowUp className="h-4 w-4" /></button><button disabled={readOnly || index === release.tracks.length - 1} onClick={(event) => { event.stopPropagation(); onMove(track.id, 1); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777] hover:bg-[#2a2a2a] hover:text-white disabled:opacity-20"><ArrowDown className="h-4 w-4" /></button><button onClick={(event) => { event.stopPropagation(); onEdit(track); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aaa] hover:bg-[#2a2a2a] hover:text-white"><Settings2 className="h-4 w-4" /></button>{!readOnly && <button onClick={(event) => { event.stopPropagation(); onRemove(track.id); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777] hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>}</div></article>; })}</div>{!release.tracks.length && <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center"><Disc3 className="h-10 w-10 text-[#555]" /><p className="mt-3 font-black text-white">ترکی به انتشار اضافه نشده است</p><p className="mt-1 text-sm text-[#707070]">فایل‌های جدید را بارگذاری کنید یا از ضبط‌ها انتخاب کنید.</p></div>}</div>;

const TaxonomySelector: React.FC<{ label: string; items: TaxonomyOption[]; value: number[]; onChange: (value: number[]) => void; disabled?: boolean }> = ({ label, items, value, onChange, disabled }) => <div><label className={labelClass}>{label}</label><div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[#303030] bg-[#181818] p-3">{items.map((item) => { const active = value.includes(item.id); return <button disabled={disabled} type="button" key={item.id} onClick={() => onChange(active ? value.filter((id) => id !== item.id) : [...value, item.id])} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? "bg-[#1DB954] text-black" : "bg-[#252525] text-[#aaa] hover:text-white"}`}>{item.title || item.name}</button>; })}</div></div>;

const ChoiceChips: React.FC<{ label: string; options: string[]; value: string[]; onChange: (value: string[]) => void; disabled?: boolean }> = ({ label, options, value, onChange, disabled }) => <div><label className={labelClass}>{label}</label><div className="flex flex-wrap gap-2 rounded-xl border border-[#303030] bg-[#181818] p-3">{options.map((option) => { const active = value.includes(option); return <button disabled={disabled} key={option} type="button" onClick={() => onChange(active ? value.filter((item) => item !== option) : [...value, option])} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? "bg-[#1DB954] text-black" : "bg-[#252525] text-[#aaa]"}`} dir="ltr">{option}</button>; })}</div></div>;


export default ReleaseComposer;
