import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  RefreshCw,
  RotateCcw,
  WalletCards,
  XCircle,
} from "lucide-react";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import type { PaginatedResponse } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import PremiumTimelineChart, { ChartView, ChartViewToggle } from "./PremiumTimelineChart";

type Range = "7d" | "30d" | "monthly" | "all";
type View = "overview" | "streams" | "withdrawals";
type PayoutStatus = "pending" | "approved" | "rejected" | "done";

interface FinanceResponse {
  summary: {
    income_change_pct: number | null;
    income_amount: string | number;
    currency: string;
    plays_count: number;
    paid_plays: number;
    zero_value_plays: number;
    average_revenue_per_play: string | number;
    free_income: string | number;
    premium_income: string | number;
    free_plays: number;
    premium_plays: number;
    current_free_play_rate: string | number;
    current_premium_play_rate: string | number;
    period: string;
  };
  chart: Array<{
    time?: string;
    label?: string;
    income: string | number;
    free_income?: string | number;
    premium_income?: string | number;
    plays: number;
  }>;
}

interface WalletResponse {
  total_credit: string | number;
  requested_credit: string | number;
  available_credit: string | number;
  withdrawable_credit: string | number;
  withdrawn_credit: string | number;
  pending_credit: string | number;
  minimum_payout_amount?: string | number;
  amount_needed_for_payout?: string | number;
  meets_minimum_payout?: boolean;
  can_request_payout?: boolean;
  paid_plays: number;
  zero_value_plays: number;
  has_active_request: boolean;
  deposit_requests: { total_submissions: number; pending: number; approved: number; rejected: number; done: number };
}

interface PayoutRequest {
  id: number;
  amount: string | number;
  status: PayoutStatus;
  transaction_id?: string | null;
  submission_date: string;
  status_change_date?: string | null;
  summary?: {
    total_plays?: number;
    free_plays?: number;
    premium_plays?: number;
    free_percentage?: number;
    premium_percentage?: number;
  };
}

interface FinanceSong {
  id: number;
  title: string;
  title_en?: string;
  cover_image?: string;
  release_date?: string | null;
  total_plays: number;
  tracked_plays: number;
  paid_plays: number;
  zero_value_plays: number;
  income: string | number;
  total_income: string | number;
  deposited_income: string | number;
  pending_income: string | number;
  remaining_income: string | number;
  available_income: string | number;
  average_revenue_per_play: string | number;
  status: string;
}

const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: "7d", label: "۷ روز" },
  { value: "30d", label: "۳۰ روز" },
  { value: "monthly", label: "۱۲ ماه" },
  { value: "all", label: "همه" },
];

const num = (value: string | number | null | undefined) => Number(value || 0);
const money = (value: string | number | null | undefined) =>
  `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 8 }).format(num(value))} تومان`;
const compact = (value: number) =>
  new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
const compactMoney = (value: number) =>
  new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
const dateLabel = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
};
const chartDateLabel = (value: string, monthly: boolean) => {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(
    "fa-IR",
    monthly ? { month: "short", year: "2-digit" } : { month: "numeric", day: "numeric" },
  ).format(date);
};

const statusMeta: Record<PayoutStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "در انتظار", className: "text-amber-300 bg-amber-500/10 border-amber-500/25", icon: Clock3 },
  approved: { label: "تأیید شده", className: "text-blue-300 bg-blue-500/10 border-blue-500/25", icon: CheckCircle2 },
  rejected: { label: "رد شده", className: "text-red-300 bg-red-500/10 border-red-500/25", icon: XCircle },
  done: { label: "پرداخت شده", className: "text-[#1DB954] bg-[#1DB954]/10 border-[#1DB954]/25", icon: CheckCircle2 },
};

const unpackSongPage = (response: FinanceSong[] | PaginatedResponse<FinanceSong>) =>
  Array.isArray(response)
    ? { count: response.length, next: null as string | null, results: response }
    : { count: response.count, next: response.next, results: response.results || [] };

const Financial: React.FC = () => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState<Range>("30d");
  const [selectedView, setSelectedView] = useState<View>("overview");
  const [chartView, setChartView] = useState<ChartView>("timeline");
  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [songs, setSongs] = useState<FinanceSong[]>([]);
  const [songsCount, setSongsCount] = useState(0);
  const [songsNext, setSongsNext] = useState<string | null>(null);
  const [songsLoadingMore, setSongsLoadingMore] = useState(false);
  const [songsError, setSongsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const loadedOnce = useRef(false);
  const loadedFinanceRange = useRef<Range | null>(null);
  const financeRequest = useRef(0);
  const songsRequest = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadAll = useCallback(async (range: Range, quiet = false) => {
    const songSequence = ++songsRequest.current;
    quiet ? setRefreshing(true) : setLoading(true);
    setSongsLoadingMore(false);
    setError("");
    setSongsError("");
    try {
      const [financeData, walletData, payoutData, songPageData] = await Promise.all([
        apiRequest<FinanceResponse>("/artist/finance/", { query: { period: range } }),
        apiRequest<WalletResponse>("/artist/wallet/"),
        apiRequest<PayoutRequest[]>("/artist/deposit-request/"),
        apiRequest<FinanceSong[] | PaginatedResponse<FinanceSong>>("/artist/finance/songs/", {
          query: { sort: "available", page_size: 20 },
        }),
      ]);
      const songPage = unpackSongPage(songPageData);
      setFinance(financeData);
      loadedFinanceRange.current = range;
      setWallet(walletData);
      setPayouts(payoutData);
      if (songSequence === songsRequest.current) {
        setSongs(songPage.results);
        setSongsCount(songPage.count);
        setSongsNext(songPage.next);
      }
      loadedOnce.current = true;
      if (quiet) showToast("اطلاعات مالی با موفقیت به‌روزرسانی شد.", "success");
    } catch (err) {
      const message = getApiErrorMessage(err, "دریافت اطلاعات مالی انجام نشد.");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const loadFinanceRange = useCallback(async (range: Range) => {
    const sequence = ++financeRequest.current;
    setFinanceLoading(true);
    try {
      const response = await apiRequest<FinanceResponse>("/artist/finance/", { query: { period: range } });
      if (sequence === financeRequest.current) {
        setFinance(response);
        loadedFinanceRange.current = range;
      }
    } catch (err) {
      if (sequence === financeRequest.current) {
        showToast(getApiErrorMessage(err, "دریافت اطلاعات بازه مالی انتخاب‌شده انجام نشد."), "error");
      }
    } finally {
      if (sequence === financeRequest.current) setFinanceLoading(false);
    }
  }, [showToast]);

  const loadMoreSongs = useCallback(async () => {
    if (!songsNext || songsLoadingMore) return;
    const sequence = ++songsRequest.current;
    setSongsLoadingMore(true);
    setSongsError("");
    try {
      const response = await apiRequest<FinanceSong[] | PaginatedResponse<FinanceSong>>(songsNext);
      if (sequence !== songsRequest.current) return;
      const page = unpackSongPage(response);
      setSongs((current) => {
        const byId = new Map(current.map((song) => [song.id, song]));
        page.results.forEach((song) => byId.set(song.id, song));
        return [...byId.values()];
      });
      setSongsCount(page.count);
      setSongsNext(page.next);
    } catch (err) {
      if (sequence !== songsRequest.current) return;
      const message = getApiErrorMessage(err, "دریافت ادامه فهرست آهنگ‌ها انجام نشد.");
      setSongsError(message);
      showToast(message, "error");
    } finally {
      if (sequence === songsRequest.current) setSongsLoadingMore(false);
    }
  }, [showToast, songsLoadingMore, songsNext]);

  useEffect(() => { void loadAll("30d"); }, [loadAll]);
  useEffect(() => {
    if (!loading && loadedOnce.current && loadedFinanceRange.current !== timeRange) {
      void loadFinanceRange(timeRange);
    }
  }, [loadFinanceRange, loading, timeRange]);

  useEffect(() => {
    if (selectedView !== "streams" || !songsNext || songsLoadingMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMoreSongs();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMoreSongs, selectedView, songsLoadingMore, songsNext]);

  const requestPayout = async () => {
    if (!wallet) return;
    if (wallet.has_active_request) {
      showToast("یک درخواست تسویه فعال دارید و تا تعیین تکلیف آن نمی‌توانید درخواست جدیدی ثبت کنید.", "error");
      return;
    }
    const minimumPayout = Math.max(0.01, num(wallet.minimum_payout_amount));
    const withdrawable = num(wallet.withdrawable_credit);
    if (withdrawable < minimumPayout) {
      const needed = Math.max(0, num(wallet.amount_needed_for_payout) || minimumPayout - withdrawable);
      showToast(`حداقل مبلغ تسویه ${money(minimumPayout)} است. ${money(needed)} دیگر نیاز دارید.`, "error");
      return;
    }
    setRequesting(true);
    try {
      await apiRequest<PayoutRequest>("/artist/deposit-request/", { method: "POST" });
      showToast("درخواست تسویه با موفقیت ثبت شد.", "success");
      await loadAll(timeRange, true);
      setSelectedView("withdrawals");
    } catch (err) {
      showToast(getApiErrorMessage(err, "ثبت درخواست تسویه انجام نشد."), "error");
    } finally {
      setRequesting(false);
    }
  };

  const cancelPayout = async (id: number) => {
    setCancellingId(id);
    try {
      await apiRequest(`/artist/deposit-request/${id}/`, { method: "DELETE" });
      showToast("درخواست تسویه با موفقیت لغو شد.", "success");
      await loadAll(timeRange, true);
    } catch (err) {
      showToast(getApiErrorMessage(err, "لغو درخواست تسویه انجام نشد."), "error");
    } finally {
      setCancellingId(null);
    }
  };

  const maxChart = useMemo(() => {
    const values = finance?.chart.map((item) => num(item.income)).filter((value) => value > 0) || [];
    return values.length ? Math.max(...values) : 0;
  }, [finance]);
  const totalPlanPlays = (finance?.summary.free_plays || 0) + (finance?.summary.premium_plays || 0);
  const premiumPercent = totalPlanPlays ? Math.round(((finance?.summary.premium_plays || 0) / totalPlanPlays) * 100) : 0;
  const freePercent = totalPlanPlays ? 100 - premiumPercent : 0;
  const totalSongIncome = num(wallet?.total_credit);
  const totalSongDeposited = num(wallet?.withdrawn_credit);
  const totalSongRemaining = Math.max(0, totalSongIncome - totalSongDeposited);
  const minimumPayout = Math.max(0.01, num(wallet?.minimum_payout_amount));
  const withdrawableBalance = num(wallet?.withdrawable_credit);
  const amountNeededForPayout = Math.max(
    0,
    num(wallet?.amount_needed_for_payout) || minimumPayout - withdrawableBalance,
  );
  const meetsMinimumPayout = wallet?.meets_minimum_payout ?? withdrawableBalance >= minimumPayout;
  const canRequestPayout = wallet?.can_request_payout ?? (meetsMinimumPayout && !wallet?.has_active_request);

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8 pc-compact" dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-black text-white lg:text-4xl">گزارش مالی</h1>
          <p className="text-[#B3B3B3]">درآمد، استریم‌ها و درخواست‌های تسویه واقعی</p>
        </div>
        <button
          onClick={() => void loadAll(timeRange, true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#383838] bg-[#181818] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#252525] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />تازه‌سازی
        </button>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
        {([
          { id: "overview", label: "نمای کلی" },
          { id: "streams", label: "درآمد آهنگ‌ها" },
          { id: "withdrawals", label: "تسویه‌ها" },
        ] as Array<{ id: View; label: string }>).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${selectedView === tab.id ? "bg-white text-black" : "bg-[#181818] text-[#aaa] hover:bg-[#282828] hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-[#181818]" />)}
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-[#181818]" />
        </div>
      ) : error && !finance ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-200">دریافت اطلاعات مالی با خطا مواجه شد.</p>
          <button onClick={() => void loadAll(timeRange)} className="rounded-xl bg-white px-5 py-2.5 font-bold text-black">تلاش دوباره</button>
        </div>
      ) : finance && wallet ? (
        <>
          {selectedView === "overview" && (
            <>
              {finance.summary.zero_value_plays > 0 && (
                <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                  {compact(finance.summary.zero_value_plays)} پخش در دیتابیس با مبلغ صفر ثبت شده است. سوابق قدیمی بدون نرخ تاریخی قابل بازسازی خودکار نیستند.
                </div>
              )}
              <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "کل درآمد", value: money(wallet.total_credit), icon: Coins, color: "text-[#1DB954] bg-[#1DB954]/15" },
                  { label: "موجودی قابل تسویه", value: money(wallet.available_credit), icon: WalletCards, color: "text-blue-400 bg-blue-500/15" },
                  { label: "در انتظار پرداخت", value: money(wallet.pending_credit), icon: Clock3, color: "text-amber-400 bg-amber-500/15" },
                  { label: "پرداخت‌شده", value: money(wallet.withdrawn_credit), icon: CheckCircle2, color: "text-violet-400 bg-violet-500/15" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-2xl border border-[#282828] bg-[#181818] p-5">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
                    <p className="mb-1 text-sm text-[#999]">{label}</p>
                    <p className="truncate text-xl font-black text-white" title={value}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-7 grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <section className="relative min-w-0 w-full rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6" aria-busy={financeLoading}>
                  {financeLoading && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end rounded-2xl bg-black/15 p-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#111]/90 px-3 py-1.5 text-xs font-bold text-[#bbb]"><RefreshCw className="h-3.5 w-3.5 animate-spin text-[#1DB954]" />بروزرسانی بازه</span>
                    </div>
                  )}
                  <div className={`transition-opacity ${financeLoading ? "opacity-55" : "opacity-100"}`}>
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">روند درآمد</h2>
                        <p className="mt-1 text-xs text-[#888]">{money(finance.summary.income_amount)} از {compact(finance.summary.plays_count)} استریم</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ChartViewToggle value={chartView} onChange={setChartView} />
                        <div className="flex gap-1.5 overflow-x-auto">
                          {rangeOptions.map((item) => (
                            <button key={item.value} onClick={() => setTimeRange(item.value)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${timeRange === item.value ? "bg-[#1DB954] text-black" : "bg-[#282828] text-[#aaa]"}`}>{item.label}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {chartView === "timeline" ? (
                      <PremiumTimelineChart
                        points={finance.chart.map((item, index) => ({ label: item.time || item.label || String(index + 1), value: num(item.income) }))}
                        seriesName="درآمد"
                        valueFormatter={money}
                        axisValueFormatter={compactMoney}
                        axisLabelFormatter={(label) => chartDateLabel(label, timeRange === "monthly" || timeRange === "all")}
                        tooltipLabelFormatter={(label) => chartDateLabel(label, timeRange === "monthly" || timeRange === "all")}
                        emptyText="در این بازه درآمدی ثبت نشده است."
                        height={248}
                        integerValues={false}
                        initialWindow="all"
                      />
                    ) : finance.chart.length ? (
                      <div className="overflow-x-auto pb-2" dir="ltr">
                        <div className="flex h-60 min-w-[640px] items-end gap-2 border-b border-[#303030] px-2">
                          {finance.chart.map((item, index) => {
                            const value = num(item.income);
                            const height = value > 0 && maxChart > 0 ? Math.max(8, value / maxChart * 200) : 0;
                            const raw = item.time || item.label || String(index + 1);
                            const label = item.time ? chartDateLabel(item.time, timeRange === "monthly" || timeRange === "all") : raw;
                            return (
                              <div key={`${raw}-${index}`} className="group flex min-w-[40px] flex-1 flex-col items-center gap-2">
                                <div className="relative flex h-[200px] w-full items-end justify-center">
                                  <div className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white group-hover:block">{money(item.income)}</div>
                                  <div className="w-full max-w-11 rounded-t-md bg-gradient-to-t from-[#147c3b] to-[#1ed760]" style={{ height: `${height}px` }} />
                                </div>
                                <span className="text-[10px] text-[#777]">{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : <div className="flex h-52 items-center justify-center text-[#777]">در این بازه درآمدی ثبت نشده است.</div>}
                  </div>
                </section>

                <section className="w-full rounded-2xl border border-[#282828] bg-[#181818] p-5 sm:p-6 xl:w-[280px]">
                  <h2 className="mb-5 text-xl font-bold text-white">درخواست تسویه</h2>
                  <div className="mb-5 rounded-2xl bg-gradient-to-br from-[#1DB954] to-[#14853f] p-5 text-black">
                    <p className="text-sm font-semibold opacity-75">مبلغ قابل تسویه</p>
                    <p className="mt-2 break-words text-2xl font-black">{money(wallet.withdrawable_credit)}</p>
                    {num(wallet.available_credit) !== num(wallet.withdrawable_credit) && <p className="mt-2 text-xs font-semibold opacity-70">موجودی دقیق: {money(wallet.available_credit)}</p>}
                  </div>
                  <div className="mb-4 rounded-xl border border-[#303030] bg-[#202020] p-3 text-xs leading-5 text-[#aaa]">
                    حداقل مبلغ برای ثبت درخواست: <strong className="text-white">{money(minimumPayout)}</strong>
                  </div>
                  {wallet.has_active_request ? (
                    <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-200">یک درخواست فعال دارید. پس از تعیین تکلیف، امکان ثبت درخواست جدید فراهم می‌شود.</div>
                  ) : !meetsMinimumPayout ? (
                    <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200">
                      برای امکان ثبت درخواست، <strong>{money(amountNeededForPayout)}</strong> دیگر به موجودی قابل تسویه نیاز دارید.
                    </div>
                  ) : null}
                  <button onClick={requestPayout} disabled={requesting || !canRequestPayout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-black text-black transition hover:bg-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40">
                    <ArrowDownToLine className="h-5 w-5" />{requesting ? "در حال ثبت..." : "تسویه کل موجودی"}
                  </button>
                </section>
              </div>

              <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div><h2 className="text-xl font-bold text-white">نوع حساب شنوندگان</h2><p className="mt-1 text-xs text-[#888]">درآمد و استریم بر اساس پلن مخاطب</p></div>
                  <CreditCard className="h-6 w-6 text-[#1DB954]" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-[#222] p-5">
                    <div className="mb-4 flex justify-between"><span className="font-bold text-white">پریمیوم</span><span className="text-[#1DB954]">{premiumPercent}%</span></div>
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#333]"><div className="h-full bg-[#1DB954]" style={{ width: `${premiumPercent}%` }} /></div>
                    <div className="flex justify-between text-sm text-[#999]"><span>{compact(finance.summary.premium_plays)} استریم</span><span>{money(finance.summary.premium_income)}</span></div>
                    <p className="mt-3 border-t border-[#333] pt-3 text-xs text-[#777]">نرخ فعلی هر پخش: {money(finance.summary.current_premium_play_rate)}</p>
                  </div>
                  <div className="rounded-xl bg-[#222] p-5">
                    <div className="mb-4 flex justify-between"><span className="font-bold text-white">رایگان</span><span className="text-blue-400">{freePercent}%</span></div>
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#333]"><div className="h-full bg-blue-500" style={{ width: `${freePercent}%` }} /></div>
                    <div className="flex justify-between text-sm text-[#999]"><span>{compact(finance.summary.free_plays)} استریم</span><span>{money(finance.summary.free_income)}</span></div>
                    <p className="mt-3 border-t border-[#333] pt-3 text-xs text-[#777]">نرخ فعلی هر پخش: {money(finance.summary.current_free_play_rate)}</p>
                  </div>
                </div>
              </section>
            </>
          )}

          {selectedView === "streams" && (
            <section className="overflow-hidden rounded-2xl border border-[#282828] bg-[#181818]">
              <div className="border-b border-[#282828] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">درآمد هر آهنگ</h2>
                    <p className="mt-1 text-xs text-[#888]">مرتب‌شده بر اساس بیشترین مبلغ قابل تسویه در همین لحظه</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-[#1DB954]" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#303030] bg-[#202020] p-4"><p className="text-xs text-[#777]">کل درآمد آهنگ‌ها</p><p className="mt-1 font-black text-white">{money(totalSongIncome)}</p></div>
                  <div className="rounded-xl border border-[#303030] bg-[#202020] p-4"><p className="text-xs text-[#777]">واریزشده</p><p className="mt-1 font-black text-violet-300">{money(totalSongDeposited)}</p></div>
                  <div className="rounded-xl border border-[#303030] bg-[#202020] p-4"><p className="text-xs text-[#777]">باقی‌مانده برای واریز</p><p className="mt-1 font-black text-[#1DB954]">{money(totalSongRemaining)}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#777]">
                  <span>{songsCount.toLocaleString("fa-IR")} آهنگ</span>
                  <span>{songs.length.toLocaleString("fa-IR")} مورد نمایش داده شده</span>
                </div>
              </div>

              {songs.length ? (
                <>
                  <div className="hidden grid-cols-[minmax(230px,1.25fr)_minmax(145px,.8fr)_minmax(145px,.8fr)_minmax(165px,.9fr)_100px] gap-4 border-b border-[#282828] px-6 py-3 text-xs font-bold text-[#777] lg:grid">
                    <span>آهنگ</span><span>کل درآمد</span><span>واریزشده</span><span>باقی‌مانده</span><span>وضعیت</span>
                  </div>
                  <div className="divide-y divide-[#282828]">
                    {songs.map((song) => {
                      const deleted = song.status === "deleted";
                      const pending = num(song.pending_income);
                      return (
                        <div key={song.id} className={`grid gap-4 p-4 transition lg:grid-cols-[minmax(230px,1.25fr)_minmax(145px,.8fr)_minmax(145px,.8fr)_minmax(165px,.9fr)_100px] lg:items-center lg:px-6 ${deleted ? "bg-[#171717] opacity-70" : "hover:bg-[#202020]"}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#2b2b2b]">
                              {song.cover_image ? <img src={song.cover_image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#777]">♪</div>}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate font-bold ${deleted ? "text-[#999]" : "text-white"}`}>{song.title}</p>
                              {song.title_en && <p className="truncate text-xs text-[#777]" dir="ltr">{song.title_en}</p>}
                              <p className="mt-1 text-[11px] text-[#666]">{compact(song.total_plays)} استریم</p>
                            </div>
                          </div>
                          <div><span className="text-xs text-[#777] lg:hidden">کل درآمد: </span><strong className="text-white">{money(song.total_income ?? song.income)}</strong></div>
                          <div><span className="text-xs text-[#777] lg:hidden">واریزشده: </span><strong className="text-violet-300">{money(song.deposited_income)}</strong></div>
                          <div>
                            <span className="text-xs text-[#777] lg:hidden">باقی‌مانده: </span><strong className="text-[#1DB954]">{money(song.remaining_income)}</strong>
                            {pending > 0 ? <p className="mt-1 text-[11px] text-amber-300">{money(pending)} در فرایند تسویه</p> : <p className="mt-1 text-[11px] text-[#777]">قابل تسویه اکنون: {money(song.available_income)}</p>}
                          </div>
                          <span className="w-fit rounded-full bg-[#2a2a2a] px-3 py-1 text-xs text-[#bbb]">{deleted ? "حذف‌شده" : "فعال"}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={loadMoreRef} className="flex min-h-24 items-center justify-center border-t border-[#282828] px-4 py-6">
                    {songsLoadingMore ? (
                      <span className="inline-flex items-center gap-2 text-sm text-[#999]"><RefreshCw className="h-4 w-4 animate-spin text-[#1DB954]" />در حال بارگذاری آهنگ‌های بیشتر</span>
                    ) : songsError ? (
                      <button onClick={() => void loadMoreSongs()} className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">تلاش دوباره برای ادامه فهرست</button>
                    ) : songsNext ? (
                      <span className="text-xs text-[#666]">با ادامه اسکرول، موارد بعدی خودکار بارگذاری می‌شوند.</span>
                    ) : (
                      <span className="text-xs text-[#666]">همه آهنگ‌ها نمایش داده شدند.</span>
                    )}
                  </div>
                </>
              ) : <div className="py-20 text-center text-[#777]">هنوز آهنگی با سابقه مالی وجود ندارد.</div>}
            </section>
          )}

          {selectedView === "withdrawals" && (
            <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div><h2 className="text-xl font-bold text-white">تاریخچه تسویه</h2><p className="mt-1 text-xs text-[#888]">{wallet.deposit_requests.total_submissions} درخواست ثبت‌شده</p></div>
                <ArrowDownToLine className="h-6 w-6 text-[#1DB954]" />
              </div>
              <div className="space-y-3">
                {payouts.length ? payouts.map((item) => {
                  const meta = statusMeta[item.status] || statusMeta.pending;
                  const Icon = meta.icon;
                  return (
                    <article key={item.id} className="rounded-xl border border-[#2c2c2c] bg-[#202020] p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.className}`}><Icon className="h-5 w-5" /></div>
                          <div>
                            <p className="text-lg font-black text-white">{money(item.amount)}</p>
                            <p className="mt-1 text-xs text-[#888]">ثبت: {dateLabel(item.submission_date)}</p>
                            {item.status_change_date && <p className="mt-1 text-xs text-[#777]">آخرین تغییر: {dateLabel(item.status_change_date)}</p>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                          {item.transaction_id && <span className="rounded-full bg-[#292929] px-3 py-1 text-xs text-[#aaa]" dir="ltr">شناسه: {item.transaction_id}</span>}
                          {item.status === "pending" && (
                            <button onClick={() => void cancelPayout(item.id)} disabled={cancellingId === item.id} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50">
                              <RotateCcw className={`h-3.5 w-3.5 ${cancellingId === item.id ? "animate-spin" : ""}`} />لغو درخواست
                            </button>
                          )}
                        </div>
                      </div>
                      {item.summary && (
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#303030] pt-4 text-xs sm:grid-cols-4">
                          <div><p className="text-[#777]">کل استریم</p><p className="mt-1 font-bold text-white">{compact(item.summary.total_plays || 0)}</p></div>
                          <div><p className="text-[#777]">پریمیوم</p><p className="mt-1 font-bold text-white">{compact(item.summary.premium_plays || 0)}</p></div>
                          <div><p className="text-[#777]">رایگان</p><p className="mt-1 font-bold text-white">{compact(item.summary.free_plays || 0)}</p></div>
                          <div><p className="text-[#777]">شماره درخواست</p><p className="mt-1 font-bold text-white">#{item.id}</p></div>
                        </div>
                      )}
                    </article>
                  );
                }) : <div className="py-20 text-center text-[#777]">هنوز درخواست تسویه‌ای ثبت نشده است.</div>}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
};

export default Financial;
