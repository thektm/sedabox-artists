import React from "react";
import { useNavigation } from "../contexts/NavigationContext";

const Analytics: React.FC = () => {
  const { navigateTo } = useNavigation();
  const timeRanges = ["1 ساعت", "7 روز", "30 روز"];
  const [activeRange, setActiveRange] = React.useState("30 روز");

  // Generate chart data based on selected time range
  const chartData = React.useMemo(() => {
    // 1 hour: 24 bars for past 24 hours
    if (activeRange === "1 ساعت") {
      return Array.from({ length: 24 })
        .map((_, i) => ({
          day: `${23 - i}:00`,
          plays: Math.floor(150 + Math.random() * 450),
        }))
        .reverse();
    }

    // 7 days: keep weekday labels
    if (activeRange === "7 روز") {
      return [
        { day: "ش", plays: 450 },
        { day: "ی", plays: 380 },
        { day: "د", plays: 520 },
        { day: "س", plays: 610 },
        { day: "چ", plays: 480 },
        { day: "پ", plays: 720 },
        { day: "ج", plays: 650 },
      ];
    }

    // 30 days: 12 bars with Iranian month names
    if (activeRange === "30 روز") {
      const iranianMonths = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند",
      ];
      return iranianMonths.map((month) => ({
        day: month,
        plays: Math.floor(600 + Math.random() * 1800),
      }));
    }

    // 90 days: aggregated weekly (13 bars)
    if (activeRange === "90 روز") {
      return Array.from({ length: 13 }).map((_, i) => ({
        day: `${i + 1}`,
        plays: Math.floor(400 + Math.random() * 1000),
      }));
    }

    // Year: 12 bars with Iranian month names
    const iranianMonths = [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ];
    return iranianMonths.map((month) => ({
      day: month,
      plays: Math.floor(600 + Math.random() * 1800),
    }));
  }, [activeRange]);

  const maxPlays = Math.max(...chartData.map((d) => d.plays));

  const topSongs = [
    { id: 1, title: "ترانه عشق", plays: "3.5K", growth: "+12%" },
    { id: 2, title: "بی‌تو", plays: "2.8K", growth: "+8%" },
    { id: 3, title: "آهنگ جدید", plays: "1.2K", growth: "+24%" },
  ];

  // Demographics: major Iranian cities + single foreign bucket
  const demographics = [
    { country: "تهران", percentage: 30, plays: "3.8K" },
    { country: "مشهد", percentage: 12, plays: "1.5K" },
    { country: "اصفهان", percentage: 9, plays: "1.1K" },
    { country: "شیراز", percentage: 6, plays: "758" },
    { country: "تبریز", percentage: 4, plays: "505" },
    { country: "خارج از کشور", percentage: 35, plays: "4.43K" },
  ];

  return (
    <div className="min-h-full w-full p-6 lg:p-8 pc-compact" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          تحلیل و آمار
        </h1>
        <p className="text-[#B3B3B3]">
          عملکرد و آمار آهنگ‌های خود را مشاهده کنید
        </p>

        {/* Live small indicator: pulsing dot + white/green text with transparent ring and green glow */}
        <div
          className="flex items-center gap-2 mt-3"
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
              <span className="text-[#1DB954] font-semibold ml-1">۲۶</span>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#1DB954]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[#1DB954] text-sm font-semibold">+12%</span>
          </div>
          <p className="text-[#B3B3B3] text-sm mb-1">بازدید کل</p>
          <p className="text-white text-2xl font-bold">12.5K</p>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#3b82f6]"
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
            <span className="text-[#3b82f6] text-sm font-semibold">+8%</span>
          </div>
          <p className="text-[#B3B3B3] text-sm mb-1">پخش کل</p>
          <p className="text-white text-2xl font-bold">8.3K</p>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#8b5cf6]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <span className="text-[#8b5cf6] text-sm font-semibold">+5%</span>
          </div>
          <p className="text-[#B3B3B3] text-sm mb-1">دنبال‌کنندگان</p>
          <p className="text-white text-2xl font-bold">856</p>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#f59e0b]/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#f59e0b]"
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
            <span className="text-[#f59e0b] text-sm font-semibold">+18%</span>
          </div>
          <p className="text-[#B3B3B3] text-sm mb-1">درآمد ماهانه</p>
          <p className="text-white text-2xl font-bold">2.4M</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#181818] border border-[#282828] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">نمودار پخش</h2>
          <div className="flex items-center gap-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeRange === range
                    ? "bg-[#1DB954] text-black"
                    : "bg-[#282828] text-[#B3B3B3] hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart with horizontal scroll */}
        <div className="overflow-x-auto overflow-y-hidden" dir="ltr">
          <div className="flex items-end gap-2 h-64 min-w-max px-2">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2"
                style={{ minWidth: chartData.length > 12 ? "40px" : "60px" }}
              >
                <div className="w-full flex items-end justify-center h-48">
                  <div
                    className="w-full bg-gradient-to-t from-[#1DB954] to-[#1ed760] rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer relative group"
                    style={{
                      height: `${(item.plays / maxPlays) * 100}%`,
                      minWidth: "20px",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#282828] px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {item.plays} پخش
                    </div>
                  </div>
                </div>
                <span className="text-[#B3B3B3] text-xs whitespace-nowrap">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Songs */}
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            محبوب‌ترین آهنگ‌ها
          </h2>
          <div className="space-y-4">
            {topSongs.map((song, index) => (
              <div
                key={index}
                onClick={() =>
                  navigateTo("details", { type: "song", id: song.id })
                }
                className="flex items-center justify-between p-3 bg-[#282828] hover:bg-[#333333] rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{song.title}</p>
                    <p className="text-[#B3B3B3] text-sm">{song.plays} پخش</p>
                  </div>
                </div>
                <span className="text-[#1DB954] text-sm font-semibold">
                  {song.growth}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            شنوندگان بر اساس شهرهای بزرگ ایران
          </h2>
          <div className="space-y-4">
            {demographics.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">
                    {item.country}
                  </span>
                  <span className="text-[#B3B3B3] text-sm">
                    {item.plays} پخش
                  </span>
                </div>
                <div className="w-full h-2 bg-[#282828] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-[#B3B3B3] text-xs mt-1 inline-block">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
