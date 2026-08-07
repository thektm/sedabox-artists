import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Eye,
  Heart,
  MapPin,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import { useLiveListeners } from "../contexts/LiveListenersContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useToast } from "../contexts/ToastContext";
import PremiumTimelineChart, { ChartView, ChartViewToggle } from "./PremiumTimelineChart";

type Period = "today" | "7d" | "30d" | "365d" | "all";

interface AnalyticsResponse {
  summary: {
    total_plays: number;
    total_likes: number;
    total_income: string | number;
    total_followers: number;
    new_followers: number;
    unique_listeners: number;
    monthly_listeners: number;
    period: Period;
    growth: Record<"plays" | "likes" | "income" | "followers", number | null>;
  };
  chart: { type: "hourly" | "daily" | "monthly"; data: Array<{ time: string; count: number }> };
  city_distribution: Array<{ city: string; count: number; percentage: number }>;
  country_distribution: Array<{ country: string; count: number; percentage: number }>;
  plan_distribution: Array<{ plan: string; count: number; income: string | number; percentage: number }>;
  top_songs: Array<{
    id: number;
    title: string;
    title_en?: string;
    cover_image?: string;
    plays: number;
    likes: number;
    stream_share: number;
  }>;
}

const ranges: Array<{ value: Period; label: string; chart?: string }> = [
  { value: "today", label: "امروز", chart: "hourly" },
  { value: "7d", label: "۷ روز", chart: "daily" },
  { value: "30d", label: "۳۰ روز", chart: "daily" },
  { value: "365d", label: "۱۲ ماه", chart: "monthly" },
  { value: "all", label: "همه", chart: "monthly" },
];

const numberFormatter = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const moneyFormatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });

const parseChartDate = (value: string) => {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dayMatch) return new Date(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3]));
  return new Date(value);
};

const formatDateLabel = (iso: string, type: AnalyticsResponse["chart"]["type"]) => {
  const date = parseChartDate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (type === "hourly") return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (type === "monthly") return new Intl.DateTimeFormat("fa-IR", { month: "short", year: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("fa-IR", { month: "numeric", day: "numeric" }).format(date);
};

const pad = (value: number) => String(value).padStart(2, "0");
const localDayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localMonthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const localHourKey = (date: Date) => `${localDayKey(date)}T${pad(date.getHours())}`;

const normalizeChartData = (
  rows: AnalyticsResponse["chart"]["data"],
  type: AnalyticsResponse["chart"]["type"],
  period: Period,
) => {
  const rowMap = new Map<string, number>();
  rows.forEach((row) => {
    const parsed = parseChartDate(row.time);
    if (Number.isNaN(parsed.getTime())) return;
    const key = type === "hourly" ? localHourKey(parsed) : type === "monthly" ? localMonthKey(parsed) : localDayKey(parsed);
    rowMap.set(key, Number(row.count || 0));
  });

  const now = new Date();
  const points: Array<{ time: string; count: number }> = [];
  if (type === "hourly") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let hour = 0; hour < 24; hour += 1) {
      const date = new Date(start);
      date.setHours(hour);
      const key = localHourKey(date);
      points.push({ time: `${key}:00:00`, count: rowMap.get(key) || 0 });
    }
    return points;
  }

  if (type === "daily") {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
    for (let index = 0; index < days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = localDayKey(date);
      points.push({ time: key, count: rowMap.get(key) || 0 });
    }
    return points;
  }

  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let startMonth = new Date(currentMonth);
  if (period === "365d") {
    startMonth.setMonth(startMonth.getMonth() - 11);
  } else if (period === "all" && rowMap.size) {
    const earliest = [...rowMap.keys()].sort()[0];
    const [year, month] = earliest.split("-").map(Number);
    startMonth = new Date(year, month - 1, 1);
  }

  for (let date = new Date(startMonth); date <= currentMonth; date.setMonth(date.getMonth() + 1)) {
    const key = localMonthKey(date);
    points.push({ time: `${key}-01`, count: rowMap.get(key) || 0 });
  }
  return points;
};

const Growth: React.FC<{ value: number | null | undefined }> = ({ value }) => {
  if (value === null || value === undefined) return <span className="text-xs text-[#777]">—</span>;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-bold ${positive ? "text-[#1DB954]" : "text-red-400"}`} dir="ltr">
      {positive ? "+" : ""}{value}%
    </span>
  );
};

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-[#282828] ${className}`} />
);

const Analytics: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { liveListeners, isPolling } = useLiveListeners();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("30d");
  const [chartView, setChartView] = useState<ChartView>("timeline");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const loadedOnce = useRef(false);

  const load = useCallback(async (quiet = false) => {
    const sequence = ++requestSequence.current;
    if (quiet) setRefreshing(true);
    else if (loadedOnce.current) setUpdating(true);
    else setLoading(true);
    setError("");
    try {
      const selected = ranges.find((item) => item.value === period);
      const response = await apiRequest<AnalyticsResponse>("/artist/analytics/", {
        query: { period, chart: selected?.chart },
      });
      if (sequence !== requestSequence.current) return;
      setData(response);
      loadedOnce.current = true;
      if (quiet) showToast("آمار با موفقیت به‌روزرسانی شد.", "success");
    } catch (err) {
      if (sequence !== requestSequence.current) return;
      const message = getApiErrorMessage(err, "دریافت اطلاعات آماری انجام نشد.");
      setError(message);
      showToast(message, "error");
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
        setUpdating(false);
        setRefreshing(false);
      }
    }
  }, [period, showToast]);

  useEffect(() => {
    void load();
    return () => { requestSequence.current += 1; };
  }, [load]);

  const chartData = useMemo(
    () => data ? normalizeChartData(data.chart.data, data.chart.type, period) : [],
    [data, period],
  );

  const maxChart = useMemo(
    () => Math.max(1, ...(chartData.map((item) => item.count) || [1])),
    [chartData],
  );

  const selectedRangeLabel = ranges.find((item) => item.value === period)?.label || "بازه انتخابی";

  const stats = data ? [
    { label: "تعداد استریم", value: numberFormatter.format(data.summary.total_plays), growth: data.summary.growth.plays, icon: Eye, tone: "text-[#1DB954] bg-[#1DB954]/15" },
    { label: "شنونده یکتا", value: numberFormatter.format(data.summary.unique_listeners), growth: null, icon: Radio, tone: "text-blue-400 bg-blue-500/15" },
    { label: "دنبال‌کنندگان", value: numberFormatter.format(data.summary.total_followers), growth: data.summary.growth.followers, icon: Users, tone: "text-violet-400 bg-violet-500/15" },
    { label: "درآمد", value: `${moneyFormatter.format(Number(data.summary.total_income || 0))} تومان`, growth: data.summary.growth.income, icon: Coins, tone: "text-amber-400 bg-amber-500/15" },
  ] : [];

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8 pc-compact" dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white lg:text-4xl">تحلیل و آمار</h1>
          <p className="text-[#B3B3B3]">داده‌های واقعی شنوندگان و عملکرد آثار شما</p>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-[#1DB954] px-4 py-2 shadow-[0_0_14px_rgba(29,185,84,.25)]">
            <span className={`h-2.5 w-2.5 rounded-full bg-[#1DB954] ${isPolling ? "animate-pulse" : ""}`} />
            <span className="text-sm font-semibold text-white"><b className="ml-1 text-[#1DB954]">{numberFormatter.format(liveListeners)}</b>کاربر در حال پخش آثار شما</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#383838] bg-[#181818] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> تازه‌سازی
        </button>
      </div>

      <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
        {ranges.map((item) => (
          <button
            key={item.value}
            onClick={() => setPeriod(item.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${period === item.value ? "bg-[#1DB954] text-black" : "bg-[#181818] text-[#B3B3B3] hover:bg-[#282828] hover:text-white"}`}
          >{item.label}</button>
        ))}
      </div>

      {loading && !data ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
          <Skeleton className="mb-8 h-80" />
          <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
        </>
      ) : error && !data ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="mb-4 text-red-200">دریافت اطلاعات با خطا مواجه شد.</p>
          <button onClick={() => void load()} className="rounded-xl bg-white px-5 py-2.5 font-bold text-black">تلاش دوباره</button>
        </div>
      ) : data ? (
        <div className="relative" aria-busy={updating || refreshing}>
          {(updating || refreshing) && <div className="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-2 rounded-full border border-[#3b3b3b] bg-[#111]/90 px-3 py-1.5 text-xs font-bold text-[#bbb] shadow-xl backdrop-blur"><RefreshCw className="h-3.5 w-3.5 animate-spin text-[#1DB954]" />در حال بروزرسانی {selectedRangeLabel}</div>}
          <div className={`transition-opacity duration-200 ${updating || refreshing ? "opacity-55" : "opacity-100"}`}>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, growth, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-[#282828] bg-[#181818] p-5 transition hover:-translate-y-0.5 hover:border-[#3a3a3a]">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
                  <Growth value={growth} />
                </div>
                <p className="mb-1 text-sm text-[#AFAFAF]">{label}</p>
                <p className="truncate text-2xl font-black text-white" title={value}>{value}</p>
              </div>
            ))}
          </div>

          <section className="mb-8 rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-bold text-white">نمودار استریم</h2><p className="mt-1 text-xs text-[#888]">بر اساس پخش‌های ثبت‌شده در اپلیکیشن مخاطبان</p></div>
              <ChartViewToggle value={chartView} onChange={setChartView} />
            </div>
            {chartView === "timeline" ? (
              <PremiumTimelineChart
                points={chartData.map((item) => ({ label: item.time, value: item.count }))}
                seriesName="استریم"
                valueFormatter={(value) => `${numberFormatter.format(value)} استریم`}
                axisValueFormatter={(value) => numberFormatter.format(value)}
                axisLabelFormatter={(label) => formatDateLabel(label, data.chart.type)}
                tooltipLabelFormatter={(label) => formatDateLabel(label, data.chart.type)}
                emptyText="در این بازه هنوز استریمی ثبت نشده است."
                height={270}
              />
            ) : chartData.length ? (
              <div className="overflow-x-auto pb-2" dir="ltr">
                <div className="flex h-64 min-w-[680px] items-end gap-2 border-b border-[#303030] px-2">
                  {chartData.map((item) => {
                    const height = item.count > 0 ? Math.max(3, (item.count / maxChart) * 100) : 0;
                    return (
                      <div key={item.time} className="group flex min-w-[34px] flex-1 flex-col items-center justify-end gap-2">
                        <div className="relative flex h-[210px] w-full items-end justify-center">
                          <div className="absolute bottom-full mb-2 hidden rounded-lg bg-black px-2 py-1 text-xs font-bold text-white shadow-xl group-hover:block">{numberFormatter.format(item.count)}</div>
                          <div className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-[#168d42] to-[#1ed760] transition-all duration-500 group-hover:brightness-125" style={{ height: `${height}%` }} />
                        </div>
                        <span className="whitespace-nowrap text-[10px] text-[#8d8d8d]">{formatDateLabel(item.time, data.chart.type)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <div className="flex h-56 items-center justify-center text-[#777]">در این بازه هنوز استریمی ثبت نشده است.</div>}
          </section>

          <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">آهنگ‌های محبوب</h2><p className="mt-1 text-xs text-[#777]">استریم‌های ثبت‌شده در {selectedRangeLabel}</p></div><Heart className="h-5 w-5 text-[#1DB954]" /></div>
              <div className="space-y-2">
                {data.top_songs.length ? data.top_songs.map((song, index) => (
                  <button key={song.id} onClick={() => navigateTo("details", { type: "song", id: song.id })} className="flex w-full items-center gap-3 rounded-xl p-3 text-right transition hover:bg-[#242424]">
                    <span className="w-5 text-center text-sm font-black text-[#777]">{index + 1}</span>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#282828]">{song.cover_image ? <img src={song.cover_image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#666]">♪</div>}</div>
                    <div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{song.title}</p>{song.title_en && <p className="truncate text-xs text-[#777]" dir="ltr">{song.title_en}</p>}</div>
                    <div className="shrink-0 text-left"><p className="text-sm font-bold text-white">{numberFormatter.format(song.plays)} استریم</p><p className="text-[10px] text-[#1DB954]">{song.stream_share}% از این بازه</p></div>
                  </button>
                )) : <div className="py-16 text-center text-[#777]">هنوز داده‌ای برای رتبه‌بندی آهنگ‌ها وجود ندارد.</div>}
              </div>
            </section>

            <section className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-white">نوع اشتراک مخاطبان</h2><Users className="h-5 w-5 text-[#1DB954]" /></div>
              <div className="space-y-5">
                {["premium", "free"].map((plan) => {
                  const item = data.plan_distribution.find((row) => row.plan === plan);
                  const percent = item?.percentage || 0;
                  return <div key={plan}><div className="mb-2 flex items-center justify-between"><span className="font-semibold text-white">{plan === "premium" ? "پریمیوم" : "رایگان"}</span><span className="text-sm text-[#B3B3B3]">{numberFormatter.format(item?.count || 0)} · {percent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#292929]"><div className={`h-full rounded-full ${plan === "premium" ? "bg-[#1DB954]" : "bg-blue-500"}`} style={{ width: `${Math.min(100, percent)}%` }} /></div></div>;
                })}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-[#2b2b2b] pt-5">
                <div className="rounded-xl bg-[#222] p-4"><p className="text-xs text-[#888]">شنونده ماهانه</p><p className="mt-1 text-xl font-black text-white">{numberFormatter.format(data.summary.monthly_listeners)}</p></div>
                <div className="rounded-xl bg-[#222] p-4"><p className="text-xs text-[#888]">دنبال‌کننده جدید</p><p className="mt-1 text-xl font-black text-white">{numberFormatter.format(data.summary.new_followers)}</p></div>
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: "شهرهای برتر", icon: MapPin, rows: data.city_distribution.map((row) => ({ ...row, label: row.city })) },
              { title: "کشورهای برتر", icon: MapPin, rows: data.country_distribution.map((row) => ({ ...row, label: row.country })) },
            ].map(({ title, icon: Icon, rows }) => (
              <section key={title} className="rounded-2xl border border-[#282828] bg-[#181818] p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-2"><Icon className="h-5 w-5 text-[#1DB954]" /><h2 className="text-lg font-bold text-white">{title}</h2></div>
                <div className="space-y-4">
                  {rows.length ? rows.slice(0, 8).map((row) => (
                    <div key={row.label || "Unknown"}><div className="mb-1.5 flex justify-between text-sm"><span className="truncate text-white">{row.label || "نامشخص"}</span><span className="shrink-0 text-[#aaa]">{numberFormatter.format(row.count)} · {row.percentage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#2b2b2b]"><div className="h-full rounded-full bg-[#1DB954]" style={{ width: `${Math.min(100, row.percentage)}%` }} /></div></div>
                  )) : <div className="py-10 text-center text-[#777]">اطلاعات مکانی هنوز ثبت نشده است.</div>}
                </div>
              </section>
            ))}
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Analytics;
