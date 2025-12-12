import React, { useRef, useEffect } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { ArrowRight, Heart, Music2, Clock, ArrowLeft } from "lucide-react";

interface AlbumDetailProps {
  albumId?: string | number;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ albumId }) => {
  const { goBack, navigateTo } = useNavigation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [albumId]);

  // Dummy data - in a real app, fetch based on albumId
  const albumData = {
    id: albumId,
    title: "آلبوم جدید",
    artist: "شما",
    cover: "https://picsum.photos/400/400?random=2",
    likes: "2.4K",
    releaseDate: "1402/10/25",
    songs: [
      { id: 1, title: "آهنگ اول", duration: "3:45", plays: "1.2K" },
      { id: 2, title: "آهنگ دوم", duration: "4:12", plays: "856" },
      { id: 3, title: "آهنگ سوم", duration: "2:58", plays: "742" },
      { id: 4, title: "آهنگ چهارم", duration: "5:23", plays: "1.5K" },
      { id: 5, title: "آهنگ پنجم", duration: "3:18", plays: "623" },
    ],
  };

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
        <h1 className="text-xl font-bold text-white">جزئیات آلبوم</h1>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Album Info & Cover */}
        <div className="md:col-span-2 bg-[#181818] border border-[#282828] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Cover Image */}
          <div className="relative group w-full sm:w-48 aspect-square rounded-xl overflow-hidden shadow-lg shrink-0">
            <img
              src={albumData.cover}
              alt={albumData.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {albumData.title}
                </h2>
                <p className="text-[#B3B3B3] text-lg mb-4">
                  {albumData.artist}
                </p>
              </div>
              {/* Status Badge */}
              <span className="px-3 py-1 bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium rounded-full border border-[#1DB954]/20">
                منتشر شده
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[#B3B3B3] mb-6">
              <div className="flex items-center gap-1.5">
                <Music2 size={16} />
                <span>{albumData.releaseDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Likes Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#181818] border border-[#282828] rounded-xl p-5 flex items-center justify-between group hover:border-[#ef4444]/50 transition-colors">
            <div>
              <p className="text-[#B3B3B3] text-sm mb-1">لایک‌ها</p>
              <p className="text-2xl font-bold text-white">{albumData.likes}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] group-hover:scale-110 transition-transform">
              <Heart size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-[#181818] border border-[#282828] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">آهنگ‌های آلبوم</h3>
        <div className="space-y-3">
          {albumData.songs.map((song, index) => (
            <div
              key={song.id}
              onClick={() =>
                navigateTo("details", { type: "song", id: song.id })
              }
              className="flex items-center justify-between p-4 bg-[#282828] hover:bg-[#333333] rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#1DB954] rounded flex items-center justify-center text-black font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-semibold">{song.title}</p>
                  <p className="text-[#B3B3B3] text-sm">{song.plays} پخش</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#B3B3B3]">
                <Clock size={16} />
                <span className="text-sm">{song.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail;
