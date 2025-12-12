import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "../contexts/NavigationContext";

// Album metadata interface matching Spotify's requirements
interface AlbumMetadata {
  id: number;
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  genre: string[];
  subGenre: string[];
  mood: string[];
  language: string;
  explicit: boolean;
  label: string;
  producers: string[];
  composers: string[];
  lyricists: string[];
  description: string;
  credits: string;
  status: "published" | "draft" | "pending" | "rejected";
  approvalStatus: "approved" | "pending" | "rejected" | "none";
  songs: number[]; // Array of song IDs
}

// Song metadata interface (simplified for albums context)
interface SongMetadata {
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: boolean;
  speechiness: number;
  label: string;
  producers: string[];
  composers: string[];
  lyricists: string[];
  credits: string;
}

// Song interface for selection
interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
}

// Uploaded song interface
interface UploadedSong {
  id: string;
  file: File;
  title: string;
  metadata: Partial<SongMetadata>;
}

const Albums: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<"all" | "published" | "pending">(
    "all"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumMetadata | null>(null);
  const [modalStep, setModalStep] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(
    null
  );
  const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
  const [songSelectorTab, setSongSelectorTab] = useState<"upload" | "released">(
    "released"
  );
  const [selectedSongsForAlbum, setSelectedSongsForAlbum] = useState<
    (number | string)[]
  >([]);
  const [uploadedSongs, setUploadedSongs] = useState<UploadedSong[]>([]);
  const [isSongMetadataModalOpen, setIsSongMetadataModalOpen] = useState(false);
  const [currentSongForMetadata, setCurrentSongForMetadata] =
    useState<UploadedSong | null>(null);
  const [songMetadataStep, setSongMetadataStep] = useState(3);
  const [songMetadataForm, setSongMetadataForm] = useState<
    Partial<SongMetadata>
  >({
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
  });

  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [formData, setFormData] = useState<Partial<AlbumMetadata>>({
    genre: [],
    subGenre: [],
    mood: [],
    language: "fa",
    explicit: false,
    producers: [],
    composers: [],
    lyricists: [],
    songs: [],
  });

  // Mock songs data for selection
  const [availableSongs, setAvailableSongs] = useState<Song[]>([
    { id: 1, title: "آهنگ جدید", artist: "شما", duration: "3:45" },
    { id: 2, title: "ترانه عشق", artist: "شما", duration: "4:12" },
    { id: 3, title: "بی‌تو", artist: "شما", duration: "3:28" },
    { id: 4, title: "آهنگ دیگر", artist: "شما", duration: "2:55" },
  ]);

  const [albums, setAlbums] = useState<AlbumMetadata[]>([
    {
      id: 1,
      title: "آلبوم اول",
      artist: "شما",
      coverImage: "https://picsum.photos/400/400?random=4",
      releaseDate: "2024-01-15",
      genre: ["پاپ", "راک"],
      subGenre: ["پاپ راک"],
      mood: ["شاد", "پرانرژی"],
      language: "fa",
      explicit: false,
      label: "لیبل موسیقی",
      producers: ["تهیه کننده 1"],
      composers: ["آهنگساز 1"],
      lyricists: ["ترانه سرا 1"],
      description: "اولین آلبوم موسیقی",
      credits: "تمامی حقوق محفوظ است",
      status: "published",
      approvalStatus: "approved",
      songs: [1, 2],
    },
    {
      id: 2,
      title: "آلبوم دوم",
      artist: "شما",
      coverImage: "https://picsum.photos/400/400?random=5",
      releaseDate: "2024-03-10",
      genre: ["سنتی", "پاپ"],
      subGenre: ["پاپ سنتی"],
      mood: ["عاشقانه", "آرام"],
      language: "fa",
      explicit: false,
      label: "لیبل موسیقی",
      producers: ["تهیه کننده 2"],
      composers: ["آهنگساز 2"],
      lyricists: ["ترانه سرا 2"],
      description: "دومین آلبوم موسیقی",
      credits: "تمامی حقوق محفوظ است",
      status: "draft",
      approvalStatus: "pending",
      songs: [3],
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

  const filteredAlbums =
    activeTab === "all"
      ? albums
      : activeTab === "pending"
      ? albums.filter((album) => album.approvalStatus === "pending")
      : albums.filter((album) => album.status === activeTab);

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

  const openModal = (album?: AlbumMetadata) => {
    if (album) {
      setEditingAlbum(album);
      setFormData(album);
      setSelectedSongsForAlbum(album.songs);
    } else {
      setEditingAlbum(null);
      setFormData({
        genre: [],
        subGenre: [],
        mood: [],
        language: "fa",
        explicit: false,
        producers: [],
        composers: [],
        lyricists: [],
        songs: [],
      });
      setSelectedSongsForAlbum([]);
    }
    setModalStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAlbum(null);
    setModalStep(1);
    setIsSongSelectorOpen(false);
  };

  const handleInputChange = (field: keyof AlbumMetadata, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (field: keyof AlbumMetadata, value: string) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: items }));
  };

  const handleSubmit = () => {
    const albumData = {
      ...formData,
      songs: selectedSongsForAlbum,
    } as AlbumMetadata;
    if (editingAlbum) {
      // Update existing album
      setAlbums((prev) =>
        prev.map((album) =>
          album.id === editingAlbum.id
            ? {
                ...album,
                ...albumData,
                status: "pending",
                approvalStatus: "pending",
              }
            : album
        )
      );
    } else {
      // Add new album
      const newAlbum: AlbumMetadata = {
        ...albumData,
        id: albums.length + 1,
        artist: "شما",
        coverImage: `https://picsum.photos/400/400?random=${albums.length + 6}`,
        status: "draft",
        approvalStatus: "pending",
      };
      setAlbums((prev) => [...prev, newAlbum]);
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setAlbums((prev) => prev.filter((album) => album.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleApprovalChange = (
    id: number,
    status: "approved" | "rejected"
  ) => {
    setAlbums((prev) =>
      prev.map((album) =>
        album.id === id
          ? {
              ...album,
              approvalStatus: status,
              status: status === "approved" ? "published" : "draft",
            }
          : album
      )
    );
  };

  const addSongToAlbum = (songId: number | string) => {
    if (!selectedSongsForAlbum.includes(songId)) {
      setSelectedSongsForAlbum((prev) => [...prev, songId]);
    }
  };

  const removeSongFromAlbum = (songId: number | string) => {
    setSelectedSongsForAlbum((prev) => prev.filter((id) => id !== songId));
  };

  const getSongById = (id: number) =>
    availableSongs.find((song) => song.id === id);

  const openSongMetadataModal = (uploadedSong: UploadedSong) => {
    setCurrentSongForMetadata(uploadedSong);
    setSongMetadataForm(uploadedSong.metadata);
    setSongMetadataStep(3);
    setIsSongMetadataModalOpen(true);
  };

  const closeSongMetadataModal = () => {
    setIsSongMetadataModalOpen(false);
    setCurrentSongForMetadata(null);
    setSongMetadataStep(3);
  };

  const handleSongMetadataInputChange = (
    field: keyof SongMetadata,
    value: any
  ) => {
    setSongMetadataForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSongMetadataArrayInput = (
    field: keyof SongMetadata,
    value: string
  ) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setSongMetadataForm((prev) => ({ ...prev, [field]: items }));
  };

  const saveSongMetadata = () => {
    if (currentSongForMetadata) {
      setUploadedSongs((prev) =>
        prev.map((song) =>
          song.id === currentSongForMetadata.id
            ? { ...song, metadata: songMetadataForm }
            : song
        )
      );
    }
    closeSongMetadataModal();
  };

  const isSongMetadataComplete = (metadata: Partial<SongMetadata>) => {
    // Check if required fields are filled
    return (
      metadata.tempo !== undefined &&
      metadata.energy !== undefined &&
      metadata.danceability !== undefined &&
      metadata.valence !== undefined &&
      metadata.acousticness !== undefined &&
      metadata.instrumentalness !== undefined &&
      metadata.liveness !== undefined &&
      metadata.speechiness !== undefined &&
      metadata.label &&
      metadata.producers &&
      metadata.composers &&
      metadata.lyricists &&
      metadata.credits
    );
  };

  const canProceedToNextStep = () => {
    // Check if all uploaded songs have complete metadata
    return uploadedSongs.every((song) => isSongMetadataComplete(song.metadata));
  };

  return (
    <div className="min-h-full w-full p-6 lg:p-8 pc-compact" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
          مدیریت آلبوم‌ها
        </h1>
        <p className="text-[#B3B3B3]">آلبوم‌های خود را مدیریت و ایجاد کنید</p>
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
            همه ({albums.length})
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`px-3 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-none ${
              activeTab === "published"
                ? "bg-[#1DB954] text-black"
                : "text-[#B3B3B3] hover:text-white"
            }`}
          >
            منتشر شده ({albums.filter((a) => a.status === "published").length})
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
            {albums.filter((a) => a.approvalStatus === "pending").length})
          </button>
        </div>

        {/* Create Button */}
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
          <span className="text-sm sm:text-base">ساخت آلبوم جدید</span>
        </button>
      </div>

      {/* Albums List */}
      <div className="bg-[#181818] border border-[#282828] rounded-xl overflow-hidden">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#282828] text-[#B3B3B3] text-sm font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-4">عنوان</div>
          <div className="col-span-2">تاریخ انتشار</div>
          <div className="col-span-1">آهنگ‌ها</div>
          <div className="col-span-2">وضعیت</div>
          <div className="col-span-2">عملیات</div>
        </div>

        {/* Table Body */}
        <div>
          {filteredAlbums.map((album, index) => (
            <div
              key={album.id}
              onClick={() =>
                navigateTo("details", { type: "album", id: album.id })
              }
              className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-[#282828] transition-colors cursor-pointer border-b border-[#282828] last:border-b-0"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden flex items-center gap-4 p-2">
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-white font-semibold text-base sm:text-sm truncate mb-1">
                    {album.title}
                  </p>
                  <p className="text-[#B3B3B3] text-sm sm:text-xs mb-2">
                    {album.artist}
                  </p>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="text-[#B3B3B3] text-xs">
                      {album.songs.length} آهنگ
                    </span>
                    <span className="text-[#B3B3B3] text-xs">
                      {new Date(album.releaseDate).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      album.approvalStatus === "approved"
                        ? "bg-[#1DB954]/20 text-[#1DB954]"
                        : album.approvalStatus === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {album.approvalStatus === "approved"
                      ? "تأیید شده"
                      : album.approvalStatus === "pending"
                      ? "در انتظار تأیید"
                      : "رد شده"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(album);
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
                        setShowDeleteConfirm(album.id);
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
                    src={album.coverImage}
                    alt={album.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {album.title}
                    </p>
                    <p className="text-[#B3B3B3] text-sm">{album.artist}</p>
                  </div>
                </div>
                <div className="hidden lg:flex col-span-2 items-center text-[#B3B3B3]">
                  {album.releaseDate}
                </div>
                <div className="hidden lg:flex col-span-1 items-center text-white font-semibold">
                  {album.songs.length}
                </div>
                <div className="hidden lg:flex col-span-2 items-center">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      album.approvalStatus === "approved"
                        ? "bg-[#1DB954]/20 text-[#1DB954]"
                        : album.approvalStatus === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {album.approvalStatus === "approved"
                      ? "تأیید شده"
                      : album.approvalStatus === "pending"
                      ? "در انتظار"
                      : "رد شده"}
                  </span>
                </div>
                <div className="hidden lg:flex col-span-2 items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(album);
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
                      setShowDeleteConfirm(album.id);
                    }}
                    className="p-1.5 text-[#B3B3B3] hover:text-red-500 hover:bg-[#282828] rounded transition-colors"
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
              آیا از حذف این آلبوم اطمینان دارید؟ این عمل قابل بازگشت نیست.
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
                {editingAlbum ? "ویرایش آلبوم" : "ساخت آلبوم جدید"}
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
                  { num: 3, label: "آهنگ‌ها" },
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
                        عنوان آلبوم *
                      </label>
                      <input
                        type="text"
                        value={formData.title || ""}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                        placeholder="نام آلبوم را وارد کنید"
                      />
                    </div>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      تصویر کاور *
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
                      id="explicit-album"
                      checked={formData.explicit || false}
                      onChange={(e) =>
                        handleInputChange("explicit", e.target.checked)
                      }
                      className="w-5 h-5 rounded bg-[#282828] border-[#404040] text-[#1DB954] focus:ring-[#1DB954]"
                    />
                    <label
                      htmlFor="explicit-album"
                      className="text-white font-semibold"
                    >
                      این آلبوم دارای محتوای صریح است
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
                      حال و هوای آلبوم (Mood) *
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
                      توضیحات آلبوم
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-[#282828] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-[#1DB954]"
                      placeholder="توضیحی درباره آلبوم بنویسید..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Songs */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">آهنگ‌های آلبوم</h3>
                    <button
                      onClick={() => {
                        setIsSongSelectorOpen(true);
                        setSongSelectorTab("released");
                      }}
                      className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-colors"
                    >
                      اضافه کردن آهنگ
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedSongsForAlbum.length === 0 ? (
                      <p className="text-[#B3B3B3] text-center py-8">
                        هنوز آهنگی به این آلبوم اضافه نشده است
                      </p>
                    ) : (
                      selectedSongsForAlbum.map((songId) => {
                        const releasedSong =
                          typeof songId === "number"
                            ? getSongById(songId)
                            : null;
                        const uploadedSong =
                          typeof songId === "string"
                            ? uploadedSongs.find((s) => s.id === songId)
                            : null;
                        const song = releasedSong || uploadedSong;
                        if (!song) return null;
                        const isUploaded = !!uploadedSong;
                        const metadataComplete = isUploaded
                          ? isSongMetadataComplete(uploadedSong!.metadata)
                          : true;
                        return (
                          <div
                            key={songId}
                            className="flex items-center justify-between bg-[#282828] p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center ${
                                  metadataComplete
                                    ? "bg-[#1DB954]"
                                    : "bg-yellow-500"
                                }`}
                              >
                                <svg
                                  className="w-4 h-4 text-black"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-semibold">
                                  {song.title}
                                </p>
                                <p className="text-[#B3B3B3] text-sm">
                                  {isUploaded
                                    ? `بارگذاری شده - ${
                                        (song as UploadedSong).file?.name || ""
                                      }`
                                    : `${(song as Song).artist} • ${
                                        (song as Song).duration
                                      }`}
                                </p>
                                {!metadataComplete && (
                                  <p className="text-yellow-500 text-xs">
                                    متادیتا ناقص
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isUploaded && !metadataComplete && (
                                <button
                                  onClick={() =>
                                    openSongMetadataModal(uploadedSong!)
                                  }
                                  className="px-3 py-1 bg-yellow-500 text-black rounded text-sm"
                                >
                                  تکمیل
                                </button>
                              )}
                              <button
                                onClick={() => removeSongFromAlbum(songId)}
                                className="text-red-500 hover:text-red-400 transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
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
                    disabled={modalStep === 3 && !canProceedToNextStep()}
                    className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 font-bold rounded-lg transition-colors text-sm md:text-base ${
                      modalStep === 3 && !canProceedToNextStep()
                        ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                        : "bg-[#1DB954] hover:bg-[#1ed760] text-black"
                    }`}
                  >
                    {modalStep === 3 && !canProceedToNextStep()
                      ? "تکمیل متادیتا"
                      : "بعدی"}
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
                    {editingAlbum ? "ذخیره تغییرات" : "ساخت آلبوم"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Song Selector Modal */}
      {isSongSelectorOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden pc-compact">
            <div className="flex items-center justify-between p-6 border-b border-[#282828]">
              <h3 className="text-xl font-bold text-white">انتخاب آهنگ</h3>
              <button
                onClick={() => setIsSongSelectorOpen(false)}
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

            {/* Tabs */}
            <div className="px-6 py-4 border-b border-[#282828]">
              <div className="flex items-center gap-2 bg-[#282828] p-1 rounded-lg">
                <button
                  onClick={() => setSongSelectorTab("released")}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 flex-1 ${
                    songSelectorTab === "released"
                      ? "bg-[#1DB954] text-black"
                      : "text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  آهنگ‌های منتشر شده
                </button>
                <button
                  onClick={() => setSongSelectorTab("upload")}
                  className={`px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 flex-1 ${
                    songSelectorTab === "upload"
                      ? "bg-[#1DB954] text-black"
                      : "text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  بارگذاری مستقیم
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {songSelectorTab === "released" && (
                <div className="space-y-2">
                  {availableSongs
                    .filter((song) => !selectedSongsForAlbum.includes(song.id))
                    .map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between bg-[#282828] p-3 rounded-lg hover:bg-[#404040] transition-colors cursor-pointer"
                        onClick={() => {
                          addSongToAlbum(song.id);
                          setIsSongSelectorOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1DB954] rounded flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-black"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {song.title}
                            </p>
                            <p className="text-[#B3B3B3] text-sm">
                              {song.artist} • {song.duration}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#1DB954] hover:text-[#1ed760] transition-colors">
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  {availableSongs.filter(
                    (song) => !selectedSongsForAlbum.includes(song.id)
                  ).length === 0 && (
                    <p className="text-[#B3B3B3] text-center py-8">
                      تمامی آهنگ‌ها به این آلبوم اضافه شده‌اند
                    </p>
                  )}
                </div>
              )}

              {songSelectorTab === "upload" && (
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple
                      accept="audio/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const newUploadedSongs = files.map((file) => ({
                          id: `uploaded-${Date.now()}-${Math.random()}`,
                          file,
                          title: file.name.replace(/\.[^/.]+$/, ""),
                          metadata: {},
                        }));
                        setUploadedSongs((prev) => [
                          ...prev,
                          ...newUploadedSongs,
                        ]);
                        // Add to selected songs
                        const newIds = newUploadedSongs.map((s) => s.id);
                        setSelectedSongsForAlbum((prev) => [
                          ...prev,
                          ...newIds,
                        ]);
                      }}
                      className="hidden"
                      id="song-upload"
                    />
                    <label
                      htmlFor="song-upload"
                      className="border-2 border-dashed border-[#404040] rounded-lg p-8 text-center hover:border-[#1DB954] transition-colors cursor-pointer block"
                    >
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
                        فایل صوتی را انتخاب کنید
                      </p>
                      <p className="text-[#B3B3B3] text-sm">
                        فرمت‌های پشتیبانی شده: MP3, WAV, FLAC (حداکثر 200MB)
                      </p>
                    </label>
                  </div>

                  {uploadedSongs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">
                        آهنگ‌های بارگذاری شده
                      </h4>
                      {uploadedSongs.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between bg-[#282828] p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1DB954] rounded flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-black"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-white font-semibold">
                                {song.title}
                              </p>
                              <p className="text-[#B3B3B3] text-sm">
                                {song.file.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isSongMetadataComplete(song.metadata) && (
                              <button
                                onClick={() => openSongMetadataModal(song)}
                                className="px-3 py-1 bg-yellow-500 text-black rounded text-sm"
                              >
                                تکمیل متادیتا
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setUploadedSongs((prev) =>
                                  prev.filter((s) => s.id !== song.id)
                                );
                                setSelectedSongsForAlbum((prev) =>
                                  prev.filter((id) => id !== song.id)
                                );
                              }}
                              className="text-red-500 hover:text-red-400 transition-colors"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#282828] border border-[#404040] rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">نکات مهم</h4>
                    <ul className="text-[#B3B3B3] text-sm space-y-1 list-disc list-inside">
                      <li>
                        آهنگ‌های بارگذاری شده مستقیماً به آلبوم اضافه می‌شوند
                      </li>
                      <li>
                        اطمینان حاصل کنید از حقوق مالکیت معنوی تمامی فایل‌ها
                      </li>
                      <li>
                        فایل‌ها پس از تأیید به لیست آهنگ‌های منتشر شده اضافه
                        می‌شوند
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Song Metadata Modal */}
      {isSongMetadataModalOpen && currentSongForMetadata && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-[#181818] rounded-xl w-full max-w-4xl my-8 pc-compact">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#282828]">
              <h2 className="text-2xl font-bold text-white">
                تکمیل متادیتای آهنگ: {currentSongForMetadata.title}
              </h2>
              <button
                onClick={closeSongMetadataModal}
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
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      songMetadataStep >= 3
                        ? "bg-[#1DB954] text-black"
                        : "bg-[#282828] text-[#B3B3B3]"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs text-[#B3B3B3] mt-2">
                    ویژگی‌های صوتی
                  </span>
                </div>
                <div className="w-20 h-1 bg-[#282828]" />
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      songMetadataStep >= 4
                        ? "bg-[#1DB954] text-black"
                        : "bg-[#282828] text-[#B3B3B3]"
                    }`}
                  >
                    4
                  </div>
                  <span className="text-xs text-[#B3B3B3] mt-2">
                    اطلاعات قانونی
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto" dir="rtl">
              {/* Step 3: Audio Features */}
              {songMetadataStep === 3 && (
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
                        value={songMetadataForm.tempo || 120}
                        onChange={(e) =>
                          handleSongMetadataInputChange(
                            "tempo",
                            parseInt(e.target.value)
                          )
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
                            ? songMetadataForm[
                                feature.key as keyof SongMetadata
                              ]
                              ? "بله"
                              : "خیر"
                            : `${
                                songMetadataForm[
                                  feature.key as keyof SongMetadata
                                ] || 0
                              }%`}
                        </span>
                      </div>
                      {feature.key === "liveness" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`song-${feature.key}`}
                            checked={
                              (songMetadataForm[
                                feature.key as keyof SongMetadata
                              ] as boolean) || false
                            }
                            onChange={(e) =>
                              handleSongMetadataInputChange(
                                "liveness",
                                e.target.checked
                              )
                            }
                            className="w-5 h-5 rounded bg-[#282828] border-[#404040] text-[#1DB954] focus:ring-[#1DB954]"
                          />
                          <label
                            htmlFor={`song-${feature.key}`}
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
                            (songMetadataForm[
                              feature.key as keyof SongMetadata
                            ] as number) || 0
                          }
                          onChange={(e) =>
                            handleSongMetadataInputChange(
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
              {songMetadataStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        لیبل/ناشر *
                      </label>
                      <input
                        type="text"
                        value={songMetadataForm.label || ""}
                        onChange={(e) =>
                          handleSongMetadataInputChange("label", e.target.value)
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
                      value={songMetadataForm.producers?.join(", ") || ""}
                      onChange={(e) =>
                        handleSongMetadataArrayInput(
                          "producers",
                          e.target.value
                        )
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
                      value={songMetadataForm.composers?.join(", ") || ""}
                      onChange={(e) =>
                        handleSongMetadataArrayInput(
                          "composers",
                          e.target.value
                        )
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
                      value={songMetadataForm.lyricists?.join(", ") || ""}
                      onChange={(e) =>
                        handleSongMetadataArrayInput(
                          "lyricists",
                          e.target.value
                        )
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
                      value={songMetadataForm.credits || ""}
                      onChange={(e) =>
                        handleSongMetadataInputChange("credits", e.target.value)
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
                {songMetadataStep > 3 && (
                  <button
                    onClick={() => setSongMetadataStep(songMetadataStep - 1)}
                    className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#282828] hover:bg-[#404040] text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
                  >
                    قبلی
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={closeSongMetadataModal}
                  className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#282828] hover:bg-[#404040] text-white font-semibold rounded-lg transition-colors text-sm md:text-base"
                >
                  انصراف
                </button>
                <button
                  onClick={saveSongMetadata}
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
                  ذخیره متادیتا
                </button>
                {songMetadataStep < 4 && (
                  <button
                    onClick={() => setSongMetadataStep(songMetadataStep + 1)}
                    className="flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-colors text-sm md:text-base"
                  >
                    بعدی
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAlbums.length === 0 && (
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
            {activeTab === "all" && "هنوز آلبومی ندارید"}
            {activeTab === "published" && "هنوز آلبوم منتشر شده‌ای ندارید"}
            {activeTab === "pending" && "آلبومی در انتظار تأیید نیست"}
          </h3>
          <p className="text-[#B3B3B3] mb-6">
            {activeTab === "all" && "اولین آلبوم خود را بسازید"}
            {activeTab === "published" &&
              "آلبوم‌های تأیید شده اینجا نمایش داده می‌شوند"}
            {activeTab === "pending" &&
              "آلبوم‌های در انتظار تأیید اینجا نمایش داده می‌شوند"}
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-lg transition-all duration-200"
          >
            ساخت آلبوم
          </button>
        </div>
      )}
    </div>
  );
};

export default Albums;
