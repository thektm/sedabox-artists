import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  ArrowLeft,
  Clock,
  Edit3,
  Heart,
  ListPlus,
  Loader2,
  MapPin,
  Music2,
  Play,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import { apiRequest, getApiErrorMessage, resolveMediaUrl } from "../lib/api";
import SongModal from "./SongModal";
import ConfirmModal from "./ConfirmModal";
import { ArtistOption, PartialSong, SongStatus } from "./types";

interface SongDetailProps {
  songId?: string | number;
  initialEdit?: boolean;
}

interface DailyPlay {
  date: string;
  count: number;
}

interface LocationRow {
  city?: string | null;
  country?: string | null;
  count: number;
  percentage: number;
}

interface TaxonomyValue {
  id: number;
  title: string;
}

interface SongApi {
  id: number;
  title: string;
  title_fa?: string;
  title_en?: string;
  artist_name?: string;
  cover_image?: string;
  plays?: number;
  likes_count?: number;
  added_to_playlists_count?: number;
  duration_display?: string;
  release_date?: string | null;
  status?: SongStatus;
  featured_artists?: ArtistOption[];
  album_title?: string | null;
  duration_seconds?: number;
  audio_file?: string;
  stream_url?: string;
  genre_ids?: TaxonomyValue[];
  sub_genre_ids?: TaxonomyValue[];
  mood_ids?: TaxonomyValue[];
  tag_ids?: TaxonomyValue[];
  language?: string;
  tempo?: number;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
  live_performed?: boolean;
  speechiness?: number;
  label?: string;
  label_en?: string;
  producers?: string[];
  producers_en?: string[];
  composers?: string[];
  composers_en?: string[];
  lyricists?: string[];
  lyricists_en?: string[];
  lyrics?: string;
  lyrics_en?: string;
  description?: string;
  description_en?: string;
  credits?: string;
  credits_en?: string;
  is_single?: boolean;
  requires_reapproval?: boolean;
  linked_release_statuses?: string[];
  analytics?: {
    days: number;
    total_period_plays: number;
    daily_plays: DailyPlay[];
    city_distribution: LocationRow[];
    country_distribution: LocationRow[];
  };
}

const ranges = [
  { label: "۷ روز", days: 7 },
  { label: "۳۰ روز", days: 30 },
  { label: "۹۰ روز", days: 90 },
];

const statusMeta: Record<string, { label: string; className: string }> = {
  published: { label: "منتشر شده", className: "border-[#1DB954]/25 bg-[#1DB954]/10 text-[#1DB954]" },
  approved: { label: "تأیید شده", className: "border-blue-400/25 bg-blue-400/10 text-blue-300" },
  pending: { label: "در انتظار تأیید", className: "border-amber-400/25 bg-amber-400/10 text-amber-300" },
  rejected: { label: "رد شده", className: "border-red-400/25 bg-red-400/10 text-red-300" },
  draft: { label: "پیش‌نویس", className: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300" },
  deleted: { label: "حذف‌شده", className: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400" },
};

const numberFormatter = new Intl.NumberFormat("fa-IR");
const audienceBaseUrl = (process.env.NEXT_PUBLIC_AUDIENCE_BASE_URL || "https://sedabox.com").replace(/\/$/, "");

const formatDate = (value?: string | null, short = false) => {
  if (!value) return "نامشخص";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: short ? "short" : "long",
    day: "numeric",
    ...(short ? {} : { year: "numeric" }),
  }).format(date);
};


const toEditorSong = (song: SongApi): PartialSong => {
  const featured = song.featured_artists || [];
  const status = song.status || "draft";
  return {
    id: song.id,
    title: song.title_fa ?? song.title ?? "",
    title_fa: song.title_fa ?? song.title ?? "",
    title_en: song.title_en || "",
    artist: song.artist_name || "",
    featuredArtists: featured,
    featured_artists: featured,
    featured_artist_ids: featured.map((artist) => artist.id),
    album: song.album_title || "",
    duration: song.duration_display || (song.duration_seconds ? `${Math.floor(song.duration_seconds / 60)}:${String(song.duration_seconds % 60).padStart(2, "0")}` : "0:00"),
    plays: String(song.plays || 0),
    status,
    approvalStatus: status === "published" || status === "approved" ? "approved" : status === "rejected" ? "rejected" : status === "pending" ? "pending" : "none",
    image: resolveMediaUrl(song.cover_image || ""),
    audioFile: song.audio_file || song.stream_url,
    releaseDate: song.release_date || "",
    release_date: song.release_date || "",
    genre: (song.genre_ids || []).map((item) => item.title),
    subGenre: (song.sub_genre_ids || []).map((item) => item.title),
    mood: (song.mood_ids || []).map((item) => item.title),
    tags: (song.tag_ids || []).map((item) => item.title),
    genre_ids: (song.genre_ids || []).map((item) => item.id),
    sub_genre_ids: (song.sub_genre_ids || []).map((item) => item.id),
    mood_ids: (song.mood_ids || []).map((item) => item.id),
    tag_ids: (song.tag_ids || []).map((item) => item.id),
    language: song.language || "fa",
    tempo: song.tempo ?? 120,
    energy: song.energy ?? 50,
    danceability: song.danceability ?? 50,
    valence: song.valence ?? 50,
    acousticness: song.acousticness ?? 0,
    instrumentalness: song.instrumentalness ?? 0,
    liveness: Boolean(song.live_performed),
    live_performed: Boolean(song.live_performed),
    speechiness: song.speechiness ?? 0,
    label: song.label || "",
    label_en: song.label_en || "",
    producers: song.producers || [],
    producers_en: song.producers_en || [],
    composers: song.composers || [],
    composers_en: song.composers_en || [],
    lyricists: song.lyricists || [],
    lyricists_en: song.lyricists_en || [],
    lyrics: song.lyrics || "",
    lyrics_en: song.lyrics_en || "",
    description: song.description || "",
    description_en: song.description_en || "",
    credits: song.credits || "",
    credits_en: song.credits_en || "",
    is_single: Boolean(song.is_single),
    requires_reapproval: Boolean(song.requires_reapproval),
    linked_release_statuses: song.linked_release_statuses || [],
  };
};

const appendArray = (form: FormData, key: string, values: unknown[] | undefined) => {
  if (values?.length) values.forEach((value) => form.append(key, String(value)));
  else form.append(key, "");
};

const buildSongPayload = (data: PartialSong) => {
  const payload = new FormData();
  const scalarFields: Array<keyof PartialSong> = [
    "title", "title_en", "release_date", "language", "description", "description_en", "lyrics", "lyrics_en",
    "tempo", "energy", "danceability", "valence", "acousticness", "instrumentalness", "speechiness",
    "label", "label_en", "credits", "credits_en",
  ];
  scalarFields.forEach((field) => {
    const value = data[field];
    if (value !== undefined && value !== null) payload.append(String(field), String(value));
  });
  payload.set("release_date", String(data.release_date || data.releaseDate || ""));
  payload.set("is_single", String(Boolean(data.is_single)));
  payload.set("live_performed", String(Boolean(data.live_performed ?? data.liveness)));

  appendArray(payload, "genre_ids", data.genre_ids);
  appendArray(payload, "sub_genre_ids", data.sub_genre_ids);
  appendArray(payload, "mood_ids", data.mood_ids);
  appendArray(payload, "tag_ids", data.tag_ids);
  appendArray(payload, "featured_artist_ids", data.featured_artist_ids);
  appendArray(payload, "producers", data.producers);
  appendArray(payload, "producers_en", data.producers_en);
  appendArray(payload, "composers", data.composers);
  appendArray(payload, "composers_en", data.composers_en);
  appendArray(payload, "lyricists", data.lyricists);
  appendArray(payload, "lyricists_en", data.lyricists_en);
  if (data.audio_file) payload.append("audio_file", data.audio_file);
  if (data.cover_image) payload.append("cover_image", data.cover_image);
  return payload;
};

const SongDetail: React.FC<SongDetailProps> = ({ songId, initialEdit = false }) => {
  const { goBack } = useNavigation();
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestSequence = useRef(0);
  const [song, setSong] = useState<SongApi | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const initialEditOpened = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingReviewSave, setPendingReviewSave] = useState<PartialSong | null>(null);

  const numericSongId = Number(songId);
  const validSongId = Number.isInteger(numericSongId) && numericSongId > 0;

  const loadSong = useCallback(async (selectedDays: number, initial = false, notify = false) => {
    if (!validSongId) {
      setError("شناسه آهنگ معتبر نیست.");
      setLoading(false);
      return;
    }
    const sequence = ++requestSequence.current;
    initial ? setLoading(true) : setChartLoading(true);
    setError("");
    try {
      const response = await apiRequest<SongApi>(`/artist/songs/${numericSongId}/`, {
        query: { days: selectedDays },
      });
      if (sequence !== requestSequence.current) return;
      setSong(response);
      if (notify) showToast("آمار آهنگ با موفقیت به‌روزرسانی شد.", "success");
    } catch (requestError) {
      if (sequence !== requestSequence.current) return;
      const message = getApiErrorMessage(requestError, "دریافت جزئیات آهنگ انجام نشد.");
      if (initial) setError(message);
      showToast(message, "error");
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setChartLoading(false);
      }
    }
  }, [numericSongId, showToast, validSongId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setDays(30);
    setSong(null);
    void loadSong(30, true);
  }, [numericSongId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!previewOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setPreviewOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [previewOpen]);

  const dailyPlays = song?.analytics?.daily_plays || [];
  const editorSong = useMemo(() => song ? toEditorSong(song) : null, [song]);

  useEffect(() => {
    if (!initialEdit || !song || initialEditOpened.current) return;
    initialEditOpened.current = true;
    setEditOpen(true);
  }, [initialEdit, song]);
  const chartOptions = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "#282828",
      borderColor: "#3E3E3E",
      textStyle: { color: "#fff" },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const point = params[0];
        return `<div style="direction:rtl"><div style="color:#aaa;font-size:12px">${formatDate(point?.name, true)}</div><strong>${numberFormatter.format(point?.value || 0)} پخش</strong></div>`;
      },
    },
    grid: { left: 8, right: 8, top: 18, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dailyPlays.map((item) => item.date),
      axisLabel: { color: "#929292", fontSize: 10, hideOverlap: true, formatter: (value: string) => formatDate(value, true) },
      axisLine: { lineStyle: { color: "#363636" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#929292", fontSize: 10 },
      splitLine: { lineStyle: { color: "#292929", type: "dashed" } },
    },
    series: [{
      type: "line",
      smooth: true,
      showSymbol: dailyPlays.length < 10,
      symbolSize: 7,
      data: dailyPlays.map((item) => item.count),
      lineStyle: { width: 3, color: "#1DB954" },
      itemStyle: { color: "#1DB954" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(29,185,84,.32)" },
          { offset: 1, color: "rgba(29,185,84,0)" },
        ]),
      },
    }],
  }), [dailyPlays]);

  const share = async () => {
    if (!song?.id) return showToast("شناسه آهنگ در دسترس نیست.", "error");
    const url = `${audienceBaseUrl}/track/${song.id}/`;
    try {
      const nativeShare = typeof navigator.share === "function";
      if (nativeShare) await navigator.share({ title: song.title, url });
      else await navigator.clipboard.writeText(url);
      showToast(nativeShare ? "آهنگ با موفقیت به اشتراک گذاشته شد." : "پیوند آهنگ با موفقیت کپی شد.", "success");
    } catch (shareError) {
      if ((shareError as Error)?.name !== "AbortError") showToast("اشتراک‌گذاری آهنگ انجام نشد.", "error");
    }
  };

  const selectRange = (selectedDays: number) => {
    if (selectedDays === days || chartLoading) return;
    setDays(selectedDays);
    void loadSong(selectedDays);
  };

  const submitSong = async (data: PartialSong, reviewConfirmed = false) => {
    if (!song?.id || submitting) return;
    const requiresReview = Boolean(song.requires_reapproval || song.status === "published" || song.status === "approved");
    if (requiresReview && !reviewConfirmed) {
      setPendingReviewSave(data);
      return;
    }
    const payload = buildSongPayload(data);
    if (requiresReview) payload.set("confirm_re_review", "true");
    setSubmitting(true);
    try {
      await apiRequest<{ message: string; song: SongApi }>(`/artist/songs/${song.id}/`, {
        method: "PATCH",
        body: payload,
      });
      setEditOpen(false);
      showToast("آهنگ ویرایش و برای بررسی ارسال شد.", "success");
      await loadSong(days);
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "ذخیره تغییرات آهنگ انجام نشد."), "error");
    } finally {
      setSubmitting(false);
      if (reviewConfirmed) setPendingReviewSave(null);
    }
  };

  if (loading) {
    return <div className="h-full w-full animate-pulse p-4 pb-24 lg:p-8" dir="rtl"><div className="mb-6 h-10 rounded-xl bg-[#202020]"/><div className="mb-6 grid gap-6 md:grid-cols-3"><div className="h-72 rounded-2xl bg-[#181818] md:col-span-2"/><div className="h-72 rounded-2xl bg-[#181818]"/></div><div className="h-80 rounded-2xl bg-[#181818]"/></div>;
  }

  if (error || !song) {
    return <div className="flex h-full min-h-[420px] items-center justify-center p-6" dir="rtl"><div className="max-w-md rounded-2xl border border-red-500/20 bg-[#181818] p-8 text-center"><Music2 className="mx-auto mb-4 h-12 w-12 text-[#555]"/><p className="mb-5 text-sm text-red-300" dir="ltr">{error || "آهنگ پیدا نشد."}</p><div className="flex justify-center gap-3"><button onClick={goBack} className="rounded-full border border-[#444] px-5 py-2 font-bold text-white">بازگشت</button><button onClick={() => void loadSong(days, true, true)} className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-5 py-2 font-black text-black"><RefreshCw className="h-4 w-4"/>تلاش مجدد</button></div></div></div>;
  }

  const deleted = song.status === "deleted";
  const status = statusMeta[song.status || ""] || { label: song.status || "نامشخص", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" };
  const locations = [
    { title: "شهرهای برتر", key: "city" as const, rows: song.analytics?.city_distribution || [] },
    { title: "کشورهای برتر", key: "country" as const, rows: song.analytics?.country_distribution || [] },
  ];

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto p-4 pb-24 lg:p-8" dir="rtl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black text-white">جزئیات آهنگ</h1>
        <button onClick={goBack} className="rounded-full bg-[#282828] p-2.5 text-white transition hover:bg-[#3a3a3a]" aria-label="بازگشت"><ArrowLeft className="h-5 w-5"/></button>
      </header>

      {deleted && <div className="mb-5 rounded-2xl border border-zinc-500/25 bg-zinc-500/10 px-4 py-3 text-sm leading-6 text-zinc-300">این آهنگ حذف شده و از فهرست‌های تحلیلی فعال کنار گذاشته شده است؛ شناسه، آمار تاریخی و درآمد آن برای گزارش مالی و تسویه حفظ می‌شود.</div>}

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <section className={`relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:flex-row sm:p-6 md:col-span-2 ${deleted ? "grayscale opacity-70" : ""}`}>
          {deleted && <span className="pointer-events-none absolute inset-x-4 top-1/2 z-20 h-px bg-white/25"/>}
          <button onClick={() => song.cover_image && setPreviewOpen(true)} className="aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-[#262626] sm:w-48" disabled={!song.cover_image}>
            {song.cover_image ? <img src={song.cover_image} alt={song.title} className={`h-full w-full object-cover transition duration-500 ${deleted ? "grayscale" : "hover:scale-105"}`}/> : <span className="flex h-full items-center justify-center"><Music2 className="h-12 w-12 text-[#555]"/></span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h2 className={`break-words text-2xl font-black lg:text-3xl ${deleted ? "text-[#aaa] line-through" : "text-white"}`}>{song.title_fa ?? song.title}</h2>{song.title_en && <p className="mt-1 truncate text-sm text-[#8d8d8d]" dir="ltr">{song.title_en}</p>}<p className="mt-2 text-lg text-[#b3b3b3]">{song.artist_name || "نامشخص"}</p></div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
            </div>
            <div className="mb-6 flex flex-wrap gap-4 text-sm text-[#aaa]"><span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4"/>{song.duration_display || "0:00"}</span><span className="inline-flex items-center gap-1.5"><Music2 className="h-4 w-4"/>{formatDate(song.release_date)}</span></div>
            <div className="flex flex-wrap gap-3">{!deleted&&<><button onClick={() => setEditOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1DB954] px-6 py-2.5 font-black text-black transition hover:bg-[#1ed760] sm:flex-none"><Edit3 className="h-4 w-4"/>ویرایش اطلاعات آهنگ</button><button onClick={() => void share()} className="rounded-full border border-[#4a4a4a] p-2.5 text-[#bbb] transition hover:border-white hover:text-white" aria-label="اشتراک‌گذاری"><Share2 className="h-5 w-5"/></button></>}</div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
          {[
            { label: "تعداد پخش", value: song.plays || 0, icon: Play, className: "text-[#1DB954] bg-[#1DB954]/10" },
            { label: "لایک‌ها", value: song.likes_count || 0, icon: Heart, className: "text-red-400 bg-red-400/10" },
            { label: "افزوده‌شدن به پلی‌لیست", value: song.added_to_playlists_count || 0, icon: ListPlus, className: "text-blue-400 bg-blue-400/10" },
          ].map(({ label, value, icon: Icon, className }) => <div key={label} className="flex items-center justify-between rounded-xl border border-[#282828] bg-[#181818] p-5"><div><p className="mb-1 text-xs text-[#999]">{label}</p><p className="text-2xl font-black text-white">{numberFormatter.format(value)}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}><Icon className="h-5 w-5"/></span></div>)}
        </section>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6 lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-black text-white">روند پخش</h3><p className="mt-1 text-xs text-[#777]">{numberFormatter.format(song.analytics?.total_period_plays || 0)} پخش در بازه انتخابی</p></div><div className="flex rounded-xl bg-[#282828] p-1">{ranges.map((range) => <button key={range.days} onClick={() => selectRange(range.days)} disabled={chartLoading} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${days === range.days ? "bg-[#1DB954] text-black" : "text-[#aaa] hover:text-white"}`}>{range.label}</button>)}</div></div>
          <div className="relative h-72">{chartLoading && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[#181818]/70"><Loader2 className="h-7 w-7 animate-spin text-[#1DB954]"/></div>}{dailyPlays.length ? <ReactECharts option={chartOptions} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate/> : <div className="flex h-full items-center justify-center text-sm text-[#777]">در این بازه پخشی ثبت نشده است.</div>}</div>
        </section>

        <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-black text-white">موقعیت مخاطبان</h3><MapPin className="h-5 w-5 text-[#1DB954]"/></div><div className="space-y-6">{locations.map(({ title, key, rows }) => <div key={title}><p className="mb-3 text-xs font-bold text-[#888]">{title}</p><div className="space-y-3">{rows.slice(0, 4).map((row, index) => { const label = row[key] || "نامشخص"; return <div key={`${label}-${index}`}><div className="mb-1.5 flex justify-between text-xs"><span className="truncate text-white">{label}</span><span className="text-[#999]">{numberFormatter.format(row.count)} · {row.percentage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#292929]"><div className="h-full rounded-full bg-[#1DB954]" style={{ width: `${Math.min(100, row.percentage)}%` }}/></div></div>; })}{!rows.length && <p className="text-xs text-[#666]">داده‌ای ثبت نشده است.</p>}</div></div>)}</div></section>
      </div>

      <SongModal
        isOpen={editOpen}
        onClose={() => { if (!submitting && !pendingReviewSave) setEditOpen(false); }}
        onSubmit={submitSong}
        initialData={editorSong}
        initialIsSingle={song.is_single ?? true}
        isSubmitting={submitting}
      />
      <ConfirmModal
        open={Boolean(pendingReviewSave)}
        title="ارسال دوباره برای بررسی"
        description="با ذخیره این تغییرات، آهنگ و انتشار مرتبط دوباره در انتظار تأیید قرار می‌گیرند. آیا ادامه می‌دهید؟"
        confirmLabel="ذخیره و ارسال برای بررسی"
        cancelLabel="بازگشت به ویرایش"
        loading={submitting}
        onCancel={() => !submitting && setPendingReviewSave(null)}
        onConfirm={() => pendingReviewSave ? submitSong(pendingReviewSave, true) : undefined}
      />

      {previewOpen && song.cover_image && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setPreviewOpen(false)}><img src={song.cover_image} alt={song.title} className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()}/><button onClick={() => setPreviewOpen(false)} className="absolute left-4 top-4 rounded-full bg-[#202020] px-4 py-2 text-xl text-white" aria-label="بستن">×</button></div>}
    </div>
  );
};

export default SongDetail;
