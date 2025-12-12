import React from "react";
import { useResponsive } from "../hooks/useResponsive";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import TopNav from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isMobile, isTablet } = useResponsive();
  const showMobileLayout = isMobile || isTablet;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121212]">
      {showMobileLayout ? (
        // Mobile Layout
        <div className="h-full flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-hidden bg-gradient-to-b from-[#121212] to-[#0a0a0a] relative">
            {children}
          </main>
        </div>
      ) : (
        // Desktop Layout
        <div dir="rtl" className="h-full flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopNav />
            <main className="flex-1 overflow-hidden bg-gradient-to-br from-[#121212] via-[#0f0f0f] to-[#0a0a0a] relative">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
