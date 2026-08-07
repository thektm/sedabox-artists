import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "./ConfirmModal";
import { ReleaseContributor } from "./releaseTypes";

const roles = [
  ["producer", "تهیه‌کننده"],
  ["composer", "آهنگساز"],
  ["lyricist", "ترانه‌سرا"],
  ["songwriter", "ترانه‌نویس"],
  ["performer", "اجراکننده"],
  ["publisher", "ناشر"],
  ["label", "لیبل"],
  ["rights_owner", "صاحب حقوق اثر"],
] as const;

const inputClass = "w-full rounded-xl border border-[#343434] bg-[#191919] px-3.5 py-3 text-white outline-none placeholder:text-[#606060] focus:border-[#1DB954] focus:ring-2 focus:ring-[#1DB954]/10";
const emptyForm = { id: "", name: "", name_en: "", roles: ["producer"] as string[] };

const Contributors: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ReleaseContributor[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<ReleaseContributor | null>(null);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      const data = await apiRequest<{ results: ReleaseContributor[] }>("/artist/contributors/");
      setItems(Array.isArray(data.results) ? data.results : []);
      if (quiet) showToast("فهرست مشارکت‌کنندگان با موفقیت به‌روزرسانی شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "دریافت فهرست مشارکت‌کنندگان انجام نشد."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => !needle || [item.name, item.name_en, ...(item.roles || [])].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [items, query]);

  const toggleRole = (role: string) => setForm((current) => ({
    ...current,
    roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role],
  }));

  const reset = () => setForm(emptyForm);
  const edit = (item: ReleaseContributor) => setForm({ id: item.id, name: item.name, name_en: item.name_en || "", roles: item.roles?.length ? item.roles : ["producer"] });

  const save = async () => {
    if (!form.name.trim()) return showToast("وارد کردن نام مشارکت‌کننده الزامی است.", "error");
    if (!form.roles.length) return showToast("حداقل یک نقش برای مشارکت‌کننده انتخاب کنید.", "error");
    setSaving(true);
    try {
      const payload = { id: form.id || undefined, name: form.name.trim(), name_en: form.name_en.trim(), roles: form.roles };
      const saved = await apiRequest<ReleaseContributor>("/artist/contributors/", {
        method: form.id ? "PATCH" : "POST",
        body: payload,
      });
      setItems((current) => form.id ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
      reset();
      showToast(form.id ? "مشارکت‌کننده با موفقیت ویرایش شد." : "مشارکت‌کننده با موفقیت ذخیره شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "ذخیره مشارکت‌کننده انجام نشد."), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting || removing) return;
    setRemoving(true);
    try {
      await apiRequest("/artist/contributors/", { method: "DELETE", body: { id: deleting.id } });
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      if (form.id === deleting.id) reset();
      setDeleting(null);
      showToast("مشارکت‌کننده با موفقیت حذف شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "حذف مشارکت‌کننده انجام نشد."), "error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8" dir="rtl">
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#1DB954]">عوامل قابل استفاده مجدد</p>
          <h1 className="text-3xl font-black text-white lg:text-4xl">مشارکت‌کنندگان</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8d8d8d]">افراد و سازمان‌های پرتکرار را یک‌بار ذخیره کنید و در ساخت انتشار، به متادیتای مشترک ترک‌ها اضافه کنید.</p>
        </div>
        <button onClick={() => void load(true)} disabled={refreshing || loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#343434] bg-[#191919] px-4 font-black text-white disabled:opacity-40">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> تازه‌سازی
        </button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pr-11`} placeholder="جستجو بر اساس نام یا نقش" />
            </div>
            <span className="hidden rounded-xl bg-[#1a1a1a] px-4 py-3 text-sm font-black text-[#aaa] sm:block">{items.length} پروفایل</span>
          </div>

          {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-[#191919]" />)}</div> : filtered.length ? (
            <div className="overflow-hidden rounded-2xl border border-[#2d2d2d] bg-[#151515]">
              <div className="hidden grid-cols-[minmax(220px,1fr)_minmax(250px,1fr)_100px] gap-3 border-b border-[#2b2b2b] px-4 py-3 text-xs font-black text-[#707070] md:grid"><span>نام</span><span>نقش‌ها</span><span className="text-left">عملیات</span></div>
              <div className="divide-y divide-[#292929]">{filtered.map((item) => <article key={item.id} className={`grid gap-3 p-4 transition md:grid-cols-[minmax(220px,1fr)_minmax(250px,1fr)_100px] md:items-center ${form.id === item.id ? "bg-[#1DB954]/5" : "hover:bg-[#1b1b1b]"}`}>
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#242424] text-[#1DB954]"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate font-black text-white">{item.name}</p>{item.name_en && <p className="truncate text-xs text-[#777]" dir="ltr">{item.name_en}</p>}</div></div>
                <div className="flex flex-wrap gap-1.5">{item.roles.map((role) => <span key={role} className="rounded-full bg-[#242424] px-2.5 py-1 text-[11px] font-bold text-[#b7b7b7]" dir="ltr">{roles.find(([value]) => value === role)?.[1] || role}</span>)}</div>
                <div className="flex justify-end gap-1"><button onClick={() => edit(item)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aaa] hover:bg-[#292929] hover:text-white" title="ویرایش"><Edit3 className="h-4 w-4" /></button><button onClick={() => setDeleting(item)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777] hover:bg-red-500/10 hover:text-red-300" title="حذف"><Trash2 className="h-4 w-4" /></button></div>
              </article>)}</div>
            </div>
          ) : <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#303030] bg-[#151515] px-5 text-center"><UsersRound className="h-10 w-10 text-[#555]" /><p className="mt-3 font-black text-white">مشارکت‌کننده‌ای پیدا نشد</p><p className="mt-1 text-sm text-[#747474]">یک پروفایل جدید بسازید یا عبارت جستجو را تغییر دهید.</p></div>}
        </section>

        <aside className="sticky top-4 rounded-2xl border border-[#303030] bg-[#161616] p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black text-white">{form.id ? "ویرایش پروفایل" : "پروفایل جدید"}</h2><p className="mt-1 text-xs text-[#777]">نام و تمام نقش‌های قابل استفاده را ثبت کنید.</p></div>{form.id && <button onClick={reset} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252525] text-[#aaa]"><X className="h-4 w-4" /></button>}</div>
          <div className="space-y-4"><div><label className="mb-2 block text-xs font-black text-[#d5d5d5]">نام فارسی یا نمایشی *</label><input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div><div dir="ltr"><label className="mb-2 block text-left text-xs font-black text-[#d5d5d5]">نام انگلیسی</label><input className={`${inputClass} text-left`} value={form.name_en} onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))} /></div><div><label className="mb-2 block text-xs font-black text-[#d5d5d5]">نقش‌ها *</label><div className="flex flex-wrap gap-2">{roles.map(([value, label]) => { const active = form.roles.includes(value); return <button key={value} type="button" onClick={() => toggleRole(value)} className={`rounded-full px-3 py-2 text-xs font-black transition ${active ? "bg-[#1DB954] text-black" : "bg-[#242424] text-[#aaa] hover:text-white"}`} dir="ltr">{label}</button>; })}</div></div></div>
          <button onClick={() => void save()} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 py-3 font-black text-black disabled:opacity-40">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}{form.id ? "ذخیره تغییرات" : "افزودن پروفایل"}</button>
        </aside>
      </div>

      <ConfirmModal open={Boolean(deleting)} title="حذف مشارکت‌کننده" description="این پروفایل از فهرست قابل استفاده حذف می‌شود؛ اطلاعاتی که قبلاً روی ترک‌ها اعمال شده‌اند تغییر نمی‌کنند." confirmLabel="حذف" cancelLabel="انصراف" tone="danger" loading={removing} onCancel={() => !removing && setDeleting(null)} onConfirm={() => void remove()} />
    </div>
  );
};

export default Contributors;
