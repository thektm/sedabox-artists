import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Headphones,
  Inbox,
  Loader2,
  MessageCircleMore,
  Plus,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { apiRequest, fetchAllPages, getApiErrorMessage } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

type TicketStatus = "open" | "in_progress" | "answered" | "closed";

type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_response: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<TicketStatus, { label: string; className: string; icon: React.ReactNode }> = {
  open: {
    label: "باز",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  in_progress: {
    label: "در حال بررسی",
    className: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  answered: {
    label: "پاسخ داده شده",
    className: "border-[#1DB954]/30 bg-[#1DB954]/10 text-[#59e98a]",
    icon: <MessageCircleMore className="h-3.5 w-3.5" />,
  },
  closed: {
    label: "بسته شده",
    className: "border-white/10 bg-white/5 text-[#b3b3b3]",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
};

const FILTERS: Array<{ id: "all" | TicketStatus; label: string }> = [
  { id: "all", label: "همه" },
  { id: "open", label: "باز" },
  { id: "in_progress", label: "در حال بررسی" },
  { id: "answered", label: "پاسخ داده شده" },
  { id: "closed", label: "بسته شده" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SupportTickets: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const rows = await fetchAllPages<SupportTicket>("/artist/support/tickets/");
      setTickets(rows);
      setLoadError(null);
      setSelectedId((current) => {
        if (current && rows.some((ticket) => ticket.id === current)) return current;
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      const message = getApiErrorMessage(error, "دریافت تیکت‌ها انجام نشد.");
      setLoadError(message);
      if (silent) showToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadTickets();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadTickets(true);
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadTickets]);

  useEffect(() => {
    if (!showCreate) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setShowCreate(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCreate, submitting]);

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((item) => item.status === "open").length,
    in_progress: tickets.filter((item) => item.status === "in_progress").length,
    answered: tickets.filter((item) => item.status === "answered").length,
    closed: tickets.filter((item) => item.status === "closed").length,
  }), [tickets]);

  const filtered = useMemo(
    () => filter === "all" ? tickets : tickets.filter((item) => item.status === filter),
    [filter, tickets],
  );
  const selected = filtered.find((ticket) => ticket.id === selectedId) || filtered[0] || null;

  useEffect(() => {
    if (filtered.length && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (cleanSubject.length < 3) {
      showToast("موضوع تیکت باید حداقل ۳ نویسه باشد.", "error");
      return;
    }
    if (cleanMessage.length < 5) {
      showToast("متن تیکت باید حداقل ۵ نویسه باشد.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiRequest<SupportTicket>("/artist/support/tickets/", {
        method: "POST",
        body: { subject: cleanSubject, message: cleanMessage },
      });
      setTickets((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setSelectedId(created.id);
      setFilter("all");
      setSubject("");
      setMessage("");
      setShowCreate(false);
      showToast("تیکت شما با موفقیت ثبت شد.", "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "ثبت تیکت انجام نشد."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-full bg-[#0a0a0a] px-3 py-4 text-white sm:px-5 lg:px-7 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
        <section className="overflow-hidden rounded-2xl border border-[#282828] bg-gradient-to-l from-[#181818] via-[#121212] to-[#0d0d0d] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/12 text-[#1DB954] ring-1 ring-[#1DB954]/20">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black sm:text-2xl">پشتیبانی و تیکت‌ها</h1>
                <p className="mt-1 text-xs leading-5 text-[#9b9b9b] sm:text-sm">
                  درخواست‌های پشتیبانی، وضعیت بررسی و پاسخ مدیریت را از همین بخش پیگیری کنید.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadTickets(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#303030] bg-[#161616] px-3 text-sm font-bold text-[#d0d0d0] transition hover:border-[#454545] hover:bg-[#202020] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                بروزرسانی
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 text-sm font-black text-black transition hover:bg-[#1ed760] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                تیکت جدید
              </button>
            </div>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold transition ${
                  active
                    ? "border-[#1DB954]/35 bg-[#1DB954]/12 text-[#67ef93]"
                    : "border-[#282828] bg-[#121212] text-[#a8a8a8] hover:border-[#3a3a3a] hover:text-white"
                }`}
              >
                {item.label}
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] ${active ? "bg-[#1DB954]/15" : "bg-white/5"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[#252525] bg-[#111]">
            <div className="flex items-center gap-3 text-sm text-[#aaa]"><Loader2 className="h-5 w-5 animate-spin text-[#1DB954]" /> در حال دریافت تیکت‌ها…</div>
          </div>
        ) : loadError && tickets.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-6 text-center">
            <Inbox className="h-9 w-9 text-red-300/70" />
            <p className="max-w-md text-sm text-[#c6c6c6]">{loadError}</p>
            <button type="button" onClick={() => void loadTickets()} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black">تلاش دوباره</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#303030] bg-[#101010] p-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#777]"><Inbox className="h-6 w-6" /></div>
            <h2 className="font-black">تیکتی در این بخش نیست</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[#888]">برای ارتباط با پشتیبانی می‌توانید یک تیکت جدید ثبت کنید.</p>
          </div>
        ) : (
          <div className="grid min-h-[470px] gap-4 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
            <section className="overflow-hidden rounded-2xl border border-[#282828] bg-[#111]">
              <div className="border-b border-[#242424] px-4 py-3 text-xs font-bold text-[#888]">{filtered.length.toLocaleString("fa-IR")} تیکت</div>
              <div className="max-h-[620px] overflow-y-auto p-2 [scrollbar-gutter:stable]">
                {filtered.map((ticket) => {
                  const meta = STATUS_META[ticket.status] || STATUS_META.open;
                  const active = ticket.id === selectedId;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`mb-2 block w-full rounded-xl border p-3 text-right transition last:mb-0 ${
                        active ? "border-[#1DB954]/30 bg-[#1DB954]/[0.07]" : "border-transparent bg-[#171717] hover:border-[#303030] hover:bg-[#1b1b1b]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 truncate text-sm font-black text-white">{ticket.subject}</h3>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${meta.className}`}>{meta.icon}{meta.label}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#909090]">{ticket.message}</p>
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-[#666]">
                        <span>#{ticket.id.toLocaleString("fa-IR")}</span>
                        <span>{formatDate(ticket.updated_at || ticket.created_at)}</span>
                      </div>
                      {ticket.admin_response?.trim() && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#57df84]"><span className="h-1.5 w-1.5 rounded-full bg-[#1DB954]" /> پاسخ مدیریت ثبت شده است</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#282828] bg-[#111] p-4 sm:p-5">
              {selected ? (
                <div className="flex h-full flex-col">
                  <div className="flex flex-col gap-3 border-b border-[#242424] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-[#666]">تیکت #{selected.id.toLocaleString("fa-IR")}</span>
                        {(() => {
                          const selectedMeta = STATUS_META[selected.status] || STATUS_META.open;
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${selectedMeta.className}`}>
                              {selectedMeta.icon}{selectedMeta.label}
                            </span>
                          );
                        })()}
                      </div>
                      <h2 className="break-words text-lg font-black sm:text-xl">{selected.subject}</h2>
                    </div>
                    <div className="shrink-0 text-[11px] leading-5 text-[#737373] sm:text-left">
                      <div>ثبت: {formatDate(selected.created_at)}</div>
                      <div>آخرین تغییر: {formatDate(selected.updated_at)}</div>
                    </div>
                  </div>

                  <div className="space-y-4 py-4">
                    <div>
                      <div className="mb-2 text-xs font-black text-[#8d8d8d]">پیام شما</div>
                      <div className="whitespace-pre-wrap break-words rounded-xl border border-[#292929] bg-[#171717] p-4 text-sm leading-7 text-[#e3e3e3]">{selected.message}</div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#8d8d8d]">پاسخ مدیریت</span>
                        {selected.responded_at && <span className="text-[10px] text-[#666]">{formatDate(selected.responded_at)}</span>}
                      </div>
                      {selected.admin_response?.trim() ? (
                        <div className="relative overflow-hidden rounded-xl border border-[#1DB954]/20 bg-[#1DB954]/[0.055] p-4">
                          <div className="absolute inset-y-0 right-0 w-1 bg-[#1DB954]" />
                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-[#e8f8ed]">{selected.admin_response}</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#303030] bg-[#151515] p-5 text-center text-sm leading-6 text-[#858585]">
                          هنوز پاسخی از طرف مدیریت ثبت نشده است. تغییر وضعیت و پاسخ جدید به‌صورت خودکار در این صفحه بروزرسانی می‌شود.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setShowCreate(false); }}>
          <form onSubmit={submitTicket} className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#303030] bg-[#121212] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-[#282828] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-lg font-black">ثبت تیکت جدید</h2>
                <p className="mt-1 text-xs text-[#858585]">موضوع و توضیحات درخواست خود را واضح و کامل بنویسید.</p>
              </div>
              <button type="button" disabled={submitting} onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#888] transition hover:bg-white/5 hover:text-white disabled:opacity-50" aria-label="بستن">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 sm:p-5">
              <div>
                <label className="mb-2 block text-xs font-black text-[#a0a0a0]">موضوع</label>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value.slice(0, 240))}
                  maxLength={240}
                  autoFocus
                  placeholder="مثلاً مشکل در انتشار یک آهنگ"
                  className="h-11 w-full rounded-xl border border-[#303030] bg-[#0d0d0d] px-3 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#1DB954]/60"
                />
                <div className="mt-1 text-left text-[10px] text-[#5f5f5f]">{subject.length.toLocaleString("fa-IR")} / ۲۴۰</div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black text-[#a0a0a0]">توضیحات</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={7}
                  placeholder="جزئیات مشکل یا درخواست را بنویسید…"
                  className="w-full resize-none rounded-xl border border-[#303030] bg-[#0d0d0d] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#555] focus:border-[#1DB954]/60"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#282828] bg-[#0e0e0e] px-4 py-3 sm:px-5">
              <button type="button" disabled={submitting} onClick={() => setShowCreate(false)} className="h-10 rounded-xl border border-[#303030] px-4 text-sm font-bold text-[#aaa] transition hover:bg-white/5 hover:text-white disabled:opacity-50">انصراف</button>
              <button type="submit" disabled={submitting} className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#1DB954] px-4 text-sm font-black text-black transition hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "در حال ارسال…" : "ارسال تیکت"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
