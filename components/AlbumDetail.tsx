import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  Check,
  Coins,
  Disc3,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  Music2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import { useImageCropper } from "../contexts/ImageCropperContext";
import { apiRequest, fetchAllPages, getApiErrorMessage, unwrapList } from "../lib/api";
import ConfirmModal from "./ConfirmModal";
import type { TaxonomyOption } from "./types";

interface AlbumDetailProps {
  albumId?: string | number;
  initialEdit?: boolean;
}

interface AlbumSong {
  id: number;
  title: string;
  title_en?: string;
  display_title?: string;
  cover_image?: string;
  duration_display?: string;
  plays?: number | string;
  likes_count?: number;
  status?: string;
  album_id?: number | null;
  is_single?: boolean;
}

interface AlbumData {
  id: number;
  title: string;
  title_en?: string;
  artist_name?: string;
  cover_image?: string;
  release_date?: string | null;
  description?: string;
  description_en?: string;
  likes_count?: number;
  songs_count?: number;
  songs?: AlbumSong[];
  genre_items?: TaxonomyOption[];
  sub_genre_items?: TaxonomyOption[];
  mood_items?: TaxonomyOption[];
  is_deleted?: boolean;
  active_songs_count?: number;
  deleted_songs_count?: number;
  published_songs_count?: number;
  total_streams?: number;
  total_income?: string | number;
  total_duration_seconds?: number;
}

interface AlbumForm {
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  release_date: string;
  genre_ids: number[];
  sub_genre_ids: number[];
  mood_ids: number[];
}

const emptyForm: AlbumForm = {
  title: "",
  title_en: "",
  description: "",
  description_en: "",
  release_date: "",
  genre_ids: [],
  sub_genre_ids: [],
  mood_ids: [],
};

const inputClass =
  "w-full rounded-xl border border-[#393939] bg-[#202020] px-4 py-3 text-white outline-none transition placeholder:text-[#656565] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/15";

const compactNumber = (value: number | string | undefined) => new Intl.NumberFormat("fa-IR", {
  notation: "compact",
  maximumFractionDigits: 1,
}).format(Number(value || 0));
const exactMoney = (value: number | string | undefined) => `${new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 8,
}).format(Number(value || 0))} تومان`;
const durationLabel = (seconds?: number) => {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours} ساعت و ${minutes} دقیقه` : `${minutes} دقیقه`;
};

const AlbumDetail: React.FC<AlbumDetailProps> = ({ albumId, initialEdit = false }) => {
  const { goBack, navigateTo } = useNavigation();
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [taxonomies, setTaxonomies] = useState({
    genres: [] as TaxonomyOption[],
    subgenres: [] as TaxonomyOption[],
    moods: [] as TaxonomyOption[],
  });
  const [allSongs, setAllSongs] = useState<AlbumSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [managingSongs, setManagingSongs] = useState(false);
  const [editing, setEditing] = useState(initialEdit);
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [songSearch, setSongSearch] = useState("");
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
  const [songAction, setSongAction] = useState<{ song: AlbumSong; mode: "detach" | "delete" } | null>(null);
  const [deleteAlbumOpen, setDeleteAlbumOpen] = useState(false);
  const [form, setForm] = useState<AlbumForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const numericAlbumId = Number(albumId);
  const validAlbumId = Number.isInteger(numericAlbumId) && numericAlbumId > 0;

  const populateForm = useCallback((value: AlbumData) => {
    setForm({
      title: value.title || "",
      title_en: value.title_en || "",
      description: value.description || "",
      description_en: value.description_en || "",
      release_date: value.release_date || "",
      genre_ids: (value.genre_items || []).map((item) => Number(item.id)),
      sub_genre_ids: (value.sub_genre_items || []).map((item) => Number(item.id)),
      mood_ids: (value.mood_items || []).map((item) => Number(item.id)),
    });
    setCoverPreview(value.cover_image || "");
    setCoverFile(null);
  }, []);

  const load = useCallback(
    async (quiet = false) => {
      if (!validAlbumId) {
        setLoading(false);
        showToast("شناسه آلبوم معتبر نیست.", "error");
        return;
      }

      quiet ? setRefreshing(true) : setLoading(true);
      try {
        const [detail, songs, genres, subgenres, moods] = await Promise.all([
          apiRequest<AlbumData>(`/artist/albums/${numericAlbumId}/`),
          fetchAllPages<AlbumSong>("/artist/songs/"),
          apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/genres/"),
          apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/subgenres/"),
          apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/moods/"),
        ]);

        setAlbum(detail);
        setAllSongs(songs);
        setTaxonomies({
          genres: unwrapList(genres),
          subgenres: unwrapList(subgenres),
          moods: unwrapList(moods),
        });
        populateForm(detail);
        if (quiet) showToast("اطلاعات آلبوم با موفقیت به‌روزرسانی شد.", "success");
      } catch (error) {
        showToast(getApiErrorMessage(error, "دریافت جزئیات آلبوم انجام نشد."), "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [numericAlbumId, populateForm, showToast, validAlbumId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAlbumStats = useCallback(async () => {
    if (!validAlbumId) return;
    try {
      setAlbum(await apiRequest<AlbumData>(`/artist/albums/${numericAlbumId}/`));
    } catch {
      // The operation itself already succeeded; the regular refresh button can retry stats.
    }
  }, [numericAlbumId, validAlbumId]);

  useEffect(
    () => () => {
      if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );

  const availableSongs = useMemo(() => {
    const currentIds = new Set((album?.songs || []).map((song) => song.id));
    const needle = songSearch.trim().toLowerCase();
    return allSongs.filter((song) => {
      const isAvailable = song.status !== "deleted" && !song.album_id && !currentIds.has(song.id);
      const matches =
        !needle ||
        song.title?.toLowerCase().includes(needle) ||
        song.title_en?.toLowerCase().includes(needle);
      return isAvailable && matches;
    });
  }, [album?.songs, allSongs, songSearch]);

  const setField = <K extends keyof AlbumForm>(key: K, value: AlbumForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleTaxonomy = (
    key: "genre_ids" | "sub_genre_ids" | "mood_ids",
    id: number,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  };

  const chooseCover = async (file?: File) => {
    if (!file) return;
    const result = await cropImage(file, {
      mode: "square",
      title: "برش کاور آلبوم",
      description: "کاور آلبوم باید مربعی باشد. قاب را روی بهترین بخش تصویر تنظیم کنید.",
      maxSourceBytes: 40 * 1024 * 1024,
      maxOutputBytes: 9.5 * 1024 * 1024,
      maxOutputDimension: 3000,
    });
    if (!result) return;
    if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(result.file);
    setCoverPreview(URL.createObjectURL(result.file));
  };

  const cancelEdit = () => {
    if (album) populateForm(album);
    setEditing(false);
  };

  const appendIds = (data: FormData, key: string, ids: number[]) => {
    if (ids.length) ids.forEach((id) => data.append(key, String(id)));
    else data.append(key, "");
  };

  const saveAlbum = async () => {
    if (!album) return;
    if (!form.title.trim()) {
      showToast("وارد کردن عنوان فارسی آلبوم الزامی است.", "error");
      return;
    }
    if (!form.release_date) {
      showToast("وارد کردن تاریخ انتشار الزامی است.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("title_en", form.title_en.trim());
      payload.append("description", form.description.trim());
      payload.append("description_en", form.description_en.trim());
      payload.append("release_date", form.release_date);
      appendIds(payload, "genre_ids", form.genre_ids);
      appendIds(payload, "sub_genre_ids", form.sub_genre_ids);
      appendIds(payload, "mood_ids", form.mood_ids);
      if (coverFile) payload.append("cover_image", coverFile);

      const response = await apiRequest<{ album?: AlbumData } | AlbumData>(
        `/artist/albums/${album.id}/`,
        { method: "PATCH", body: payload },
      );
      const updated = "album" in response && response.album ? response.album : (response as AlbumData);
      const merged = { ...album, ...updated, songs: album.songs };
      setAlbum(merged);
      populateForm(merged);
      setEditing(false);
      showToast("اطلاعات آلبوم با موفقیت ذخیره شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره تغییرات آلبوم انجام نشد."), "error");
    } finally {
      setSaving(false);
    }
  };

  const addSongs = async () => {
    if (!album || !selectedSongIds.length) {
      showToast("حداقل یک آهنگ برای افزودن انتخاب کنید.", "error");
      return;
    }
    setManagingSongs(true);
    try {
      const response = await apiRequest<{
        songs?: AlbumSong[];
        missing_or_not_owned_ids?: number[];
      }>(`/artist/albums/${album.id}/songs/`, {
        method: "POST",
        body: { song_ids: selectedSongIds },
      });
      const added = response.songs || [];
      const missing = response.missing_or_not_owned_ids || [];
      if (!added.length) {
        showToast("هیچ‌یک از آهنگ‌های انتخاب‌شده افزوده نشد. فهرست را به‌روزرسانی و دوباره تلاش کنید.", "error");
        return;
      }
      setAlbum((current) =>
        current
          ? {
              ...current,
              songs: [...(current.songs || []), ...added],
              songs_count: (current.songs || []).length + added.length,
            }
          : current,
      );
      setAllSongs((current) =>
        current.map((song) =>
          selectedSongIds.includes(song.id)
            ? { ...song, album_id: album.id, is_single: false }
            : song,
        ),
      );
      setSelectedSongIds([]);
      setSongModalOpen(false);
      showToast(
        missing.length
          ? `${added.length.toLocaleString("fa-IR")} آهنگ افزوده شد و افزودن ${missing.length.toLocaleString("fa-IR")} آهنگ انجام نشد.`
          : added.length === 1
            ? "آهنگ با موفقیت به آلبوم افزوده شد."
            : `${added.length.toLocaleString("fa-IR")} آهنگ با موفقیت به آلبوم افزوده شد.`,
        missing.length ? "info" : "success",
      );
      await refreshAlbumStats();
    } catch (error) {
      showToast(getApiErrorMessage(error, "افزودن آهنگ‌ها به آلبوم انجام نشد."), "error");
    } finally {
      setManagingSongs(false);
    }
  };

  const confirmSongAction = async () => {
    if (!album || !songAction) return;
    const { song, mode } = songAction;
    setManagingSongs(true);
    try {
      if (mode === "detach") {
        const response = await apiRequest<{ album_deleted?: boolean; album_deletion?: "soft" | "hard" }>(`/artist/albums/${album.id}/songs/`, {
          method: "DELETE",
          body: { song_ids: [song.id] },
        });
        setAllSongs((current) => current.map((item) => item.id === song.id ? { ...item, album_id: null, is_single: true } : item));
        if (response.album_deleted && response.album_deletion === "hard") {
          showToast("آهنگ از آلبوم جدا شد و چون آخرین آهنگ فعال بود، آلبوم نیز حذف شد.", "success");
          goBack();
          return;
        }
        setAlbum((current) => {
          if (!current) return current;
          const nextSongs = (current.songs || []).filter((item) => item.id !== song.id);
          return {
            ...current,
            songs: nextSongs,
            songs_count: nextSongs.length,
            active_songs_count: nextSongs.filter((item) => item.status !== "deleted").length,
            is_deleted: Boolean(response.album_deleted),
          };
        });
        showToast(response.album_deleted ? "آهنگ جدا شد و آلبوم تاریخی غیرفعال ماند." : "آهنگ از آلبوم جدا و به‌صورت تک‌آهنگ حفظ شد.", "success");
      } else {
        const response = await apiRequest<{ deletion: "soft" | "hard"; song?: AlbumSong; album_deleted?: boolean; album_deletion?: "soft" | "hard" }>(`/artist/songs/${song.id}/`, { method: "DELETE" });
        setAllSongs((current) => response.deletion === "soft"
          ? current.map((item) => item.id === song.id ? { ...item, ...(response.song || {}), status: "deleted" } : item)
          : current.filter((item) => item.id !== song.id));
        if (response.album_deleted && response.album_deletion === "hard") {
          showToast("آهنگ حذف شد و چون آخرین آهنگ فعال آلبوم بود، آلبوم نیز حذف شد.", "success");
          goBack();
          return;
        }
        setAlbum((current) => {
          if (!current) return current;
          const nextSongs = response.deletion === "soft"
            ? (current.songs || []).map((item) => item.id === song.id ? { ...item, ...(response.song || {}), status: "deleted" } : item)
            : (current.songs || []).filter((item) => item.id !== song.id);
          return {
            ...current,
            songs: nextSongs,
            songs_count: nextSongs.length,
            active_songs_count: nextSongs.filter((item) => item.status !== "deleted").length,
            is_deleted: Boolean(response.album_deleted),
          };
        });
        showToast(response.album_deleted ? "آهنگ حذف شد و آلبوم تاریخی غیرفعال ماند." : response.deletion === "soft" ? "آهنگ غیرفعال شد؛ آمار و درآمد آن محفوظ است." : "آهنگ کاملاً حذف شد.", "success");
      }
      await refreshAlbumStats();
      setSongAction(null);
    } catch (error) {
      showToast(getApiErrorMessage(error, mode === "detach" ? "جدا کردن آهنگ از آلبوم انجام نشد." : "حذف آهنگ انجام نشد."), "error");
    } finally {
      setManagingSongs(false);
    }
  };

  const deleteAlbum = async () => {
    if (!album) return;
    setManagingSongs(true);
    try {
      const response = await apiRequest<{ deletion: "soft" | "hard"; album?: AlbumData }>(`/artist/albums/${album.id}/`, { method: "DELETE" });
      setDeleteAlbumOpen(false);
      if (response.deletion === "hard") {
        showToast("آلبوم و ترک‌های بدون سابقه آن حذف شدند.", "success");
        goBack();
        return;
      }
      setAlbum(response.album || { ...album, is_deleted: true, active_songs_count: 0 });
      setEditing(false);
      showToast("آلبوم غیرفعال شد؛ شناسه‌ها، آمار و درآمد ترک‌های منتشرشده محفوظ است.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "حذف آلبوم انجام نشد."), "error");
    } finally {
      setManagingSongs(false);
    }
  };

  const taxonomyPicker = (
    label: string,
    key: "genre_ids" | "sub_genre_ids" | "mood_ids",
    items: TaxonomyOption[],
  ) => (
    <div>
      <label className="mb-2 block text-sm font-bold text-white">{label}</label>
      <div className="flex min-h-14 max-h-36 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[#333] bg-[#1b1b1b] p-3">
        {items.length ? (
          items.map((item) => {
            const active = form[key].includes(Number(item.id));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleTaxonomy(key, Number(item.id))}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-[#1DB954] bg-[#1DB954]/15 text-[#1DB954]"
                    : "border-[#414141] text-[#aaa] hover:border-[#666]"
                }`}
              >
                {item.title || item.name}
              </button>
            );
          })
        ) : (
          <span className="m-auto text-xs text-[#777]">گزینه‌ای موجود نیست</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#111] text-white" dir="rtl">
        <Loader2 className="h-9 w-9 animate-spin text-[#1DB954]" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#111] px-6 text-center" dir="rtl">
        <Disc3 className="h-14 w-14 text-[#555]" />
        <h2 className="text-xl font-black text-white">اطلاعات آلبوم در دسترس نیست</h2>
        <button onClick={goBack} className="rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black">
          بازگشت
        </button>
      </div>
    );
  }

  const songs = album.songs || [];
  const activeSongs = songs.filter((song) => song.status !== "deleted");
  const actionIsLastActive = Boolean(songAction && songAction.song.status !== "deleted" && activeSongs.length === 1);
  const displayedTaxonomies = [
    ...(album.genre_items || []),
    ...(album.sub_genre_items || []),
    ...(album.mood_items || []),
  ];

  return (
    <div className="min-h-full bg-[#111] px-4 pb-28 pt-5 text-white sm:px-6 lg:px-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#1c1c1c] px-4 py-2.5 font-bold text-[#ddd] transition hover:bg-[#252525]"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => void load(true)}
              disabled={refreshing || saving || managingSongs}
              className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#1c1c1c] px-4 py-2.5 font-bold text-[#ddd] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              بروزرسانی
            </button>
            {!album.is_deleted && !editing && <>
              <button
                onClick={() => setDeleteAlbumOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 font-bold text-red-400 hover:bg-red-500/15"
              >
                <Trash2 className="h-4 w-4" />
                حذف آلبوم
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-4 py-2.5 font-black text-black"
              >
                <Edit3 className="h-4 w-4" />
                ویرایش
              </button>
            </>}
          </div>
        </header>

        <section className={`relative overflow-hidden rounded-3xl border border-[#292929] bg-gradient-to-b from-[#202020] to-[#171717] shadow-2xl ${album.is_deleted ? "grayscale opacity-60" : ""}`}>
          {album.is_deleted && <span className="pointer-events-none absolute inset-x-5 top-1/2 z-20 h-px -translate-y-1/2 bg-white/30" />}
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[260px_1fr] lg:p-9">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="group relative aspect-square overflow-hidden rounded-3xl border border-[#363636] bg-[#242424] shadow-xl">
                {coverPreview || album.cover_image ? (
                  <img
                    src={coverPreview || album.cover_image}
                    alt={album.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Disc3 className="m-auto h-full w-20 text-[#555]" />
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 font-bold opacity-0 transition group-hover:opacity-100"
                  >
                    <ImagePlus className="h-8 w-8 text-[#1DB954]" />
                    تغییر کاور
                  </button>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => { const file=event.target.files?.[0]; event.target.value=""; void chooseCover(file); }}
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "ترک فعال", value: compactNumber(album.active_songs_count ?? activeSongs.length), icon: Music2 },
                  { label: "استریم", value: compactNumber(album.total_streams), icon: BarChart3 },
                  { label: "پسند", value: compactNumber(album.likes_count), icon: Heart },
                  { label: "مدت", value: durationLabel(album.total_duration_seconds), icon: Clock3 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-[#2f2f2f] bg-[#1b1b1b] p-3 text-center">
                    <Icon className="mx-auto mb-1 h-4 w-4 text-[#1DB954]" />
                    <p className="truncate text-sm font-black" title={value}>{value}</p>
                    <p className="mt-1 text-[11px] text-[#888]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-2xl border border-[#2f2f2f] bg-[#1b1b1b] px-4 py-3">
                <span className="inline-flex items-center gap-2 text-xs text-[#888]"><Coins className="h-4 w-4 text-[#1DB954]" />درآمد کل آلبوم</span>
                <strong className="max-w-[58%] truncate text-sm text-[#1DB954]" title={exactMoney(album.total_income)}>{exactMoney(album.total_income)}</strong>
              </div>
            </div>

            <div className="min-w-0">
              {editing ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">عنوان فارسی *</label>
                      <input
                        value={form.title}
                        onChange={(event) => setField("title", event.target.value)}
                        className={inputClass}
                        placeholder="عنوان آلبوم"
                      />
                    </div>
                    <div dir="ltr">
                      <label className="mb-2 block text-left text-sm font-bold">عنوان انگلیسی</label>
                      <input
                        value={form.title_en}
                        onChange={(event) => setField("title_en", event.target.value)}
                        className={`${inputClass} text-left`}
                        placeholder="عنوان آلبوم"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">توضیحات فارسی</label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setField("description", event.target.value)}
                        className={`${inputClass} min-h-28 resize-y`}
                      />
                    </div>
                    <div dir="ltr">
                      <label className="mb-2 block text-left text-sm font-bold">توضیحات انگلیسی</label>
                      <textarea
                        value={form.description_en}
                        onChange={(event) => setField("description_en", event.target.value)}
                        className={`${inputClass} min-h-28 resize-y text-left`}
                      />
                    </div>
                  </div>
                  <div className="max-w-sm">
                    <label className="mb-2 block text-sm font-bold">تاریخ انتشار *</label>
                    <input
                      type="date"
                      value={form.release_date}
                      onChange={(event) => setField("release_date", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {taxonomyPicker("سبک‌ها", "genre_ids", taxonomies.genres)}
                    {taxonomyPicker("زیرسبک‌ها", "sub_genre_ids", taxonomies.subgenres)}
                    {taxonomyPicker("حال‌وهوا", "mood_ids", taxonomies.moods)}
                  </div>
                  <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#3b3b3b] bg-[#222] px-5 py-2.5 font-bold text-[#ddd] disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      انصراف
                    </button>
                    <button
                      onClick={() => void saveAlbum()}
                      disabled={saving}
                      className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      ذخیره
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-center">
                  <p className="mb-2 text-sm font-bold text-[#1DB954]">{album.is_deleted ? "آلبوم حذف‌شده" : "آلبوم"}</p>
                  <h1 className={`break-words text-3xl font-black sm:text-5xl ${album.is_deleted ? "line-through text-[#999]" : ""}`}>{album.title}</h1>
                  {album.title_en && (
                    <p className="mt-2 text-xl font-semibold text-[#999]" dir="ltr">
                      {album.title_en}
                    </p>
                  )}
                  <p className="mt-4 font-bold text-[#bbb]">{album.artist_name || "هنرمند"}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#aaa]">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#333] bg-[#1b1b1b] px-3 py-2">
                      <CalendarDays className="h-4 w-4 text-[#1DB954]" />
                      {album.release_date || "بدون تاریخ انتشار"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#333] bg-[#1b1b1b] px-3 py-2">
                      <Music2 className="h-4 w-4 text-[#1DB954]" />
                      {songs.length} آهنگ
                    </span>
                  </div>
                  {(album.description || album.description_en) && (
                    <div className="mt-6 grid gap-3 lg:grid-cols-2">
                      {album.description && (
                        <p className="rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-4 leading-7 text-[#c9c9c9]">
                          {album.description}
                        </p>
                      )}
                      {album.description_en && (
                        <p className="rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-4 text-left leading-7 text-[#c9c9c9]" dir="ltr">
                          {album.description_en}
                        </p>
                      )}
                    </div>
                  )}
                  {!!displayedTaxonomies.length && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {displayedTaxonomies.map((item, index) => (
                        <span
                          key={`${item.id}-${index}`}
                          className="rounded-full border border-[#34563f] bg-[#1DB954]/10 px-3 py-1.5 text-xs font-bold text-[#64e58e]"
                        >
                          {item.title || item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`mt-7 rounded-3xl border border-[#292929] bg-[#181818] p-4 sm:p-6 ${album.is_deleted ? "grayscale opacity-60" : ""}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">آهنگ‌های آلبوم</h2>
              <p className="mt-1 text-sm text-[#888]">جداسازی از آلبوم و حذف کامل، دو عملیات مستقل هستند.</p>
            </div>
            {!album.is_deleted && <button
              onClick={() => {
                setSongSearch("");
                setSelectedSongIds([]);
                setSongModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-4 py-2.5 font-black text-black"
            >
              <Plus className="h-5 w-5" />
              افزودن آهنگ
            </button>}
          </div>

          {songs.length ? (
            <div className="space-y-2">
              {songs.map((song, index) => {
                const deleted = song.status === "deleted";
                return <div
                  key={song.id}
                  aria-disabled={deleted}
                  className={`group relative flex items-center gap-3 rounded-2xl border border-transparent bg-[#202020] p-3 transition ${deleted ? "grayscale opacity-55" : "hover:border-[#343434] hover:bg-[#242424]"}`}
                >
                  {deleted && <span className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-px -translate-y-1/2 bg-white/25" />}
                  <span className="w-7 text-center text-sm text-[#777]">{index + 1}</span>
                  <button
                    onClick={() => { if (!deleted) navigateTo("details", { type: "song", id: song.id }); }}
                    disabled={deleted}
                    className="flex min-w-0 flex-1 items-center gap-3 text-right disabled:cursor-not-allowed"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#303030]">
                      {song.cover_image ? <img src={song.cover_image} alt="" className="h-full w-full object-cover" /> : <Music2 className="m-3 h-6 w-6 text-[#777]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-black ${deleted ? "line-through text-[#888]" : ""}`}>{song.display_title || song.title}</p>
                      {song.title_en && <p className="truncate text-xs text-[#777]" dir="ltr">{song.title_en}</p>}
                    </div>
                  </button>
                  <div className="hidden text-sm text-[#888] sm:block">{song.duration_display || "0:00"}</div>
                  <div className="hidden min-w-20 text-left text-sm text-[#888] md:block">{Number(song.plays || 0).toLocaleString()} پخش</div>
                  {!album.is_deleted && !deleted && <div className="relative z-20 flex gap-1">
                    <button onClick={() => setSongAction({ song, mode: "detach" })} disabled={managingSongs} aria-label="حذف آهنگ از آلبوم" title="حذف از آلبوم" className="rounded-xl p-2.5 text-[#888] transition hover:bg-amber-500/10 hover:text-amber-300 disabled:opacity-40"><Unlink className="h-5 w-5" /></button>
                    <button onClick={() => setSongAction({ song, mode: "delete" })} disabled={managingSongs} aria-label="حذف کامل آهنگ" title="حذف کامل آهنگ" className="rounded-xl p-2.5 text-[#888] transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"><Trash2 className="h-5 w-5" /></button>
                  </div>}
                </div>;
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#3a3a3a] py-14 text-center">
              <Music2 className="mx-auto mb-3 h-10 w-10 text-[#555]" />
              <p className="font-bold text-[#aaa]">هنوز آهنگی به این آلبوم اضافه نشده است.</p>
            </div>
          )}
        </section>
      </div>

      {songModalOpen && (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#303030] bg-[#151515] shadow-2xl sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-[#292929] px-5 py-4">
              <div>
                <h3 className="text-lg font-black">افزودن آهنگ به آلبوم</h3>
                <p className="mt-1 text-xs text-[#888]">فقط آهنگ‌های بدون آلبوم نمایش داده می‌شوند.</p>
              </div>
              <button
                onClick={() => !managingSongs && setSongModalOpen(false)}
                className="rounded-xl p-2 text-[#888] hover:bg-[#292929] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]" />
                <input
                  value={songSearch}
                  onChange={(event) => setSongSearch(event.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="جستجوی آهنگ"
                />
              </div>
              <div className="space-y-2">
                {availableSongs.length ? (
                  availableSongs.map((song) => {
                    const selected = selectedSongIds.includes(song.id);
                    return (
                      <button
                        type="button"
                        key={song.id}
                        onClick={() =>
                          setSelectedSongIds((current) =>
                            selected
                              ? current.filter((id) => id !== song.id)
                              : [...current, song.id],
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${
                          selected
                            ? "border-[#1DB954] bg-[#1DB954]/10"
                            : "border-[#303030] bg-[#1d1d1d] hover:bg-[#242424]"
                        }`}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#303030]">
                          {song.cover_image ? (
                            <img src={song.cover_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Music2 className="m-3 h-6 w-6 text-[#777]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black">{song.title}</p>
                          {song.title_en && (
                            <p className="truncate text-xs text-[#777]" dir="ltr">
                              {song.title_en}
                            </p>
                          )}
                        </div>
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#1DB954] bg-[#1DB954] text-black"
                              : "border-[#555] text-transparent"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-14 text-center text-[#777]">
                    <Music2 className="mx-auto mb-3 h-9 w-9" />
                    <p>آهنگ قابل افزودنی پیدا نشد.</p>
                  </div>
                )}
              </div>
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-[#292929] px-5 py-4">
              <span className="text-sm text-[#888]">{selectedSongIds.length} انتخاب شده</span>
              <button
                onClick={() => void addSongs()}
                disabled={managingSongs || !selectedSongIds.length}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-40"
              >
                {managingSongs ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                افزودن
              </button>
            </footer>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(songAction)}
        title={songAction?.mode === "delete" ? "حذف کامل آهنگ" : "حذف آهنگ از آلبوم"}
        description={songAction?.mode === "delete"
          ? `این آهنگ حذف می‌شود؛ اگر منتشرشده یا دارای سابقه مالی باشد، فقط غیرفعال می‌شود و درآمد آن حفظ خواهد شد.${actionIsLastActive ? " این آخرین آهنگ فعال آلبوم است و با حذف آن، آلبوم نیز حذف خواهد شد." : ""}`
          : `آهنگ فقط از آلبوم جدا و به‌صورت تک‌آهنگ حفظ می‌شود.${actionIsLastActive ? " این آخرین آهنگ فعال آلبوم است و با جداسازی آن، آلبوم نیز حذف خواهد شد." : ""}`}
        confirmLabel={songAction?.mode === "delete" ? "حذف آهنگ" : "حذف از آلبوم"}
        cancelLabel="انصراف"
        tone="danger"
        loading={managingSongs}
        onCancel={() => !managingSongs && setSongAction(null)}
        onConfirm={() => void confirmSongAction()}
      />
      <ConfirmModal
        open={deleteAlbumOpen}
        title="حذف آلبوم"
        description="همه ترک‌ها با قانون حذف آهنگ پردازش می‌شوند: ترک‌های منتشرشده یا دارای سابقه مالی غیرفعال می‌مانند و آمار و درآمدشان حفظ می‌شود؛ ترک‌های بدون سابقه کاملاً حذف می‌شوند."
        confirmLabel="حذف آلبوم"
        cancelLabel="انصراف"
        tone="danger"
        loading={managingSongs}
        onCancel={() => !managingSongs && setDeleteAlbumOpen(false)}
        onConfirm={() => void deleteAlbum()}
      />
    </div>
  );
};

export default AlbumDetail;
