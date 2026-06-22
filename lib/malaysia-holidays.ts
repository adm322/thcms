/**
 * Malaysian Public Holidays 2026
 * Sources: Official JPA/Kabinet calendar
 * Note: Some Islamic holidays are subject to moon sighting — dates are approximate.
 */

export interface MalaysianHoliday {
  date: string;       // ISO date string
  name: string;
  type: "NATIONAL" | "STATE" | "RELIGIOUS";
  states?: string[];  // If state-specific
  isPublicHoliday: boolean;
}

export interface SpecialPeriod {
  name: string;
  startDate: string;
  endDate: string;
  type: "FESTIVE" | "PEAK" | "SCHOOL_HOLIDAY";
  description: string;
  affectsWork: boolean;
}

// ─── 2026 Public Holidays ──────────────────────────────────

export const MALAYSIA_HOLIDAYS_2026: MalaysianHoliday[] = [
  // January
  { date: "2026-01-01", name: "New Year's Day", type: "NATIONAL", states: ["Most states except Johor, Kedah, Kelantan, Perlis, Terengganu"], isPublicHoliday: true },
  { date: "2026-01-14", name: "YDPB Negeri Sembilan's Birthday", type: "STATE", states: ["Negeri Sembilan"], isPublicHoliday: true },
  { date: "2026-01-25", name: "Thaipusam", type: "RELIGIOUS", states: ["Johor", "Kuala Lumpur", "Negeri Sembilan", "Penang", "Perak", "Putrajaya", "Selangor"], isPublicHoliday: true },

  // February
  { date: "2026-02-01", name: "Federal Territory Day", type: "STATE", states: ["Kuala Lumpur", "Labuan", "Putrajaya"], isPublicHoliday: true },
  { date: "2026-02-17", name: "Chinese New Year (1st Day)", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-02-18", name: "Chinese New Year (2nd Day)", type: "NATIONAL", isPublicHoliday: true },

  // March
  { date: "2026-03-04", name: "Israk & Mikraj", type: "RELIGIOUS", states: ["Kedah", "Negeri Sembilan", "Perlis"], isPublicHoliday: true },
  { date: "2026-03-23", name: "Sultan of Johor's Birthday", type: "STATE", states: ["Johor"], isPublicHoliday: true },

  // April
  { date: "2026-04-03", name: "Good Friday", type: "RELIGIOUS", states: ["Sabah", "Sarawak"], isPublicHoliday: true },
  { date: "2026-04-20", name: "Hari Raya Aidilfitri (1st Day)", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-04-21", name: "Hari Raya Aidilfitri (2nd Day)", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-04-26", name: "Sultan of Terengganu's Birthday", type: "STATE", states: ["Terengganu"], isPublicHoliday: true },

  // May
  { date: "2026-05-01", name: "Labour Day", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-05-04", name: "Wesak Day", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-05-17", name: "Raja Perlis' Birthday", type: "STATE", states: ["Perlis"], isPublicHoliday: true },
  { date: "2026-05-30", name: "Pesta Kaamatan (Harvest Festival)", type: "STATE", states: ["Sabah"], isPublicHoliday: true },
  { date: "2026-05-31", name: "Pesta Kaamatan (2nd Day)", type: "STATE", states: ["Sabah"], isPublicHoliday: true },

  // June
  { date: "2026-06-01", name: "Gawai Dayak", type: "STATE", states: ["Sarawak"], isPublicHoliday: true },
  { date: "2026-06-02", name: "Gawai Dayak (2nd Day)", type: "STATE", states: ["Sarawak"], isPublicHoliday: true },
  { date: "2026-06-07", name: "Hari Raya Haji / Aidiladha", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-06-27", name: "Awal Muharram (Islamic New Year)", type: "NATIONAL", isPublicHoliday: true },

  // July
  { date: "2026-07-07", name: "George Town World Heritage City Day", type: "STATE", states: ["Penang"], isPublicHoliday: true },
  { date: "2026-07-22", name: "Sarawak Day", type: "STATE", states: ["Sarawak"], isPublicHoliday: true },

  // August
  { date: "2026-08-31", name: "Merdeka Day (National Day)", type: "NATIONAL", isPublicHoliday: true },

  // September
  { date: "2026-09-05", name: "Maulidur Rasul (Prophet's Birthday)", type: "NATIONAL", isPublicHoliday: true },
  { date: "2026-09-16", name: "Malaysia Day", type: "NATIONAL", isPublicHoliday: true },

  // October
  { date: "2026-10-10", name: "Sabah Governor's Birthday", type: "STATE", states: ["Sabah"], isPublicHoliday: true },
  { date: "2026-10-20", name: "Deepavali", type: "NATIONAL", isPublicHoliday: true },

  // November — typically quiet month

  // December
  { date: "2026-12-11", name: "Sultan of Selangor's Birthday", type: "STATE", states: ["Selangor"], isPublicHoliday: true },
  { date: "2026-12-25", name: "Christmas Day", type: "NATIONAL", isPublicHoliday: true },
];

// ─── Special Periods ───────────────────────────────────────

export const SPECIAL_PERIODS_2026: SpecialPeriod[] = [
  {
    name: "Ramadan",
    startDate: "2026-02-18",
    endDate: "2026-03-19",
    type: "FESTIVE",
    description: "Muslim fasting month — expect reduced energy, shorter working hours for Muslim staff, avoid scheduling physically demanding training",
    affectsWork: true,
  },
  {
    name: "Hari Raya Aidilfitri Week",
    startDate: "2026-04-17",
    endDate: "2026-04-26",
    type: "FESTIVE",
    description: "Major holiday period — many staff will be on leave, avoid scheduling any training in this week",
    affectsWork: true,
  },
  {
    name: "Mid-Year School Holidays",
    startDate: "2026-05-23",
    endDate: "2026-06-07",
    type: "SCHOOL_HOLIDAY",
    description: "School holidays — some staff with children may take leave, but generally OK for training",
    affectsWork: false,
  },
  {
    name: "Hari Raya Haji Week",
    startDate: "2026-06-04",
    endDate: "2026-06-10",
    type: "FESTIVE",
    description: "Another major holiday — expect some leave requests",
    affectsWork: true,
  },
  {
    name: "Year-End Peak Season",
    startDate: "2026-11-15",
    endDate: "2026-12-31",
    type: "PEAK",
    description: "Year-end closing, budget finalization, annual leave clearing — training may have low attendance. Good for compliance refreshers only.",
    affectsWork: true,
  },
  {
    name: "Year-End School Holidays",
    startDate: "2026-11-21",
    endDate: "2026-12-31",
    type: "SCHOOL_HOLIDAY",
    description: "Long school break — many staff take family leave",
    affectsWork: false,
  },
];

// ─── Helper Functions ──────────────────────────────────────

/** Get all holidays for a specific month */
export function getHolidaysForMonth(year: number, month: number): MalaysianHoliday[] {
  return MALAYSIA_HOLIDAYS_2026.filter((h) => {
    const d = new Date(h.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Get all active special periods for a date */
export function getActivePeriods(dateStr: string): SpecialPeriod[] {
  const target = new Date(dateStr);
  return SPECIAL_PERIODS_2026.filter((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return target >= start && target <= end;
  });
}

/** Check if a specific date is a public holiday */
export function isPublicHoliday(dateStr: string): MalaysianHoliday | null {
  return MALAYSIA_HOLIDAYS_2026.find((h) => h.date === dateStr) || null;
}

/** Get the first day of Ramadan (approximate) */
export function getRamadanStart(): string {
  return "2026-02-18";
}

/** Get Hari Raya Aidilfitri dates */
export function getHariRayaDates(): string[] {
  return ["2026-04-20", "2026-04-21"];
}

/** Get peak/blackout periods where training should be avoided */
export function getBlackoutPeriods(): { name: string; start: string; end: string }[] {
  return [
    { name: "Hari Raya Aidilfitri", start: "2026-04-17", end: "2026-04-26" },
    { name: "Chinese New Year", start: "2026-02-16", end: "2026-02-20" },
    { name: "Year-End", start: "2026-12-20", end: "2026-12-31" },
  ];
}

/** Check if a date falls within a blackout period */
export function isBlackoutPeriod(dateStr: string): string | null {
  const target = new Date(dateStr);
  for (const bp of getBlackoutPeriods()) {
    const start = new Date(bp.start);
    const end = new Date(bp.end);
    if (target >= start && target <= end) return bp.name;
  }
  return null;
}

/** Check if a month is generally favorable for training */
export function isFavorableMonth(month: number): { favorable: boolean; warning?: string } {
  // Q1: Ramadan + CNY overlap in Feb-Mar = tricky
  if (month === 1) return { favorable: false, warning: "Chinese New Year falls this month — avoid scheduling" };
  if (month === 2) return { favorable: false, warning: "Ramadan typically falls here — expect reduced energy" };
  // Q2: Hari Raya + school holidays
  if (month === 3) return { favorable: true, warning: "Hari Raya may fall late April — check dates" };
  if (month === 4) return { favorable: true };
  if (month === 5) return { favorable: true, warning: "Hari Raya Haji in early June — plan around it" };
  // Q3: Generally good
  if (month === 6) return { favorable: true };
  if (month === 7) return { favorable: true };
  if (month === 8) return { favorable: true, warning: "Merdeka Day 31 Aug — avoid that day" };
  // Q4: Year-end rush
  if (month === 9) return { favorable: true };
  if (month === 10) return { favorable: true, warning: "Year-end peak approaching — schedule early Nov" };
  if (month === 11) return { favorable: false, warning: "Year-end peak — low attendance likely, compliance refreshers only" };
  return { favorable: false, warning: "Year-end closure — avoid training" };
}
