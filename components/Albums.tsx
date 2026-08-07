import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Disc3,
  Edit3,
  ImagePlus,
  Loader2,
  Music2,
  Save,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiRequest, fetchAllPages, getApiErrorMessage, unwrapList } from "../lib/api";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import { useImageCropper } from "../contexts/ImageCropperContext";
import ConfirmModal from "./ConfirmModal";
import { TaxonomyOption } from "./types";

interface AlbumSong {
  id: number;
  title: string;
  title_en?: string;
  cover_image?: string;
  duration_display?: string;
  album_id?: number | null;
  is_single?: boolean;
  status?: string;
}

interface AlbumApi {
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
  song_genre_names?: string[];
  song_mood_names?: string[];
  is_deleted?: boolean;
  active_songs_count?: number;
  deleted_songs_count?: number;
  published_songs_count?: number;
  total_streams?: number;
  total_income?: string | number;
  total_duration_seconds?: number;
}

type Filter = "all" | "with-songs" | "empty" | "deleted";
type FormState = {
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  release_date: string;
  genre_ids: number[];
  sub_genre_ids: number[];
  mood_ids: number[];
};

const emptyForm: FormState = { title: "", title_en: "", description: "", description_en: "", release_date: "", genre_ids: [], sub_genre_ids: [], mood_ids: [] };
const inputClass = "w-full rounded-xl border border-[#393939] bg-[#202020] px-4 py-3 text-white outline-none transition placeholder:text-[#656565] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/15";
const labelClass = "mb-2 block text-sm font-bold text-white";

const Albums: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const [albums, setAlbums] = useState<AlbumApi[]>([]);
  const [songs, setSongs] = useState<AlbumSong[]>([]);
  const [taxonomies, setTaxonomies] = useState<{ genres: TaxonomyOption[]; subgenres: TaxonomyOption[]; moods: TaxonomyOption[] }>({ genres: [], subgenres: [], moods: [] });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AlbumApi | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedSongIds, setSelectedSongIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const [albumList, songList, genres, subgenres, moods] = await Promise.all([
        fetchAllPages<AlbumApi>("/artist/albums/"),
        fetchAllPages<AlbumSong>("/artist/songs/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/genres/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/subgenres/"),
        apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/moods/"),
      ]);
      setAlbums(albumList);
      setSongs(songList);
      setTaxonomies({ genres: unwrapList(genres), subgenres: unwrapList(subgenres), moods: unwrapList(moods) });
      if (quiet) showToast("فهرست آلبوم‌ها با موفقیت به‌روزرسانی شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت فهرست آلبوم‌ها انجام نشد."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const visibleAlbums = useMemo(() => albums.filter((album) => {
    const count = album.active_songs_count ?? album.songs?.filter((song) => song.status !== "deleted").length ?? album.songs_count ?? 0;
    const matchesFilter = filter === "all" || (filter === "deleted" ? album.is_deleted : filter === "with-songs" ? count > 0 && !album.is_deleted : count === 0 && !album.is_deleted);
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || [album.title, album.title_en, album.artist_name].some((value) => value?.toLowerCase().includes(needle)));
  }), [albums, filter, query]);

  const availableSongs = useMemo(() => {
    const editingSongIds = new Set(editing?.songs?.map((song) => song.id) || []);
    const needle = songQuery.trim().toLowerCase();
    return songs.filter((song) => song.status !== "deleted" && (!song.album_id || editingSongIds.has(song.id)) && (!needle || [song.title, song.title_en].some((value) => value?.toLowerCase().includes(needle))));
  }, [editing, songQuery, songs]);

  const openModal = async (album: AlbumApi) => {
    setEditing(album);
    setCoverFile(null);
    setSongQuery("");
    if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    try {
      setSaving(true);
      const detail = await apiRequest<AlbumApi>(`/artist/albums/${album.id}/`);
      setEditing(detail);
      setForm({
        title: detail.title || "",
        title_en: detail.title_en || "",
        description: detail.description || "",
        description_en: detail.description_en || "",
        release_date: detail.release_date || "",
        genre_ids: (detail.genre_items || []).map((item) => item.id),
        sub_genre_ids: (detail.sub_genre_items || []).map((item) => item.id),
        mood_ids: (detail.mood_items || []).map((item) => item.id),
      });
      setSelectedSongIds((detail.songs || []).filter((song) => song.status !== "deleted").map((song) => song.id));
      setCoverPreview(detail.cover_image || "");
      setModalOpen(true);
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت جزئیات آلبوم انجام نشد."), "error");
    } finally {
      setSaving(false);
    }
  };

  const chooseCover = async (file?: File) => {
    if (!file) return;
    const result = await cropImage(file, {
      mode: "square",
      title: "برش کاور آلبوم",
      description: "کاور آلبوم به‌صورت مربعی ذخیره می‌شود. محدوده دلخواه را با قاب انتخاب کنید.",
      maxSourceBytes: 40 * 1024 * 1024,
      maxOutputBytes: 9.5 * 1024 * 1024,
      maxOutputDimension: 3000,
    });
    if (!result) return;
    if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverFile(result.file);
    setCoverPreview(URL.createObjectURL(result.file));
  };

  const toggleTaxonomy = (key: "genre_ids" | "sub_genre_ids" | "mood_ids", id: number) => setForm((current) => {
    const values = current[key];
    return { ...current, [key]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id] };
  });

  const appendIds = (payload: FormData, key: string, ids: number[], includeEmpty: boolean) => {
    if (ids.length) ids.forEach((id) => payload.append(key, String(id)));
    else if (includeEmpty) payload.append(key, "");
  };

  const saveAlbum = async () => {
    if (!form.title.trim()) return showToast("وارد کردن عنوان فارسی آلبوم الزامی است.", "error");
    if (!form.release_date) return showToast("وارد کردن تاریخ انتشار الزامی است.", "error");
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (!Array.isArray(value)) payload.append(key, String(value));
      });
      appendIds(payload, "genre_ids", form.genre_ids, true);
      appendIds(payload, "sub_genre_ids", form.sub_genre_ids, true);
      appendIds(payload, "mood_ids", form.mood_ids, true);
      if (coverFile) payload.append("cover_image", coverFile);
      if (selectedSongIds.length) selectedSongIds.forEach((id) => payload.append("existing_song_ids", String(id)));
      else payload.append("existing_song_ids", "");

      if (!editing) return;
      await apiRequest(`/artist/albums/${editing.id}/`, { method: "PATCH", body: payload });
      showToast("اطلاعات آلبوم با موفقیت ذخیره شد.", "success");
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره تغییرات آلبوم انجام نشد."), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteAlbum = async () => {
    if (deleteId === null) return;
    setSaving(true);
    try {
      const response = await apiRequest<{ deletion: "soft" | "hard"; album?: AlbumApi }>(`/artist/albums/${deleteId}/`, { method: "DELETE" });
      setAlbums((current) => response.deletion === "soft"
        ? current.map((album) => album.id === deleteId ? (response.album || { ...album, is_deleted: true, active_songs_count: 0 }) : album)
        : current.filter((album) => album.id !== deleteId));
      setDeleteId(null);
      showToast(response.deletion === "soft" ? "آلبوم و ترک‌های منتشرشده غیرفعال شدند؛ آمار و درآمد محفوظ است." : "آلبوم حذف شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "حذف آلبوم انجام نشد."), "error");
    } finally {
      setSaving(false);
    }
  };

  const taxonomyPicker = (label: string, key: "genre_ids" | "sub_genre_ids" | "mood_ids", items: TaxonomyOption[]) => <div><label className={labelClass}>{label}</label><div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[#333] bg-[#1c1c1c] p-3">{items.length ? items.map((item) => <button type="button" key={item.id} onClick={() => toggleTaxonomy(key, item.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${form[key].includes(item.id) ? "bg-[#1DB954] text-black" : "bg-[#2b2b2b] text-[#bbb]"}`}>{item.title || item.name}</button>) : <span className="text-xs text-[#666]">موردی تعریف نشده است.</span>}</div></div>;

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8 pc-compact" dir="rtl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="mb-2 text-3xl font-black text-white lg:text-4xl">مدیریت آلبوم‌ها</h1><p className="text-[#B3B3B3]">ویرایش اطلاعات، مدیریت ترک‌ها و مشاهده عملکرد آلبوم‌ها</p></div><button onClick={() => void load(true)} disabled={loading || refreshing} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#383838] bg-[#181818] text-white hover:bg-[#282828] disabled:opacity-50" title="تازه‌سازی"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button></div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-1 overflow-x-auto rounded-xl bg-[#181818] p-1">{([{value:"all",label:"همه"},{value:"with-songs",label:"دارای آهنگ"},{value:"empty",label:"بدون آهنگ"},{value:"deleted",label:"حذف‌شده"}] as Array<{value:Filter;label:string}>).map((item)=><button key={item.value} onClick={()=>setFilter(item.value)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold ${filter===item.value?"bg-white text-black":"text-[#aaa] hover:bg-[#282828] hover:text-white"}`}>{item.label}</button>)}</div><div className="relative w-full lg:w-80"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-xl border border-[#333] bg-[#181818] py-3 pr-11 pl-4 text-white outline-none focus:border-[#1DB954]" placeholder="جستجو در آلبوم‌ها" /></div></div>

      {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-[.82] animate-pulse rounded-2xl bg-[#181818]"/>)}</div> : visibleAlbums.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visibleAlbums.map((album)=>{
        const count=album.active_songs_count??album.songs_count??album.songs?.filter((song)=>song.status!=="deleted").length??0;
        const deleted=Boolean(album.is_deleted);
        return <article key={album.id} aria-disabled={deleted} onClick={()=>{if(!deleted) navigateTo("details",{type:"album",id:album.id});}} className={`group relative overflow-hidden rounded-2xl border border-[#282828] bg-[#181818] transition ${deleted?"cursor-not-allowed grayscale opacity-55":"cursor-pointer hover:-translate-y-1 hover:border-[#3a3a3a] hover:shadow-xl"}`}>
          {deleted&&<span className="pointer-events-none absolute inset-x-3 top-1/2 z-20 h-px -translate-y-1/2 bg-white/30"/>}
          <div className="relative aspect-square overflow-hidden bg-[#242424]">{album.cover_image?<img src={album.cover_image} alt="" className={`h-full w-full object-cover transition duration-500 ${deleted?"":"group-hover:scale-105"}`}/>:<div className="flex h-full items-center justify-center"><Disc3 className="h-16 w-16 text-[#555]"/></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"/><span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white backdrop-blur">{count} آهنگ</span>{deleted&&<span className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-[#aaa]">حذف‌شده</span>}</div>
          <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className={`truncate text-lg font-black ${deleted?"text-[#888] line-through":"text-white"}`}>{album.title}</h3>{album.title_en&&<p className="mt-1 truncate text-xs text-[#777]" dir="ltr">{album.title_en}</p>}</div><div className="flex shrink-0 gap-1">{!deleted&&<><button onClick={(event)=>{event.stopPropagation();void openModal(album);}} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aaa] hover:bg-[#303030] hover:text-white"><Edit3 className="h-4 w-4"/></button><button onClick={(event)=>{event.stopPropagation();setDeleteId(album.id);}} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aaa] hover:bg-red-500/15 hover:text-red-400"><Trash2 className="h-4 w-4"/></button></>}</div></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#202020] p-3 text-xs"><div><span className="text-[#777]">استریم</span><p className="mt-1 font-black text-white">{new Intl.NumberFormat("fa-IR",{notation:"compact",maximumFractionDigits:1}).format(album.total_streams||0)}</p></div><div><span className="text-[#777]">درآمد</span><p className="mt-1 truncate font-black text-[#1DB954]">{new Intl.NumberFormat("fa-IR",{maximumFractionDigits:8}).format(Number(album.total_income||0))} تومان</p></div></div><div className="mt-3 flex items-center justify-between text-xs text-[#777]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{album.release_date?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(album.release_date)):"بدون تاریخ"}</span><span>{album.artist_name}</span></div></div>
        </article>})}</div> : <div className="rounded-2xl border border-[#282828] bg-[#181818] py-20 text-center"><Disc3 className="mx-auto h-16 w-16 text-[#555]"/><h3 className="mt-4 text-xl font-black text-white">آلبومی پیدا نشد</h3><p className="mt-2 text-sm text-[#777]">{query?"عبارت جستجو یا فیلتر را تغییر دهید.":"آلبوم جدید را از بخش انتشارها ثبت کنید."}</p></div>}

      {modalOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"><div className="flex h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-[#303030] bg-[#121212] sm:h-[90dvh] sm:rounded-3xl"><header className="flex items-center justify-between border-b border-[#292929] px-4 py-4 sm:px-6"><div><h2 className="text-2xl font-black text-white">ویرایش آلبوم</h2><p className="mt-1 text-xs text-[#777]">اطلاعات فارسی و انگلیسی با اپلیکیشن مخاطبان همگام می‌شوند.</p></div><button onClick={()=>!saving&&setModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#242424] text-[#aaa]"><X className="h-5 w-5"/></button></header><div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><div><label className={labelClass}>کاور آلبوم</label><button onClick={()=>coverInput.current?.click()} className="relative aspect-square w-full overflow-hidden rounded-2xl border border-dashed border-[#444] bg-[#1d1d1d] hover:border-[#1DB954]">{coverPreview?<img src={coverPreview} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full flex-col items-center justify-center"><ImagePlus className="mb-2 h-10 w-10 text-[#1DB954]"/><span className="font-bold text-white">انتخاب کاور</span><span className="mt-1 text-xs text-[#777]">JPG، PNG یا WEBP تا ۱۰ مگابایت</span></div>}</button><input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e)=>{ const file=e.target.files?.[0]; e.target.value=""; void chooseCover(file); }}/></div><div className="space-y-5"><div><label className={labelClass}>عنوان آلبوم (فارسی) *</label><input className={inputClass} value={form.title} onChange={(e)=>setForm((p)=>({...p,title:e.target.value}))}/></div><div dir="ltr"><label className={`${labelClass} text-left`}>عنوان آلبوم (انگلیسی)</label><input className={`${inputClass} text-left`} value={form.title_en} onChange={(e)=>setForm((p)=>({...p,title_en:e.target.value}))}/></div><div><label className={labelClass}>تاریخ انتشار *</label><input type="date" dir="ltr" className={`${inputClass} text-left`} value={form.release_date} onChange={(e)=>setForm((p)=>({...p,release_date:e.target.value}))}/></div><div><label className={labelClass}>توضیحات (فارسی)</label><textarea rows={4} className={`${inputClass} resize-y`} value={form.description} onChange={(e)=>setForm((p)=>({...p,description:e.target.value}))}/></div><div dir="ltr"><label className={`${labelClass} text-left`}>توضیحات انگلیسی</label><textarea rows={4} className={`${inputClass} resize-y text-left`} value={form.description_en} onChange={(e)=>setForm((p)=>({...p,description_en:e.target.value}))}/></div></div></div><div className="mt-7 grid gap-5 lg:grid-cols-3">{taxonomyPicker("ژانر", "genre_ids", taxonomies.genres)}{taxonomyPicker("زیرژانر", "sub_genre_ids", taxonomies.subgenres)}{taxonomyPicker("حال‌وهوا", "mood_ids", taxonomies.moods)}</div><div className="mt-7"><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-black text-white">آهنگ‌های آلبوم</h3><p className="mt-1 text-xs text-[#777]">فقط آهنگ‌های بدون آلبوم یا آهنگ‌های فعلی این آلبوم نمایش داده می‌شوند.</p></div><div className="relative sm:w-72"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]"/><input value={songQuery} onChange={(e)=>setSongQuery(e.target.value)} className="w-full rounded-xl border border-[#333] bg-[#1d1d1d] py-2.5 pr-10 pl-3 text-sm text-white outline-none" placeholder="جستجوی آهنگ"/></div></div><div className="max-h-72 overflow-y-auto rounded-2xl border border-[#303030] bg-[#1b1b1b] p-2">{availableSongs.length?availableSongs.map((song)=>{const active=selectedSongIds.includes(song.id); return <button type="button" key={song.id} onClick={()=>setSelectedSongIds((current)=>active?current.filter((id)=>id!==song.id):[...current,song.id])} className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition ${active?"bg-[#1DB954]/12":"hover:bg-[#252525]"}`}><div className="h-11 w-11 overflow-hidden rounded-lg bg-[#2b2b2b]">{song.cover_image?<img src={song.cover_image} alt="" className="h-full w-full object-cover"/>:<Music2 className="m-3 h-5 w-5 text-[#666]"/>}</div><div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{song.title}</p>{song.title_en&&<p className="truncate text-xs text-[#777]" dir="ltr">{song.title_en}</p>}</div><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${active?"border-[#1DB954] bg-[#1DB954] text-black":"border-[#555]"}`}>{active&&"✓"}</span></button>}):<div className="py-10 text-center text-sm text-[#777]">آهنگ قابل انتخابی وجود ندارد.</div>}</div><p className="mt-2 text-xs text-[#777]">{selectedSongIds.length} آهنگ انتخاب شده</p></div></div><footer className="flex items-center justify-end gap-3 border-t border-[#292929] px-4 py-4 sm:px-6"><button onClick={()=>!saving&&setModalOpen(false)} className="rounded-xl border border-[#3a3a3a] bg-[#222] px-5 py-2.5 font-bold text-white">انصراف</button><button onClick={()=>void saveAlbum()} disabled={saving} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black disabled:opacity-50">{saving?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}ذخیره تغییرات</button></footer></div></div>}

      <ConfirmModal open={deleteId!==null} title="حذف آلبوم" description="همه ترک‌های آلبوم با همان قانون حذف آهنگ پردازش می‌شوند: ترک‌های منتشرشده یا دارای سابقه مالی غیرفعال می‌مانند و آمار و درآمدشان حفظ می‌شود؛ پیش‌نویس‌های بدون سابقه کاملاً حذف می‌شوند." confirmLabel="حذف آلبوم" cancelLabel="انصراف" tone="danger" loading={saving} onCancel={()=>!saving&&setDeleteId(null)} onConfirm={()=>void deleteAlbum()}/>
    </div>
  );
};

export default Albums;
