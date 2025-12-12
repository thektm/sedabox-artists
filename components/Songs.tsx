import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "../contexts/NavigationContext";

// Song metadata interface matching Spotify's requirements
interface SongMetadata {
  id: number;
  title: string;
  artist: string;
  featuredArtists: string[];
  album: string;
  duration: string;
  plays: string;
  status: "published" | "draft" | "pending" | "rejected";
  approvalStatus: "approved" | "pending" | "rejected" | "none";
  image: string;
  audioFile?: string;

  // Spotify Algorithm Metadata
  releaseDate: string;
  genre: string[];
  subGenre: string[];
  mood: string[];
  language: string;
  explicit: boolean;

  // Audio Features (for Spotify algorithm)
  tempo: number; // BPM
  energy: number; // 0-100
  danceability: number; // 0-100
  valence: number; // 0-100 (positivity)
  acousticness: number; // 0-100
  instrumentalness: number; // 0-100
  liveness: boolean; // true/false
  speechiness: number; // 0-100

  // Additional Metadata
  label: string;
  producers: string[];
  composers: string[];
  lyricists: string[];
  lyrics?: string;

  // Marketing & Discovery
  tags: string[];
  description: string;
  credits: string;
}

const Songs: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<"all" | "published" | "pending">(
    "all"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongMetadata | null>(null);
  const [modalStep, setModalStep] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [isSingleRelease, setIsSingleRelease] = useState(false);

  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [formData, setFormData] = useState<Partial<SongMetadata>>({
    featuredArtists: [],
    genre: [],
    subGenre: [],
    mood: [],
    language: "fa",
    explicit: false,
    tempo: 120,
    energy: 50,
    danceability: 50,
    valence: 50,
    acousticness: 50,
    instrumentalness: 0,
    liveness: false,
    speechiness: 10,
    producers: [],
    composers: [],
    lyricists: [],
    tags: [],
  });

  const [songs, setSongs] = useState<SongMetadata[]>([
    {
      id: 1,
      title: "آهنگ جدید",
      artist: "شما",
      featuredArtists: ["هنرمند مهمان"],
      album: "آلبوم اول",
      duration: "3:45",
      plays: "1.2K",
      status: "published",
      approvalStatus: "approved",
      image: "https://picsum.photos/400/400?random=1",
      releaseDate: "2024-01-15",
      genre: ["پاپ", "راک"],
      subGenre: ["پاپ راک"],
      mood: ["شاد", "پرانرژی"],
      language: "fa",
      explicit: false,
      tempo: 128,
      energy: 85,
      danceability: 75,
      valence: 80,
      acousticness: 20,
      instrumentalness: 5,
      liveness: false,
      speechiness: 8,
      label: "لیبل موسیقی",
      producers: ["تهیه کننده 1"],
      composers: ["آهنگساز 1"],
      lyricists: ["ترانه سرا 1"],
      tags: ["پاپ", "شاد", "رقص"],
      description: "یک آهنگ شاد و پرانرژی",
      credits: "تمامی حقوق محفوظ است",
    },
    {
      id: 2,
      title: "ترانه عشق",
      artist: "شما",
      featuredArtists: [],
      album: "آلبوم اول",
      duration: "4:12",
      plays: "3.5K",
      status: "published",
      approvalStatus: "approved",
      image: "https://picsum.photos/400/400?random=2",
      releaseDate: "2024-02-20",
      genre: ["سنتی", "پاپ"],
      subGenre: ["پاپ سنتی"],
      mood: ["عاشقانه", "آرام"],
      language: "fa",
      explicit: false,
      tempo: 95,
      energy: 60,
      danceability: 45,
      valence: 70,
      acousticness: 65,
      instrumentalness: 10,
      liveness: false,
      speechiness: 15,
      label: "لیبل موسیقی",
      producers: ["تهیه کننده 2"],
      composers: ["آهنگساز 2"],
      lyricists: ["ترانه سرا 2"],
      tags: ["عاشقانه", "آرام", "سنتی"],
      description: "ترانه‌ای عاشقانه و دلنشین",
      credits: "تمامی حقوق محفوظ است",
    },
    {
      id: 3,
      title: "بی‌تو",
      artist: "شما",
      featuredArtists: [],
      album: "آلبوم دوم",
      duration: "3:28",
      plays: "2.8K",
      status: "draft",
      approvalStatus: "pending",
      image: "https://picsum.photos/400/400?random=3",
      releaseDate: "2024-03-10",
      genre: ["پاپ"],
      subGenre: ["پاپ مدرن"],
      mood: ["غمگین", "احساسی"],
      language: "fa",
      explicit: false,
      tempo: 110,
      energy: 55,
      danceability: 40,
      valence: 30,
      acousticness: 45,
      instrumentalness: 8,
      liveness: false,
      speechiness: 12,
      label: "لیبل موسیقی",
      producers: ["تهیه کننده 3"],
      composers: ["آهنگساز 3"],
      lyricists: ["ترانه سرا 3"],
      tags: ["غمگین", "احساسی", "پاپ"],
      description: "آهنگی احساسی و غمگین",
      credits: "تمامی حقوق محفوظ است",
    },
  ]);

  useEffect(() => {
    if (isModalOpen && stepsRef.current[modalStep - 1]) {
      stepsRef.current[modalStep - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [modalStep, isModalOpen]);

  const filteredSongs =
    activeTab === "all"
      ? songs
      : activeTab === "pending"
      ? songs.filter((song) => song.approvalStatus === "pending")
      : songs.filter((song) => song.status === activeTab);

  const genres = [
    "پاپ",
    "راک",
    "سنتی",
    "رپ",
    "الکترونیک",
    "جز",
    "بلوز",
    "متال",
    "کلاسیک",
    "فولک",
  ];
  const moods = [
    "شاد",
    "غمگین",
    "آرام",
    "پرانرژی",
    "عاشقانه",
    "احساسی",
    "مهمانی",
    "تمرکز",
    "خواب",
  ];

  const openModal = (song?: SongMetadata) => {
    if (song) {
      setEditingSong(song);
      setFormData(song);
      setIsSingleRelease(!song.album || song.album.trim() === "");
    } else {
      setEditingSong(null);
      setFormData({
        featuredArtists: [],
        genre: [],
        subGenre: [],
        mood: [],
        language: "fa",
        explicit: false,
        tempo: 120,
        energy: 50,
        danceability: 50,
        valence: 50,
        acousticness: 50,
        instrumentalness: 0,
        liveness: false,
        speechiness: 10,
        producers: [],
        composers: [],
        lyricists: [],
        tags: [],
      });
      setIsSingleRelease(false);
    }
    setModalStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSong(null);
    setModalStep(1);
  };

  const handleInputChange = (field: keyof SongMetadata, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: keyof SongMetadata, value: string) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: items }));
  };

  const handleSubmit = () => {
    if (editingSong) {
      // Update existing song
      setSongs((prev) =>
        prev.map((song) =>
          song.id === editingSong.id
            ? {
                ...song,
                ...formData,
                status: "pending",
                approvalStatus: "pending",
              }
            : song
        )
      );
    } else {
      // Add new song
      const newSong: SongMetadata = {
        id: songs.length + 1,
        artist: "شما",
        plays: "0",
        status: "draft",
        approvalStatus: "pending",
        image: `https://picsum.photos/400/400?random=${songs.length + 10}`,
        duration: "0:00",
        ...formData,
      } as SongMetadata;
      setSongs((prev) => [...prev, newSong]);
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setSongs((prev) => prev.filter((song) => song.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleApprovalChange = (
    id: number,
    status: "approved" | "rejected"
  ) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id === id
          ? {
              ...song,
              approvalStatus: status,
              status: status === "approved" ? "published" : "draft",
            }
          : song
      )
    );
  };

  return (
    <div className="min-h-full w-full p-6 lg:p-8 pc-compact" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          مدیریت آهنگ‌ها
        </h1>
        <p className="text-[#B3B3B3]">آهنگ‌های خود را مدیریت و بارگذاری کنید</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-none ${
              activeTab === "all"
                ? "bg-[#1DB954] text-black"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            همه ({songs.length})
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`px-3 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-none ${
              activeTab === "published"
                ? "bg-[#1DB954] text-black"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            منتشر شده ({songs.filter((s) => s.status === "published").length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-none ${
              activeTab === "pending"
                ? "bg-[#1DB954] text-black"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            در انتظار تأیید (
            {songs.filter((s) => s.approvalStatus === "pending").length})
          </button>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm sm:text-base">بارگذاری آهنگ جدید</span>
        </button>
      </div>

      {/* Songs List */}
      <div className="bg-[#181818] border border-[#282828] rounded-xl overflow-hidden">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#282828] text-[#B3B3B3] text-sm font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-4">عنوان</div>
          <div className="col-span-2">آلبوم</div>
          <div className="col-span-1">زمان</div>
          <div className="col-span-1">پخش</div>
          <div className="col-span-2">وضعیت</div>
          <div className="col-span-1">عملیات</div>
        </div>

        {/* Table Body */}
        <div>
          {filteredSongs.map((song, index) => (
            <div
              key={song.id}
              onClick={() =>
                navigateTo("details", { type: "song", id: song.id })
              }
              className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-[#282828] transition-colors cursor-pointer border-b border-[#282828] last:border-b-0"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden flex items-center gap-4 p-2">
                <img
                  src={song.image}
                  alt={song.title}
                  className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-white font-semibold text-base sm:text-sm truncate mb-1">
                    {song.title}
                  </p>
                  <p className="text-[#B3B3B3] text-sm sm:text-xs mb-2">
                    {song.album}
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="text-[#B3B3B3] text-xs">
                      {song.duration}
                    </span>
                    <span className="text-[#B3B3B3] text-xs">
                      {song.plays} پخش
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      song.approvalStatus === "approved"
                        ? "bg-[#1DB954]/20 text-[#1DB954]"
                        : song.approvalStatus === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {song.approvalStatus === "approved"
                      ? "تأیید شده"
                      : song.approvalStatus === "pending"
                      ? "در انتظار تأیید"
                      : "رد شده"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(song);
                      }}
                      className="p-2 text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-colors min-w-[40px] min-h-[40px] touch-manipulation"
                      title="ویرایش"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(song.id);
                      }}
                      className="p-2 text-[#B3B3B3] hover:text-red-500 hover:bg-[#282828] rounded-lg transition-colors min-w-[40px] min-h-[40px] touch-manipulation"
                      title="حذف"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <>
                <div className="hidden lg:flex col-span-1 items-center text-[#B3B3B3]">
                  {index + 1}
                </div>
                <div className="hidden lg:flex col-span-4 items-center gap-3">
                  <img
                    src={song.image}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {song.title}
                    </p>
                    <p className="text-[#B3B3B3] text-sm">{song.artist}</p>
                  </div>
                </div>
                <div className="hidden lg:flex col-span-2 items-center text-[#B3B3B3]">
                  {song.album}
                </div>
                <div className="hidden lg:flex col-span-1 items-center text-[#B3B3B3]">
                  {song.duration}
                </div>
                <div className="hidden lg:flex col-span-1 items-center text-white font-semibold">
                  {song.plays}
                </div>
                <div className="hidden lg:flex col-span-2 items-center">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      song.approvalStatus === "approved"
                        ? "bg-[#1DB954]/20 text-[#1DB954]"
                        : song.approvalStatus === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {song.approvalStatus === "approved"
                      ? "تأیید شده"
                      : song.approvalStatus === "pending"
                      ? "در انتظار"
                      : "رد شده"}
                  </span>
                </div>
                <div className="hidden lg:flex col-span-1 items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(song);
                    }}
                    className="p-1.5 text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded transition-colors"
                    title="ویرایش"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(song.id);
                    }}
                    className="p-1.5 text-[#B3B3B3] hover:text-red-500 hover:bg-[#282828] rounded transition-colors"
                    title="حذف"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">تأیید حذف</h3>
            <p className="text-[#B3B3B3] mb-6">
              آیا از حذف این آهنگ اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-[#181818] hover:bg-[#282828] text-white rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#181818] rounded-xl w-full max-w-4xl my-8 pc-compact">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#282828]">
              <h2 className="text-2xl font-bold text-white">
                {editingSong ? "ویرایش آهنگ" : "بارگذاری آهنگ جدید"}
              </h2>
              <button
                onClick={closeModal}
                className="text-[#B3B3B3] hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-[#282828]">
              <style>{`.steps-container::-webkit-scrollbar { display: none; } .steps-container { scrollbar-width: none; }`}</style>
              <div className="flex items-center justify-between max-w-2xl mx-auto overflow-x-auto steps-container">
                {[
                  { num: 1, label: "اطلاعات اصلی" },
                  { num: 2, label: "متادیتا و ژانر" },
                  { num: 3, label: "ویژگی‌های صوتی" },
                  { num: 4, label: "اطلاعات قانونی" },
                ].map((step, idx) => (
                  <div
                    key={step.num}
                    className="flex items-center"
                    ref={(el) => {
                      stepsRef.current[idx] = el;
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                          modalStep >= step.num
                            ? "bg-[#1DB954] text-black"
                            : "bg-[#282828] text-[#B3B3B3]"
                        }`}
                      >
                        {step.num}
                      </div>
                      <span className="text-xs text-[#B3B3B3] mt-2 hidden sm:block">
                        {step.label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className={`w-12 sm:w-20 h-1 mx-2 transition-colors ${
                          modalStep > step.num ? "bg-[#1DB954]" : "bg-[#282828]"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto" dir="rtl">
              {/* Step 1: Basic Information */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        عنوان آهنگ *
                      </label>
                      <input
                        type="text"
                        value={formData.title || ""}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                        placeholder="نام آهنگ را وارد کنید"
                      />
                    </div>
                    <div>
                      <div className="flex flex-row-reverse justify-end items-center gap-2 mb-2">
                        <button
                          onClick={() => setIsSingleRelease(!isSingleRelease)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            isSingleRelease
                              ? "bg-[#1DB954] text-black"
                              : "bg-[#282828] text-[#B3B3B3] hover:bg-[#404040]"
                          }`}
                        >
                          انتشار تک
                        </button>
                        <label className="block text-white font-semibold">
                          نام آلبوم *
                        </label>
                      </div>
                      <input
                        type="text"
                        value={formData.album || ""}
                        onChange={(e) =>
                          handleInputChange("album", e.target.value)
                        }
                        disabled={isSingleRelease}
                        className={`w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954] ${
                          isSingleRelease ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        placeholder="نام آلبوم"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      هنرمندان مهمان (با کاما جدا کنید)
                    </label>
                    <input
                      type="text"
                      value={formData.featuredArtists?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayInput("featuredArtists", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="نام هنرمندان مهمان"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        تاریخ انتشار *
                      </label>
                      <input
                        type="date"
                        value={formData.releaseDate || ""}
                        onChange={(e) =>
                          handleInputChange("releaseDate", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        زبان *
                      </label>
                      <select
                        value={formData.language || "fa"}
                        onChange={(e) =>
                          handleInputChange("language", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      >
                        <option value="fa">فارسی</option>
                        <option value="en">انگلیسی</option>
                        <option value="ar">عربی</option>
                        <option value="tr">ترکی</option>
                        <option value="other">سایر</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      فایل صوتی *
                    </label>
                    <div className="border-2 border-dashed border-[#404040] rounded-lg p-8 text-center hover:border-[#1DB954] transition-colors cursor-pointer">
                      <svg
                        className="w-12 h-12 text-[#B3B3B3] mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-white font-semibold mb-1">
                        فایل صوتی را اینجا بکشید یا کلیک کنید
                      </p>
                      <p className="text-[#B3B3B3] text-sm">
                        فرمت‌های پشتیبانی شده: MP3, WAV, FLAC (حداکثر 200MB)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      تصویر کاور
                    </label>
                    <div className="border-2 border-dashed border-[#404040] rounded-lg p-8 text-center hover:border-[#1DB954] transition-colors cursor-pointer">
                      <svg
                        className="w-12 h-12 text-[#B3B3B3] mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-white font-semibold mb-1">
                        تصویر کاور را آپلود کنید
                      </p>
                      <p className="text-[#B3B3B3] text-sm">
                        حداقل 3000x3000 پیکسل، فرمت JPG یا PNG
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="explicit"
                      checked={formData.explicit || false}
                      onChange={(e) =>
                        handleInputChange("explicit", e.target.checked)
                      }
                      className="w-5 h-5 rounded bg-[#282828] border-[#404040] text-[#1DB954] focus:ring-[#1DB954]"
                    />
                    <label
                      htmlFor="explicit"
                      className="text-white font-semibold"
                    >
                      این آهنگ دارای محتوای صریح است
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Metadata & Genre */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      ژانر اصلی * (حداقل یک مورد)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            const current = formData.genre || [];
                            if (current.includes(genre)) {
                              handleInputChange(
                                "genre",
                                current.filter((g) => g !== genre)
                              );
                            } else {
                              handleInputChange("genre", [...current, genre]);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            formData.genre?.includes(genre)
                              ? "bg-[#1DB954] text-black"
                              : "bg-[#282828] text-[#B3B3B3] hover:bg-[#404040]"
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      زیرژانر (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={formData.subGenre?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayInput("subGenre", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="زیرژانرها را با کاما جدا کنید"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      حال و هوای آهنگ (Mood) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {moods.map((mood) => (
                        <button
                          key={mood}
                          type="button"
                          onClick={() => {
                            const current = formData.mood || [];
                            if (current.includes(mood)) {
                              handleInputChange(
                                "mood",
                                current.filter((m) => m !== mood)
                              );
                            } else {
                              handleInputChange("mood", [...current, mood]);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            formData.mood?.includes(mood)
                              ? "bg-[#1DB954] text-black"
                              : "bg-[#282828] text-[#B3B3B3] hover:bg-[#404040]"
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      تگ‌ها (برای جستجو و کشف آهنگ)
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(", ") || ""}
                      onChange={(e) => handleArrayInput("tags", e.target.value)}
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="تگ‌ها را با کاما جدا کنید"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      توضیحات آهنگ
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="توضیحی درباره آهنگ بنویسید..."
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      متن آهنگ (Lyrics)
                    </label>
                    <textarea
                      value={formData.lyrics || ""}
                      onChange={(e) =>
                        handleInputChange("lyrics", e.target.value)
                      }
                      rows={6}
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954] font-mono"
                      placeholder="متن آهنگ را اینجا وارد کنید..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Audio Features */}
              {modalStep === 3 && (
                <div className="space-y-6">
                  <p className="text-[#B3B3B3] text-sm">
                    این اطلاعات به الگوریتم‌های پخش و پیشنهاد اسپاتیفای کمک
                    می‌کند تا آهنگ شما را به مخاطبان مناسب معرفی کند.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        تمپو (BPM) *
                      </label>
                      <input
                        type="number"
                        value={formData.tempo || 120}
                        onChange={(e) =>
                          handleInputChange("tempo", parseInt(e.target.value))
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                        min="40"
                        max="240"
                      />
                    </div>
                  </div>

                  {/* Audio Feature Sliders */}
                  {[
                    {
                      key: "liveness",
                      label: "اجرای زنده",
                      desc: "احتمال اجرای زنده بودن",
                    },
                    {
                      key: "energy",
                      label: "انرژی",
                      desc: "شدت و فعالیت آهنگ",
                    },
                    {
                      key: "valence",
                      label: "مثبت‌نگری",
                      desc: "احساس مثبت یا منفی",
                    },
                    {
                      key: "acousticness",
                      label: "آکوستیک بودن",
                      desc: "میزان استفاده از آلات آکوستیک",
                    },
                    {
                      key: "instrumentalness",
                      label: "بی‌کلام بودن",
                      desc: "میزان بی‌کلام بودن",
                    },
                    {
                      key: "danceability",
                      label: "قابلیت رقص",
                      desc: "مناسب بودن برای رقصیدن",
                    },
                    {
                      key: "speechiness",
                      label: "گفتاری بودن",
                      desc: "میزان حضور کلام",
                    },
                  ].map((feature) => (
                    <div key={feature.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="block text-white font-semibold">
                            {feature.label}
                          </label>
                          <p className="text-[#B3B3B3] text-sm">
                            {feature.desc}
                          </p>
                        </div>
                        <span className="text-[#1DB954] font-bold text-lg">
                          {feature.key === "liveness"
                            ? formData[feature.key as keyof SongMetadata]
                              ? "بله"
                              : "خیر"
                            : `${
                                formData[feature.key as keyof SongMetadata] || 0
                              }%`}
                        </span>
                      </div>
                      {feature.key === "liveness" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`liveness-${feature.key}`}
                            checked={
                              (formData[
                                feature.key as keyof SongMetadata
                              ] as boolean) || false
                            }
                            onChange={(e) =>
                              handleInputChange("liveness", e.target.checked)
                            }
                            className="w-5 h-5 rounded bg-[#282828] border-[#404040] text-[#1DB954] focus:ring-[#1DB954]"
                          />
                          <label
                            htmlFor={`liveness-${feature.key}`}
                            className="text-white"
                          >
                            اجرای زنده
                          </label>
                        </div>
                      ) : (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={
                            (formData[
                              feature.key as keyof SongMetadata
                            ] as number) || 0
                          }
                          onChange={(e) =>
                            handleInputChange(
                              feature.key as keyof SongMetadata,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full h-2 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4: Legal Information */}
              {modalStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        لیبل/ناشر *
                      </label>
                      <input
                        type="text"
                        value={formData.label || ""}
                        onChange={(e) =>
                          handleInputChange("label", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                        placeholder="نام لیبل موسیقی"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      تهیه‌کنندگان (با کاما جدا کنید)
                    </label>
                    <input
                      type="text"
                      value={formData.producers?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayInput("producers", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="نام تهیه‌کنندگان"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      آهنگسازان (با کاما جدا کنید)
                    </label>
                    <input
                      type="text"
                      value={formData.composers?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayInput("composers", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="نام آهنگسازان"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      ترانه‌سراها (با کاما جدا کنید)
                    </label>
                    <input
                      type="text"
                      value={formData.lyricists?.join(", ") || ""}
                      onChange={(e) =>
                        handleArrayInput("lyricists", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="نام ترانه‌سراها"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      اعتبارات و تشکرات
                    </label>
                    <textarea
                      value={formData.credits || ""}
                      onChange={(e) =>
                        handleInputChange("credits", e.target.value)
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="اعتبارات کامل و تشکرات..."
                    />
                  </div>

                  <div className="bg-[#282828] border border-[#404040] rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#1DB954]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      نکات مهم
                    </h4>
                    <ul className="text-[#B3B3B3] text-sm space-y-1 list-disc list-inside">
                      <li>
                        اطمینان حاصل کنید تمامی حقوق مالکیت معنوی را دارید
                      </li>
                      <li>اعتبارات کامل به شناسایی بهتر همکاران کمک می‌کند</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6 border-t border-[#282828] gap-3 sm:gap-0">
              <div className="flex gap-2 w-full sm:w-auto">
                {modalStep > 1 && (
                  <button
                    onClick={() => setModalStep(modalStep - 1)}
                    className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#282828] hover:bg-[#404040] text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
                  >
                    قبلی
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={closeModal}
                  className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#282828] hover:bg-[#404040] text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
                >
                  انصراف
                </button>
                {modalStep < 4 ? (
                  <button
                    onClick={() => setModalStep(modalStep + 1)}
                    className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-colors text-sm md:text-base"
                  >
                    بعدی
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {editingSong ? "ذخیره تغییرات" : "بارگذاری آهنگ"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredSongs.length === 0 && (
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-12 text-center mt-6">
          <div className="w-20 h-20 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-[#B3B3B3]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">
            {activeTab === "all" && "هنوز آهنگی ندارید"}
            {activeTab === "published" && "هنوز آهنگ منتشر شده‌ای ندارید"}
            {activeTab === "pending" && "آهنگی در انتظار تأیید نیست"}
          </h3>
          <p className="text-[#B3B3B3] mb-6">
            {activeTab === "all" && "اولین آهنگ خود را بارگذاری کنید"}
            {activeTab === "published" &&
              "آهنگ‌های تأیید شده اینجا نمایش داده می‌شوند"}
            {activeTab === "pending" &&
              "آهنگ‌های در انتظار تأیید اینجا نمایش داده می‌شوند"}
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-all duration-200"
          >
            بارگذاری آهنگ
          </button>
        </div>
      )}
    </div>
  );
};

export default Songs;
