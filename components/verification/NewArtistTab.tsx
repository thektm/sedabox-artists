import React, { useState, useRef } from "react";
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

interface NewArtistTabProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  artisticName: string;
  birthDate: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  city: string;
  address: string;
  bio: string;
  idCardImage: string | null;
  profileImage: string | null;
}

const NewArtistTab: React.FC<NewArtistTabProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    artisticName: "",
    birthDate: "",
    nationalId: "",
    phoneNumber: "",
    email: "",
    city: "",
    address: "",
    bio: "",
    idCardImage: null,
    profileImage: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "idCard" | "profile"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          [type === "idCard" ? "idCardImage" : "profileImage"]: result,
        }));
        if (errors[type === "idCard" ? "idCardImage" : "profileImage"]) {
          setErrors((prev) => ({
            ...prev,
            [type === "idCard" ? "idCardImage" : "profileImage"]: undefined,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "نام الزامی است";
    if (!formData.lastName.trim())
      newErrors.lastName = "نام خانوادگی الزامی است";
    if (!formData.artisticName.trim())
      newErrors.artisticName = "نام هنری الزامی است";
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
    if (!formData.city.trim()) newErrors.city = "شهر الزامی است";
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
                  alt="Profile"
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
            accept="image/*"
            onChange={(e) => handleImageUpload(e, "profile")}
            className="hidden"
          />
        </div>
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
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
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
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام خانوادگی خود را وارد کنید"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              نام هنری *
            </label>
            <input
              type="text"
              name="artisticName"
              value={formData.artisticName}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.artisticName ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="نام هنری خود را وارد کنید"
            />
            {errors.artisticName && (
              <p className="text-red-500 text-xs mt-1">{errors.artisticName}</p>
            )}
          </div>

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
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white focus:outline-none focus:border-[#1DB954] transition-colors`}
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
              <MapPin className="w-4 h-4" />
              شهر *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full bg-[#0a0a0a] border ${
                errors.city ? "border-red-500" : "border-[#282828]"
              } rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors`}
              placeholder="شهر محل سکونت"
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              آدرس (اختیاری)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors"
              placeholder="آدرس کامل محل سکونت"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#B3B3B3] mb-1 md:mb-2">
              بیوگرافی هنری (اختیاری)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[#0a0a0a] border border-[#282828] rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-[#535353] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
              placeholder="در مورد فعالیت‌های هنری خود بنویسید..."
            />
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
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "idCard")}
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
            "ارسال درخواست احراز هویت"
          )}
        </button>
      </div>
    </form>
  );
};

export default NewArtistTab;
