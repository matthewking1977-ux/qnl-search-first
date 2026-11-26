// Visiting facts shown in the "today" strip and the matching service answers.
// Source: qnl.qa "Hours and Location" and "Reading and Study Spaces" pages (as shared by QNL, Nov 2026).
import type { Lang } from '../i18n';

/** Library opening hours in Doha time, 24-hour clock. Friday is the only different day. */
export const HOURS = {
  weekday: { open: 8, close: 20 }, // Saturday to Thursday
  friday: { open: 16, close: 20 },
} as const;

type T = Record<Lang, string>;
export const STUDY_SPACES: { name: T; meta: T; kit: T }[] = [
  {
    name: { en: 'Group study rooms', ar: 'غرف الدراسة الجماعية' },
    meta: { en: '6 rooms · 4–6 people · 13 m²', ar: '6 غرف · \u20664–6\u2069 أشخاص · 13 م²' },
    kit: { en: 'Seating and power sockets', ar: 'مقاعد ومقابس كهرباء' },
  },
  {
    name: { en: 'Media lounge (large)', ar: 'صالة الوسائط (كبيرة)' },
    meta: { en: '1 room · up to 6 people · 28 m²', ar: 'غرفة واحدة · حتى 6 أشخاص · 28 م²' },
    kit: { en: 'Presentation, TV screen, media server, technician', ar: 'عرض تقديمي، شاشة تلفاز، خادم وسائط، فنّي' },
  },
  {
    name: { en: 'Media lounge (small)', ar: 'صالة الوسائط (صغيرة)' },
    meta: { en: '2 rooms · up to 4 people · 13 m²', ar: 'غرفتان · حتى 4 أشخاص · 13 م²' },
    kit: { en: 'Presentation, TV screen, media server, technician', ar: 'عرض تقديمي، شاشة تلفاز، خادم وسائط، فنّي' },
  },
  {
    name: { en: 'Individual study rooms (Quiet Zone)', ar: 'غرف الدراسة الفردية (المنطقة الهادئة)' },
    meta: { en: '28 rooms · 1 person', ar: '28 غرفة · شخص واحد' },
    kit: { en: 'Seating, a bookcase and a power socket', ar: 'مقعد ورف كتب ومقبس كهرباء' },
  },
  {
    name: { en: 'Night Study Space (Quiet Zone)', ar: 'مساحة الدراسة الليلية (المنطقة الهادئة)' },
    meta: { en: '70 places', ar: '70 مقعدًا' },
    kit: { en: 'PCs, seating and power sockets', ar: 'حواسيب ومقاعد ومقابس كهرباء' },
  },
];
