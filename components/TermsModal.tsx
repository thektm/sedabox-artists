import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const TermsModal: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:p-10"
      dir="rtl"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <div className="relative z-[110] w-full max-w-3xl max-h-full flex flex-col bg-[#121212] border border-[#282828] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#282828]">
          <h3 className="text-white font-bold text-xl">
            شرایط و ضوابط استفاده
          </h3>
          <button
            onClick={onClose}
            className="text-[#B3B3B3] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-[#B3B3B3] leading-relaxed space-y-6 custom-scrollbar">
          <h2 className="text-white font-bold text-lg mb-4">
            شرایط و ضوابط استفاده هنرمندان از پلتفرم صدا باکس
          </h2>
          <p>
            با ثبت نام، تکمیل اطلاعات و استفاده از داشبورد هنرمندان در پلتفرم
            «صدا باکس»، شما به عنوان هنرمند / صاحب اثر تأیید می نمایید که کلیه
            شرایط و ضوابط زیر را به دقت مطالعه کرده‌اید و آن ها را به صورت کامل،
            آگاهانه و بدون قید و شرط می پذیرید.
          </p>

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۱. مالکیت و حقوق آثار
            </h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                شما تأیید می کنید که مالک قانونی آثار ثبت شده در پلتفرم هستید یا
                مجوز رسمی و معتبر از صاحبان حقوق مادی و معنوی اثر (از جمله
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

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۲. مجوز استفاده و انتشار
            </h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                با ثبت آثار، شما به پلتفرم «صدا باکس» مجوز غیر انحصاری (مگر آنکه
                خلاف آن به صورت مکتوب توافق شده باشد) برای:
                <ul className="list-disc list-inside mr-6 mt-1 space-y-1 opacity-80">
                  <li>انتشار</li>
                  <li>پخش آنلاین (Streaming)</li>
                  <li>نمایش اطلاعات اثر و هنرمند</li>
                </ul>
                در وب سایت، اپلیکیشن و سرویس‌های وابسته پلتفرم اعطا می کنید.
              </li>
              <li>
                این مجوز به هیچ عنوان به معنای فروش، واگذاری مالکیت یا انتقال
                حقوق مادی اثر نمی باشد.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">۳. صحت اطلاعات</h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                شما متعهد می شوید که کلیه اطلاعات وارد شده در داشبورد هنرمندان
                (از جمله نام، مشخصات، اطلاعات بانکی، اطلاعات آثار و مجوزها)
                صحیح، کامل و به روز باشد.
              </li>
              <li>
                هرگونه مسئولیت ناشی از ارائه اطلاعات نادرست یا ناقص، بر عهده شما
                خواهد بود.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۴. درآمد و تسویه حساب
            </h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                سهم درآمد شما از پخش آنلاین (Streaming) آثار مطابق با مدل درآمدی
                اعلام شده در پلتفرم محاسبه می‌شود.
              </li>
              <li>
                گزارش های مالی از طریق داشبورد هنرمندان در اختیار شما قرار خواهد
                گرفت.
              </li>
              <li>
                پرداخت ها صرفاً به حساب بانکی ثبت شده توسط شما انجام می‌شود.
              </li>
              <li>
                پلتفرم حق دارد کارمزدهای قانونی، مالیات و هزینه‌های بانکی را طبق
                قوانین کسر نماید.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۵. محتوا و رفتار مجاز
            </h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                ثبت هرگونه محتوای ناقض قوانین جمهوری اسلامی ایران، اخلاق عمومی،
                حقوق اشخاص ثالث یا مقررات پلتفرم ممنوع است.
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

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۶. فسخ و قطع همکاری
            </h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>
                هر یک از طرفین می توانند مطابق شرایط اعلام شده، همکاری را خاتمه
                دهند.
              </li>
              <li>
                در صورت فسخ، آثار تا پایان دوره تسویه مالی در پلتفرم باقی خواهند
                ماند.
              </li>
              <li>
                پلتفرم حق دارد در صورت تخلف، همکاری را به صورت یک طرفه خاتمه
                دهد.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-semibold mb-2">۷. تغییر شرایط</h3>
            <ul className="list-disc list-inside space-y-2 pr-4">
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

          <section>
            <h3 className="text-white font-semibold mb-2">
              ۸. قانون حاکم و حل اختلاف
            </h3>
            <p>
              این توافق نامه تابع قوانین جمهوری اسلامی ایران بوده و در صورت بروز
              اختلاف، موضوع از طریق مراجع صالح قضایی رسیدگی خواهد شد.
            </p>
          </section>

          <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-lg p-4 mt-8">
            <h4 className="text-[#1DB954] font-bold mb-2">تأیید نهایی</h4>
            <p className="text-sm">
              با انتخاب گزینه «✔ شرایط و ضوابط را مطالعه کرده و می پذیرم»، شما
              تأیید می کنید که:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• تمامی مفاد فوق را خوانده‌اید.</li>
              <li>• آن ها را به طور کامل قبول دارید.</li>
              <li>• مسئولیت حقوقی آثار ثبت شده را می‌پذیرید.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#282828] flex justify-end">
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-[#1DB954] hover:bg-[#1ED760] text-black font-bold rounded-full transition-all duration-200 shadow-lg hover:scale-105 active:scale-95"
          >
            تأیید و پذیرش شرایط
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

export default TermsModal;
