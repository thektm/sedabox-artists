const PERSIAN_TEXT = /[\u0600-\u06FF]/;
const LATIN_TEXT = /[A-Za-z]/;

const FIELD_LABELS: Record<string, string> = {
  phone: "شماره تلفن",
  phone_number: "شماره تلفن",
  password: "رمز عبور",
  currentPassword: "رمز عبور فعلی",
  current_password: "رمز عبور فعلی",
  newPassword: "رمز عبور جدید",
  new_password: "رمز عبور جدید",
  resetToken: "نشست بازیابی رمز عبور",
  otp: "کد تأیید",
  title: "عنوان فارسی",
  title_en: "عنوان انگلیسی",
  description: "توضیحات فارسی",
  description_en: "توضیحات انگلیسی",
  release_date: "تاریخ انتشار",
  original_release_date: "تاریخ انتشار اولیه",
  release_type: "نوع انتشار",
  language: "زبان اثر",
  audio_file: "فایل صوتی",
  cover_image: "تصویر کاور",
  profile_image: "تصویر پروفایل",
  banner_image: "تصویر بنر",
  social_accounts: "پیوندهای شبکه‌های اجتماعی",
  genre_ids: "ژانرها",
  sub_genre_ids: "زیرژانرها",
  mood_ids: "حال‌وهواها",
  featured_artist_ids: "هنرمندان مهمان",
  contributor_ids: "مشارکت‌کنندگان",
  song_ids: "آهنگ‌ها",
  track_ids: "ترک‌ها",
  album_id: "آلبوم",
  release_id: "انتشار",
  artist_id: "هنرمند",
  role: "نقش",
  roles: "نقش‌ها",
  email: "ایمیل",
  name: "نام",
  name_en: "نام انگلیسی",
  artistic_name: "نام هنری",
  artistic_name_en: "نام هنری انگلیسی",
  national_code: "کد ملی",
  address: "نشانی",
  bank_card: "شماره کارت بانکی",
  iban: "شماره شبا",
  non_field_errors: "اطلاعات واردشده",
  detail: "خطا",
  error: "خطا",
  message: "پیام",
};

export const PERSIAN_ERROR_BY_CODE: Record<string, string> = {
  VALIDATION_ERROR: "لطفاً اطلاعات مشخص‌شده را بررسی و اصلاح کنید.",
  INVALID_PHONE: "شماره تلفن همراه معتبر وارد کنید.",
  invalid_phone: "شماره تلفن همراه معتبر وارد کنید.",
  invalid_otp_format: "کد تأیید چهاررقمی را کامل وارد کنید.",
  USER_EXISTS: "این شماره تلفن قبلاً ثبت شده است. برای ادامه وارد حساب خود شوید.",
  USER_BANNED: "حساب شما مسدود شده است. برای پیگیری با پشتیبانی تماس بگیرید.",
  RATE_LIMIT: "تعداد درخواست‌ها بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.",
  SMS_FAILED: "ارسال پیامک کد تأیید انجام نشد. چند دقیقه دیگر دوباره تلاش کنید.",
  OTP_NOT_FOUND: "کد تأیید فعال پیدا نشد. یک کد جدید درخواست کنید.",
  OTP_EXCEEDED: "تعداد تلاش‌های ناموفق برای کد تأیید بیش از حد مجاز است. کد جدیدی درخواست کنید.",
  OTP_INVALID: "کد تأیید واردشده صحیح نیست. دوباره بررسی کنید.",
  OTP_EXPIRED: "کد تأیید منقضی شده است. یک کد جدید دریافت کنید.",
  AUTH_FAILED: "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  ACCOUNT_LOCKED: "به‌دلیل چند تلاش ناموفق، ورود موقتاً قفل شده است. کمی بعد دوباره تلاش کنید.",
  PHONE_NOT_REGISTERED: "حسابی با این شماره تلفن پیدا نشد.",
  TOKEN_INVALID: "نشست ورود معتبر نیست. دوباره وارد شوید.",
  TOKEN_REVOKED: "نشست شما منقضی یا لغو شده است. دوباره وارد شوید.",
  REFRESH_TOKEN_REQUIRED: "اطلاعات تمدید نشست ارسال نشده است. دوباره وارد شوید.",
  INVALID_PASSWORD: "رمز عبور فعلی صحیح نیست.",
  SESSION_NOT_FOUND: "نشست موردنظر پیدا نشد.",
  CURRENT_SESSION_INVALID: "نشست فعلی معتبر نیست یا منقضی شده است. دوباره وارد شوید.",
  ARTIST_ONLY: "این بخش فقط برای حساب هنرمند در دسترس است.",
  SUBMISSION_EXISTS: "درخواست احراز هویت هنرمند قبلاً ثبت شده است و باید همان درخواست را ویرایش کنید.",
  ARTIST_AUTH_NOT_FOUND: "درخواست احراز هویت هنرمند پیدا نشد.",
  ARTIST_ACCOUNT_NOT_FOUND: "برای این شماره تلفن حساب هنرمند فعالی پیدا نشد.",
  ARTIST_RESET_TOKEN_INVALID: "نشست بازیابی رمز عبور معتبر نیست. دوباره کد بازیابی درخواست کنید.",
  ARTIST_RESET_TOKEN_EXPIRED: "لینک بازنشانی رمز عبور منقضی شده است. دوباره درخواست بازنشانی بدهید.",
  ARTIST_RESET_TOKEN_USED: "این لینک بازنشانی قبلاً استفاده شده است. دوباره درخواست بازنشانی بدهید.",
  RESET_TOKEN_INVALID: "لینک بازنشانی رمز عبور معتبر نیست. دوباره درخواست بازنشانی بدهید.",
  RESET_TOKEN_EXPIRED: "لینک بازنشانی رمز عبور منقضی شده است. دوباره درخواست بازنشانی بدهید.",
  RESET_TOKEN_USED: "این لینک بازنشانی قبلاً استفاده شده است. دوباره درخواست بازنشانی بدهید.",
  BAD_REQUEST: "اطلاعات درخواست معتبر نیست.",
  AUTHENTICATION_REQUIRED: "برای ادامه باید دوباره وارد حساب هنرمند شوید.",
  PERMISSION_DENIED: "اجازه انجام این عملیات را ندارید.",
  NOT_FOUND: "اطلاعات درخواستی پیدا نشد.",
  SERVER_ERROR: "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید.",
  INVALID_JSON: "ساختار اطلاعات ارسالی معتبر نیست.",
  METHOD_NOT_ALLOWED: "این روش برای درخواست فعلی مجاز نیست.",
  UNSUPPORTED_MEDIA_TYPE: "نوع محتوای ارسالی پشتیبانی نمی‌شود.",
  NETWORK_ERROR: "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
  minimum_payout_not_reached: "موجودی قابل تسویه هنوز به حداقل مبلغ تسویه نرسیده است.",
};

const EXACT_MESSAGES: Record<string, string> = {
  "something went wrong. please try again.": "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
  "the request could not be completed.": "انجام درخواست ممکن نشد. لطفاً دوباره تلاش کنید.",
  "the server could not complete the request. please try again.": "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید.",
  "the server could not complete this request. please try again.": "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید.",
  "could not connect to the server. check your internet connection and try again.": "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
  "unable to connect to the server. check your internet connection and try again.": "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
  "upload connection failed. check your internet connection and try again.": "ارتباط هنگام بارگذاری قطع شد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
  "the upload timed out before the server finished processing it.": "مهلت بارگذاری پیش از پایان پردازش سرور تمام شد. دوباره تلاش کنید.",
  "the upload was cancelled.": "بارگذاری لغو شد.",
  "uploads are only available in the browser.": "بارگذاری فایل فقط در مرورگر امکان‌پذیر است.",
  "your session has expired. please sign in again.": "نشست شما منقضی شده است. دوباره وارد شوید.",
  "you do not have permission to perform this action.": "اجازه انجام این عملیات را ندارید.",
  "invalid credentials": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "failed to login": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "login failed": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "incorrect username or password": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "invalid username or password": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "incorrect phone or password": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "invalid phone or password": "شماره تلفن یا رمز عبور اشتباه است. لطفاً دوباره تلاش کنید.",
  "failed to register": "ثبت‌نام انجام نشد. لطفاً اطلاعات را بررسی کنید و دوباره تلاش کنید.",
  "registration failed": "ثبت‌نام انجام نشد. لطفاً اطلاعات را بررسی کنید و دوباره تلاش کنید.",
  "failed to reset password": "بازنشانی رمز عبور انجام نشد. لطفاً دوباره تلاش کنید.",
  "phone already registered": "این شماره تلفن قبلاً ثبت شده است.",
  "this account has been banned.": "این حساب کاربری مسدود شده است.",
  "enter a valid mobile number.": "شماره تلفن همراه معتبر وارد کنید.",
  "enter the 4-digit verification code.": "کد تأیید چهاررقمی را کامل وارد کنید.",
  "this field is required.": "این فیلد الزامی است.",
  "this field may not be blank.": "این فیلد نمی‌تواند خالی باشد.",
  "ensure this field has at least 6 characters.": "این مقدار باید حداقل ۶ کاراکتر باشد.",
  "ensure this field has at least 8 characters.": "این مقدار باید حداقل ۸ کاراکتر باشد.",
  "the new password must be different from the current password.": "رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد.",
  "current password is incorrect.": "رمز عبور فعلی صحیح نیست.",
  "password changed successfully.": "رمز عبور با موفقیت تغییر کرد.",
  "artist profile not found or user is not an artist": "پروفایل هنرمند پیدا نشد یا این حساب نقش هنرمند ندارد.",
  "user is not an artist": "این حساب نقش هنرمند ندارد.",
  "artist profile not found.": "پروفایل هنرمند پیدا نشد.",
  "invalid upload identifier.": "شناسه بارگذاری معتبر نیست.",
  "audio file is required.": "انتخاب فایل صوتی الزامی است.",
  "audio file must be smaller than 500mb.": "حجم فایل صوتی باید کمتر از ۵۰۰ مگابایت باشد.",
  "only mp3 and wav audio files are supported.": "فقط فایل‌های صوتی MP3 و WAV پشتیبانی می‌شوند.",
  "cover image must be smaller than 10mb.": "حجم تصویر کاور باید کمتر از ۱۰ مگابایت باشد.",
  "cover image must be jpg, png, or webp.": "فرمت تصویر کاور باید JPG، PNG یا WEBP باشد.",
  "album cover must be smaller than 10mb.": "حجم کاور آلبوم باید کمتر از ۱۰ مگابایت باشد.",
  "album cover must be jpg, png, or webp.": "فرمت کاور آلبوم باید JPG، PNG یا WEBP باشد.",
  "only jpg, png, and webp images are supported.": "فقط تصاویر JPG، PNG و WEBP پشتیبانی می‌شوند.",
  "not found.": "اطلاعات موردنظر پیدا نشد.",
};

const normalizeKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export const fieldLabelFa = (key: string): string => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const normalized = key.replace(/_/g, " ").trim();
  if (PERSIAN_TEXT.test(normalized) && !LATIN_TEXT.test(normalized)) return normalized;
  return "فیلد مربوطه";
};

export const toPersianMessage = (
  value: unknown,
  fallback = "انجام درخواست ممکن نشد. لطفاً دوباره تلاش کنید.",
  code?: string,
): string => {
  if (code && PERSIAN_ERROR_BY_CODE[code]) return PERSIAN_ERROR_BY_CODE[code];
  const source = String(value ?? "").trim();
  if (!source) return fallback;
  if (PERSIAN_TEXT.test(source) && !LATIN_TEXT.test(source)) return source;

  const exact = EXACT_MESSAGES[normalizeKey(source)];
  if (exact) return exact;

  const minLength = source.match(/ensure this field has at least (\d+) characters?/i);
  if (minLength) return `این مقدار باید حداقل ${Number(minLength[1]).toLocaleString("fa-IR")} کاراکتر باشد.`;

  const maxLength = source.match(/ensure this field has no more than (\d+) characters?/i);
  if (maxLength) return `این مقدار نباید بیشتر از ${Number(maxLength[1]).toLocaleString("fa-IR")} کاراکتر باشد.`;

  const tooLarge = source.match(/maximum size is (\d+)mb/i);
  if (tooLarge) return `حجم فایل نباید بیشتر از ${Number(tooLarge[1]).toLocaleString("fa-IR")} مگابایت باشد.`;

  const rateLimit = source.match(/(?:wait|try again in)\s*(\d+)\s*seconds?/i);
  if (rateLimit) return `لطفاً ${Number(rateLimit[1]).toLocaleString("fa-IR")} ثانیه صبر کنید و دوباره تلاش کنید.`;

  if (/network|failed to fetch|load failed|connection|offline/i.test(source)) {
    return "ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.";
  }
  if (/timeout|timed out/i.test(source)) {
    return "مهلت انجام درخواست تمام شد. دوباره تلاش کنید.";
  }
  if (/unauthorized|authentication|token|session expired/i.test(source)) {
    return "نشست شما معتبر نیست یا منقضی شده است. دوباره وارد شوید.";
  }
  if (/forbidden|permission/i.test(source)) return "اجازه انجام این عملیات را ندارید.";
  if (/not found/i.test(source)) return "اطلاعات درخواستی پیدا نشد.";
  if (/invalid|incorrect/i.test(source)) return "اطلاعات واردشده معتبر یا صحیح نیست.";
  if (/server|internal error/i.test(source)) return "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید.";

  // Never expose an unknown English server message in the Persian artist panel.
  if (LATIN_TEXT.test(source) && !PERSIAN_TEXT.test(source)) return fallback;
  return source;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const firstCode = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  if (typeof value.code === "string") return value.code;
  if (isRecord(value.error) && typeof value.error.code === "string") return value.error.code;
  return undefined;
};

const retryAfterSeconds = (value: unknown): number | undefined => {
  if (!isRecord(value)) return undefined;
  const nested = isRecord(value.error) ? value.error.retry_after_seconds : undefined;
  const raw = nested ?? value.retry_after_seconds;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
};

const collectFieldErrors = (value: unknown, path: string[] = []): string[] => {
  if (typeof value === "string") {
    const translated = toPersianMessage(value);
    const field = path.find((item) => !["error", "fields", "detail", "message", "non_field_errors"].includes(item));
    return [field ? `${fieldLabelFa(field)}: ${translated}` : translated];
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectFieldErrors(item, path));
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .filter(([key]) => !["code", "status", "retry_after_seconds", "meta"].includes(key))
    .flatMap(([key, item]) => collectFieldErrors(item, [...path, key]));
};

export const getPersianPayloadMessage = (
  payload: unknown,
  fallback = "انجام درخواست ممکن نشد. لطفاً دوباره تلاش کنید.",
): string => {
  const code = firstCode(payload);
  const retrySeconds = retryAfterSeconds(payload);
  if (code === "ACCOUNT_LOCKED" && retrySeconds) {
    return `به‌دلیل چند تلاش ناموفق، ورود موقتاً قفل شده است. ${retrySeconds.toLocaleString("fa-IR")} ثانیه دیگر دوباره تلاش کنید.`;
  }
  if (code === "RATE_LIMIT" && retrySeconds) {
    return `تعداد درخواست‌ها بیش از حد مجاز است. ${retrySeconds.toLocaleString("fa-IR")} ثانیه دیگر دوباره تلاش کنید.`;
  }
  const record = isRecord(payload) ? payload : undefined;
  const errorRecord = record && isRecord(record.error) ? record.error : undefined;
  const fields = errorRecord?.fields ?? record?.fields;
  const fieldMessages = collectFieldErrors(fields);
  if (fieldMessages.length) return [...new Set(fieldMessages)].join(" · ");
  if (code && PERSIAN_ERROR_BY_CODE[code]) return PERSIAN_ERROR_BY_CODE[code];

  const candidate =
    (typeof errorRecord?.message === "string" && errorRecord.message) ||
    (typeof record?.message === "string" && record.message) ||
    (typeof record?.detail === "string" && record.detail) ||
    (typeof record?.error === "string" && record.error) ||
    (typeof payload === "string" && payload) ||
    "";
  return toPersianMessage(candidate, fallback, code);
};
