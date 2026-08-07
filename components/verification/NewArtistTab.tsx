import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import {
  Upload,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  IdCard,
  Camera,
} from "lucide-react";
import { useImageCropper } from "../../contexts/ImageCropperContext";

const DatePicker = dynamic(() => import("react-multi-date-picker"), {
  ssr: false,
});

interface NewArtistTabProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

interface FormData {
  firstName: string;
  firstNameEn: string;
  lastName: string;
  lastNameEn: string;
  artisticName: string;
  artisticNameEn: string;
  birthDate: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  city: string;
  address: string;
  bio: string;
  bioEn: string;
  idCardImage: string | null;
  idCardFile: File | null;
  profileImage: string | null;
  profileFile: File | null;
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
  "کردستان",
  "بجنورد",
  "یاسوج",
  "نقده",
  "فسا",
  "نجف‌آباد",
];

const NewArtistTab: React.FC<NewArtistTabProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const { cropImage } = useImageCropper();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    firstNameEn: "",
    lastName: "",
    lastNameEn: "",
    artisticName: "",
    artisticNameEn: "",
    birthDate: "",
    nationalId: "",
    phoneNumber: "",
    email: "",
    city: "",
    address: "",
    bio: "",
    bioEn: "",
    idCardImage: null,
    idCardFile: null,
    profileImage: null,
    profileFile: null,
  });

  // Store jalali display string (e.g. ۱۴۰۰/۰۱/۰۱) while sending gregorian ISO in formData.birthDate
  const [jalaliBirth, setJalaliBirth] = useState<string>("");

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

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

  const isFormValid = useMemo(() => {
    const f = formData;
    const nationalValid = /^\d{10}$/.test(f.nationalId);
    const phoneValid = /^09\d{9}$/.test(f.phoneNumber);
    return (
      f.firstName.trim().length > 0 &&
      f.firstNameEn.trim().length > 0 &&
      f.lastName.trim().length > 0 &&
      f.lastNameEn.trim().length > 0 &&
      f.artisticName.trim().length > 0 &&
      f.artisticNameEn.trim().length > 0 &&
      f.birthDate &&
      nationalValid &&
      phoneValid &&
      f.city.trim().length > 0 &&
      !!f.idCardImage
    );
  }, [formData]);

  const previewUrlsRef = useRef<{ profile?: string; idCard?: string }>({});

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "idCard" | "profile",
  ) => {
    const input = e.currentTarget;
    const sourceFile = input.files?.[0];
    input.value = "";
    if (!sourceFile) return;

    const errorKey = type === "idCard" ? "idCardImage" : "profileImage";
    const fileKey = type === "idCard" ? "idCardFile" : "profileFile";
    const previewKey = type === "idCard" ? "idCardImage" : "profileImage";
    const isProfile = type === "profile";

    const result = await cropImage(sourceFile, {
      mode: isProfile ? "square" : "free",
      title: isProfile ? "برش تصویر پروفایل هنرمند" : "تنظیم تصویر کارت ملی",
      description: isProfile
        ? "تصویر پروفایل مربعی ذخیره می‌شود. چهره را داخل محدوده مناسب قرار دهید."
        : "به‌صورت پیش‌فرض کل کارت حفظ می‌شود. فقط در صورت نیاز حاشیه‌های اضافی را برش دهید و اطلاعات کارت را حذف نکنید.",
      maxSourceBytes: 25 * 1024 * 1024,
      maxOutputBytes: 4.8 * 1024 * 1024,
      maxOutputDimension: isProfile ? 1800 : 3000,
      acceptedTypes: ["image/jpeg", "image/png"],
      outputTypes: ["image/jpeg", "image/png"],
    });
    if (!result) return;

    const previousUrl = previewUrlsRef.current[type];
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    const previewUrl = URL.createObjectURL(result.file);
    previewUrlsRef.current[type] = previewUrl;
    setFormData((prev) => ({ ...prev, [fileKey]: result.file, [previewKey]: previewUrl }));
    setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "نام فارسی الزامی است";
    if (!formData.firstNameEn.trim()) newErrors.firstNameEn = "نام انگلیسی الزامی است";
    if (!formData.lastName.trim()) newErrors.lastName = "نام خانوادگی فارسی الزامی است";
    if (!formData.lastNameEn.trim()) newErrors.lastNameEn = "نام خانوادگی انگلیسی الزامی است";
    if (!formData.artisticName.trim()) newErrors.artisticName = "نام هنری فارسی الزامی است";
    if (!formData.artisticNameEn.trim()) newErrors.artisticNameEn = "نام هنری انگلیسی الزامی است";
    if (!formData.birthDate) newErrors.birthDate = "تاریخ تولد الزامی است";
    if (!formData.nationalId.trim()) newErrors.nationalId = "کد ملی الزامی است";
    else if (!/^\d{10}$/.test(formData.nationalId))
      newErrors.nationalId = "کد ملی باید 10 رقم باشد";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "شماره موبایل الزامی است";
    else if (!/^09\d{9}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "شماره موبایل معتبر نیست";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "ایمیل معتبر نیست";
    }
    if (!formData.city.trim()) newErrors.city = "شهر فارسی الزامی است";
    if (!formData.idCardImage)
      newErrors.idCardImage = "تصویر کارت ملی الزامی است";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Image Upload */}
      <div className="flex justify-center mb-4 md:mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1DB954] to-[#1ed760] p-1">
            <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="پروفایل هنرمند"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-[#535353]" />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg hover:bg-[#1ed760] transition-all hover:scale-110"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <input
            ref={profileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={(e) => handleImageUpload(e, "profile")}
            className="hidden"
          />
        </div>
        {errors.profileImage && (
          <p className="mt-2 text-center text-xs text-red-500">{errors.profileImage}</p>
        )}
      </div>

      {/* Personal Information Section */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-[#1DB954]" />
          </div>
          اطلاعات شخصی
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام (فارسی) *</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${errors.firstName ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام فارسی" />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام انگلیسی (انگلیسی) *</label>
            <input type="text" name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} dir="ltr"
              className={`w-full bg-[#0a0a0a] border ${errors.firstNameEn ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام انگلیسی" />
            {errors.firstNameEn && <p className="text-red-500 text-xs mt-1">{errors.firstNameEn}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام خانوادگی (فارسی) *</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${errors.lastName ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام خانوادگی فارسی" />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام خانوادگی انگلیسی (انگلیسی) *</label>
            <input type="text" name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} dir="ltr"
              className={`w-full bg-[#0a0a0a] border ${errors.lastNameEn ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام خانوادگی انگلیسی" />
            {errors.lastNameEn && <p className="text-red-500 text-xs mt-1">{errors.lastNameEn}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام هنری (فارسی) *</label>
            <input type="text" name="artisticName" value={formData.artisticName} onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${errors.artisticName ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام هنری فارسی" />
            {errors.artisticName && <p className="text-red-500 text-xs mt-1">{errors.artisticName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">نام هنری انگلیسی (انگلیسی) *</label>
            <input type="text" name="artisticNameEn" value={formData.artisticNameEn} onChange={handleChange} dir="ltr"
              className={`w-full bg-[#0a0a0a] border ${errors.artisticNameEn ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام هنری انگلیسی" />
            {errors.artisticNameEn && <p className="text-red-500 text-xs mt-1">{errors.artisticNameEn}</p>}
          </div>

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
                } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors`}
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
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="کد ملی 10 رقمی"
            />
            {errors.nationalId && (
              <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              شماره موبایل *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={11}
              inputMode="numeric"
              className={`w-full bg-[#0a0a0a] border ${
                errors.phoneNumber ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="09123456789"
              dir="ltr"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              ایمیل (اختیاری)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.email ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="example@email.com"
              dir="ltr"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> شهر *
            </label>
            <div className="relative">
              <select name="city" value={formData.city} onChange={handleChange} dir="rtl"
                className={`appearance-none w-full bg-[#0a0a0a] border ${errors.city ? "border-red-500" : "border-[#282828]"} rounded-xl px-3 py-2 md:px-4 md:py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors`}>
                <option value="">انتخاب شهر</option>
                {IRAN_CITIES_FA.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#535353]">▼</div>
            </div>
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">آدرس (اختیاری)</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange}
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors"
              placeholder="آدرس کامل محل سکونت" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">بیوگرافی هنری (فارسی، اختیاری)</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4}
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
              placeholder="در مورد فعالیت‌های هنری خود بنویسید..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">زندگی‌نامه انگلیسی هنرمند (اختیاری)</label>
            <textarea name="bioEn" value={formData.bioEn} onChange={handleChange} rows={4} dir="ltr"
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
              placeholder="درباره فعالیت هنری خود به انگلیسی بنویسید…" />
          </div>
        </div>
      </div>

      {/* ID Card Upload Section */}
      <div className="bg-[#121212] rounded-2xl p-3 md:p-6 border border-[#282828]">
        <h3 className="text-xl font-bold text-white mb-3 md:mb-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1DB954]/20 rounded-lg flex items-center justify-center">
            <IdCard className="w-5 h-5 text-[#1DB954]" />
          </div>
          احراز هویت با کارت ملی
        </h3>

        <div className="space-y-4">
          <div
            onClick={() => idCardInputRef.current?.click()}
            className={`border-2 border-dashed ${
              errors.idCardImage ? "border-red-500" : "border-[#282828]"
            } rounded-2xl p-4 md:p-8 cursor-pointer hover:border-[#1DB954] transition-all group bg-[#0a0a0a]`}
          >
            <input
              ref={idCardInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={(e) => handleImageUpload(e, "idCard")}
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
            <p className="text-red-500 text-sm">{errors.idCardImage}</p>
          )}

          <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl p-2 md:p-4">
            <p className="text-[#1DB954] text-sm font-medium">
              ⚠️ لطفاً مطمئن شوید که تصویر کارت ملی واضح و خوانا باشد. این تصویر
              برای احراز هویت شما استفاده خواهد شد.
            </p>
          </div>
        </div>
      </div>

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
            "ارسال درخواست احراز هویت"
          )}
        </button>
      </div>
    </form>
  );
};

export default NewArtistTab;
