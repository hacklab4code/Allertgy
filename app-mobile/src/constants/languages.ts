export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  /** BCP-47 locale for date/number formatting */
  locale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹', locale: 'pt-PT' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱', locale: 'nl-NL' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱', locale: 'pl-PL' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk', flag: '🇩🇰', locale: 'da-DK' },
  { code: 'nb', label: 'Norwegian', nativeLabel: 'Norsk', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi', flag: '🇫🇮', locale: 'fi-FI' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština', flag: '🇨🇿', locale: 'cs-CZ' },
  { code: 'sk', label: 'Slovak', nativeLabel: 'Slovenčina', flag: '🇸🇰', locale: 'sk-SK' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar', flag: '🇭🇺', locale: 'hu-HU' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Română', flag: '🇷🇴', locale: 'ro-RO' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български', flag: '🇧🇬', locale: 'bg-BG' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', flag: '🇬🇷', locale: 'el-GR' },
  { code: 'hr', label: 'Croatian', nativeLabel: 'Hrvatski', flag: '🇭🇷', locale: 'hr-HR' },
  { code: 'sl', label: 'Slovenian', nativeLabel: 'Slovenščina', flag: '🇸🇮', locale: 'sl-SI' },
  { code: 'sr', label: 'Serbian', nativeLabel: 'Srpski', flag: '🇷🇸', locale: 'sr-RS' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦', locale: 'uk-UA' },
  { code: 'ca', label: 'Catalan', nativeLabel: 'Català', flag: '🇪🇸', locale: 'ca-ES' },
  { code: 'sq', label: 'Albanian', nativeLabel: 'Shqip', flag: '🇦🇱', locale: 'sq-AL' },
  { code: 'mt', label: 'Maltese', nativeLabel: 'Malti', flag: '🇲🇹', locale: 'mt-MT' },
  { code: 'lv', label: 'Latvian', nativeLabel: 'Latviešu', flag: '🇱🇻', locale: 'lv-LV' },
  { code: 'lt', label: 'Lithuanian', nativeLabel: 'Lietuvių', flag: '🇱🇹', locale: 'lt-LT' },
  { code: 'et', label: 'Estonian', nativeLabel: 'Eesti', flag: '🇪🇪', locale: 'et-EE' },
  { code: 'is', label: 'Icelandic', nativeLabel: 'Íslenska', flag: '🇮🇸', locale: 'is-IS' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', flag: '🇮🇱', locale: 'he-IL' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی', flag: '🇮🇷', locale: 'fa-IR' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', locale: 'hi-IN' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇧🇩', locale: 'bn-BD' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳', locale: 'ta-IN' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', flag: '🇵🇰', locale: 'ur-PK' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย', flag: '🇹🇭', locale: 'th-TH' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'tl', label: 'Filipino', nativeLabel: 'Filipino', flag: '🇵🇭', locale: 'fil-PH' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', flag: '🇰🇪', locale: 'sw-KE' },
  { code: 'af', label: 'Afrikaans', nativeLabel: 'Afrikaans', flag: '🇿🇦', locale: 'af-ZA' },
];

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function normalizeLangCode(lang: string | null | undefined): string {
  const code = (lang || 'it').toLowerCase().split('-')[0];
  return LANGUAGE_BY_CODE.has(code) ? code : 'en';
}

export function getFlagEmoji(lang: string | null | undefined): string {
  return LANGUAGE_BY_CODE.get(normalizeLangCode(lang))?.flag ?? '🌐';
}

export function getLanguageLabel(lang: string | null | undefined): string {
  const opt = LANGUAGE_BY_CODE.get(normalizeLangCode(lang));
  return opt ? opt.nativeLabel : 'English';
}

export function getLocaleForLang(lang: string | null | undefined): string {
  return LANGUAGE_BY_CODE.get(normalizeLangCode(lang))?.locale ?? 'en-GB';
}

export function isRtlLanguage(lang: string | null | undefined): boolean {
  const code = normalizeLangCode(lang);
  return code === 'ar' || code === 'he' || code === 'fa' || code === 'ur';
}
