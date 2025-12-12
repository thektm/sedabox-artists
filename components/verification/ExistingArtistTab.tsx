import React, { useState, useRef } from "react";
import { Search, Upload, Calendar, IdCard, CheckCircle2 } from "lucide-react";

interface ExistingArtistTabProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

interface Artist {
  id: string;
  name: string;
  avatar: string;
  genres: string[];
  verified: boolean;
}

interface FormData {
  selectedArtist: Artist | null;
  birthDate: string;
  nationalId: string;
  idCardImage: string | null;
  additionalInfo: string;
}

// Mock data for existing artists
const MOCK_ARTISTS: Artist[] = [
  {
    id: "1",
    name: "محسن چاوشی",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=MC",
    genres: ["سنتی", "پاپ"],
    verified: true,
  },
  {
    id: "2",
    name: "حمید هیراد",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=HH",
    genres: ["پاپ", "راک"],
    verified: true,
  },
  {
    id: "3",
    name: "سینا سرلک",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=SS",
    genres: ["پاپ"],
    verified: true,
  },
  {
    id: "4",
    name: "علی یاسینی",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=AY",
    genres: ["سنتی"],
    verified: true,
  },
  {
    id: "5",
    name: "رضا صادقی",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=RS",
    genres: ["پاپ", "سنتی"],
    verified: true,
  },
  {
    id: "6",
    name: "مهدی یراحی",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=MY",
    genres: ["پاپ"],
    verified: true,
  },
  {
    id: "7",
    name: "امیر عباس گلاب",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=AG",
    genres: ["پاپ", "راک"],
    verified: true,
  },
  {
    id: "8",
    name: "علیرضا طلیسچی",
    avatar: "https://via.placeholder.com/100/1DB954/FFFFFF?text=AT",
    genres: ["سنتی", "فولکلور"],
    verified: true,
  },
];

const ExistingArtistTab: React.FC<ExistingArtistTabProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<FormData>({
    selectedArtist: null,
    birthDate: "",
    nationalId: "",
    idCardImage: null,
    additionalInfo: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const idCardInputRef = useRef<HTMLInputElement>(null);

  const filteredArtists = MOCK_ARTISTS.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArtistSelect = (artist: Artist) => {
    setFormData((prev) => ({ ...prev, selectedArtist: artist }));
    setShowDropdown(false);
    setSearchQuery("");
    if (errors.selectedArtist) {
      setErrors((prev) => ({ ...prev, selectedArtist: undefined }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData((prev) => ({ ...prev, idCardImage: result }));
        if (errors.idCardImage) {
          setErrors((prev) => ({ ...prev, idCardImage: undefined }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.selectedArtist)
      newErrors.selectedArtist = "انتخاب هنرمند الزامی است";
    if (!formData.birthDate) newErrors.birthDate = "تاریخ تولد الزامی است";
    if (!formData.nationalId.trim()) newErrors.nationalId = "کد ملی الزامی است";
    else if (!/^\d{10}$/.test(formData.nationalId))
      newErrors.nationalId = "کد ملی باید 10 رقم باشد";
    if (!formData.idCardImage)
      newErrors.idCardImage = "تصویر کارت ملی الزامی است";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit({
        ...formData,
        artistId: formData.selectedArtist?.id,
        artistName: formData.selectedArtist?.name,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-[#1DB954]/20 to-[#1ed760]/20 border border-[#1DB954]/40 rounded-2xl p-3 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg mb-2">
              درخواست مالکیت حساب هنرمند موجود
            </h4>
            <p className="text-[#B3B3B3] text-sm leading-relaxed">
              اگر قبلاً به عنوان هنرمند در پلتفرم ما فعالیت داشته‌اید و
              می‌خواهید مالکیت حساب خود را احراز کنید، لطفاً هنرمند مورد نظر را
              انتخاب کرده و اطلاعات احراز هویت خود را وارد نمایید. تیم ما
              اطلاعات شما را بررسی کرده و پس از تأیید، دسترسی کامل به حساب هنری
              خود را دریافت خواهید کرد.
            </p>
          </div>
        </div>
      </div>

      {/* Artist Selection */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-[#1DB954]" />
          </div>
          انتخاب هنرمند
        </h3>

        {formData.selectedArtist ? (
          <div className="relative">
            <div className="bg-gradient-to-br from-[#1DB954]/20 to-[#1ed760]/20 border-2 border-[#1DB954] rounded-2xl p-3 md:p-6 mb-4">
              <div className="flex items-center gap-4">
                <img
                  src={formData.selectedArtist.avatar}
                  alt={formData.selectedArtist.name}
                  className="w-20 h-20 rounded-full border-4 border-[#1DB954]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-bold text-xl">
                      {formData.selectedArtist.name}
                    </h4>
                    {formData.selectedArtist.verified && (
                      <CheckCircle2 className="w-6 h-6 text-[#1DB954]" />
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {formData.selectedArtist.genres.map((genre) => (
                      <span
                        key={genre}
                        className="bg-[#1DB954]/30 text-[#1DB954] px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, selectedArtist: null }))
                  }
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
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#535353] w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className={`w-full bg-[#0a0a0a] border ${
                  errors.selectedArtist ? "border-red-500" : "border-[#282828]"
                } rounded-xl px-12 py-3 md:py-4 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
                placeholder="نام هنرمند را جستجو کنید..."
              />
            </div>
            {errors.selectedArtist && (
              <p className="text-red-500 text-sm mt-2">
                {errors.selectedArtist}
              </p>
            )}

            {showDropdown && searchQuery && (
              <div className="absolute z-10 w-full mt-2 bg-[#181818] border border-[#282828] rounded-2xl shadow-2xl max-h-96 overflow-y-auto custom-scrollbar">
                {filteredArtists.length > 0 ? (
                  filteredArtists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => handleArtistSelect(artist)}
                      className="w-full flex items-center gap-4 p-3 md:p-4 hover:bg-[#282828] transition-colors border-b border-[#282828] last:border-b-0"
                    >
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        className="w-14 h-14 rounded-full"
                      />
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-semibold">
                            {artist.name}
                          </h4>
                          {artist.verified && (
                            <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {artist.genres.map((genre) => (
                            <span
                              key={genre}
                              className="text-[#B3B3B3] text-xs"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-[#535353]">
                      هنرمندی با این نام یافت نشد
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Information */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <IdCard className="w-5 h-5 text-[#1DB954]" />
          </div>
          اطلاعات احراز هویت
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تاریخ تولد *
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.birthDate ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors`}
            />
            {errors.birthDate && (
              <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
              <IdCard className="w-4 h-4" />
              کد ملی *
            </label>
            <input
              type="text"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              maxLength={10}
              className={`w-full bg-[#0a0a0a] border ${
                errors.nationalId ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="کد ملی 10 رقمی"
            />
            {errors.nationalId && (
              <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              اطلاعات تکمیلی (اختیاری)
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
              placeholder="اطلاعات تکمیلی که ممکن است در احراز هویت کمک کند (آثار، لینک‌ها و...)"
            />
          </div>
        </div>
      </div>

      {/* ID Card Upload */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <Upload className="w-5 h-5 text-[#1DB954]" />
          </div>
          بارگذاری مدارک
        </h3>

        <div
          onClick={() => idCardInputRef.current?.click()}
          className={`border-2 border-dashed ${
            errors.idCardImage ? "border-red-500" : "border-[#282828]"
          } rounded-2xl p-4 md:p-8 cursor-pointer hover:border-[#1DB954] transition-all group bg-[#0a0a0a]`}
        >
          <input
            ref={idCardInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {formData.idCardImage ? (
            <div className="relative">
              <img
                src={formData.idCardImage}
                alt="ID Card"
                className="max-h-64 mx-auto rounded-xl"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold">
                  کلیک کنید تا تغییر دهید
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-[#535353] mx-auto mb-4 group-hover:text-[#1DB954] transition-colors" />
              <p className="text-white font-semibold mb-2">
                تصویر کارت ملی خود را بارگذاری کنید *
              </p>
              <p className="text-[#535353] text-sm">
                فرمت‌های مجاز: JPG, PNG - حداکثر 5MB
              </p>
            </div>
          )}
        </div>
        {errors.idCardImage && (
          <p className="text-red-500 text-sm mt-2">{errors.idCardImage}</p>
        )}

        <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl p-2 md:p-4 mt-4">
          <p className="text-[#1DB954] text-sm font-medium">
            ⚠️ تصویر کارت ملی باید واضح و خوانا باشد. این مدرک برای احراز هویت و
            تأیید مالکیت حساب هنری شما استفاده می‌شود.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-2 md:pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-bold py-3 px-8 md:py-4 md:px-12 rounded-full hover:shadow-2xl hover:shadow-[#1DB954]/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              در حال ارسال...
            </div>
          ) : (
            "ارسال درخواست احراز مالکیت"
          )}
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1db954;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #1ed760;
        }
      `}</style>
    </form>
  );
};

export default ExistingArtistTab;
