import React, { useState } from "react";

// Financial Data Interfaces
interface StreamingRecord {
  id: number;
  songTitle: string;
  plays: number;
  revenuePerPlay: number;
  totalRevenue: number;
  date: string;
}

interface WithdrawalAttempt {
  id: number;
  amount: number;
  requestDate: string;
  status: "pending" | "completed" | "rejected";
  completedDate?: string;
  bankAccount: string;
}

interface FinancialSummary {
  totalLifetimeEarnings: number; // Total earned from beginning
  totalWithdrawn: number; // Total amount withdrawn successfully
  totalPendingWithdrawals: number; // Amount in pending withdrawals
  availableBalance: number; // Available to withdraw now
  totalWithdrawalAttempts: number; // Number of withdrawal requests
  successfulWithdrawals: number;
  pendingWithdrawals: number;
  rejectedWithdrawals: number;
}

interface MonthlyRevenue {
  month: string;
  totalPlays: number;
  totalRevenue: number;
  averageRevenuePerPlay: number;
}

const Financial: React.FC = () => {
  const [timeRange, setTimeRange] = useState<
    "week" | "month" | "year" | "lifetime"
  >("month");
  const [selectedView, setSelectedView] = useState<
    "overview" | "streams" | "withdrawals"
  >("overview");

  // Revenue per play (in Tomans) - This would come from backend/settings
  const REVENUE_PER_PLAY = 50; // 50 Tomans per play

  // Mock Data - In production, this comes from API
  const streamingRecords: StreamingRecord[] = [
    {
      id: 1,
      songTitle: "ترانه عشق",
      plays: 45600,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 2280000,
      date: "1403/09/19",
    },
    {
      id: 2,
      songTitle: "بی‌تو",
      plays: 32400,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 1620000,
      date: "1403/09/18",
    },
    {
      id: 3,
      songTitle: "آهنگ جدید",
      plays: 28900,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 1445000,
      date: "1403/09/17",
    },
    {
      id: 4,
      songTitle: "ترانه عشق",
      plays: 21300,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 1065000,
      date: "1403/09/16",
    },
    {
      id: 5,
      songTitle: "شب بارانی",
      plays: 19800,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 990000,
      date: "1403/09/15",
    },
    {
      id: 6,
      songTitle: "بی‌تو",
      plays: 18200,
      revenuePerPlay: REVENUE_PER_PLAY,
      totalRevenue: 910000,
      date: "1403/09/14",
    },
  ];

  const withdrawalHistory: WithdrawalAttempt[] = [
    {
      id: 1,
      amount: 5000000,
      requestDate: "1403/09/01",
      status: "completed",
      completedDate: "1403/09/03",
      bankAccount: "****1234",
    },
    {
      id: 2,
      amount: 3000000,
      requestDate: "1403/08/15",
      status: "completed",
      completedDate: "1403/08/17",
      bankAccount: "****1234",
    },
    {
      id: 3,
      amount: 2000000,
      requestDate: "1403/09/15",
      status: "pending",
      bankAccount: "****1234",
    },
    {
      id: 4,
      amount: 1500000,
      requestDate: "1403/07/20",
      status: "completed",
      completedDate: "1403/07/22",
      bankAccount: "****1234",
    },
    {
      id: 5,
      amount: 500000,
      requestDate: "1403/07/05",
      status: "rejected",
      bankAccount: "****1234",
    },
  ];

  // Calculate Financial Summary
  const calculateFinancialSummary = (): FinancialSummary => {
    const totalLifetimeEarnings = 42180000; // Sum of all streaming revenue from beginning
    const totalWithdrawn = withdrawalHistory
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0);
    const totalPendingWithdrawals = withdrawalHistory
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + w.amount, 0);

    return {
      totalLifetimeEarnings,
      totalWithdrawn,
      totalPendingWithdrawals,
      availableBalance:
        totalLifetimeEarnings - totalWithdrawn - totalPendingWithdrawals,
      totalWithdrawalAttempts: withdrawalHistory.length,
      successfulWithdrawals: withdrawalHistory.filter(
        (w) => w.status === "completed"
      ).length,
      pendingWithdrawals: withdrawalHistory.filter(
        (w) => w.status === "pending"
      ).length,
      rejectedWithdrawals: withdrawalHistory.filter(
        (w) => w.status === "rejected"
      ).length,
    };
  };

  const monthlyData: MonthlyRevenue[] = [
    {
      month: "فروردین",
      totalPlays: 95000,
      totalRevenue: 4750000,
      averageRevenuePerPlay: 50,
    },
    {
      month: "اردیبهشت",
      totalPlays: 87000,
      totalRevenue: 4350000,
      averageRevenuePerPlay: 50,
    },
    {
      month: "خرداد",
      totalPlays: 102000,
      totalRevenue: 5100000,
      averageRevenuePerPlay: 50,
    },
    {
      month: "تیر",
      totalPlays: 118000,
      totalRevenue: 5900000,
      averageRevenuePerPlay: 50,
    },
    {
      month: "مرداد",
      totalPlays: 107000,
      totalRevenue: 5350000,
      averageRevenuePerPlay: 50,
    },
    {
      month: "شهریور",
      totalPlays: 146300,
      totalRevenue: 7315000,
      averageRevenuePerPlay: 50,
    },
  ];

  const financialSummary = calculateFinancialSummary();
  const maxAmount = Math.max(...monthlyData.map((d) => d.totalRevenue));

  // Calculate period-specific data
  const getPeriodData = () => {
    const now = new Date();
    let filteredData = streamingRecords;

    // In production, filter by actual dates
    if (timeRange === "week") {
      filteredData = streamingRecords.slice(0, 7);
    } else if (timeRange === "month") {
      filteredData = streamingRecords.slice(0, 30);
    } else if (timeRange === "year") {
      filteredData = streamingRecords;
    }

    const totalPlays = filteredData.reduce((sum, r) => sum + r.plays, 0);
    const totalRevenue = filteredData.reduce(
      (sum, r) => sum + r.totalRevenue,
      0
    );
    const previousRevenue =
      timeRange === "month"
        ? 5350000
        : timeRange === "week"
        ? 890000
        : 32500000;
    const growth = (
      ((totalRevenue - previousRevenue) / previousRevenue) *
      100
    ).toFixed(1);

    return {
      totalPlays,
      totalRevenue,
      growth: growth.startsWith("-") ? growth : `+${growth}`,
      averageRevenuePerPlay: REVENUE_PER_PLAY,
    };
  };

  const currentPeriodData = getPeriodData();

  return (
    <div className="min-h-full w-full p-4 sm:p-6 lg:p-8 pc-compact" dir="rtl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          گزارش مالی
        </h1>
        <p className="text-[#B3B3B3]">مدیریت و پیگیری درآمد از پخش موزیک</p>
      </div>

      {/* Lifetime Summary Cards - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Lifetime Earnings */}
        <div className="bg-gradient-to-br from-[#1DB954]/10 to-[#1ed760]/5 border border-[#1DB954]/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-[#1DB954]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[#B3B3B3] text-xs font-semibold">
              کل درآمد از ابتدا
            </p>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            {financialSummary.totalLifetimeEarnings.toLocaleString()}
          </p>
          <p className="text-[#1DB954] text-xs">تومان</p>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-[#3b82f6]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[#B3B3B3] text-xs font-semibold">
              مجموع برداشت شده
            </p>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            {financialSummary.totalWithdrawn.toLocaleString()}
          </p>
          <p className="text-[#B3B3B3] text-xs">
            {financialSummary.successfulWithdrawals} برداشت موفق
          </p>
        </div>

        {/* Available Balance */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[#B3B3B3] text-xs font-semibold">
              موجودی قابل برداشت
            </p>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            {financialSummary.availableBalance.toLocaleString()}
          </p>
          <p className="text-emerald-500 text-xs">آماده برداشت</p>
        </div>

        {/* Withdrawal Attempts */}
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-[#8b5cf6]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[#B3B3B3] text-xs font-semibold">
              تلاش‌های برداشت
            </p>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            {financialSummary.totalWithdrawalAttempts}
          </p>
          <p className="text-[#B3B3B3] text-xs">
            {financialSummary.pendingWithdrawals} در انتظار •{" "}
            {financialSummary.rejectedWithdrawals} رد شده
          </p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-[#282828] overflow-x-auto">
        <button
          onClick={() => setSelectedView("overview")}
          className={`px-3 sm:px-4 py-2 sm:py-3 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
            selectedView === "overview"
              ? "border-[#1DB954] text-[#1DB954]"
              : "border-transparent text-[#B3B3B3] hover:text-white"
          }`}
        >
          نمای کلی
        </button>
        <button
          onClick={() => setSelectedView("streams")}
          className={`px-3 sm:px-4 py-2 sm:py-3 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
            selectedView === "streams"
              ? "border-[#1DB954] text-[#1DB954]"
              : "border-transparent text-[#B3B3B3] hover:text-white"
          }`}
        >
          تاریخچه پخش
        </button>
        <button
          onClick={() => setSelectedView("withdrawals")}
          className={`px-3 sm:px-4 py-2 sm:py-3 font-semibold text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
            selectedView === "withdrawals"
              ? "border-[#1DB954] text-[#1DB954]"
              : "border-transparent text-[#B3B3B3] hover:text-white"
          }`}
        >
          برداشت‌ها
        </button>
      </div>

      {/* Time Range Selector - Only for Overview and Streams */}
      {selectedView !== "withdrawals" && (
        <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto">
          <button
            onClick={() => setTimeRange("week")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
              timeRange === "week"
                ? "bg-[#1DB954] text-black"
                : "bg-[#282828] text-[#B3B3B3] hover:text-white"
            }`}
          >
            هفتگی
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
              timeRange === "month"
                ? "bg-[#1DB954] text-black"
                : "bg-[#282828] text-[#B3B3B3] hover:text-white"
            }`}
          >
            ماهانه
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
              timeRange === "year"
                ? "bg-[#1DB954] text-black"
                : "bg-[#282828] text-[#B3B3B3] hover:text-white"
            }`}
          >
            سالانه
          </button>
          <button
            onClick={() => setTimeRange("lifetime")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
              timeRange === "lifetime"
                ? "bg-[#1DB954] text-black"
                : "bg-[#282828] text-[#B3B3B3] hover:text-white"
            }`}
          >
            کل دوره
          </button>
        </div>
      )}

      {/* Overview Tab */}
      {selectedView === "overview" && (
        <>
          {/* Period Revenue Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Period Total Revenue */}
            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1DB954]/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-[#1DB954]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[#B3B3B3] text-sm">درآمد دوره</p>
                  <span
                    className={`text-xs font-semibold ${
                      currentPeriodData.growth.startsWith("+")
                        ? "text-[#1DB954]"
                        : "text-red-500"
                    }`}
                  >
                    {currentPeriodData.growth}%
                  </span>
                </div>
              </div>
              <p className="text-white text-2xl sm:text-3xl font-bold">
                {currentPeriodData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-[#B3B3B3] text-sm mt-1">تومان</p>
            </div>

            {/* Total Plays */}
            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[#B3B3B3] text-sm">تعداد پخش</p>
                </div>
              </div>
              <p className="text-white text-2xl sm:text-3xl font-bold">
                {currentPeriodData.totalPlays.toLocaleString()}
              </p>
              <p className="text-[#B3B3B3] text-sm mt-1">پخش</p>
            </div>

            {/* Revenue Per Play */}
            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#8b5cf6]/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-[#8b5cf6]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#B3B3B3] text-sm">درآمد هر پخش</p>
                </div>
              </div>
              <p className="text-white text-2xl sm:text-3xl font-bold">
                {currentPeriodData.averageRevenuePerPlay.toLocaleString()}
              </p>
              <p className="text-[#B3B3B3] text-sm mt-1">تومان</p>
            </div>
          </div>

          {/* Chart and Balance */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Monthly Revenue Chart */}
            <div className="xl:col-span-2 bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                    روند درآمد ماهانه
                  </h3>
                  <p className="text-[#B3B3B3] text-sm">6 ماه اخیر</p>
                </div>
              </div>

              {/* Mobile Chart - Simplified */}
              <div className="block xl:hidden">
                <div className="space-y-3">
                  {monthlyData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-[#B3B3B3] flex-shrink-0">
                        {item.month}
                      </div>
                      <div className="flex-1 bg-[#282828] rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(item.totalRevenue / maxAmount) * 100}%`,
                          }}
                        >
                          <span className="text-xs text-black font-bold">
                            {(item.totalRevenue / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-[#B3B3B3] w-16 text-left flex-shrink-0">
                        {item.totalPlays.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Chart */}
              <div className="hidden xl:flex xl:items-end xl:justify-between xl:gap-3 xl:h-64">
                {monthlyData.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex items-end justify-center h-56">
                      <div
                        className="w-full bg-gradient-to-t from-[#1DB954] to-[#1ed760] rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer relative group"
                        style={{
                          height: `${(item.totalRevenue / maxAmount) * 100}%`,
                        }}
                      >
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#282828] px-3 py-2 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="font-bold text-[#1DB954]">
                            {(item.totalRevenue / 1000000).toFixed(1)}M تومان
                          </div>
                          <div className="text-[#B3B3B3] text-xs mt-1">
                            {item.totalPlays.toLocaleString()} پخش
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[#B3B3B3] text-xs">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance & Withdrawal Card */}
            <div className="bg-gradient-to-br from-[#1DB954] to-[#1ed760] rounded-xl p-4 sm:p-6 text-black">
              <div className="mb-4 sm:mb-6">
                <p className="text-black/70 text-sm mb-2">موجودی قابل برداشت</p>
                <p className="text-3xl sm:text-4xl font-bold">
                  {financialSummary.availableBalance.toLocaleString()}
                </p>
                <p className="text-sm mt-1">تومان</p>
              </div>

              <div className="space-y-3 mb-4 sm:mb-6 bg-black/10 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">در انتظار تسویه</span>
                  <span className="font-semibold">
                    {financialSummary.totalPendingWithdrawals.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">برداشت‌های موفق</span>
                  <span className="font-semibold">
                    {financialSummary.successfulWithdrawals} مورد
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">آخرین برداشت</span>
                  <span className="font-semibold">
                    {withdrawalHistory.find((w) => w.status === "completed")
                      ?.completedDate || "-"}
                  </span>
                </div>
              </div>

              <button
                className="w-full py-3 bg-black hover:bg-black/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                disabled={financialSummary.availableBalance < 100000}
              >
                {financialSummary.availableBalance < 100000
                  ? "حداقل 100,000 تومان"
                  : "درخواست برداشت"}
              </button>
              {financialSummary.availableBalance < 100000 && (
                <p className="text-xs text-black/60 mt-2 text-center">
                  حداقل موجودی برای برداشت: 100,000 تومان
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Streams Tab */}
      {selectedView === "streams" && (
        <div className="bg-[#181818] border border-[#282828] rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#282828]">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              تاریخچه پخش و درآمد
            </h3>
            <p className="text-[#B3B3B3] text-sm">
              جزئیات درآمد از پخش آهنگ‌ها
            </p>
          </div>

          {/* Mobile Table View */}
          <div className="block sm:hidden">
            {streamingRecords.map((record, index) => (
              <div
                key={record.id}
                className={`p-4 hover:bg-[#282828] transition-colors ${
                  index !== streamingRecords.length - 1
                    ? "border-b border-[#282828]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#1DB954]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-[#1DB954]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-base truncate">
                      {record.songTitle}
                    </h4>
                    <p className="text-[#B3B3B3] text-sm">{record.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#282828]/50 rounded-lg p-3">
                    <p className="text-[#B3B3B3] text-xs mb-1">تعداد پخش</p>
                    <p className="text-white font-bold text-lg">
                      {record.plays.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#282828]/50 rounded-lg p-3">
                    <p className="text-[#B3B3B3] text-xs mb-1">درآمد کل</p>
                    <p className="text-[#1DB954] font-bold text-lg">
                      {record.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#282828]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#B3B3B3]">هر پخش:</span>
                    <span className="text-white font-semibold">
                      {record.revenuePerPlay.toLocaleString()} تومان
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-[#282828]/50 text-[#B3B3B3] text-sm font-semibold min-w-[800px]">
              <div className="col-span-4">عنوان آهنگ</div>
              <div className="col-span-2 text-center">تعداد پخش</div>
              <div className="col-span-2 text-center">درآمد هر پخش</div>
              <div className="col-span-3 text-center">درآمد کل</div>
              <div className="col-span-1 text-center">تاریخ</div>
            </div>

            {/* Table Rows */}
            {streamingRecords.map((record, index) => (
              <div
                key={record.id}
                className={`grid grid-cols-12 gap-4 p-4 hover:bg-[#282828] transition-colors min-w-[800px] ${
                  index !== streamingRecords.length - 1
                    ? "border-b border-[#282828]"
                    : ""
                }`}
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1DB954]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-[#1DB954]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm truncate">
                    {record.songTitle}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {record.plays.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-[#B3B3B3]">
                    {record.revenuePerPlay.toLocaleString()} تومان
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-center">
                  <span className="text-[#1DB954] font-bold text-lg">
                    {record.totalRevenue.toLocaleString()} تومان
                  </span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-[#B3B3B3] text-sm">{record.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="p-4 bg-[#282828]/50 border-t border-[#282828]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-[#B3B3B3] text-sm">مجموع این دوره:</span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <span className="text-white font-semibold">
                  {streamingRecords
                    .reduce((sum, r) => sum + r.plays, 0)
                    .toLocaleString()}{" "}
                  پخش
                </span>
                <span className="text-[#1DB954] font-bold text-lg sm:text-xl">
                  {streamingRecords
                    .reduce((sum, r) => sum + r.totalRevenue, 0)
                    .toLocaleString()}{" "}
                  تومان
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {selectedView === "withdrawals" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Withdrawal Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-[#B3B3B3] text-sm">برداشت‌های موفق</p>
              </div>
              <p className="text-white text-xl sm:text-2xl font-bold">
                {financialSummary.successfulWithdrawals}
              </p>
              <p className="text-green-500 text-sm mt-1">
                {financialSummary.totalWithdrawn.toLocaleString()} تومان
              </p>
            </div>

            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-[#B3B3B3] text-sm">در انتظار تسویه</p>
              </div>
              <p className="text-white text-xl sm:text-2xl font-bold">
                {financialSummary.pendingWithdrawals}
              </p>
              <p className="text-yellow-500 text-sm mt-1">
                {financialSummary.totalPendingWithdrawals.toLocaleString()}{" "}
                تومان
              </p>
            </div>

            <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-[#B3B3B3] text-sm">برداشت‌های رد شده</p>
              </div>
              <p className="text-white text-xl sm:text-2xl font-bold">
                {financialSummary.rejectedWithdrawals}
              </p>
              <p className="text-red-500 text-sm mt-1">نیاز به بررسی</p>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="bg-[#181818] border border-[#282828] rounded-xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#282828]">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                تاریخچه برداشت‌ها
              </h3>
              <p className="text-[#B3B3B3] text-sm">تمام تلاش‌های برداشت وجه</p>
            </div>

            {withdrawalHistory.map((withdrawal, index) => (
              <div
                key={withdrawal.id}
                className={`p-4 sm:p-5 hover:bg-[#282828] transition-colors ${
                  index !== withdrawalHistory.length - 1
                    ? "border-b border-[#282828]"
                    : ""
                }`}
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        withdrawal.status === "completed"
                          ? "bg-green-500/20"
                          : withdrawal.status === "pending"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      {withdrawal.status === "completed" ? (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : withdrawal.status === "pending" ? (
                        <svg
                          className="w-6 h-6 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-white font-bold text-lg">
                          {withdrawal.amount.toLocaleString()} تومان
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            withdrawal.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : withdrawal.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {withdrawal.status === "completed"
                            ? "تکمیل شده"
                            : withdrawal.status === "pending"
                            ? "در انتظار"
                            : "رد شده"}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-[#B3B3B3]">
                        <p>درخواست: {withdrawal.requestDate}</p>
                        {withdrawal.completedDate && (
                          <p>تکمیل: {withdrawal.completedDate}</p>
                        )}
                        <p>حساب: {withdrawal.bankAccount}</p>
                      </div>
                    </div>
                  </div>
                  {withdrawal.status === "pending" && (
                    <button className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold text-sm rounded-lg transition-colors">
                      لغو درخواست
                    </button>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        withdrawal.status === "completed"
                          ? "bg-green-500/20"
                          : withdrawal.status === "pending"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      {withdrawal.status === "completed" ? (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : withdrawal.status === "pending" ? (
                        <svg
                          className="w-6 h-6 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-white font-bold text-lg">
                          {withdrawal.amount.toLocaleString()} تومان
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            withdrawal.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : withdrawal.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {withdrawal.status === "completed"
                            ? "تکمیل شده"
                            : withdrawal.status === "pending"
                            ? "در انتظار"
                            : "رد شده"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#B3B3B3]">
                        <span>درخواست: {withdrawal.requestDate}</span>
                        {withdrawal.completedDate && (
                          <span>تکمیل: {withdrawal.completedDate}</span>
                        )}
                        <span>حساب: {withdrawal.bankAccount}</span>
                      </div>
                    </div>
                  </div>
                  {withdrawal.status === "pending" && (
                    <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-semibold text-sm rounded-lg transition-colors">
                      لغو درخواست
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
