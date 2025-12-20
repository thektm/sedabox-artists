import React from "react";
import { FileText } from "lucide-react";

const TermsAndConditions: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-[#121212] text-[#B3B3B3] p-6 sm:p-10"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b border-[#282828] pb-6">
          <div className="p-3 bg-[#1DB954]/10 rounded-xl">
            <FileText className="w-8 h-8 text-[#1DB954]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">شرایط و ضوابط</h1>
            <p className="text-sm mt-1">آخرین بروزرسانی: آذر ۱۴۰۴</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 leading-relaxed">
          <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
            <h2 className="text-white font-bold text-xl mb-4">
              شرایط و ضوابط استفاده هنرمندان از پلتفرم صدا باکس
            </h2>
            <p>
              با ثبت نام، تکمیل اطلاعات و استفاده از داشبورد هنرمندان در پلتفرم
              «صدا باکس»، شما به عنوان هنرمند / صاحب اثر تأیید می نمایید که کلیه
              شرایط و ضوابط زیر را به دقت مطالعه کرده‌اید و آن ها را به صورت
              کامل، آگاهانه و بدون قید و شرط می پذیرید.
            </p>
          </section>

          <div className="grid gap-6">
            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۱
                </span>
                مالکیت و حقوق آثار
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  شما تأیید می کنید که مالک قانونی آثار ثبت شده در پلتفرم هستید
                  یا مجوز رسمی و معتبر از صاحبان حقوق مادی و معنوی اثر (از جمله
                  آهنگساز، ترانه سرا، تنظیم کننده، ناشر و ...) در اختیار دارید.
                </li>
                <li>
                  مسئولیت کامل هرگونه ادعا، شکایت یا دعوای حقوقی اشخاص ثالث نسبت
                  به آثار ثبت شده، صرفاً بر عهده شما خواهد بود.
                </li>
                <li>
                  پلتفرم هیچ مسئولیتی در قبال نقض حقوق اشخاص ثالث نخواهد داشت.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۲
                </span>
                مجوز استفاده و انتشار
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  با ثبت آثار، شما به پلتفرم «صدا باکس» مجوز غیر انحصاری (مگر
                  آنکه خلاف آن به صورت مکتوب توافق شده باشد) برای:
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-[#282828] rounded-full text-xs text-white">
                      انتشار
                    </span>
                    <span className="px-3 py-1 bg-[#282828] rounded-full text-xs text-white">
                      پخش آنلاین (Streaming)
                    </span>
                    <span className="px-3 py-1 bg-[#282828] rounded-full text-xs text-white">
                      نمایش اطلاعات اثر و هنرمند
                    </span>
                  </div>
                  در وب سایت، اپلیکیشن و سرویس‌های وابسته پلتفرم اعطا می کنید.
                </li>
                <li>
                  این مجوز به هیچ عنوان به معنای فروش، واگذاری مالکیت یا انتقال
                  حقوق مادی اثر نمی باشد.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۳
                </span>
                صحت اطلاعات
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  شما متعهد می شوید که کلیه اطلاعات وارد شده در داشبورد هنرمندان
                  (از جمله نام، مشخصات، اطلاعات بانکی، اطلاعات آثار و مجوزها)
                  صحیح، کامل و به روز باشد.
                </li>
                <li>
                  هرگونه مسئولیت ناشی از ارائه اطلاعات نادرست یا ناقص، بر عهده
                  شما خواهد بود.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۴
                </span>
                درآمد و تسویه حساب
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  سهم درآمد شما از پخش آنلاین (Streaming) آثار مطابق با مدل
                  درآمدی اعلام شده در پلتفرم محاسبه می‌شود.
                </li>
                <li>
                  گزارش های مالی از طریق داشبورد هنرمندان در اختیار شما قرار
                  خواهد گرفت.
                </li>
                <li>
                  پرداخت ها صرفاً به حساب بانکی ثبت شده توسط شما انجام می‌شود.
                </li>
                <li>
                  پلتفرم حق دارد کارمزدهای قانونی، مالیات و هزینه‌های بانکی را
                  طبق قوانین کسر نماید.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۵
                </span>
                محتوا و رفتار مجاز
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  ثبت هرگونه محتوای ناقض قوانین جمهوری اسلامی ایران، اخلاق
                  عمومی، حقوق اشخاص ثالث یا مقررات پلتفرم ممنوع است.
                </li>
                <li>
                  پلتفرم حق دارد در صورت مشاهده تخلف، بدون نیاز به اطلاع قبلی:
                  <ul className="list-disc list-inside mr-6 mt-1 space-y-1 opacity-80">
                    <li>اثر یا صفحه هنرمند را تعلیق یا حذف کند</li>
                    <li>دسترسی به داشبورد را محدود نماید</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۶
                </span>
                فسخ و قطع همکاری
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  هر یک از طرفین می توانند مطابق شرایط اعلام شده، همکاری را
                  خاتمه دهند.
                </li>
                <li>
                  در صورت فسخ، آثار تا پایان دوره تسویه مالی در پلتفرم باقی
                  خواهند ماند.
                </li>
                <li>
                  پلتفرم حق دارد در صورت تخلف، همکاری را به صورت یک طرفه خاتمه
                  دهد.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۷
                </span>
                تغییر شرایط
              </h3>
              <ul className="space-y-3 pr-8 list-disc">
                <li>
                  پلتفرم مجاز است در صورت لزوم، شرایط و ضوابط را به روزرسانی
                  نماید.
                </li>
                <li>
                  ادامه استفاده شما از داشبورد هنرمندان به منزله پذیرش نسخه جدید
                  شرایط خواهد بود.
                </li>
              </ul>
            </section>

            <section className="bg-[#181818] p-6 rounded-2xl border border-[#282828]">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1DB954] text-black rounded-full flex items-center justify-center text-xs">
                  ۸
                </span>
                قانون حاکم و حل اختلاف
              </h3>
              <p className="pr-8">
                این توافق نامه تابع قوانین جمهوری اسلامی ایران بوده و در صورت
                بروز اختلاف، موضوع از طریق مراجع صالح قضایی رسیدگی خواهد شد.
              </p>
            </section>
          </div>

          <div className="bg-[#1DB954] p-8 rounded-2xl text-black text-center">
            <h4 className="text-2xl font-bold mb-4">تأیید نهایی</h4>
            <p className="font-medium mb-6">
              با استفاده از این پنل، شما تأیید می‌کنید که تمامی مفاد فوق را
              خوانده و پذیرفته‌اید.
            </p>
            <div className="flex justify-center gap-8 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <span className="text-[#1DB954] text-[10px]">✓</span>
                </div>
                مطالعه کامل
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <span className="text-[#1DB954] text-[10px]">✓</span>
                </div>
                پذیرش بی قید و شرط
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <span className="text-[#1DB954] text-[10px]">✓</span>
                </div>
                مسئولیت حقوقی
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-[#535353]">
          <p>© ۲۰۲۵ صدا باکس. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
