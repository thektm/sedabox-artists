import React from "react";

const SplashScreen: React.FC = () => {
  return (
    <div dir="rtl" className="fixed inset-0 bg-[#121212] flex flex-col items-center justify-center z-50">
      {/* Logo */}
      <div className="mb-8">
        <img src="/logo-text.png" alt="Sedabox" className="h-45 w-auto" />
      </div>

      {/* Loading Dots */}
      <div className="flex space-x-2">
        <div
          className="w-3 h-3 bg-[#B3B3B3] rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-[#B3B3B3] rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-3 h-3 bg-[#B3B3B3] rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>

     
    </div>
  );
};

export default SplashScreen;
