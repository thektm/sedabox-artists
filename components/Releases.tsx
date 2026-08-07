import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CopyPlus,
  Disc3,
  Edit3,
  FileEdit,
  Loader2,
  Music2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Unlink,
} from "lucide-react";
import { apiRequest, getApiErrorMessage, resolveMediaUrl } from "../lib/api";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "./ConfirmModal";
import { ArtistRelease, ReleaseStatus, ReleaseTrackApi, ReleaseType } from "./releaseTypes";

interface ReleasesResponse { results: ArtistRelease[]; }
type Tab = "all" | ReleaseStatus;
type DeleteAction =
  | { kind: "release"; release: ArtistRelease }
  | { kind: "detach-track" | "delete-track"; release: ArtistRelease; track: ReleaseTrackApi };

const statusMeta: Record<ReleaseStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: "پیش‌نویس", className: "bg-white/10 text-[#cfcfcf]", icon: <FileEdit className="h-3.5 w-3.5" /> },
  in_review: { label: "در حال بررسی", className: "bg-amber-500/10 text-amber-300", icon: <Clock3 className="h-3.5 w-3.5" /> },
  changes_requested: { label: "نیازمند اصلاح", className: "bg-orange-500/10 text-orange-300", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  approved: { label: "تأییدشده", className: "bg-emerald-500/10 text-emerald-300", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  scheduled: { label: "زمان‌بندی‌شده", className: "bg-blue-500/10 text-blue-300", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  live: { label: "منتشرشده", className: "bg-[#1DB954]/10 text-[#1DB954]", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  rejected: { label: "ردشده", className: "bg-red-500/10 text-red-300", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  taken_down: { label: "حذف‌شده", className: "bg-white/10 text-[#8b8b8b]", icon: <Trash2 className="h-3.5 w-3.5" /> },
};

const typeLabel: Record<ReleaseType, string> = { single: "تک‌آهنگ", ep: "مینی‌آلبوم", album: "آلبوم", compilation: "کامپلیشن" };
const activeTracks = (release: ArtistRelease) => (release.tracks || []).filter((track) => track.status !== "deleted");
const isDeletedRelease = (release: ArtistRelease) => release.status === "taken_down" || Boolean(release.tracks?.length && !activeTracks(release).length);
const releaseTrackCount = (release: ArtistRelease) => release.tracks?.length || release.track_ids?.length || release.validation?.summary?.track_count || 0;
const formatDate = (value?: string) => {
  if (!value) return "بدون تاریخ";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "short", day: "numeric" }).format(date);
};

const Releases: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const [releases, setReleases] = useState<ArtistRelease[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [deleteAction, setDeleteAction] = useState<DeleteAction | null>(null);
  const [deletingKey, setDeletingKey] = useState("");

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const data = await apiRequest<ReleasesResponse>("/artist/releases/");
      setReleases(Array.isArray(data.results) ? data.results : []);
      if (quiet) showToast("فهرست انتشارها به‌روزرسانی شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "بارگذاری انتشارها انجام نشد."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const openRelease = (release: ArtistRelease) => {
    if (isDeletedRelease(release)) return;
    if (!release.legacy) return navigateTo("release-composer", { id: release.id });
    if (release.legacy_kind === "song" && release.song_id) return navigateTo("details", { type: "song", id: release.song_id });
    if (release.album_id) navigateTo("details", { type: "album", id: release.album_id });
  };

  const editRelease = (release: ArtistRelease) => {
    if (!release.legacy) return navigateTo("release-composer", { id: release.id });
    if (release.legacy_kind === "song" && release.song_id) return navigateTo("details", { type: "song", id: release.song_id, edit: true });
    if (release.album_id) navigateTo("details", { type: "album", id: release.album_id, edit: true });
  };

  const editTrack = (release: ArtistRelease, track: ReleaseTrackApi) => {
    if (track.status === "deleted") return;
    if (release.legacy) return navigateTo("details", { type: "song", id: track.id, edit: true });
    navigateTo("release-composer", { id: release.id, trackId: track.id });
  };

  const createRelease = async () => {
    setCreating(true);
    try {
      const release = await apiRequest<ArtistRelease>("/artist/releases/", { method: "POST", body: { title: "انتشار بدون عنوان", release_type: "album" } });
      navigateTo("release-composer", { id: release.id });
    } catch (error) {
      showToast(getApiErrorMessage(error, "ساخت پیش‌نویس انتشار انجام نشد."), "error");
    } finally { setCreating(false); }
  };

  const cloneRelease = async (source: ArtistRelease) => {
    if (source.legacy || cloningId || isDeletedRelease(source)) return;
    setCloningId(source.id);
    try {
      const release = await apiRequest<ArtistRelease>(`/artist/releases/${source.id}/clone/`, {
        method: "POST",
        body: { mode: source.status === "rejected" || source.status === "changes_requested" ? "revision" : "duplicate" },
      });
      showToast("یک نسخه قابل‌ویرایش ساخته شد.", "success");
      navigateTo("release-composer", { id: release.id });
    } catch (error) {
      showToast(getApiErrorMessage(error, "ساخت نسخه قابل‌ویرایش انجام نشد."), "error");
    } finally { setCloningId(null); }
  };

  const executeDelete = async () => {
    if (!deleteAction || deletingKey) return;
    const { release } = deleteAction;
    const key = deleteAction.kind === "release" ? release.id : `${deleteAction.kind}-${deleteAction.track.id}`;
    setDeletingKey(key);
    try {
      if (deleteAction.kind === "release") {
        if (release.legacy_kind === "album" && release.album_id) {
          await apiRequest(`/artist/albums/${release.album_id}/`, { method: "DELETE" });
        } else if (release.legacy_kind === "song" && release.song_id) {
          await apiRequest(`/artist/songs/${release.song_id}/`, { method: "DELETE" });
        } else {
          await apiRequest(`/artist/releases/${release.id}/`, { method: "DELETE", body: { lock_version: release.lock_version } });
        }
        showToast("انتشار حذف شد؛ سوابق مالی لازم محفوظ ماند.", "success");
      } else if (deleteAction.kind === "delete-track") {
        await apiRequest(`/artist/songs/${deleteAction.track.id}/`, { method: "DELETE" });
        showToast("آهنگ حذف یا برای حفظ آمار و درآمد غیرفعال شد.", "success");
      } else if (release.legacy && release.album_id) {
        await apiRequest(`/artist/albums/${release.album_id}/songs/`, { method: "DELETE", body: { song_ids: [deleteAction.track.id] } });
        showToast("آهنگ از انتشار جدا و به‌صورت مستقل حفظ شد.", "success");
      } else {
        await apiRequest(`/artist/releases/${release.id}/tracks/`, {
          method: "DELETE",
          body: { song_ids: [deleteAction.track.id], lock_version: release.lock_version, delete_empty_album: true },
        });
        showToast("آهنگ از انتشار جدا و به‌صورت مستقل حفظ شد.", "success");
      }
      setDeleteAction(null);
      await load();
    } catch (error) {
      showToast(getApiErrorMessage(error, "عملیات حذف انجام نشد."), "error");
    } finally { setDeletingKey(""); }
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return releases.filter((release) => {
      const tabMatch = tab === "all" || release.status === tab;
      const trackText = (release.tracks || []).flatMap((track) => [track.title, track.title_en]);
      const text = [release.title, release.title_en, release.release_type, release.primary_artist?.name, release.primary_artist?.name_en, ...trackText].filter(Boolean).join(" ").toLowerCase();
      return tabMatch && (!needle || text.includes(needle));
    });
  }, [query, releases, tab]);

  const counts = useMemo(() => releases.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}), [releases]);

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "all", label: "همه" }, { value: "draft", label: "پیش‌نویس" }, { value: "in_review", label: "در حال بررسی" },
    { value: "changes_requested", label: "نیازمند اصلاح" }, { value: "approved", label: "تأییدشده" },
    { value: "scheduled", label: "زمان‌بندی‌شده" }, { value: "live", label: "منتشرشده" },
    { value: "rejected", label: "ردشده" }, { value: "taken_down", label: "حذف‌شده" },
  ];

  const renderActions = (release: ArtistRelease) => {
    const deleted = isDeletedRelease(release);
    return <div className="relative z-20 flex shrink-0 items-center justify-end gap-1">
      {!release.legacy && release.status !== "draft" && !deleted && <button disabled={Boolean(cloningId)} onClick={(event) => { event.stopPropagation(); void cloneRelease(release); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#858585] hover:bg-[#1DB954]/10 hover:text-[#1DB954] disabled:opacity-40" title="ساخت نسخه قابل‌ویرایش">{cloningId === release.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}</button>}
      {!deleted && <button disabled={Boolean(deletingKey)} onClick={(event) => { event.stopPropagation(); setDeleteAction({ kind: "release", release }); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#858585] hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40" title="حذف انتشار"><Trash2 className="h-4 w-4" /></button>}
      <button onClick={(event) => { event.stopPropagation(); editRelease(release); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#272727] px-3 text-xs font-black text-white hover:bg-[#333]"><Edit3 className="h-3.5 w-3.5" />{deleted || (!release.legacy && release.status !== "draft") ? "مشاهده" : "ویرایش"}</button>
    </div>;
  };

  const renderAlbum = (release: ArtistRelease) => {
    const deleted = isDeletedRelease(release);
    const effectiveStatus: ReleaseStatus = deleted ? "taken_down" : release.status;
    const meta = statusMeta[effectiveStatus];
    const artwork = release.release_metadata?.cover_url;
    const tracks = release.tracks || [];
    const count = releaseTrackCount(release);
    return <article key={release.id} aria-disabled={deleted} onClick={() => openRelease(release)} className={`relative overflow-hidden rounded-2xl border border-[#303030] bg-[#171717] transition ${deleted ? "cursor-not-allowed grayscale opacity-60" : "cursor-pointer hover:border-[#414141] hover:bg-[#1a1a1a]"}`}>
      {deleted && <span className="pointer-events-none absolute inset-x-4 top-1/2 z-30 h-px -translate-y-1/2 bg-white/30" />}
      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(240px,1fr)_90px_74px_140px_132px] lg:items-center lg:px-4">
        <div className="flex min-w-0 items-center gap-3"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#282828] shadow-[8px_8px_0_#101010]">{artwork ? <img src={resolveMediaUrl(artwork)} alt="" className="h-full w-full object-cover" /> : <Disc3 className="h-7 w-7 text-[#666]" />}</div><div className="min-w-0"><p className={`truncate text-base font-black ${deleted ? "line-through text-[#8c8c8c]" : "text-white"}`}>{release.title || "انتشار بدون عنوان"}</p>{release.title_en && <p className="truncate text-xs text-[#777]" dir="ltr">{release.title_en}</p>}<p className="mt-1 text-[11px] text-[#666]">آخرین تغییر: {formatDate(release.updated_at)}</p></div></div>
        <p className="text-xs font-bold text-[#aaa]"><span className="ml-1 text-[#666] lg:hidden">نوع:</span>{typeLabel[release.release_type]}</p>
        <p className="text-sm font-black text-white"><span className="ml-1 text-xs font-normal text-[#666] lg:hidden">ترک‌ها:</span>{release.release_type === "album" ? count : "-"}</p>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${meta.className}`}>{meta.icon}{meta.label}</span>
        {renderActions(release)}
      </div>
      <div className="mr-[2.15rem] border-r border-[#343434] px-3 pb-3 pr-5 sm:mr-[5.1rem]">
        <div className="max-h-44 space-y-1.5 overflow-y-auto pl-1">
          {tracks.map((track, index) => {
            const trackDeleted = track.status === "deleted";
            return <div key={track.id} onClick={(event) => event.stopPropagation()} className={`relative flex min-w-0 items-center gap-2 rounded-xl border border-[#292929] bg-[#111] px-3 py-2 ${trackDeleted ? "grayscale opacity-55" : ""}`}>
              {trackDeleted && <span className="pointer-events-none absolute inset-x-2 top-1/2 z-10 h-px -translate-y-1/2 bg-white/25" />}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#242424] text-[11px] font-black text-[#aaa]">{index + 1}</span>
              <div className="min-w-0 flex-1"><p className={`truncate text-sm font-bold ${trackDeleted ? "line-through text-[#888]" : "text-white"}`}>{track.title || `Track ${index + 1}`}</p><p className="truncate text-[11px] text-[#666]">{track.duration_display || "بدون زمان"}{track.title_en ? ` · ${track.title_en}` : ""}</p></div>
              {!trackDeleted && <div className="relative z-20 flex shrink-0 gap-1">
                <button onClick={() => editTrack(release, track)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#aaa] hover:bg-[#292929] hover:text-white" title="ویرایش آهنگ"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteAction({ kind: "detach-track", release, track })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#aaa] hover:bg-amber-500/10 hover:text-amber-300" title="حذف از انتشار"><Unlink className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteAction({ kind: "delete-track", release, track })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#aaa] hover:bg-red-500/10 hover:text-red-300" title="حذف کامل آهنگ"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>}
            </div>;
          })}
          {!tracks.length && <div className="rounded-xl border border-dashed border-[#303030] bg-[#121212] px-3 py-2 text-xs text-[#666]">هنوز ترکی داخل این انتشار نیست.</div>}
        </div>
      </div>
    </article>;
  };

  const renderCompactRelease = (release: ArtistRelease) => {
    const deleted = isDeletedRelease(release);
    const meta = statusMeta[deleted ? "taken_down" : release.status];
    const artwork = release.release_metadata?.cover_url;
    return <article key={release.id} aria-disabled={deleted} onClick={() => openRelease(release)} className={`relative grid gap-3 rounded-xl border border-[#282828] bg-[#161616] p-3 transition lg:grid-cols-[minmax(240px,1fr)_90px_74px_140px_132px] lg:items-center lg:px-4 ${deleted ? "cursor-not-allowed grayscale opacity-60" : "cursor-pointer hover:border-[#383838] hover:bg-[#1c1c1c]"}`}>
      {deleted && <span className="pointer-events-none absolute inset-x-4 top-1/2 z-10 h-px -translate-y-1/2 bg-white/30" />}
      <div className="flex min-w-0 items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#282828]">{artwork ? <img src={resolveMediaUrl(artwork)} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-6 w-6 text-[#666]" />}</div><div className="min-w-0"><p className={`truncate font-black ${deleted ? "line-through text-[#888]" : "text-white"}`}>{release.title || "انتشار بدون عنوان"}</p>{release.title_en && <p className="truncate text-xs text-[#777]" dir="ltr">{release.title_en}</p>}<p className="mt-1 text-[11px] text-[#666]">آخرین تغییر: {formatDate(release.updated_at)}</p></div></div>
      <p className="text-xs font-bold text-[#aaa]"><span className="ml-1 text-[#666] lg:hidden">نوع:</span>{typeLabel[release.release_type]}</p>
      <p className="text-sm font-black text-white"><span className="ml-1 text-xs font-normal text-[#666] lg:hidden">ترک‌ها:</span>-</p>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${meta.className}`}>{meta.icon}{meta.label}</span>
      {renderActions(release)}
    </article>;
  };

  const lastTrackWarning = deleteAction && deleteAction.kind !== "release" && activeTracks(deleteAction.release).length === 1
    ? " این آخرین آهنگ فعال انتشار است و با انجام این کار، خود انتشار نیز حذف خواهد شد."
    : "";
  const confirmDescription = !deleteAction ? "" : deleteAction.kind === "release"
    ? (deleteAction.release.release_type !== "single"
      ? "همه آهنگ‌های این انتشار با قانون حذف آهنگ پردازش می‌شوند: آثار منتشرشده یا دارای درآمد غیرفعال می‌مانند و سوابقشان حفظ می‌شود؛ آثار بدون سابقه کاملاً حذف می‌شوند."
      : "اگر آهنگ منتشرشده یا دارای سابقه مالی باشد، غیرفعال می‌شود و آمار و درآمد آن حفظ خواهد شد؛ در غیر این صورت کاملاً حذف می‌شود.")
    : deleteAction.kind === "detach-track"
      ? `آهنگ فقط از انتشار جدا و به‌صورت مستقل حفظ می‌شود.${lastTrackWarning}`
      : `آهنگ کاملاً حذف می‌شود؛ اگر منتشرشده یا دارای سابقه مالی باشد، فقط غیرفعال خواهد شد.${lastTrackWarning}`;

  return <div className="min-h-full w-full p-4 sm:p-6 lg:p-8" dir="rtl">
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1DB954]">فضای مدیریت موسیقی</p><h1 className="text-3xl font-black text-white lg:text-4xl">انتشارها</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#929292]">تک‌آهنگ، مینی‌آلبوم، آلبوم و مجموعه گردآوری را با ساختاری روشن و فشرده مدیریت کنید.</p></div><div className="flex items-center gap-2"><button onClick={() => void load(true)} disabled={loading || refreshing} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#343434] bg-[#181818] text-white hover:bg-[#242424] disabled:opacity-40" title="به‌روزرسانی"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button><button onClick={() => void createRelease()} disabled={creating} className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-3 font-black text-black hover:bg-[#1ed760] disabled:opacity-50">{creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}ساخت انتشار</button></div></header>

    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "پیش‌نویس فعال", value: counts.draft || 0, icon: <FileEdit className="h-5 w-5" /> },
      { label: "در حال بررسی", value: counts.in_review || 0, icon: <Send className="h-5 w-5" /> },
      { label: "زمان‌بندی‌شده", value: counts.scheduled || 0, icon: <CalendarDays className="h-5 w-5" /> },
      { label: "منتشرشده", value: counts.live || 0, icon: <CheckCircle2 className="h-5 w-5" /> },
    ].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[#282828] bg-[#171717] px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242424] text-[#1DB954]">{item.icon}</span><div><p className="text-xl font-black text-white">{item.value}</p><p className="text-[11px] text-[#777]">{item.label}</p></div></div>)}</div>

    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex gap-1 overflow-x-auto rounded-xl bg-[#171717] p-1">{tabs.map((item) => <button key={item.value} onClick={() => setTab(item.value)} className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm ${tab === item.value ? "bg-white text-black" : "text-[#999] hover:bg-[#252525] hover:text-white"}`}>{item.label}</button>)}</div><div className="relative w-full xl:w-80"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-xl border border-[#333] bg-[#171717] py-3 pr-11 pl-4 text-white outline-none placeholder:text-[#666] focus:border-[#1DB954]" placeholder="جستجو در انتشار و ترک‌ها" /></div></div>

    {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-[#181818]" />)}</div> : filtered.length ? <div className="space-y-2">
      <div className="hidden grid-cols-[minmax(240px,1fr)_90px_74px_140px_132px] items-center gap-3 rounded-xl border border-[#262626] bg-[#131313] px-4 py-2.5 text-[11px] font-black text-[#737373] lg:grid">
        <span>انتشار</span><span>نوع</span><span>ترک‌ها</span><span>وضعیت</span><span className="text-left">عملیات</span>
      </div>
      {filtered.map((release) => release.release_type !== "single" ? renderAlbum(release) : renderCompactRelease(release))}
    </div> : <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#303030] bg-[#151515] px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#242424]"><Music2 className="h-7 w-7 text-[#777]" /></div><h2 className="text-xl font-black text-white">انتشاری پیدا نشد</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#777]">{query ? "عبارت جستجو یا فیلتر را تغییر دهید." : "اولین انتشار خود را بسازید."}</p>{!query && <button onClick={() => void createRelease()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black"><Plus className="h-5 w-5" />ساخت انتشار</button>}</div>}

    <ConfirmModal open={Boolean(deleteAction)} title={deleteAction?.kind === "release" ? "حذف انتشار" : deleteAction?.kind === "detach-track" ? "حذف آهنگ از انتشار" : "حذف کامل آهنگ"} description={confirmDescription} confirmLabel={deleteAction?.kind === "detach-track" ? "حذف از انتشار" : "حذف"} cancelLabel="انصراف" tone="danger" loading={Boolean(deletingKey)} onCancel={() => { if (!deletingKey) setDeleteAction(null); }} onConfirm={() => void executeDelete()} />
  </div>;
};

export default Releases;
