import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Loader2,
  Music2,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
} from "lucide-react";
import { apiRequest, fetchAllPages, getApiErrorMessage, resolveMediaUrl } from "../lib/api";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "./ConfirmModal";
import SongModal from "./SongModal";
import { ArtistOption, PartialSong, SongMetadata, SongStatus } from "./types";

type Tab = "all" | "published" | "pending" | "rejected" | "draft" | "deleted";

interface ApiSong {
  id: number;
  title: string;
  title_fa?: string;
  title_en?: string;
  artist_name?: string;
  featured_artists?: ArtistOption[];
  album_title?: string | null;
  album_id?: number | null;
  album_active_songs_count?: number;
  duration_display?: string;
  duration_seconds?: number;
  plays?: number;
  status?: SongStatus;
  cover_image?: string;
  audio_file?: string;
  stream_url?: string;
  release_date?: string;
  genre_ids?: Array<{ id: number; title: string }>;
  sub_genre_ids?: Array<{ id: number; title: string }>;
  mood_ids?: Array<{ id: number; title: string }>;
  tag_ids?: Array<{ id: number; title: string }>;
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
}

const statusInfo: Record<SongStatus, { label: string; className: string }> = {
  published: { label: "منتشر شده", className: "bg-[#1DB954]/15 text-[#1DB954]" },
  approved: { label: "تأیید شده", className: "bg-blue-500/15 text-blue-300" },
  pending: { label: "در انتظار بررسی", className: "bg-amber-500/15 text-amber-300" },
  rejected: { label: "رد شده", className: "bg-red-500/15 text-red-300" },
  draft: { label: "پیش‌نویس", className: "bg-[#555]/20 text-[#bbb]" },
  deleted: { label: "حذف‌شده", className: "bg-white/10 text-[#8b8b8b]" },
};

const mapSong = (song: ApiSong): SongMetadata => {
  const featured = song.featured_artists || [];
  const status = song.status || "draft";
  return {
    id: Number(song.id),
    title: song.title_fa ?? song.title ?? "",
    title_fa: song.title_fa ?? song.title ?? "",
    title_en: song.title_en || "",
    artist: song.artist_name || "",
    featuredArtists: featured,
    featured_artists: featured,
    featured_artist_ids: featured.map((artist) => artist.id),
    album: song.album_title || "",
    album_id: song.album_id ?? null,
    album_active_songs_count: Number(song.album_active_songs_count || 0),
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

const Songs: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SongMetadata | null>(null);
  const [songAction, setSongAction] = useState<{ song: SongMetadata; mode: "detach" | "delete" } | null>(null);
  const [pendingReviewSave, setPendingReviewSave] = useState<PartialSong | null>(null);

  const loadSongs = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const response = await fetchAllPages<ApiSong>("/artist/songs/");
      setSongs(response.map(mapSong));
      if (quiet) showToast("فهرست آهنگ‌ها با موفقیت به‌روزرسانی شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت فهرست آهنگ‌ها انجام نشد."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { void loadSongs(); }, [loadSongs]);

  const filtered = useMemo(() => songs.filter((song) => {
    const statusMatch = tab === "all" || song.status === tab || (tab === "published" && song.status === "approved");
    const needle = query.trim().toLowerCase();
    const textMatch = !needle || [song.title, song.title_en, song.album, song.artist].some((value) => value?.toLowerCase().includes(needle));
    return statusMatch && textMatch;
  }), [query, songs, tab]);

  const openEdit = (song: SongMetadata) => {
    if (song.status === "deleted") return;
    setEditing(song);
    setModalOpen(true);
  };

  const appendArray = (form: FormData, key: string, values: unknown[] | undefined, includeEmpty = false) => {
    if (values?.length) values.forEach((value) => form.append(key, String(value)));
    else if (includeEmpty) form.append(key, "");
  };

  const submitSong = async (data: PartialSong, reviewConfirmed = false) => {
    const isEdit = Boolean(editing);
    const requiresReview = Boolean(isEdit && (editing?.requires_reapproval || editing?.status === "published" || editing?.status === "approved"));
    if (requiresReview && !reviewConfirmed) {
      setPendingReviewSave(data);
      return;
    }
    setSubmitting(true);
    try {
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

      appendArray(payload, "genre_ids", data.genre_ids, isEdit);
      appendArray(payload, "sub_genre_ids", data.sub_genre_ids, isEdit);
      appendArray(payload, "mood_ids", data.mood_ids, isEdit);
      appendArray(payload, "tag_ids", data.tag_ids, isEdit);
      appendArray(payload, "featured_artist_ids", data.featured_artist_ids, isEdit);
      appendArray(payload, "producers", data.producers, isEdit);
      appendArray(payload, "producers_en", data.producers_en, isEdit);
      appendArray(payload, "composers", data.composers, isEdit);
      appendArray(payload, "composers_en", data.composers_en, isEdit);
      appendArray(payload, "lyricists", data.lyricists, isEdit);
      appendArray(payload, "lyricists_en", data.lyricists_en, isEdit);
      if (data.audio_file) payload.append("audio_file", data.audio_file);
      if (data.cover_image) payload.append("cover_image", data.cover_image);
      if (requiresReview) payload.set("confirm_re_review", "true");

      await apiRequest<{ message: string; song: ApiSong }>(isEdit ? `/artist/songs/${editing!.id}/` : "/artist/songs/", {
        method: isEdit ? "PATCH" : "POST",
        body: payload,
      });
      showToast(isEdit ? "آهنگ ویرایش و برای بررسی ارسال شد." : "آهنگ بارگذاری و برای بررسی ارسال شد.", "success");
      setModalOpen(false);
      setEditing(null);
      await loadSongs();
    } catch (error) {
      showToast(getApiErrorMessage(error, isEdit ? "ذخیره تغییرات آهنگ انجام نشد." : "بارگذاری آهنگ انجام نشد."), "error");
    } finally {
      setSubmitting(false);
      if (reviewConfirmed) setPendingReviewSave(null);
    }
  };

  const confirmSongAction = async () => {
    if (!songAction) return;
    const { song, mode } = songAction;
    setSubmitting(true);
    try {
      if (mode === "detach") {
        if (!song.album_id) return;
        const response = await apiRequest<{ album_deleted?: boolean }>(`/artist/albums/${song.album_id}/songs/`, {
          method: "DELETE",
          body: { song_ids: [song.id] },
        });
        setSongs((current) => current.map((item) => item.id === song.id ? { ...item, album: "", album_id: null, album_active_songs_count: 0, is_single: true } : item));
        showToast(response.album_deleted ? "آهنگ جدا شد و چون آخرین آهنگ فعال بود، آلبوم نیز حذف شد." : "آهنگ از آلبوم جدا و به‌صورت تک‌آهنگ حفظ شد.", "success");
      } else {
        const response = await apiRequest<{ deletion: "soft" | "hard"; song?: ApiSong; album_deleted?: boolean }>(`/artist/songs/${song.id}/`, { method: "DELETE" });
        setSongs((current) => response.deletion === "soft"
          ? current.map((item) => item.id === song.id ? (response.song ? mapSong(response.song) : { ...item, status: "deleted" }) : item)
          : current.filter((item) => item.id !== song.id));
        showToast(response.album_deleted ? "آهنگ حذف شد و چون آخرین آهنگ فعال بود، آلبوم نیز حذف شد." : response.deletion === "soft" ? "آهنگ غیرفعال شد؛ آمار و درآمد آن محفوظ است." : "آهنگ حذف شد.", "success");
      }
      await loadSongs();
      setSongAction(null);
    } catch (error) {
      showToast(getApiErrorMessage(error, mode === "detach" ? "جدا کردن آهنگ از آلبوم انجام نشد." : "حذف آهنگ انجام نشد."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const actionIsLastAlbumTrack = Boolean(songAction?.song.album_id && songAction.song.album_active_songs_count === 1);


  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "all", label: "همه" }, { value: "published", label: "منتشرشده" }, { value: "pending", label: "در انتظار" },
    { value: "rejected", label: "ردشده" }, { value: "draft", label: "پیش‌نویس" }, { value: "deleted", label: "حذف‌شده" },
  ];

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8 pc-compact" dir="rtl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="mb-2 text-3xl font-black text-white lg:text-4xl">مدیریت آهنگ‌ها</h1><p className="text-[#B3B3B3]">آپلود، ویرایش و پیگیری وضعیت بررسی آثار</p></div>
        <button onClick={() => void loadSongs(true)} disabled={loading || refreshing} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#383838] bg-[#181818] text-white hover:bg-[#282828] disabled:opacity-50" title="تازه‌سازی"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#181818] p-1">{tabs.map((item)=><button key={item.value} onClick={()=>setTab(item.value)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm ${tab===item.value?"bg-white text-black":"text-[#aaa] hover:bg-[#282828] hover:text-white"}`}>{item.label}</button>)}</div>
        <div className="relative w-full lg:w-80"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-xl border border-[#333] bg-[#181818] py-3 pr-11 pl-4 text-white outline-none placeholder:text-[#666] focus:border-[#1DB954]" placeholder="جستجو در آهنگ‌ها" /></div>
      </div>

      {loading ? <div className="space-y-3">{Array.from({length:6}).map((_,i)=><div key={i} className="h-20 animate-pulse rounded-xl bg-[#181818]" />)}</div> : filtered.length ? <div className="overflow-hidden rounded-2xl border border-[#282828] bg-[#181818]">
        <div className="hidden grid-cols-[minmax(260px,1fr)_140px_110px_150px_110px] gap-4 border-b border-[#282828] px-6 py-3 text-xs font-bold text-[#777] lg:grid"><span>آهنگ</span><span>آلبوم</span><span>استریم</span><span>وضعیت</span><span className="text-left">عملیات</span></div>
        <div className="divide-y divide-[#282828]">{filtered.map((song)=>{
          const deleted = song.status === "deleted";
          return <article key={song.id} aria-disabled={deleted} onClick={()=>{if(!deleted) navigateTo("details",{type:"song",id:song.id});}} className={`relative grid gap-4 p-4 transition lg:grid-cols-[minmax(260px,1fr)_140px_110px_150px_110px] lg:items-center lg:px-6 ${deleted ? "cursor-not-allowed bg-[#151515] grayscale opacity-55" : "cursor-pointer hover:bg-[#202020]"}`}>
          {deleted&&<span className="pointer-events-none absolute inset-x-4 top-1/2 z-10 h-px -translate-y-1/2 bg-white/25 lg:inset-x-6"/>}
          <div className="flex min-w-0 items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#292929]">{song.image?<img src={song.image} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center"><Music2 className="h-6 w-6 text-[#666]"/></div>}</div><div className="min-w-0"><p className={`truncate font-black ${deleted ? "text-[#8a8a8a] line-through" : "text-white"}`}>{song.title}</p>{song.title_en&&<p className="truncate text-xs text-[#777]" dir="ltr">{song.title_en}</p>}<p className="mt-1 truncate text-xs text-[#777]">{song.featuredArtists.length ? `feat. ${song.featuredArtists.map((item)=>item.artistic_name||item.name).join("، ")}` : song.artist}</p></div></div>
          <div className="text-sm text-[#aaa]"><span className="ml-1 text-xs text-[#666] lg:hidden">آلبوم:</span>{song.album || "تک‌آهنگ"}</div>
          <div className="font-bold text-white"><span className="ml-1 text-xs font-normal text-[#666] lg:hidden">استریم:</span>{new Intl.NumberFormat("fa-IR",{notation:"compact",maximumFractionDigits:1}).format(Number(song.plays||0))}</div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusInfo[song.status].className}`}>{statusInfo[song.status].label}</span>
          <div className="relative z-20 flex justify-end gap-1">{!deleted&&<><button onClick={(event)=>{event.stopPropagation();openEdit(song);}} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#aaa] hover:bg-[#303030] hover:text-white" title="ویرایش"><Edit3 className="h-4 w-4"/></button>{song.album_id&&<button onClick={(event)=>{event.stopPropagation();setSongAction({song,mode:"detach"});}} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#aaa] hover:bg-amber-500/15 hover:text-amber-300" title="حذف از آلبوم"><Unlink className="h-4 w-4"/></button>}<button onClick={(event)=>{event.stopPropagation();setSongAction({song,mode:"delete"});}} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#aaa] hover:bg-red-500/15 hover:text-red-400" title="حذف"><Trash2 className="h-4 w-4"/></button></>}</div>
        </article>;})}</div>
      </div> : <div className="rounded-2xl border border-[#282828] bg-[#181818] py-20 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#282828]"><Music2 className="h-8 w-8 text-[#777]"/></div><h3 className="text-xl font-black text-white">آهنگی پیدا نشد</h3><p className="mt-2 text-sm text-[#777]">{query?"عبارت جستجو یا فیلتر را تغییر دهید.":"آهنگ جدید را از بخش انتشارها ثبت کنید."}</p></div>}

      <SongModal isOpen={modalOpen} onClose={()=>{if(!submitting && !pendingReviewSave){setModalOpen(false);setEditing(null);}}} onSubmit={submitSong} initialData={editing} initialIsSingle={editing?.is_single ?? true} isSubmitting={submitting} />
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
      <ConfirmModal open={Boolean(songAction)} title={songAction?.mode==="detach"?"حذف آهنگ از آلبوم":"حذف کامل آهنگ"} description={songAction?.mode==="detach"?`آهنگ فقط از آلبوم جدا و به‌صورت تک‌آهنگ حفظ می‌شود.${actionIsLastAlbumTrack?" این آخرین آهنگ فعال آلبوم است و با جداسازی آن، آلبوم نیز حذف خواهد شد.":""}`:`اگر آهنگ منتشر شده یا دارای آمار مالی باشد، فقط غیرفعال می‌شود و شناسه، پخش‌ها و درآمد آن محفوظ می‌ماند؛ آهنگ منتشرنشده بدون سابقه به‌صورت کامل حذف می‌شود.${actionIsLastAlbumTrack?" این آخرین آهنگ فعال آلبوم است و با حذف آن، آلبوم نیز حذف خواهد شد.":""}`} confirmLabel={songAction?.mode==="detach"?"حذف از آلبوم":"حذف آهنگ"} cancelLabel="انصراف" tone="danger" loading={submitting} onCancel={()=>!submitting&&setSongAction(null)} onConfirm={()=>void confirmSongAction()} />
      {submitting && songAction && <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#1DB954]"/></div>}
    </div>
  );
};

export default Songs;
