import React, { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const DatePicker = dynamic(() => import("react-multi-date-picker"), {
  ssr: false,
});
import { Search, Upload, Calendar, IdCard, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiRequest, getApiErrorMessage, unwrapList } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { useImageCropper } from "../../contexts/ImageCropperContext";

interface ExistingArtistTabProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

interface Artist {
  id: number | string;
  name: string;
  artistic_name?: string;
  profile_image: string | null;
  verified: boolean;
  genres?: string[];
}

interface FormData {
  selectedArtist: Artist | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  birthDate: string;
  nationalId: string;
  idCardImage: string | null;
  idCardFile: File | null;
  additionalInfo: string;
}

// لیست شهرهای ایران (فارسی)
const IRAN_CITIES_FA = [
  "تهران",
  "مشهد",
  "اصفهان",
  "کرج",
  "تبریز",
  "شیراز",
  "قم",
  "اهواز",
  "کرمانشاه",
  "رشت",
  "کرمان",
  "ارومیه",
  "ساری",
  "زنجان",
  "سنندج",
  "یزد",
  "بندرعباس",
  "بوشهر",
  "همدان",
  "قزوین",
  "سمنان",
  "زاهدان",
  "بیرجند",
  "گرگان",
  "بابل",
  "اراک",
  "شهرکرد",
  "خرم‌آباد",
  "سیرجان",
  "قائن",
  "نیشابور",
  "مراغه",
  "بجنورد",
  "یاسوج",
  "نجف‌آباد",
];

// Returns a data-URL SVG placeholder when an artist has no profile image
const getArtistPlaceholder = (artist: Artist) => {
  const name = (artist.artistic_name || artist.name || "A").trim();
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = "#0a0a0a";
  const accent = "#1DB954";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='100%' height='100%' fill='${bg}'/><circle cx='200' cy='120' r='72' fill='${accent}' opacity='0.15'/><text x='50%' y='55%' font-size='140' fill='${accent}' font-family='Inter, Roboto, Arial, Helvetica, sans-serif' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text><text x='50%' y='78%' font-size='20' fill='#B3B3B3' font-family='Inter, Roboto, Arial, Helvetica, sans-serif' dominant-baseline='middle' text-anchor='middle'>Artist</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const getValidationErrors = (formData: FormData): Partial<Record<keyof FormData, string>> => {
  const newErrors: Partial<Record<keyof FormData, string>> = {};

  if (!formData.selectedArtist)
    newErrors.selectedArtist = "انتخاب هنرمند الزامی است";
  if (!formData.firstName.trim()) newErrors.firstName = "نام الزامی است";
  if (!formData.lastName.trim()) newErrors.lastName = "نام خانوادگی الزامی است";
  if (!formData.phoneNumber.trim())
    newErrors.phoneNumber = "شماره موبایل الزامی است";
  else if (!/^09\d{9}$/.test(formData.phoneNumber))
    newErrors.phoneNumber = "شماره موبایل معتبر نیست";
  if (!formData.city.trim()) newErrors.city = "شهر الزامی است";
  if (!formData.birthDate) newErrors.birthDate = "تاریخ تولد الزامی است";
  if (!formData.nationalId.trim()) newErrors.nationalId = "کد ملی الزامی است";
  else if (!/^\d{10}$/.test(formData.nationalId))
    newErrors.nationalId = "کد ملی باید ۱۰ رقم باشد";
  if (!formData.idCardImage) newErrors.idCardImage = "تصویر کارت ملی الزامی است";

  return newErrors;
};

const ExistingArtistTab: React.FC<ExistingArtistTabProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const { showToast } = useToast();
  const { cropImage } = useImageCropper();
  const [formData, setFormData] = useState<FormData>({
    selectedArtist: null,
    firstName: "",
    lastName: "",
    phoneNumber: "",
    city: "",
    birthDate: "",
    nationalId: "",
    idCardImage: null,
    idCardFile: null,
    additionalInfo: "",
  });

  // Jalali display value while keeping gregorian ISO in formData.birthDate
  const [jalaliBirth, setJalaliBirth] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const idCardInputRef = useRef<HTMLInputElement>(null);

  // Search Artists with Debounce
  React.useEffect(() => {
    const fetchArtists = async () => {
      if (!searchQuery.trim()) {
        setArtists([]);
        return;
      }

      setIsSearching(true);
      try {
        const data = await apiRequest<Artist[] | { results?: Artist[] }>("/artists/", {
          auth: false,
          query: { q: searchQuery.trim(), unlinked: true },
        });
        setArtists(unwrapList(data));
      } catch (error) {
        setArtists([]);
        showToast(getApiErrorMessage(error, "جست‌وجوی هنرمندان انجام نشد."), "error");
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchArtists();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, showToast]);

  const handleArtistSelect = (artist: Artist) => {
    setFormData((prev) => ({ ...prev, selectedArtist: artist }));
    setShowDropdown(false);
    setSearchQuery("");
    if (errors.selectedArtist) {
      setErrors((prev) => ({ ...prev, selectedArtist: undefined }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name } = e.target;
    let { value } = e.target as HTMLInputElement;

    // Normalize numeric-only fields
    if (name === "nationalId") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 11);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validationErrors = useMemo(() => getValidationErrors(formData), [formData]);
  const submissionBlockers = useMemo(
    () => Object.values(validationErrors).filter((message): message is string => Boolean(message)),
    [validationErrors],
  );
  const isFormValid = submissionBlockers.length === 0;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const sourceFile = input.files?.[0];
    input.value = "";
    if (!sourceFile) return;

    const result = await cropImage(sourceFile, {
      mode: "free",
      title: "تنظیم تصویر کارت ملی",
      description: "کل کارت به‌صورت پیش‌فرض داخل قاب قرار می‌گیرد. فقط حاشیه‌های اضافی را برش دهید و هیچ بخش اطلاعاتی را حذف نکنید.",
      maxSourceBytes: 25 * 1024 * 1024,
      maxOutputBytes: 4.8 * 1024 * 1024,
      maxOutputDimension: 3000,
      acceptedTypes: ["image/jpeg", "image/png"],
      outputTypes: ["image/jpeg", "image/png"],
    });
    if (!result) return;

    setFormData((prev) => ({ ...prev, idCardFile: result.file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, idCardImage: reader.result as string }));
      setErrors((prev) => ({ ...prev, idCardImage: undefined }));
    };
    reader.readAsDataURL(result.file);
  };

  const validateForm = (): boolean => {
    setErrors(validationErrors);
    return isFormValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
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
                  src={
                    formData.selectedArtist.profile_image ||
                    getArtistPlaceholder(formData.selectedArtist)
                  }
                  alt={
                    formData.selectedArtist.artistic_name ||
                    formData.selectedArtist.name
                  }
                  className="w-20 h-20 rounded-full border-4 border-[#1DB954] object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-bold text-xl">
                      {formData.selectedArtist.artistic_name ||
                        formData.selectedArtist.name}
                    </h4>
                    {formData.selectedArtist.verified && (
                      <CheckCircle2 className="w-6 h-6 text-[#1DB954]" />
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {formData.selectedArtist.artistic_name && (
                      <span className="bg-[#1DB954]/30 text-[#1DB954] px-3 py-1 rounded-full text-sm font-semibold">
                        {formData.selectedArtist.name}
                      </span>
                    )}
                    {(formData.selectedArtist.genres || []).map((genre) => (
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

            {showDropdown && (searchQuery || isSearching) && (
              <div className="absolute z-10 w-full mt-2 bg-[#181818] border border-[#282828] rounded-2xl shadow-2xl max-h-96 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1DB954]"></div>
                    <p className="text-[#B3B3B3] mt-2">در حال جستجو...</p>
                  </div>
                ) : artists.length > 0 ? (
                  artists.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => handleArtistSelect(artist)}
                      className="w-full flex items-center gap-4 p-3 md:p-4 hover:bg-[#282828] transition-colors border-b border-[#282828] last:border-b-0"
                    >
                      <img
                        src={
                          artist.profile_image || getArtistPlaceholder(artist)
                        }
                        alt={artist.artistic_name || artist.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-semibold">
                            {artist.artistic_name || artist.name}
                          </h4>
                          {artist.verified && (
                            <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {artist.artistic_name && (
                            <span className="text-[#B3B3B3] text-xs">
                              {artist.name}
                            </span>
                          )}
                          {(artist.genres || []).map((genre) => (
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

      {/* Personal Information */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#1DB954]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          اطلاعات شخصی
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              نام *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.firstName ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام خود را وارد کنید"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              نام خانوادگی *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.lastName ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام خانوادگی خود را وارد کنید"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              شماره موبایل *
            </label>
            <input
              type="tel"
              name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                inputMode="numeric"
              maxLength={11}
              className={`w-full bg-[#0a0a0a] border ${
                errors.phoneNumber ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="09123456789"
              dir="ltr"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              شهر *
            </label>
            <div className="relative">
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                dir="rtl"
                className={`appearance-none w-full bg-[#0a0a0a] border ${
                  errors.city ? "border-red-500" : "border-[#282828]"
                } rounded-xl px-4 py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              >
                <option value="">انتخاب شهر</option>
                {IRAN_CITIES_FA.map((c) => (
                  <option key={c} value={c} className="text-right">
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute left-3 top-1/2 transform -translate-y-1/2 text-[#535353]">
                ▼
              </div>
            </div>
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>
        </div>
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
            <div>
              <DatePicker
                value={jalaliBirth}
                onChange={(date: any) => {
                  if (!date) {
                    setJalaliBirth("");
                    setFormData((prev) => ({ ...prev, birthDate: "" }));
                    return;
                  }
                  try {
                    const greg = date.toDate();
                    const iso = greg.toISOString().split("T")[0];
                    setFormData((prev) => ({ ...prev, birthDate: iso }));
                    setJalaliBirth(date.format("YYYY/MM/DD"));
                    if (errors.birthDate) {
                      setErrors((prev) => ({ ...prev, birthDate: undefined }));
                    }
                  } catch (err) {
                    console.error("Failed to parse date:", err);
                  }
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                className="w-full"
                inputClass={`w-full bg-[#0a0a0a] border ${
                  errors.birthDate ? "border-red-500" : "border-[#282828]"
                } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors`}
                calendarPosition="bottom-right"
              />
            </div>
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
              inputMode="numeric"
              pattern="\d*"
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
                alt="مدرک شناسایی"
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
                فرمت‌های مجاز: JPG یا PNG ـ حداکثر ۵ مگابایت
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

      {submissionBlockers.length > 0 && (
        <div
          className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-3 md:p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-amber-200">
                  برای ارسال درخواست، این موارد را تکمیل کنید
                </p>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                  {submissionBlockers.length} مورد
                </span>
              </div>
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-xs text-[#d6d6d6] sm:grid-cols-2">
                {submissionBlockers.map((blocker) => (
                  <li key={blocker} className="flex items-start gap-2 leading-5">
                    <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                    <span>{blocker}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-2 md:pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] text-white font-bold py-3 px-8 md:py-4 md:px-12 rounded-full hover:shadow-2xl hover:shadow-[#1DB954]/50 transition-all duration-300 hover:scale-105 disabled:filter disabled:grayscale disabled:brightness-75 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 text-lg"
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
