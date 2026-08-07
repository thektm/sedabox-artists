import React, { useCallback, useEffect, useState } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import { useLiveListeners } from "../contexts/LiveListenersContext";
import { useToast } from "../contexts/ToastContext";
import { apiRequest, getApiErrorMessage } from "../lib/api";
import PremiumTimelineChart, { ChartView, ChartViewToggle } from "./PremiumTimelineChart";

interface Song {
  id: number;
  title: string;
  plays: number;
  likes_count: number;
  added_to_playlists_count: number;
  cover_image: string;
  display_title?: string;
  featured_artists?: string[];
}

interface PerformanceData {
  today: number;
  last_7_days: number;
  last_30_days: number;
  growth: {
    today: string | null;
    last_7_days: string | null;
    last_30_days: string | null;
  };
}

interface HomeData {
  income_summary: PerformanceData;
  plays_summary: PerformanceData;
  daily_plays: {
    date: string;
    count: number;
  }[];
  top_songs: Song[];
}

const Home: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { user } = useAuth();
  const { liveListeners } = useLiveListeners();
  const { showToast } = useToast();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<ChartView>("timeline");

  const loadHomeData = useCallback(async (notify = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<HomeData>("/artist/home/");
      setData(response);
      if (notify) showToast("داشبورد با موفقیت به‌روزرسانی شد.", "success");
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "دریافت اطلاعات داشبورد هنرمند انجام نشد.");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  // Mini chart data for streams trend
  const dailyPlays = data?.daily_plays || [];
  const maxStream =
    dailyPlays.length > 0 ? Math.max(...dailyPlays.map((d) => d.count)) : 0;

  if (loading) {
    return (
      <div className="min-h-full w-full p-6 lg:p-8 pc-compact" dir="rtl">
        <div className="mb-8">
          <div className="h-8 w-1/3 bg-[#282828] rounded animate-pulse mb-2" />
          <div className="h-4 w-1/4 bg-[#222] rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl p-6 bg-[#181818] border border-[#282828] animate-pulse h-28" />
          <div className="rounded-xl p-6 bg-[#181818] border border-[#282828] animate-pulse h-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 rounded-xl p-6 bg-[#181818] border border-[#282828] animate-pulse h-64" />
          <div className="rounded-xl p-6 bg-[#181818] border border-[#282828] animate-pulse h-64" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[#282828] rounded-lg"
              >
                <div className="w-8 h-8 bg-[#222] rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-[#222] rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-[#222] rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full w-full flex items-center justify-center bg-[#121212]">
        <div className="text-center p-8 bg-[#181818] border border-red-500/20 rounded-xl">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => void loadHomeData(true)}
            className="px-6 py-2 bg-[#1DB954] text-black font-bold rounded-full hover:scale-105 transition-transform"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const { income_summary, plays_summary, top_songs } = data!;

  const formatGrowthValue = (growth: string | null) => {
    if (!growth) return null;
    const isNegative = growth.includes("-");
    const isPositive = growth.includes("+");
    const val = growth.replace(/[+-]/g, "");

    return {
      value: val,
      isPositive: isPositive && !isNegative,
      isNegative: isNegative,
    };
  };

  const getDayName = (dateStr: string) => {
    const days = ["ی", "د", "س", "چ", "پ", "ج", "ش"];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const formatJalali = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    } catch (e) {
      return dateStr;
    }
  };

  const formatMoney = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";

    // Use compact notation for large values, otherwise localize with sensible fraction digits
    try {
      const abs = Math.abs(val);
      if (abs >= 1000) {
        return (
          new Intl.NumberFormat("fa-IR", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(val) + " تومان"
        );
      }

      if (abs >= 1) {
        return (
          new Intl.NumberFormat("fa-IR").format(Math.round(val)) + " تومان"
        );
      }

      // small values: show up to 8 decimal places but trim trailing zeros
      const formatter = new Intl.NumberFormat("fa-IR", {
        maximumFractionDigits: 8,
      });
      return formatter.format(val).replace(/(،0+|\.0+)$/g, "") + " تومان";
    } catch (e) {
      return String(val) + " تومان";
    }
  };

  return (
    <div className="min-h-full w-full p-6 lg:p-8 pc-compact" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          خوش آمدید، {user?.name} 👋
        </h1>
        <p className="text-[#B3B3B3]">خلاصه‌ای از عملکرد و فعالیت‌های شما</p>

        {/* Live small indicator: pulsing dot + white/green text with transparent ring and green glow */}
        <div
          className="flex items-center  gap-2 mt-3"
          aria-live="polite"
          style={{
            gap: "calc(0.5rem * 1.15)",
            marginTop: "calc(0.75rem * 1.15)",
          }}
        >
          <div
            className="relative px-3 py-1 inline-flex items-center pr-6"
            style={{ paddingRight: "calc(1.5rem * 1.15)" }}
          >
            {/* pulsing dot inside the ring (keep animation) */}
            <span
              aria-hidden
              className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1DB954] rounded-full animate-pulse z-20"
              style={{ right: "calc(0.5rem * 1.15)" }}
            />

            <span className="relative z-10 text-white font-semibold text-sm ">
              <span className="text-[#1DB954] font-semibold ml-1">
                {liveListeners.toLocaleString("fa-IR")}
              </span>
              کاربر در حال پخش آثار شما
            </span>

            {/* visible transparent ring + green border and glow */}
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full border-2 border-[#1DB954] pointer-events-none"
              style={{ boxShadow: "0 0 12px rgba(29,185,84,0.45)" }}
            />
          </div>
        </div>
      </div>

      {/* Key Metrics - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Card */}
        <div
          onClick={() => navigateTo("financial")}
          className="bg-gradient-to-br from-[#1DB954]/10 to-[#1ed760]/5 border border-[#1DB954]/30 rounded-xl p-6 hover:border-[#1DB954]/50 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1DB954] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[#B3B3B3] text-sm">درآمد ۳۰ روز اخیر</p>
                <p className="text-white text-2xl font-bold">
                  {formatMoney(income_summary.last_30_days)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {formatGrowthValue(income_summary.growth.last_7_days) && (
                <span
                  className={`${
                    formatGrowthValue(income_summary.growth.last_7_days)
                      ?.isNegative
                      ? "text-red-500"
                      : "text-[#1DB954]"
                  } text-sm font-semibold flex items-center gap-1`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      formatGrowthValue(income_summary.growth.last_7_days)
                        ?.isNegative
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatGrowthValue(income_summary.growth.last_7_days)!.value}
                </span>
              )}
              <span className="text-[#B3B3B3] text-xs">نسبت به هفته قبل</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#282828]">
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">درآمد 24 ساعت گذشته</p>
              <p className="text-white font-semibold">
                {formatMoney(income_summary.today)}
              </p>
            </div>
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">درآمد ۷ روز اخیر</p>
              <p className="text-white font-semibold">
                {formatMoney(income_summary.last_7_days)}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[#B3B3B3] group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </div>

        {/* Total Streams Card */}
        <div
          onClick={() => navigateTo("analytics")}
          className="bg-gradient-to-br from-[#3b82f6]/10 to-[#2563eb]/5 border border-[#3b82f6]/30 rounded-xl p-6 hover:border-[#3b82f6]/50 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[#B3B3B3] text-sm">
                  تعداد استریم‌ها (30 روز)
                </p>
                <p className="text-white text-2xl font-bold">
                  {plays_summary.last_30_days.toLocaleString("fa-IR")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {formatGrowthValue(plays_summary.growth.today) && (
                <>
                  <span
                    className={`${
                      formatGrowthValue(plays_summary.growth.today)?.isNegative
                        ? "text-red-500"
                        : "text-[#3b82f6]"
                    } text-sm font-semibold flex items-center gap-1`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        formatGrowthValue(plays_summary.growth.today)
                          ?.isNegative
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatGrowthValue(plays_summary.growth.today)!.value}
                  </span>
                  <span className="text-[#B3B3B3] text-xs">امروز</span>
                </>
              )}
              {formatGrowthValue(plays_summary.growth.last_7_days) && (
                <>
                  <span
                    className={`${
                      formatGrowthValue(plays_summary.growth.last_7_days)
                        ?.isNegative
                        ? "text-red-500"
                        : "text-[#3b82f6]"
                    } text-sm font-semibold flex items-center gap-1 mt-1`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        formatGrowthValue(plays_summary.growth.last_7_days)
                          ?.isNegative
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {formatGrowthValue(plays_summary.growth.last_7_days)!.value}
                  </span>
                  <span className="text-[#B3B3B3] text-xs">۷ روز گذشته</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#282828]">
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">استریم‌های امروز</p>
              <p className="text-white font-semibold">
                {plays_summary.today.toLocaleString("fa-IR")}
              </p>
            </div>
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">
                استریم‌های ۷ روز اخیر
              </p>
              <p className="text-white font-semibold">
                {plays_summary.last_7_days.toLocaleString("fa-IR")}
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[#B3B3B3] group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts and Top Songs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Performance Chart */}
        <div
          onClick={() => navigateTo("analytics")}
          className="lg:col-span-2 bg-[#181818] border border-[#282828] rounded-xl p-6 hover:border-[#1DB954]/30 transition-all duration-300 cursor-pointer group"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                عملکرد هفتگی
              </h3>
              <p className="text-[#B3B3B3] text-sm">آمار پخش 7 روز اخیر</p>
            </div>
            <div className="flex items-center gap-3">
              <ChartViewToggle value={chartView} onChange={setChartView} />
              <svg
                className="w-5 h-5 text-[#B3B3B3] group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
          </div>

          {chartView === "timeline" ? (
            <PremiumTimelineChart
              points={dailyPlays.slice().reverse().map((day) => ({ label: day.date, value: day.count }))}
              seriesName="استریم"
              valueFormatter={(value) => `${value.toLocaleString("fa-IR")} استریم`}
              axisValueFormatter={(value) => new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 }).format(value)}
              axisLabelFormatter={formatJalali}
              tooltipLabelFormatter={formatJalali}
              emptyText="در این هفته هنوز استریمی ثبت نشده است."
              height={218}
            />
          ) : (
            <div className="flex items-end justify-between gap-3 h-48">
              {dailyPlays
                .slice()
                .reverse()
                .map((day, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex items-end justify-center h-40">
                      <div
                        className="w-full bg-gradient-to-t from-[#1DB954] to-[#1ed760] rounded-t-lg hover:opacity-80 transition-opacity relative group/bar"
                        style={{
                          height: `${maxStream > 0 ? (day.count / maxStream) * 100 : 5}%`,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#282828] px-2 py-1 rounded text-xs text-white opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count.toLocaleString("fa-IR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#B3B3B3] text-xs font-medium">
                        {getDayName(day.date)}
                      </span>
                      <span className="text-[#9CA3AF] text-[11px] mt-1">
                        {formatJalali(day.date)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Songs */}
        <div
          onClick={() => navigateTo("songs")}
          className="bg-[#181818] border border-[#282828] rounded-xl p-6 hover:border-[#1DB954]/30 transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                آهنگ‌های محبوب
              </h3>
              <p className="text-[#B3B3B3] text-sm">پرطرفدارترین‌ها</p>
            </div>
            <svg
              className="w-5 h-5 text-[#B3B3B3] group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>

          <div className="space-y-4">
            {top_songs.slice(0, 5).map((song, index) => {
              const fa = Array.isArray(song.featured_artists)
                ? song.featured_artists
                : [];
              const cleaned = fa.filter(
                (a) => typeof a === "string" && a.trim() !== "",
              );

              const cleanEmptyParens = (s?: string) => {
                if (!s) return "";
                // remove empty or placeholder feat parentheses like (feat.), (feat ), (ft), (.) etc.
                let out = s.replace(
                  /\(\s*(?:feat\.?|ft\.?)\s*[\.:]?\s*\)/gi,
                  "",
                );
                // remove parentheses that only contain punctuation/whitespace
                out = out.replace(/\(\s*[\.\-–—_\s]*\s*\)/g, "");
                // trim and collapse multiple spaces
                out = out.replace(/\s{2,}/g, " ").trim();
                return out;
              };

              let displayTitle = cleanEmptyParens(song.display_title);
              if (!displayTitle) {
                if (cleaned.length > 0) {
                  displayTitle = `${song.title} (feat. ${cleaned.join(", ")})`;
                } else {
                  displayTitle = song.title as unknown as string;
                }
              }

              return (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 bg-[#282828] hover:bg-[#333333] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {displayTitle}
                    </p>
                    <p className="text-[#B3B3B3] text-xs">
                      {song.plays.toLocaleString("fa-IR")} پخش
                    </p>
                  </div>
                </div>
              );
            })}
            {top_songs.length === 0 && (
              <div className="py-8 text-center text-[#B3B3B3] text-sm">
                آهنگی برای نمایش وجود ندارد
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateTo("songs");
            }}
            className="w-full mt-4 py-2 text-center text-sm text-[#1DB954] hover:text-[#1ed760] font-semibold transition-colors"
          >
            مشاهده همه آهنگ‌ها ←
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
