import React, { useState, useEffect, useRef } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import ConfirmModal from "./ConfirmModal";

const TopNav: React.FC = () => {
  const { currentPage, navigateTo } = useNavigation();
  const { user, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const showMobileLayout = isMobile || isTablet;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Notifications
  type Notification = {
    id: string;
    title: string;
    body?: string;
    read?: boolean;
  };
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "آلبوم شما تأیید و منتشر شد",
      body: "آلبوم جدید شما اکنون در دسترس عموم قرار گرفته است",
    },
    {
      id: "2",
      title: "13 لایک جدید روی آهنگ X",
      body: "کاربران بیشتری آهنگ شما را پسندیده‌اند",
    },
    {
      id: "3",
      title: "12 دنبال‌کننده جدید",
      body: "کاربران جدیدی شما را دنبال کرده‌اند",
    },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [showNotifications, setShowNotifications] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const removingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!showNotifications) return;
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showNotifications]);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPage]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleSettingsClick = () => {
    navigateTo("settings");
  };

  const handleLogout = () => {
    // show confirmation modal instead of immediate logout
    setShowConfirm(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const confirmLogout = () => {
    setShowConfirm(false);
    logout();
    navigateTo("login");
  };

  const toggleNotifications = (e?: React.MouseEvent) => {
    if (e) {
      const ex = (e as React.MouseEvent).clientX;
      const ey = (e as React.MouseEvent).clientY;
      // compute a preferred x/y and ensure the panel stays on screen
      const margin = 12;
      const panelW = 360; // desired panel width for desktop
      let x = ex;
      let y = ey + 8; // slightly below cursor
      if (x + panelW + margin > window.innerWidth) {
        x = window.innerWidth - panelW - margin;
      }
      if (x < margin) x = margin;
      if (y + 300 > window.innerHeight) {
        y = window.innerHeight - 300 - margin;
      }
      setPanelPosition({ x, y });
    } else {
      setPanelPosition(null);
    }
    setShowNotifications((s) => !s);
  };

  const markRead = (id: string) => {
    // animate out then remove
    removingRef.current[id] = true;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      delete removingRef.current[id];
    }, 350); // match CSS transition
  };

  if (showMobileLayout) {
    // Mobile/Tablet Top Navigation
    return (
      <>
        <div
          className="sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur-md border-b border-[#282828]"
          dir="rtl"
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SedaBox" className="h-8 w-8" />
              <div>
                <h1 className="text-white font-bold text-sm">صدا باکس</h1>
                <p className="text-[#B3B3B3] text-xs">داشبورد هنرمند</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications Button (mobile) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotifications(e);
                }}
                className="w-10 h-10 flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-all duration-200 relative"
                aria-label="اعلان‌ها"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#1DB954] rounded-full border-2 border-[#121212]"></span>
                )}
              </button>

              {/* Settings Button */}
              <button
                onClick={handleSettingsClick}
                className="w-10 h-10 flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-all duration-200 group"
                aria-label="تنظیمات"
              >
                <svg
                  className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
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
              </button>

              {/* Burger Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#282828] rounded-lg transition-all duration-200"
                aria-label="منو"
              >
                <div className="w-6 h-5 relative flex flex-col justify-between">
                  <span
                    className={`w-full h-0.5 bg-current transform transition-all duration-300 origin-center ${
                      isMenuOpen ? "rotate-45 translate-y-2" : ""
                    }`}
                  ></span>
                  <span
                    className={`w-full h-0.5 bg-current transition-all duration-300 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  ></span>
                  <span
                    className={`w-full h-0.5 bg-current transform transition-all duration-300 origin-center ${
                      isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Notification Panel */}
        {showNotifications && (
          <div
            ref={panelRef}
            className="fixed left-4 right-4 top-20 max-w-[calc(100%-32px)] mx-auto bg-[#0f0f0f] border border-[#282828] rounded-xl z-60 shadow-xl transition-transform duration-300 pc-compact"
            dir="rtl"
          >
            <div className="px-4 py-3 border-b border-[#282828] flex items-center justify-between">
              <h3 className="text-white font-bold">اعلان‌ها</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-[#B3B3B3] hover:text-white"
                aria-label="بستن اعلان‌ها"
              >
                ✕
              </button>
            </div>
            <div className="max-h-72 overflow-auto p-3 space-y-2">
              {notifications.length === 0 && (
                <p className="text-[#B3B3B3] text-sm">اعلانی وجود ندارد</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 bg-[#121212] p-3 rounded-lg transition-all duration-300 ${
                    removingRef.current[n.id]
                      ? "translate-x-6 opacity-0 h-0 p-0 overflow-hidden"
                      : "opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!n.read}
                    onChange={() => markRead(n.id)}
                    className="mt-1"
                    aria-label={`mark-${n.id}`}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[#B3B3B3] text-xs">{n.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Mobile Slide-in Menu */}
        <div
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#121212] z-50 transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          dir="rtl"
        >
          {/* Menu Header */}
          <div className="p-6 border-b border-[#282828]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SedaBox" className="h-10 w-10" />
                <div>
                  <h2 className="text-white font-bold text-lg">صدا باکس</h2>
                  <p className="text-[#B3B3B3] text-xs">داشبورد هنرمند</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-all duration-200"
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

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {[
                { id: "home", label: "خانه", icon: "🏠" },
                { id: "songs", label: "مدیریت آهنگ‌ها", icon: "🎵" },
                { id: "albums", label: "مدیریت آلبوم‌ها", icon: "💿" },
                { id: "analytics", label: "تحلیل و آمار", icon: "📊" },
                { id: "financial", label: "گزارش مالی", icon: "💰" },
                { id: "settings", label: "تنظیمات", icon: "⚙️" },
                { id: "terms", label: "شرایط و ضوابط", icon: "📄" },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                      currentPage === item.id
                        ? "bg-[#1DB954] text-black"
                        : "text-[#B3B3B3] hover:text-white hover:bg-[#282828]"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-bold text-base">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-[#282828]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[#B3B3B3] hover:text-white hover:bg-[#282828] transition-all duration-200"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-bold text-base">خروج از حساب</span>
            </button>
          </div>
          <ConfirmModal
            open={showConfirm}
            title="خروج از حساب کاربری"
            description="آیا از خروج از حساب کاربری مطمئن هستید؟"
            confirmLabel="بله، خروج"
            cancelLabel="خیر، بازگشت"
            onCancel={() => setShowConfirm(false)}
            onConfirm={confirmLogout}
          />
        </div>
      </>
    );
  }

  // Desktop Top Navigation
  return (
    <div
      className="sticky top-0 z-30 w-full bg-[#121212]/95 backdrop-blur-md border-b border-[#282828]"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Side - Page Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">داشبورد هنرمند</h1>
              <p className="text-[#B3B3B3] text-sm">
                خوش آمدید، {user?.name || "هنرمند"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications (desktop) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNotifications(e as React.MouseEvent);
            }}
            className="w-10 h-10 flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-all duration-200 relative group"
            aria-label="اعلان‌ها"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#1DB954] rounded-full border-2 border-[#121212]"></span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={handleSettingsClick}
            className="w-10 h-10 flex items-center justify-center text-[#B3B3B3] hover:text-white hover:bg-[#282828] rounded-lg transition-all duration-200 group"
            aria-label="تنظیمات"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
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
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-r border-[#282828]">
            <div className="w-8 h-8 bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "ح"}
            </div>
            <div className="hidden lg:block">
              <p className="text-white font-semibold text-sm">
                {user?.name || "هنرمند"}
              </p>
              <p className="text-[#B3B3B3] text-xs">
                {user?.artistName || "هنرمند"}
              </p>
            </div>
          </div>
        </div>
        {/* Desktop Notification Panel */}
        {showNotifications && (
          <div
            ref={panelRef}
            style={
              panelPosition
                ? {
                    position: "fixed",
                    left: panelPosition.x,
                    top: panelPosition.y,
                    width: 360,
                  }
                : { position: "fixed", right: 20, top: 80, width: 360 }
            }
            className="bg-[#0f0f0f] border border-[#282828] rounded-xl z-60 shadow-xl transition-all duration-300 pc-compact"
            dir="rtl"
          >
            <div className="px-4 py-3 border-b border-[#282828] flex items-center justify-between">
              <h3 className="text-white font-bold">اعلان‌ها</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-[#B3B3B3] hover:text-white"
                aria-label="بستن اعلان‌ها"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 overflow-auto p-3 space-y-2">
              {notifications.length === 0 && (
                <p className="text-[#B3B3B3] text-sm">اعلانی وجود ندارد</p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 bg-[#121212] p-3 rounded-lg transition-all duration-300 ${
                    removingRef.current[n.id]
                      ? "translate-x-6 opacity-0 h-0 p-0 overflow-hidden"
                      : "opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!n.read}
                    onChange={() => markRead(n.id)}
                    className="mt-1"
                    aria-label={`mark-${n.id}`}
                  />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[#B3B3B3] text-xs">{n.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNav;
