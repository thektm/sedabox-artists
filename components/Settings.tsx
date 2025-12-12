import React, { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Instagram, Twitter, Youtube, MessageCircle } from "lucide-react";

interface SocialLinks {
  instagram: string;
  twitter: string;
  youtube: string;
  telegram: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "social" | "media" | "security"
  >("profile");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    artistName: user?.artistName || "",
    bio: "",
    email: user?.email || "",
    location: "",
  });

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    twitter: "",
    youtube: "",
    telegram: "",
  });

  // Media State
  const [profileImage, setProfileImage] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string>("");

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Password Modal State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === "profile") setProfileImage(result);
        else if (type === "cover") setCoverImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSuccessMessage("تغییرات با موفقیت ذخیره شد");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveSocial = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSuccessMessage("لینک‌های شبکه‌های اجتماعی ذخیره شد");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveMedia = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSuccessMessage("تصاویر با موفقیت ذخیره شد");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("رمز عبور جدید و تکرار آن مطابقت ندارند");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("رمز عبور باید حداقل 8 کاراکتر باشد");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setShowPasswordModal(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSuccessMessage("رمز عبور با موفقیت تغییر یافت");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const tabs = [
    { id: "profile" as const, label: "ویرایش پروفایل", icon: "👤" },
    { id: "social" as const, label: "شبکه‌های اجتماعی", icon: "🔗" },
    { id: "media" as const, label: "بنر و کاور", icon: "🖼️" },
    { id: "security" as const, label: "امنیت", icon: "🔒" },
  ];

  const socialPlatforms = [
    {
      key: "instagram" as keyof SocialLinks,
      label: "اینستاگرام",
      icon: Instagram,
      placeholder: "https://instagram.com/username",
      color: "from-purple-500 to-pink-500",
    },
    {
      key: "twitter" as keyof SocialLinks,
      label: "توییتر",
      icon: Twitter,
      placeholder: "https://twitter.com/username",
      color: "from-blue-400 to-blue-600",
    },
    {
      key: "youtube" as keyof SocialLinks,
      label: "یوتیوب",
      icon: Youtube,
      placeholder: "https://youtube.com/@username",
      color: "from-red-500 to-red-700",
    },
    {
      key: "telegram" as keyof SocialLinks,
      label: "تلگرام",
      icon: MessageCircle,
      placeholder: "https://t.me/username",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-full w-full pc-compact" dir="rtl">
      {/* Premium Header with Gradient */}
      <div className="relative bg-gradient-to-br from-[#1DB954] via-[#1ed760] to-[#1DB954] px-4 lg:px-8 py-4 lg:py-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                تنظیمات هنرمند
              </h1>
              <p className="text-white/90 text-base mt-1 font-medium">
                مدیریت پروفایل و تنظیمات حساب کاربری
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease-out]">
          <div className="bg-[#1DB954] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-sm">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Tabs - Spotify Style */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-lg scale-105"
                  : "bg-[#181818] text-[#B3B3B3] hover:bg-[#282828] hover:text-white hover:scale-102"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4 lg:space-y-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="bg-[#181818] rounded-2xl p-4 lg:p-8 border border-[#282828]">
              <h2 className="text-2xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center">
                  👤
                </span>
                اطلاعات شخصی
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    نام کامل
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                    placeholder="نام و نام خانوادگی"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    نام هنری
                  </label>
                  <input
                    type="text"
                    value={profileData.artistName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        artistName: e.target.value,
                      })
                    }
                    className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                    placeholder="نام هنری شما"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    موقعیت مکانی
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        location: e.target.value,
                      })
                    }
                    className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                    placeholder="تهران، ایران"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-white mb-2">
                  بیوگرافی هنری
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={5}
                  className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all resize-none"
                  placeholder="درباره خود و فعالیت‌های هنری‌تان بنویسید..."
                />
                <p className="text-xs text-[#6A6A6A] mt-2">
                  حداکثر 500 کاراکتر
                </p>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>ذخیره تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Links Tab */}
        {activeTab === "social" && (
          <div className="space-y-4 lg:space-y-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="bg-[#181818] rounded-2xl p-4 lg:p-8 border border-[#282828]">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  🔗
                </span>
                لینک شبکه‌های اجتماعی
              </h2>
              <p className="text-[#B3B3B3] mb-8">
                پروفایل‌های خود را در پلتفرم‌های مختلف متصل کنید
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {socialPlatforms.map((platform) => (
                  <div key={platform.key} className="group">
                    <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <platform.icon className="w-5 h-5" />
                      {platform.label}
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={socialLinks[platform.key]}
                        onChange={(e) =>
                          setSocialLinks({
                            ...socialLinks,
                            [platform.key]: e.target.value,
                          })
                        }
                        className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                        placeholder={platform.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#121212] rounded-xl border border-[#282828]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">نکته مهم</h3>
                    <p className="text-sm text-[#B3B3B3]">
                      لینک‌های شبکه‌های اجتماعی شما در پروفایل عمومی نمایش داده
                      می‌شوند و به طرفداران کمک می‌کند تا شما را در پلتفرم‌های
                      مختلف دنبال کنند.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSocial}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>ذخیره تغییرات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === "media" && (
          <div className="space-y-4 lg:space-y-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Profile Image */}
            <div className="bg-[#181818] rounded-2xl p-4 lg:p-8 border border-[#282828]">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  📸
                </span>
                تصویر پروفایل
              </h2>
              <p className="text-[#B3B3B3] mb-4 lg:mb-6">
                تصویری که در کنار نام شما نمایش داده می‌شود
              </p>

              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#1DB954] to-[#1ed760] p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl">👤</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "profile")}
                    className="hidden"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">راهنما:</h3>
                  <ul className="text-sm text-[#B3B3B3] space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></span>
                      حداقل ابعاد: 400x400 پیکسل
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></span>
                      فرمت‌های پشتیبانی شده: JPG, PNG
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></span>
                      حداکثر حجم: 5MB
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-[#181818] rounded-2xl p-4 lg:p-8 border border-[#282828]">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  🖼️
                </span>
                کاور هنرمند
              </h2>
              <p className="text-[#B3B3B3] mb-4 lg:mb-6">
                تصویر پس‌زمینه صفحه پروفایل شما
              </p>

              <div className="relative group">
                <div className="w-full h-64 rounded-xl bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 overflow-hidden shadow-2xl">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl opacity-50">🎨</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-black transition-all shadow-lg"
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-semibold">آپلود کاور</span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "cover")}
                  className="hidden"
                />
              </div>

              <div className="mt-4 text-sm text-[#B3B3B3]">
                <p>ابعاد پیشنهادی: 1600x400 پیکسل</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveMedia}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>ذخیره تصاویر</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-4 lg:space-y-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="bg-[#181818] rounded-2xl p-4 lg:p-8 border border-[#282828]">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  🔒
                </span>
                امنیت حساب کاربری
              </h2>
              <p className="text-[#B3B3B3] mb-6 lg:mb-8">
                مدیریت رمز عبور و تنظیمات امنیتی
              </p>

              {/* Password Section */}
              <div className="p-4 lg:p-6 bg-[#121212] rounded-xl border border-[#282828] mb-4 lg:mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="w-6 h-6 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-1">رمز عبور</h3>
                      <p className="text-sm text-[#B3B3B3]">
                        آخرین تغییر: 3 ماه پیش
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-white text-black text-sm font-bold px-6 py-3 rounded-full hover:bg-[#B3B3B3] transition-all shadow-lg hover:scale-105 whitespace-nowrap"
                  >
                    تغییر رمز عبور
                  </button>
                </div>
              </div>

              {/* Two Factor Authentication */}
              <div className="p-4 lg:p-6 bg-[#121212] rounded-xl border border-[#282828] mb-4 lg:mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-1">
                        احراز هویت دو مرحله‌ای
                      </h3>
                      <p className="text-sm text-[#B3B3B3]">
                        امنیت بیشتر با کد تایید پیامکی
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-14 h-7 bg-[#282828] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1DB954]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1DB954]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div
            className="bg-[#181818] rounded-2xl p-8 max-w-md w-full border border-[#282828] animate-[slideUp_0.3s_ease-out]"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center">
                  🔑
                </span>
                تغییر رمز عبور
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
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

            {passwordError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-400">{passwordError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  رمز عبور فعلی
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                  placeholder="رمز عبور فعلی خود را وارد کنید"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  رمز عبور جدید
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                  placeholder="رمز عبور جدید (حداقل 8 کاراکتر)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  تکرار رمز عبور جدید
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#121212] border border-[#282828] rounded-lg px-4 py-3 text-white placeholder-[#6A6A6A] focus:border-[#1DB954] focus:outline-none focus:ring-2 focus:ring-[#1DB954]/20 transition-all"
                  placeholder="رمز عبور جدید را مجددا وارد کنید"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">نکات امنیتی:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• حداقل 8 کاراکتر</li>
                    <li>• ترکیبی از حروف بزرگ و کوچک</li>
                    <li>• شامل اعداد و کاراکترهای خاص</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleChangePassword}
                disabled={
                  isSaving ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
                className="flex-1 bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954] text-white font-bold px-6 py-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>در حال تغییر...</span>
                  </>
                ) : (
                  <span>تغییر رمز عبور</span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="px-6 py-3 bg-[#282828] text-white font-bold rounded-full hover:bg-[#3E3E3E] transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Settings;
