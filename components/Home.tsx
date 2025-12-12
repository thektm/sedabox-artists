import React from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";

const Home: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { user } = useAuth();

  // Mini chart data for streams trend
  const streamsTrend = [420, 380, 520, 610, 480, 720, 650];
  const maxStream = Math.max(...streamsTrend);

  const topSongs = [
    { id: 1, title: "ترانه عشق", plays: "3.5K", growth: "+12%", trend: "up" },
    { id: 2, title: "بی‌تو", plays: "2.8K", growth: "+8%", trend: "up" },
    { id: 3, title: "آهنگ جدید", plays: "1.2K", growth: "+24%", trend: "up" },
  ];

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
              <span className="text-[#1DB954] font-semibold ml-1">259</span>
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
                <p className="text-[#B3B3B3] text-sm">درآمد ماهانه</p>
                <p className="text-white text-2xl font-bold">2.4M تومان</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#1DB954] text-sm font-semibold flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
                +18%
              </span>
              <span className="text-[#B3B3B3] text-xs">نسبت به ماه قبل</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#282828]">
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">درآمد امروز</p>
              <p className="text-white font-semibold">82K تومان</p>
            </div>
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">پیش‌بینی پایان ماه</p>
              <p className="text-white font-semibold">2.8M تومان</p>
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
                <p className="text-[#B3B3B3] text-sm">تعداد استریم‌ها</p>
                <p className="text-white text-2xl font-bold">8.3K</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#3b82f6] text-sm font-semibold flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
                +12%
              </span>
              <span className="text-[#B3B3B3] text-xs">7 روز گذشته</span>
              <span className="text-[#3b82f6] text-sm font-semibold flex items-center gap-1 mt-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
                +28%
              </span>
              <span className="text-[#B3B3B3] text-xs">30 روز گذشته</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#282828]">
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">استریم‌های امروز</p>
              <p className="text-white font-semibold">1.2K</p>
            </div>
            <div>
              <p className="text-[#B3B3B3] text-xs mb-1">پیش‌بینی پایان ماه</p>
              <p className="text-white font-semibold">9.5K</p>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                عملکرد هفتگی
              </h3>
              <p className="text-[#B3B3B3] text-sm">آمار پخش 7 روز اخیر</p>
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

          {/* Chart */}
          <div className="flex items-end justify-between gap-3 h-48">
            {[
              { label: "ش", value: 420 },
              { label: "ی", value: 380 },
              { label: "د", value: 520 },
              { label: "س", value: 610 },
              { label: "چ", value: 480 },
              { label: "پ", value: 720 },
              { label: "ج", value: 650 },
            ].map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className="w-full bg-gradient-to-t from-[#1DB954] to-[#1ed760] rounded-t-lg hover:opacity-80 transition-opacity relative group/bar"
                    style={{ height: `${(day.value / 720) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#282828] px-2 py-1 rounded text-xs text-white opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {day.value}
                    </div>
                  </div>
                </div>
                <span className="text-[#B3B3B3] text-xs font-medium">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
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
            {topSongs.map((song, index) => (
              <div
                key={song.id}
                className="flex items-center gap-3 p-3 bg-[#282828] hover:bg-[#333333] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {song.title}
                  </p>
                  <p className="text-[#B3B3B3] text-xs">{song.plays} پخش</p>
                </div>
                <div className="flex items-center gap-1 text-[#1DB954] text-xs font-semibold">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {song.growth}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 text-center text-sm text-[#1DB954] hover:text-[#1ed760] font-semibold transition-colors">
            مشاهده همه آهنگ‌ها →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
