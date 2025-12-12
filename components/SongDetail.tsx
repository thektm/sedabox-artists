import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import {
  ArrowRight,
  Play,
  Heart,
  ListPlus,
  Share2,
  Clock,
  Music2,
  ArrowLeft,
} from "lucide-react";

interface SongDetailProps {
  songId?: string | number;
}

const SongDetail: React.FC<SongDetailProps> = ({ songId }) => {
  const { goBack, navigateTo } = useNavigation();
  const [activeTimeRange, setActiveTimeRange] = useState("30 روز");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [songId]);

  // Dummy data - in a real app, fetch based on songId
  const songData = {
    id: songId,
    title: "آهنگ جدید",
    artist: "شما",
    cover: "https://picsum.photos/400/400?random=1",
    plays: "12.5K",
    likes: "856",
    playlists: "142",
    duration: "3:45",
    releaseDate: "1402/10/25",
  };

  const timeRanges = ["7 روز", "30 روز", "90 روز"];

  // Chart Data Generator
  const playHistoryData = useMemo(() => {
    const points = 20;
    return Array.from({ length: points }).map((_, i) => ({
      value: Math.floor(Math.random() * 100) + 50,
      label: i % 5 === 0 ? `${i + 1}` : "",
    }));
  }, [activeTimeRange]);

  const maxPlayValue = Math.max(...playHistoryData.map((d) => d.value));

  // Generate SVG path for line chart
  const getPath = () => {
    const height = 200;
    const width = 100; // percentage
    const stepX = width / (playHistoryData.length - 1);

    let path = `M 0 ${
      height - (playHistoryData[0].value / maxPlayValue) * height
    }`;

    playHistoryData.forEach((point, i) => {
      if (i === 0) return;
      const x = i * stepX;
      const y = height - (point.value / maxPlayValue) * height;
      // Simple curve smoothing could be added here, but straight lines are efficient
      path += ` L ${x} ${y}`;
    });

    return path;
  };

  const cityStats = [
    { city: "تهران", plays: "3.8K", percentage: 45 },
    { city: "مشهد", plays: "1.5K", percentage: 25 },
    { city: "اصفهان", plays: "1.1K", percentage: 15 },
    { city: "شیراز", plays: "758", percentage: 10 },
    { city: "سایر", plays: "1.2K", percentage: 5 },
  ];

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto w-full p-4 lg:p-8 pb-24 animate-fade-in custom-scrollbar"
      dir="rtl"
    >
      {/* Header / Navigation */}
      <div className="flex flex-row-reverse w-full justify-between items-center gap-4 mb-6">
        <button
          onClick={goBack}
          className="p-2 rounded-full bg-[#282828] hover:bg-[#3E3E3E] text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">جزئیات آهنگ</h1>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Song Info & Cover */}
        <div className="md:col-span-2 bg-[#181818] border border-[#282828] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Cover Image - Top Right (in RTL) / Left (in LTR) */}
          {/* Since we are in RTL, it will be on the right naturally if we just place it. 
                User asked for "top right". In RTL flex-row, the first item is on the right. 
            */}
          <div className="relative group w-full sm:w-48 aspect-square rounded-xl overflow-hidden shadow-lg shrink-0">
            <img
              src={songData.cover}
              alt={songData.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
              <button
                onClick={() => navigateTo("songs")}
                className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl"
              >
                <Music2 size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {songData.title}
                </h2>
                <p className="text-[#B3B3B3] text-lg mb-4">{songData.artist}</p>
              </div>
              {/* Status Badge */}
              <span className="px-3 py-1 bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium rounded-full border border-[#1DB954]/20">
                منتشر شده
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[#B3B3B3] mb-6">
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{songData.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Music2 size={16} />
                <span>{songData.releaseDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo("songs")}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <Music2 size={18} />
                <span>مشاهده در آهنگ‌ها</span>
              </button>
              <button className="p-2.5 rounded-full border border-[#B3B3B3]/30 text-[#B3B3B3] hover:text-white hover:border-white transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#181818] border border-[#282828] rounded-xl p-5 flex items-center justify-between group hover:border-[#1DB954]/50 transition-colors">
            <div>
              <p className="text-[#B3B3B3] text-sm mb-1">تعداد پخش</p>
              <p className="text-2xl font-bold text-white">{songData.plays}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954] group-hover:scale-110 transition-transform">
              <Play size={20} fill="currentColor" />
            </div>
          </div>

          <div className="bg-[#181818] border border-[#282828] rounded-xl p-5 flex items-center justify-between group hover:border-[#ef4444]/50 transition-colors">
            <div>
              <p className="text-[#B3B3B3] text-sm mb-1">لایک‌ها</p>
              <p className="text-2xl font-bold text-white">{songData.likes}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
          </div>

          <div className="bg-[#181818] border border-[#282828] rounded-xl p-5 flex items-center justify-between group hover:border-[#3b82f6]/50 transition-colors">
            <div>
              <p className="text-[#B3B3B3] text-sm mb-1">افزودن به پلی‌لیست</p>
              <p className="text-2xl font-bold text-white">
                {songData.playlists}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] group-hover:scale-110 transition-transform">
              <ListPlus size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Play History Chart */}
        <div className="lg:col-span-2 bg-[#181818] border border-[#282828] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">روند پخش</h3>
            <div className="flex bg-[#282828] rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTimeRange === range
                      ? "bg-[#1DB954] text-black shadow-sm"
                      : "text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full relative">
            {/* Simple SVG Line Chart */}
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 200"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line
                x1="0"
                y1="0"
                x2="100"
                y2="0"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1="100"
                x2="100"
                y2="100"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1="150"
                x2="100"
                y2="150"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="2"
              />
              <line
                x1="0"
                y1="200"
                x2="100"
                y2="200"
                stroke="#333"
                strokeWidth="0.5"
                strokeDasharray="2"
              />

              {/* The Line */}
              <path
                d={getPath()}
                fill="none"
                stroke="#1DB954"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-[0_0_10px_rgba(29,185,84,0.3)]"
              />

              {/* Area under the line (optional, for better look) */}
              <path
                d={`${getPath()} L 100 200 L 0 200 Z`}
                fill="url(#gradient)"
                opacity="0.2"
              />

              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1DB954" />
                  <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* City Stats */}
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">پخش بر اساس شهر</h3>
          <div className="space-y-5">
            {cityStats.map((city, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-white font-medium">{city.city}</span>
                  <span className="text-[#B3B3B3]">{city.plays}</span>
                </div>
                <div className="h-2 w-full bg-[#282828] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1DB954] rounded-full"
                    style={{ width: `${city.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
