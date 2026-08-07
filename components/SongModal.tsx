import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileAudio,
  ImagePlus,
  Loader2,
  Music2,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { apiRequest, getApiErrorMessage, resolveMediaUrl, unwrapList } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { useImageCropper } from "../contexts/ImageCropperContext";
import { ArtistOption, PartialSong, SongMetadata, TaxonomyOption } from "./types";

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PartialSong) => void | Promise<void>;
  initialData?: PartialSong | null;
  initialIsSingle?: boolean;
  isSubmitting?: boolean;
  releaseMode?: boolean;
  fixedTitle?: { title: string; title_en?: string };
  fixedReleaseDate?: string;
  allowIncomplete?: boolean;
  draftMode?: boolean;
  submitLabel?: string;
}

type Step = 1 | 2 | 3 | 4;
type MultiKey = "genre_ids" | "sub_genre_ids" | "mood_ids" | "tag_ids";

const languageLabels: Record<string, string> = {
  fa: "فارسی",
  en: "انگلیسی",
  ar: "عربی",
  other: "سایر",
};

const languageLabel = (value?: string) => languageLabels[String(value || "").toLowerCase()] || "نامشخص";

const blank: PartialSong = {
  title: "",
  title_en: "",
  featuredArtists: [],
  featured_artist_ids: [],
  is_single: true,
  releaseDate: "",
  release_date: "",
  language: "fa",
  genre_ids: [],
  sub_genre_ids: [],
  mood_ids: [],
  tag_ids: [],
  description: "",
  description_en: "",
  lyrics: "",
  lyrics_en: "",
  tempo: 120,
  energy: 50,
  danceability: 50,
  valence: 50,
  acousticness: 0,
  instrumentalness: 0,
  speechiness: 0,
  live_performed: false,
  label: "",
  label_en: "",
  producers: [],
  producers_en: [],
  composers: [],
  composers_en: [],
  lyricists: [],
  lyricists_en: [],
  credits: "",
  credits_en: "",
};

const inputClass = "w-full rounded-xl border border-[#393939] bg-[#202020] px-4 py-3 text-white outline-none transition placeholder:text-[#646464] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/15";
const labelClass = "mb-2 block text-sm font-bold text-white";
const listToText = (value: unknown) => Array.isArray(value) ? value.join(", ") : String(value || "");
const textToList = (value: string) => value.split(/[,،\n]/).map((item) => item.trim()).filter(Boolean);

const SongModal: React.FC<SongModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialIsSingle = true,
  isSubmitting = false,
  releaseMode = false,
  fixedTitle,
  fixedReleaseDate = "",
  submitLabel,
}) => {
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<PartialSong>(blank);
  const [taxonomies, setTaxonomies] = useState<{ genres: TaxonomyOption[]; subgenres: TaxonomyOption[]; moods: TaxonomyOption[]; tags: TaxonomyOption[] }>({ genres: [], subgenres: [], moods: [], tags: [] });
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(false);
  const [artistQuery, setArtistQuery] = useState("");
  const [currentArtistId, setCurrentArtistId] = useState<number | null>(null);
  const [artistResults, setArtistResults] = useState<ArtistOption[]>([]);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const [audioName, setAudioName] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const editing = Boolean(initialData?.id);

  useEffect(() => {
    if (!isOpen) return;
    const featured = (initialData?.featuredArtists || initialData?.featured_artists || []) as ArtistOption[];
    setStep(1);
    setForm({
      ...blank,
      ...initialData,
      title: fixedTitle?.title ?? initialData?.title_fa ?? initialData?.title ?? "",
      title_fa: fixedTitle?.title ?? initialData?.title_fa ?? initialData?.title ?? "",
      title_en: fixedTitle?.title_en ?? initialData?.title_en ?? "",
      is_single: releaseMode ? false : initialData?.is_single ?? initialIsSingle,
      releaseDate: fixedReleaseDate || initialData?.releaseDate || initialData?.release_date || "",
      release_date: fixedReleaseDate || initialData?.release_date || initialData?.releaseDate || "",
      featuredArtists: featured,
      featured_artist_ids: initialData?.featured_artist_ids || featured.map((item) => item.id),
      genre_ids: initialData?.genre_ids || [],
      sub_genre_ids: initialData?.sub_genre_ids || [],
      mood_ids: initialData?.mood_ids || [],
      tag_ids: initialData?.tag_ids || [],
      producers: Array.isArray(initialData?.producers) ? initialData?.producers : textToList(String(initialData?.producers || "")),
      producers_en: Array.isArray(initialData?.producers_en) ? initialData?.producers_en : textToList(String(initialData?.producers_en || "")),
      composers: Array.isArray(initialData?.composers) ? initialData?.composers : textToList(String(initialData?.composers || "")),
      composers_en: Array.isArray(initialData?.composers_en) ? initialData?.composers_en : textToList(String(initialData?.composers_en || "")),
      lyricists: Array.isArray(initialData?.lyricists) ? initialData?.lyricists : textToList(String(initialData?.lyricists || "")),
      lyricists_en: Array.isArray(initialData?.lyricists_en) ? initialData?.lyricists_en : textToList(String(initialData?.lyricists_en || "")),
    });
    setAudioName("");
    setCoverPreview(resolveMediaUrl(initialData?.image || ""));
    setArtistQuery("");
    setArtistResults([]);
  }, [fixedReleaseDate, fixedTitle?.title, fixedTitle?.title_en, initialData, initialIsSingle, isOpen, releaseMode]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoadingTaxonomies(!releaseMode);

    void (async () => {
      const taxonomyRequest = releaseMode
        ? Promise.resolve<TaxonomyOption[][]>([])
        : Promise.all([
            apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/genres/").then(unwrapList),
            apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/subgenres/").then(unwrapList),
            apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/moods/").then(unwrapList),
            apiRequest<TaxonomyOption[] | { results: TaxonomyOption[] }>("/tags/").then(unwrapList),
          ]);
      const [taxonomyResult, artistResult] = await Promise.allSettled([
        taxonomyRequest,
        apiRequest<{ id: number }>("/artist/settings/"),
      ]);
      if (cancelled) return;

      if (!releaseMode && taxonomyResult.status === "fulfilled") {
        const [genres, subgenres, moods, tags] = taxonomyResult.value;
        setTaxonomies({ genres, subgenres, moods, tags });
      } else if (!releaseMode && taxonomyResult.status === "rejected") {
        showToast(getApiErrorMessage(taxonomyResult.reason, "دریافت دسته‌بندی‌های آهنگ انجام نشد."), "error");
      }

      if (artistResult.status === "fulfilled") {
        setCurrentArtistId(Number(artistResult.value.id));
      } else {
        setCurrentArtistId(null);
        showToast(getApiErrorMessage(artistResult.reason, "دریافت پروفایل هنرمند انجام نشد."), "error");
      }
      setLoadingTaxonomies(false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, releaseMode, showToast]);

  useEffect(() => {
    if (!isOpen || artistQuery.trim().length < 2) {
      setArtistResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingArtists(true);
      try {
        const data = await apiRequest<ArtistOption[]>("/artists/", { query: { q: artistQuery.trim(), artist_panel: 1 }, signal: controller.signal });
        const selected = new Set(form.featured_artist_ids || []);
        setArtistResults(data.filter((item) => item.id !== currentArtistId && !selected.has(item.id)).slice(0, 8));
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") showToast(getApiErrorMessage(error, "جست‌وجوی هنرمندان انجام نشد."), "error");
      } finally {
        setSearchingArtists(false);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [artistQuery, currentArtistId, form.featured_artist_ids, isOpen, showToast]);

  useEffect(() => {
    if (!currentArtistId) return;
    setForm((current) => {
      const featured = ((current.featuredArtists || current.featured_artists || []) as ArtistOption[]).filter((item) => item.id !== currentArtistId);
      return { ...current, featuredArtists: featured, featured_artists: featured, featured_artist_ids: featured.map((item) => item.id) };
    });
  }, [currentArtistId]);

  useEffect(() => () => { if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const setValue = <K extends keyof PartialSong>(key: K, value: PartialSong[K]) => {
    setForm((current) => {
      const next: PartialSong = { ...current, [key]: value };
      if (key === "releaseDate") next.release_date = String(value || "");
      return next;
    });
  };

  const toggleMulti = (key: MultiKey, id: number) => {
    setForm((current) => {
      const values = (current[key] || []) as number[];
      return { ...current, [key]: values.includes(id) ? values.filter((item) => item !== id) : [...values, id] };
    });
  };

  const selectAudio = (file?: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["mp3", "wav"].includes(ext)) return showToast("فقط فایل‌های صوتی MP3 و WAV پشتیبانی می‌شوند.", "error");
    if (file.size > 500 * 1024 * 1024) return showToast("حجم فایل صوتی باید کمتر از ۵۰۰ مگابایت باشد.", "error");
    setForm((current) => ({ ...current, audio_file: file }));
    setAudioName(file.name);
  };

  const selectCover = async (file?: File) => {
    if (!file) return;
    const result = await cropImage(file, {
      mode: "square",
      title: "برش کاور آهنگ",
      description: "کاور آهنگ باید مربعی باشد. قاب را جابه‌جا کنید یا از هر لبه و گوشه اندازه آن را تغییر دهید.",
      maxSourceBytes: 40 * 1024 * 1024,
      maxOutputBytes: 9.5 * 1024 * 1024,
      maxOutputDimension: 3000,
    });
    if (!result) return;
    if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(result.file));
    setForm((current) => ({ ...current, cover_image: result.file }));
  };

  const validateStep = (target = step) => {
    if (target === 1) {
      if (!String(fixedTitle?.title || form.title || "").trim() && !String(fixedTitle?.title_en || form.title_en || "").trim()) return "عنوان فارسی یا انگلیسی آهنگ را وارد کنید.";
      if (!editing && !form.audio_file) return "یک فایل صوتی MP3 یا WAV انتخاب کنید.";
      if (!releaseMode && !form.releaseDate && !form.release_date) return "وارد کردن تاریخ انتشار الزامی است.";
    }
    if (target === 2) {
      if (!releaseMode && !(form.genre_ids || []).length) return "حداقل یک ژانر انتخاب کنید.";
      if (!releaseMode && !(form.mood_ids || []).length) return "حداقل یک حال‌وهوا انتخاب کنید.";
      const tempo = Number(form.tempo || 0);
      if (tempo < 40 || tempo > 240) return "تمپو باید بین ۴۰ تا ۲۴۰ ضرب در دقیقه باشد.";
    }
    return "";
  };

  const next = () => {
    const message = validateStep();
    if (message) return showToast(message, "error");
    setStep((value) => Math.min(4, value + 1) as Step);
  };

  const submit = async () => {
    const first = validateStep(1) || validateStep(2);
    if (first) return showToast(first, "error");
    await onSubmit({
      ...form,
      title: fixedTitle?.title || form.title,
      title_en: fixedTitle?.title_en ?? form.title_en,
      release_date: fixedReleaseDate || form.releaseDate || form.release_date,
      featured_artist_ids: form.featured_artist_ids || [],
    });
  };

  const selectedArtists = (form.featuredArtists || []) as ArtistOption[];
  const featureRows = [
    { key: "energy", label: "انرژی" }, { key: "danceability", label: "رقص‌پذیری" }, { key: "valence", label: "حس مثبت" },
    { key: "acousticness", label: "آکوستیک" }, { key: "instrumentalness", label: "بی‌کلام" }, { key: "speechiness", label: "گفتاری" },
  ] as const;

  const taxonomyBlock = (label: string, key: MultiKey, items: TaxonomyOption[]) => (
    <div><label className={labelClass}>{label}</label>{loadingTaxonomies ? <div className="h-24 animate-pulse rounded-xl bg-[#242424]" /> : items.length ? <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[#303030] bg-[#1d1d1d] p-3">{items.map((item) => { const active = (form[key] || []).includes(item.id); return <button type="button" key={item.id} onClick={() => toggleMulti(key, item.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${active ? "bg-[#1DB954] text-black" : "bg-[#2b2b2b] text-[#bbb] hover:text-white"}`}>{item.title || item.name}</button>; })}</div> : <p className="rounded-xl border border-[#303030] p-4 text-sm text-[#777]">موردی در سرور تعریف نشده است.</p>}</div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4" dir="rtl" role="dialog" aria-modal="true">
      <div className="flex h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-[#303030] bg-[#121212] shadow-2xl sm:h-[92dvh] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-[#292929] px-4 py-4 sm:px-6">
          <div><h2 className="text-xl font-black text-white sm:text-2xl">{editing ? "ویرایش آهنگ" : "افزودن آهنگ جدید"}</h2><p className="mt-1 text-xs text-[#777]">مرحله {step} از ۴</p></div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252525] text-[#aaa] hover:bg-[#333] hover:text-white disabled:opacity-40"><X className="h-5 w-5" /></button>
        </header>

        <div className="border-b border-[#292929] px-4 py-3 sm:px-6"><div className="flex items-center gap-2">{["اطلاعات اصلی", releaseMode ? "ویژگی صوتی" : "دسته‌بندی", releaseMode ? "متن آهنگ" : "متن و عوامل", "بازبینی"].map((label, index) => { const n = index + 1; const active = n === step; const complete = n < step; return <React.Fragment key={label}><button type="button" onClick={() => complete && setStep(n as Step)} className={`flex min-w-0 items-center gap-2 ${active || complete ? "text-white" : "text-[#666]"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${complete ? "bg-[#1DB954] text-black" : active ? "bg-white text-black" : "bg-[#292929]"}`}>{complete ? <Check className="h-4 w-4" /> : n}</span><span className="hidden truncate text-xs font-bold md:block">{label}</span></button>{n < 4 && <div className={`h-px flex-1 ${complete ? "bg-[#1DB954]" : "bg-[#303030]"}`} />}</React.Fragment>; })}</div></div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {step === 1 && <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              {fixedTitle ? <div className="rounded-xl border border-[#303030] bg-[#1b1b1b] p-4"><p className="text-xs font-bold text-[#777]">عنوان از اطلاعات انتشار استفاده می‌شود</p><p className="mt-2 text-lg font-black text-white">{fixedTitle.title}</p>{fixedTitle.title_en && <p className="mt-1 text-sm text-[#999]" dir="ltr">{fixedTitle.title_en}</p>}</div> : <><div><label className={labelClass}>عنوان آهنگ (فارسی) *</label><input className={inputClass} value={form.title || ""} onChange={(e)=>setValue("title",e.target.value)} placeholder="عنوان فارسی آهنگ" /></div><div dir="ltr"><label className={`${labelClass} text-left`}>عنوان انگلیسی آهنگ</label><input className={`${inputClass} text-left`} value={form.title_en || ""} onChange={(e)=>setValue("title_en",e.target.value)} placeholder="عنوان انگلیسی" /></div></>}
              {!releaseMode && <><div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>تاریخ انتشار *</label><input type="date" dir="ltr" className={`${inputClass} text-left`} value={form.releaseDate || form.release_date || ""} onChange={(e)=>setValue("releaseDate",e.target.value)} /></div><div><label className={labelClass}>زبان اصلی</label><select className={inputClass} value={form.language || "fa"} onChange={(e)=>setValue("language",e.target.value)}><option value="fa">فارسی</option><option value="en">انگلیسی</option><option value="ar">العربية</option><option value="other">سایر</option></select></div></div><label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#333] bg-[#202020] p-4"><div><p className="font-bold text-white">انتشار به‌عنوان تک‌آهنگ</p><p className="mt-1 text-xs text-[#777]">بعداً می‌توانید آن را به آلبوم اضافه کنید.</p></div><input type="checkbox" checked={Boolean(form.is_single)} onChange={(e)=>setValue("is_single",e.target.checked)} className="h-5 w-5 accent-[#1DB954]" /></label></>}
            </div>
            <div className="space-y-5">
              <div><label className={labelClass}>فایل صوتی {!editing && "*"}</label><button type="button" onClick={()=>audioRef.current?.click()} className="flex min-h-28 w-full items-center gap-4 rounded-2xl border border-dashed border-[#454545] bg-[#1c1c1c] p-4 text-right transition hover:border-[#1DB954]"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/15"><FileAudio className="h-6 w-6 text-[#1DB954]" /></div><div className="min-w-0"><p className="truncate font-bold text-white">{audioName || (editing ? "برای حفظ فایل فعلی، فایل جدید انتخاب نکنید" : "انتخاب فایل MP3 یا WAV")}</p><p className="mt-1 text-xs text-[#777]">حداکثر ۵۰۰ مگابایت</p></div></button><input ref={audioRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" hidden onChange={(e)=>selectAudio(e.target.files?.[0])} /></div>
              <div><label className={labelClass}>کاور آهنگ</label><button type="button" onClick={()=>coverRef.current?.click()} className="relative flex min-h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#454545] bg-[#1c1c1c] transition hover:border-[#1DB954]">{coverPreview?<img src={coverPreview} alt="پیش‌نمایش کاور" className="absolute inset-0 h-full w-full object-cover"/>:<div className="text-center"><ImagePlus className="mx-auto mb-2 h-8 w-8 text-[#1DB954]"/><p className="font-bold text-white">انتخاب کاور</p><p className="mt-1 text-xs text-[#777]">JPG، PNG یا WEBP تا ۱۰ مگابایت</p></div>}<span className="absolute inset-0 bg-black/0 transition hover:bg-black/20" /></button><input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e)=>{ const file=e.target.files?.[0]; e.target.value=""; void selectCover(file); }} /></div>
            </div>
            <div className="lg:col-span-2"><label className={labelClass}>هنرمندان مهمان</label><div className="rounded-2xl border border-[#333] bg-[#1d1d1d] p-4"><div className="relative"><Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]"/><input className={`${inputClass} pr-11`} value={artistQuery} onChange={(e)=>setArtistQuery(e.target.value)} placeholder="حداقل دو حرف از نام هنرمند را جستجو کنید" />{searchingArtists&&<Loader2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#1DB954]"/>}</div>{artistResults.length>0&&<div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#333] bg-[#171717] p-2">{artistResults.map((artist)=><button type="button" key={artist.id} onClick={()=>{const next=[...selectedArtists,artist]; setForm((current)=>({...current,featuredArtists:next,featured_artists:next,featured_artist_ids:next.map((item)=>item.id)})); setArtistQuery(""); setArtistResults([]);}} className="flex w-full items-center gap-3 rounded-lg p-2 text-right hover:bg-[#292929]"><div className="h-10 w-10 overflow-hidden rounded-full bg-[#303030]">{artist.profile_image?<img src={artist.profile_image} alt="" className="h-full w-full object-cover"/>:<UserPlus className="m-2.5 h-5 w-5 text-[#777]"/>}</div><div><p className="font-bold text-white">{artist.artistic_name || artist.name}</p>{(artist.artistic_name_en||artist.name_en)&&<p className="text-xs text-[#777]" dir="ltr">{artist.artistic_name_en || artist.name_en}</p>}</div></button>)}</div>}<div className="mt-3 flex flex-wrap gap-2">{selectedArtists.length ? selectedArtists.map((artist)=><span key={artist.id} className="inline-flex items-center gap-2 rounded-full bg-[#2b2b2b] py-1.5 pr-3 pl-1.5 text-sm text-white">{artist.artistic_name || artist.name}<button type="button" onClick={()=>{const next=selectedArtists.filter((item)=>item.id!==artist.id); setForm((current)=>({...current,featuredArtists:next,featured_artists:next,featured_artist_ids:next.map((item)=>item.id)}));}} className="rounded-full bg-[#444] p-1 hover:bg-red-500"><X className="h-3 w-3"/></button></span>):<p className="text-xs text-[#666]">هنرمند مهمانی انتخاب نشده است.</p>}</div></div></div>
          </div>}

          {step === 2 && <div className="space-y-7">
            {!releaseMode && <div className="grid gap-6 lg:grid-cols-2">{taxonomyBlock("ژانر *", "genre_ids", taxonomies.genres)}{taxonomyBlock("زیرژانر", "sub_genre_ids", taxonomies.subgenres)}{taxonomyBlock("حال‌وهوا *", "mood_ids", taxonomies.moods)}{taxonomyBlock("تگ‌ها", "tag_ids", taxonomies.tags)}</div>}
            <div className="rounded-2xl border border-[#303030] bg-[#1b1b1b] p-4 sm:p-6"><h3 className="mb-5 text-lg font-black text-white">ویژگی‌های صوتی</h3><div className="grid gap-5 md:grid-cols-2"><div><label className={labelClass}>تمپو (ضرب در دقیقه)</label><input type="number" min={40} max={240} className={inputClass} value={form.tempo ?? 120} onChange={(e)=>setValue("tempo",Number(e.target.value))}/></div><label className="flex items-center justify-between rounded-xl border border-[#333] bg-[#202020] p-4"><div><p className="font-bold text-white">اجرای زنده</p><p className="mt-1 text-xs text-[#777]">نسخه ثبت‌شده از اجرای زنده است.</p></div><input type="checkbox" checked={Boolean(form.live_performed)} onChange={(e)=>setValue("live_performed",e.target.checked)} className="h-5 w-5 accent-[#1DB954]" /></label>{featureRows.map(({key,label})=><div key={key}><div className="mb-2 flex justify-between"><label className="text-sm font-bold text-white">{label}</label><span className="text-xs text-[#1DB954]">{Number(form[key] || 0)}%</span></div><input type="range" min={0} max={100} value={Number(form[key] || 0)} onChange={(e)=>setValue(key,Number(e.target.value))} className="w-full accent-[#1DB954]" /></div>)}</div></div>
          </div>}

          {step === 3 && <div className="space-y-7">
            <div className="grid gap-6 lg:grid-cols-2"><div><label className={labelClass}>توضیحات (فارسی)</label><textarea rows={5} className={`${inputClass} resize-y`} value={form.description || ""} onChange={(e)=>setValue("description",e.target.value)} /></div><div dir="ltr"><label className={`${labelClass} text-left`}>توضیحات انگلیسی</label><textarea rows={5} className={`${inputClass} resize-y text-left`} value={form.description_en || ""} onChange={(e)=>setValue("description_en",e.target.value)} /></div><div><label className={labelClass}>متن ترانه (فارسی)</label><textarea rows={9} className={`${inputClass} resize-y`} value={form.lyrics || ""} onChange={(e)=>setValue("lyrics",e.target.value)} /></div><div dir="ltr"><label className={`${labelClass} text-left`}>متن ترانه انگلیسی</label><textarea rows={9} className={`${inputClass} resize-y text-left`} value={form.lyrics_en || ""} onChange={(e)=>setValue("lyrics_en",e.target.value)} /></div></div>
{!releaseMode && <div className="rounded-2xl border border-[#303030] bg-[#1b1b1b] p-4 sm:p-6"><h3 className="mb-5 text-lg font-black text-white">حقوق و عوامل</h3><div className="grid gap-5 lg:grid-cols-2"><div><label className={labelClass}>لیبل (فارسی)</label><input className={inputClass} value={form.label || ""} onChange={(e)=>setValue("label",e.target.value)} /></div><div dir="ltr"><label className={`${labelClass} text-left`}>نام انگلیسی ناشر</label><input className={`${inputClass} text-left`} value={form.label_en || ""} onChange={(e)=>setValue("label_en",e.target.value)} /></div>{[["producers","تهیه‌کنندگان (فارسی)"],["producers_en","تهیه‌کنندگان به انگلیسی"],["composers","آهنگسازان (فارسی)"],["composers_en","آهنگسازان به انگلیسی"],["lyricists","ترانه‌سرایان (فارسی)"],["lyricists_en","ترانه‌سرایان به انگلیسی"]].map(([key,label])=><div key={key} dir={key.endsWith("_en")?"ltr":"rtl"}><label className={`${labelClass} ${key.endsWith("_en")?"text-left":""}`}>{label}</label><input className={`${inputClass} ${key.endsWith("_en")?"text-left":""}`} value={listToText(form[key as keyof PartialSong])} onChange={(e)=>setForm((current)=>({...current,[key]:textToList(e.target.value)}))} placeholder={key.endsWith("_en")?"نام‌ها را با ویرگول جدا کنید":"نام‌ها را با ویرگول جدا کنید"}/></div>)}<div><label className={labelClass}>سایر عوامل (فارسی)</label><textarea rows={4} className={`${inputClass} resize-y`} value={form.credits || ""} onChange={(e)=>setValue("credits",e.target.value)} /></div><div dir="ltr"><label className={`${labelClass} text-left`}>اطلاعات تکمیلی عوامل به انگلیسی</label><textarea rows={4} className={`${inputClass} resize-y text-left`} value={form.credits_en || ""} onChange={(e)=>setValue("credits_en",e.target.value)} /></div></div></div>}
          </div>}

          {step === 4 && <div className="space-y-6"><div className="flex flex-col gap-5 rounded-2xl border border-[#303030] bg-[#1b1b1b] p-5 sm:flex-row"><div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-[#292929]">{coverPreview?<img src={coverPreview} alt="" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center"><Music2 className="h-12 w-12 text-[#666]"/></div>}</div><div className="min-w-0 flex-1"><p className="text-2xl font-black text-white">{form.title || "—"}</p>{form.title_en&&<p className="mt-1 text-[#999]" dir="ltr">{form.title_en}</p>}<div className="mt-4 flex flex-wrap gap-2 text-xs">{!releaseMode && <span className="rounded-full bg-[#2a2a2a] px-3 py-1.5 text-[#bbb]">{form.releaseDate || form.release_date}</span>}<span className="rounded-full bg-[#2a2a2a] px-3 py-1.5 text-[#bbb]">{form.is_single?"تک‌آهنگ":"ترک آلبوم"}</span><span className="rounded-full bg-[#2a2a2a] px-3 py-1.5 text-[#bbb]">{languageLabel(form.language)}</span><span className="rounded-full bg-[#2a2a2a] px-3 py-1.5 text-[#bbb]">{form.tempo} ضرب در دقیقه</span></div>{selectedArtists.length>0&&<p className="mt-4 text-sm text-[#aaa]">همراه با: {selectedArtists.map((item)=>item.artistic_name||item.name).join("، ")}</p>}</div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(releaseMode ? [{label:"هنرمند مهمان",value:selectedArtists.length},{label:"تمپو",value:form.tempo || 0}] : [{label:"ژانر",value:(form.genre_ids||[]).length},{label:"حال‌وهوا",value:(form.mood_ids||[]).length},{label:"تگ",value:(form.tag_ids||[]).length},{label:"هنرمند مهمان",value:selectedArtists.length}]).map((item)=><div key={item.label} className="rounded-xl border border-[#303030] bg-[#202020] p-4"><p className="text-xs text-[#777]">{item.label}</p><p className="mt-1 text-xl font-black text-white">{item.value}</p></div>)}</div><div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">پس از ثبت یا ویرایش، آهنگ برای بررسی به وضعیت در انتظار بررسی منتقل می‌شود. اطلاعات فارسی و انگلیسی برای نمایش متناسب با زبان اپلیکیشن مخاطب ذخیره خواهند شد.</div></div>}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#292929] px-4 py-4 sm:px-6">
          <button type="button" onClick={() => step === 1 ? onClose() : setStep((value) => Math.max(1, value - 1) as Step)} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl border border-[#383838] bg-[#222] px-4 py-2.5 font-bold text-white hover:bg-[#2d2d2d] disabled:opacity-40"><ArrowRight className="h-4 w-4" />{step===1?"انصراف":"قبلی"}</button>
          {step < 4 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black hover:bg-[#1ed760]">بعدی<ArrowLeft className="h-4 w-4" /></button> : <button type="button" onClick={() => void submit()} disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-5 py-2.5 font-black text-black hover:bg-[#1ed760] disabled:opacity-50">{isSubmitting?<Loader2 className="h-5 w-5 animate-spin"/>:<Check className="h-5 w-5"/>}{submitLabel || (editing ? "ذخیره تغییرات" : "ثبت آهنگ")}</button>}
        </footer>
      </div>
    </div>
  );
};

export default SongModal;
