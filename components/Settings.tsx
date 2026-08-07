import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Instagram,
  Link2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Twitter,
  UserRound,
  Youtube,
} from "lucide-react";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import { useImageCropper } from "../contexts/ImageCropperContext";

type Tab = "profile" | "social" | "media" | "security";
type SocialKey = "instagram" | "twitter" | "youtube" | "telegram";

interface ArtistSocialAccount {
  id: number;
  platform_slug: string;
  username?: string;
  url?: string;
}

interface ArtistSettingsResponse {
  id: number;
  name: string;
  name_en?: string;
  artistic_name: string;
  artistic_name_en?: string;
  email?: string | null;
  city?: string;
  city_en?: string;
  date_of_birth?: string | null;
  address?: string;
  address_en?: string;
  id_number?: string;
  bio?: string;
  bio_en?: string;
  profile_image?: string;
  banner_image?: string;
  verified?: boolean;
  unique_id?: string;
  social_accounts?: ArtistSocialAccount[];
}

type ProfileForm = Pick<ArtistSettingsResponse,
  "name" | "name_en" | "artistic_name" | "artistic_name_en" | "email" | "city" | "city_en" |
  "date_of_birth" | "address" | "address_en" | "id_number" | "bio" | "bio_en"
>;

const emptyProfile: ProfileForm = {
  name: "",
  name_en: "",
  artistic_name: "",
  artistic_name_en: "",
  email: "",
  city: "",
  city_en: "",
  date_of_birth: "",
  address: "",
  address_en: "",
  id_number: "",
  bio: "",
  bio_en: "",
};

const socialConfig: Array<{ key: SocialKey; label: string; placeholder: string; icon: React.ElementType; iconClass: string }> = [
  { key: "instagram", label: "اینستاگرام", placeholder: "https://instagram.com/username", icon: Instagram, iconClass: "from-purple-500 to-pink-500" },
  { key: "twitter", label: "توییتر (ایکس)", placeholder: "https://x.com/username", icon: Twitter, iconClass: "from-sky-400 to-blue-600" },
  { key: "youtube", label: "یوتیوب", placeholder: "https://youtube.com/@username", icon: Youtube, iconClass: "from-red-500 to-red-700" },
  { key: "telegram", label: "تلگرام", placeholder: "https://t.me/username", icon: MessageCircle, iconClass: "from-blue-400 to-cyan-500" },
];

const inputClass = "w-full rounded-xl border border-[#383838] bg-[#202020] px-4 py-3 text-white outline-none transition placeholder:text-[#656565] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/15 disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "mb-2 block text-sm font-bold text-white";

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [artist, setArtist] = useState<ArtistSettingsResponse | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [social, setSocial] = useState<Record<SocialKey, string>>({ instagram: "", twitter: "", youtube: "", telegram: "" });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [visiblePasswords, setVisiblePasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const profileInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const applyArtist = useCallback((data: ArtistSettingsResponse) => {
    setArtist(data);
    setProfile({
      name: data.name || "",
      name_en: data.name_en || "",
      artistic_name: data.artistic_name || "",
      artistic_name_en: data.artistic_name_en || "",
      email: data.email || "",
      city: data.city || "",
      city_en: data.city_en || "",
      date_of_birth: data.date_of_birth || "",
      address: data.address || "",
      address_en: data.address_en || "",
      id_number: data.id_number || "",
      bio: data.bio || "",
      bio_en: data.bio_en || "",
    });
    const links = { instagram: "", twitter: "", youtube: "", telegram: "" } as Record<SocialKey, string>;
    (data.social_accounts || []).forEach((account) => {
      const slug = account.platform_slug?.toLowerCase() as SocialKey;
      if (slug in links) links[slug] = account.url || "";
    });
    setSocial(links);
    setProfilePreview(data.profile_image || "");
    setBannerPreview(data.banner_image || "");
    setProfileFile(null);
    setBannerFile(null);
  }, []);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const data = await apiRequest<ArtistSettingsResponse>("/artist/settings/");
      applyArtist(data);
      if (quiet) showToast("تنظیمات هنرمند با موفقیت به‌روزرسانی شد.", "success");
    } catch (err) {
      const message = getApiErrorMessage(err, "دریافت تنظیمات هنرمند انجام نشد.");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyArtist, showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => () => {
    if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
  }, [profilePreview, bannerPreview]);

  const validateImage = (file: File, type: "profile" | "banner") => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const limit = type === "profile" ? 5 : 10;
    if (!allowed.includes(file.type)) {
      showToast("فقط تصاویر JPG، PNG و WEBP پشتیبانی می‌شوند.", "error");
      return false;
    }
    if (file.size > limit * 1024 * 1024) {
      showToast(`حجم تصویر ${type === "profile" ? "پروفایل هنرمند" : "بنر هنرمند"} باید کمتر از ${limit} مگابایت باشد.`, "error");
      return false;
    }
    return true;
  };

  const chooseImage = async (file: File | undefined, type: "profile" | "banner") => {
    if (!file) return;
    const isProfile = type === "profile";
    const result = await cropImage(file, {
      mode: isProfile ? "square" : "free",
      title: isProfile ? "برش تصویر پروفایل" : "برش بنر هنرمند",
      description: isProfile
        ? "تصویر پروفایل به‌صورت مربعی ذخیره می‌شود و در بعضی بخش‌ها به شکل دایره نمایش داده خواهد شد."
        : "برای بنر نسبت تصویر آزاد است. قاب را از هر چهار طرف تنظیم کنید؛ به‌صورت پیش‌فرض کل تصویر حفظ می‌شود.",
      initialAspectRatio: isProfile ? 1 : 16 / 5,
      maxSourceBytes: 40 * 1024 * 1024,
      maxOutputBytes: (isProfile ? 4.8 : 9.5) * 1024 * 1024,
      maxOutputDimension: isProfile ? 1800 : 3600,
    });
    if (!result || !validateImage(result.file, type)) return;
    const preview = URL.createObjectURL(result.file);
    if (isProfile) {
      if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
      setProfileFile(result.file);
      setProfilePreview(preview);
    } else {
      if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
      setBannerFile(result.file);
      setBannerPreview(preview);
    }
  };

  const saveForm = async (tab: "profile" | "social" | "media") => {
    if (tab === "profile") {
      if (!profile.name.trim()) return showToast("وارد کردن نام و نام خانوادگی فارسی الزامی است.", "error");
      if (!profile.artistic_name.trim()) return showToast("وارد کردن نام هنری فارسی الزامی است.", "error");
      if (profile.email && !/^\S+@\S+\.\S+$/.test(profile.email)) return showToast("یک نشانی ایمیل معتبر وارد کنید.", "error");
    }
    if (tab === "social") {
      for (const [key, value] of Object.entries(social)) {
        if (!value.trim()) continue;
        try {
          const url = new URL(value);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error();
        } catch {
          const networkLabel = socialConfig.find((item) => item.key === key)?.label || "شبکه اجتماعی";
          return showToast(`نشانی کامل و معتبر ${networkLabel} را با https:// وارد کنید.`, "error");
        }
      }
    }
    if (tab === "media" && !profileFile && !bannerFile) return showToast("ابتدا تصویر جدید پروفایل یا بنر را انتخاب کنید.", "info");

    setSaving(tab);
    try {
      const form = new FormData();
      if (tab === "profile") Object.entries(profile).forEach(([key, value]) => form.append(key, value == null ? "" : String(value)));
      if (tab === "social") form.append("social_accounts", JSON.stringify(social));
      if (tab === "media") {
        if (profileFile) form.append("profile_image", profileFile);
        if (bannerFile) form.append("banner_image", bannerFile);
      }
      const updated = await apiRequest<ArtistSettingsResponse>("/artist/settings/", { method: "PATCH", body: form });
      applyArtist(updated);
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("sedabox_user");
        if (raw) {
          try {
            const stored = JSON.parse(raw);
            localStorage.setItem("sedabox_user", JSON.stringify({ ...stored, name: updated.name, artistName: updated.artistic_name, email: updated.email }));
          } catch { /* invalid legacy cache is non-blocking */ }
        }
      }
      showToast(tab === "profile" ? "اطلاعات پروفایل هنرمند با موفقیت ذخیره شد." : tab === "social" ? "پیوندهای شبکه‌های اجتماعی با موفقیت ذخیره شدند." : "تصاویر هنرمند با موفقیت ذخیره شدند.", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "ذخیره تنظیمات هنرمند انجام نشد."), "error");
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async () => {
    if (!password.current) return showToast("رمز عبور فعلی را وارد کنید.", "error");
    if (password.next.length < 8) return showToast("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.", "error");
    if (password.next !== password.confirm) return showToast("رمز عبور جدید و تکرار آن یکسان نیستند.", "error");
    if (password.current === password.next) return showToast("رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد.", "error");
    setSaving("security");
    try {
      await apiRequest("/artist/settings/password/", { method: "POST", body: { current_password: password.current, new_password: password.next } });
      setPassword({ current: "", next: "", confirm: "" });
      showToast("رمز عبور با موفقیت تغییر کرد.", "success");
    } catch (err) {
      showToast(getApiErrorMessage(err, "تغییر رمز عبور انجام نشد."), "error");
    } finally {
      setSaving(null);
    }
  };

  const completion = useMemo(() => {
    const values = [profile.name, profile.name_en, profile.artistic_name, profile.artistic_name_en, profile.email, profile.city, profile.bio, profile.bio_en, profilePreview, bannerPreview];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  }, [profile, profilePreview, bannerPreview]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "profile", label: "ویرایش پروفایل", icon: UserRound },
    { id: "social", label: "شبکه‌های اجتماعی", icon: Link2 },
    { id: "media", label: "بنر و کاور", icon: ImageIcon },
    { id: "security", label: "امنیت", icon: ShieldCheck },
  ];

  if (loading) return <div className="min-h-full p-4 sm:p-6 lg:p-8" dir="rtl"><div className="mb-6 h-40 animate-pulse rounded-3xl bg-[#181818]"/><div className="h-[520px] animate-pulse rounded-3xl bg-[#181818]"/></div>;
  if (error && !artist) return <div className="min-h-full p-6" dir="rtl"><div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center"><p className="mb-4 text-red-200">دریافت تنظیمات با خطا مواجه شد.</p><button onClick={() => void load()} className="rounded-xl bg-white px-5 py-2.5 font-bold text-black">تلاش دوباره</button></div></div>;

  return (
    <div className="min-h-full w-full pc-compact" dir="rtl">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1DB954] via-[#1ed760] to-[#159447] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {bannerPreview && <img src={bannerPreview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply" />}
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/60 bg-black/20 shadow-xl">{profilePreview ? <img src={profilePreview} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><UserRound className="h-9 w-9 text-white" /></div>}</div>
            <div><div className="flex items-center gap-2"><h1 className="text-3xl font-black text-white lg:text-5xl">تنظیمات هنرمند</h1>{artist?.verified && <span title="تأییدشده"><Check className="h-6 w-6 rounded-full bg-white p-1 text-[#1DB954]" /></span>}</div><p className="mt-2 text-sm font-semibold text-white/85">{artist?.artistic_name || artist?.name}</p><p className="mt-1 text-xs text-white/70" dir="ltr">{artist?.unique_id || ""}</p></div>
          </div>
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-black/15 px-4 py-3 backdrop-blur"><p className="text-xs font-semibold text-white/80">تکمیل پروفایل</p><p className="mt-1 text-xl font-black text-white">{completion}%</p></div><button onClick={() => void load(true)} disabled={refreshing} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === id ? "bg-white text-black shadow-lg" : "bg-[#181818] text-[#aaa] hover:bg-[#282828] hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>

        {activeTab === "profile" && <section className="rounded-3xl border border-[#282828] bg-[#181818] p-4 sm:p-6 lg:p-8">
          <div className="mb-7"><h2 className="text-2xl font-black text-white">اطلاعات هنرمند</h2><p className="mt-2 text-sm text-[#888]">اطلاعات فارسی و انگلیسی مستقیماً در اپلیکیشن مخاطبان استفاده می‌شوند.</p></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div><label className={labelClass}>نام و نام خانوادگی (فارسی) *</label><input className={inputClass} value={profile.name || ""} onChange={(e)=>setProfile((p)=>({...p,name:e.target.value}))} /></div>
            <div dir="ltr"><label className={`${labelClass} text-left`}>نام و نام خانوادگی انگلیسی</label><input className={`${inputClass} text-left`} value={profile.name_en || ""} onChange={(e)=>setProfile((p)=>({...p,name_en:e.target.value}))} /></div>
            <div><label className={labelClass}>نام هنری (فارسی) *</label><input className={inputClass} value={profile.artistic_name || ""} onChange={(e)=>setProfile((p)=>({...p,artistic_name:e.target.value}))} /></div>
            <div dir="ltr"><label className={`${labelClass} text-left`}>نام هنری انگلیسی</label><input className={`${inputClass} text-left`} value={profile.artistic_name_en || ""} onChange={(e)=>setProfile((p)=>({...p,artistic_name_en:e.target.value}))} /></div>
            <div><label className={labelClass}>ایمیل</label><div className="relative"><Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]"/><input type="email" dir="ltr" className={`${inputClass} pr-11 text-left`} value={profile.email || ""} onChange={(e)=>setProfile((p)=>({...p,email:e.target.value}))} /></div></div>
            <div><label className={labelClass}>تاریخ تولد</label><div className="relative"><CalendarDays className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]"/><input type="date" dir="ltr" className={`${inputClass} pr-11 text-left`} value={profile.date_of_birth || ""} onChange={(e)=>setProfile((p)=>({...p,date_of_birth:e.target.value}))} /></div></div>
            <div><label className={labelClass}>شهر (فارسی)</label><div className="relative"><MapPin className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#777]"/><input className={`${inputClass} pr-11`} value={profile.city || ""} onChange={(e)=>setProfile((p)=>({...p,city:e.target.value}))} /></div></div>
            <div dir="ltr"><label className={`${labelClass} text-left`}>شهر به انگلیسی</label><input className={`${inputClass} text-left`} value={profile.city_en || ""} onChange={(e)=>setProfile((p)=>({...p,city_en:e.target.value}))} /></div>
            <div><label className={labelClass}>کد ملی / شناسه</label><input dir="ltr" className={`${inputClass} text-left`} value={profile.id_number || ""} onChange={(e)=>setProfile((p)=>({...p,id_number:e.target.value}))} /></div>
            <div><label className={labelClass}>آدرس (فارسی)</label><input className={inputClass} value={profile.address || ""} onChange={(e)=>setProfile((p)=>({...p,address:e.target.value}))} /></div>
            <div dir="ltr" className="lg:col-start-2"><label className={`${labelClass} text-left`}>نشانی به انگلیسی</label><input className={`${inputClass} text-left`} value={profile.address_en || ""} onChange={(e)=>setProfile((p)=>({...p,address_en:e.target.value}))} /></div>
            <div><label className={labelClass}>بیوگرافی (فارسی)</label><textarea rows={6} maxLength={3000} className={`${inputClass} resize-y`} value={profile.bio || ""} onChange={(e)=>setProfile((p)=>({...p,bio:e.target.value}))} /><p className="mt-1 text-left text-xs text-[#666]">{(profile.bio || "").length}/3000</p></div>
            <div dir="ltr"><label className={`${labelClass} text-left`}>زندگی‌نامه انگلیسی</label><textarea rows={6} maxLength={3000} className={`${inputClass} resize-y text-left`} value={profile.bio_en || ""} onChange={(e)=>setProfile((p)=>({...p,bio_en:e.target.value}))} /><p className="mt-1 text-right text-xs text-[#666]">{(profile.bio_en || "").length}/3000</p></div>
          </div>
          <div className="mt-7 flex justify-end"><button onClick={()=>void saveForm("profile")} disabled={saving!==null} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-6 py-3 font-black text-black hover:bg-[#1ed760] disabled:opacity-50">{saving==="profile"?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}ذخیره اطلاعات</button></div>
        </section>}

        {activeTab === "social" && <section className="rounded-3xl border border-[#282828] bg-[#181818] p-4 sm:p-6 lg:p-8">
          <div className="mb-7"><h2 className="text-2xl font-black text-white">شبکه‌های اجتماعی</h2><p className="mt-2 text-sm text-[#888]">لینک کامل پروفایل را با https:// وارد کنید. خالی‌کردن یک فیلد، آن لینک را حذف می‌کند.</p></div>
          <div className="grid gap-4 md:grid-cols-2">{socialConfig.map(({key,label,placeholder,icon:Icon,iconClass})=><div key={key} className="rounded-2xl border border-[#303030] bg-[#202020] p-4"><div className="mb-3 flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconClass}`}><Icon className="h-5 w-5 text-white"/></div><label className="font-bold text-white">{label}</label></div><input dir="ltr" className={`${inputClass} text-left`} placeholder={placeholder} value={social[key]} onChange={(e)=>setSocial((p)=>({...p,[key]:e.target.value}))}/></div>)}</div>
          <div className="mt-7 flex justify-end"><button onClick={()=>void saveForm("social")} disabled={saving!==null} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-6 py-3 font-black text-black hover:bg-[#1ed760] disabled:opacity-50">{saving==="social"?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}ذخیره لینک‌ها</button></div>
        </section>}

        {activeTab === "media" && <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-[#282828] bg-[#181818]">
            <div className="relative h-48 bg-gradient-to-br from-[#262626] to-[#111] sm:h-64">{bannerPreview?<img src={bannerPreview} alt="پیش‌نمایش بنر هنرمند" className="h-full w-full object-cover"/>:<div className="flex h-full flex-col items-center justify-center text-[#666]"><ImageIcon className="mb-2 h-10 w-10"/><span>بنر هنرمند</span></div>}<button onClick={()=>bannerInput.current?.click()} className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-black/85"><Camera className="h-4 w-4"/>تغییر بنر</button></div>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7"><div className="relative -mt-16 h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-[#181818] bg-[#282828] shadow-xl">{profilePreview?<img src={profilePreview} alt="پیش‌نمایش تصویر پروفایل هنرمند" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center"><UserRound className="h-12 w-12 text-[#666]"/></div>}</div><div className="flex-1"><h2 className="text-xl font-black text-white">تصویر پروفایل و بنر</h2><p className="mt-2 text-sm leading-6 text-[#888]">پروفایل: JPG، PNG یا WEBP تا ۵ مگابایت · بنر: JPG، PNG یا WEBP تا ۱۰ مگابایت. تصاویر در اپلیکیشن مخاطبان نمایش داده می‌شوند.</p><button onClick={()=>profileInput.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#404040] bg-[#242424] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#303030]"><Camera className="h-4 w-4"/>تغییر تصویر پروفایل</button></div></div>
          </div>
          <input ref={profileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e)=>{ const file=e.target.files?.[0]; e.target.value=""; void chooseImage(file,"profile"); }}/><input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e)=>{ const file=e.target.files?.[0]; e.target.value=""; void chooseImage(file,"banner"); }}/>
          <div className="flex justify-end"><button onClick={()=>void saveForm("media")} disabled={saving!==null || (!profileFile&&!bannerFile)} className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-6 py-3 font-black text-black hover:bg-[#1ed760] disabled:opacity-40">{saving==="media"?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}آپلود و ذخیره</button></div>
        </section>}

        {activeTab === "security" && <section className="grid gap-6 lg:grid-cols-[1fr_.7fr]">
          <div className="rounded-3xl border border-[#282828] bg-[#181818] p-4 sm:p-6 lg:p-8"><div className="mb-7 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1DB954]/15"><LockKeyhole className="h-6 w-6 text-[#1DB954]"/></div><div><h2 className="text-2xl font-black text-white">تغییر رمز عبور</h2><p className="mt-1 text-sm text-[#888]">رمز مخصوص ورود هنرمند تغییر می‌کند.</p></div></div><div className="space-y-5">{[{key:"current",label:"رمز عبور فعلی"},{key:"next",label:"رمز عبور جدید"},{key:"confirm",label:"تکرار رمز عبور جدید"}].map(({key,label})=><div key={key}><label className={labelClass}>{label}</label><div className="relative"><input dir="ltr" type={visiblePasswords?"text":"password"} className={`${inputClass} pl-12 text-left`} value={password[key as keyof typeof password]} onChange={(e)=>setPassword((p)=>({...p,[key]:e.target.value}))}/><button type="button" onClick={()=>setVisiblePasswords((v)=>!v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-white">{visiblePasswords?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div></div>)}</div><button onClick={()=>void changePassword()} disabled={saving!==null} className="mt-7 inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-black hover:bg-[#e8e8e8] disabled:opacity-50">{saving==="security"?<Loader2 className="h-5 w-5 animate-spin"/>:<LockKeyhole className="h-5 w-5"/>}تغییر رمز عبور</button></div>
          <aside className="rounded-3xl border border-[#282828] bg-[#181818] p-5 sm:p-6"><ShieldCheck className="mb-4 h-10 w-10 text-[#1DB954]"/><h3 className="text-xl font-black text-white">نکات امنیتی</h3><ul className="mt-5 space-y-4 text-sm leading-6 text-[#aaa]"><li>حداقل ۸ کاراکتر استفاده کنید.</li><li>ترکیبی از حروف، عدد و نشانه‌ها انتخاب کنید.</li><li>رمز عبور خود را با هیچ‌کس به اشتراک نگذارید.</li><li>از رمز متفاوت با حساب‌های دیگر استفاده کنید.</li></ul></aside>
        </section>}
      </main>
    </div>
  );
};

export default Settings;
