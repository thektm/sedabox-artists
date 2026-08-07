import Head from "next/head";

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>داشبورد هنرمند صداباکس</title>
        <meta name="description" content="داشبورد مدیریت آثار و درآمد هنرمندان صداباکس" />
      </Head>
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#121212] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-black">داشبورد هنرمند صداباکس</h1>
          <p className="mt-3 text-sm text-[#b3b3b3]">سامانه در حال آماده‌سازی است…</p>
        </div>
      </main>
    </>
  );
}
