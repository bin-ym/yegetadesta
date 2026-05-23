// lib/ethiopian-calendar.ts
// Ethiopian Calendar Utilities - Accurate conversion

export interface EthiopianDate {
    year: number;
    month: string;
    day: number;
    dayOfWeek: string;
}

const ethiopianMonths = [
    "መስከረም", // 1
    "ጥቅምት", // 2
    "ኅዳር", // 3
    "ታኅሣሥ", // 4
    "ጥር", // 5
    "የካቲት", // 6
    "መጋቢት", // 7
    "ሚያዝያ", // 8
    "ግንቦት", // 9
    "ሰኔ", // 10
    "ሐምሌ", // 11
    "ነሐሴ", // 12
    "ጳጉሜ", // 13
];

const ethiopianDays = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];

// Accurate Gregorian to Ethiopian conversion
export function gregorianToEthiopian(date: Date): EthiopianDate {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Ethiopian year is 7 or 8 years behind
    // Ethiopian New Year is September 11 (or 12 in leap years)
    let ethYear: number;
    let ethMonth: number;
    let ethDay: number;

    // Check if before or after Ethiopian New Year (Sept 11)
    if (month < 9 || (month === 9 && day < 11)) {
        // Before Ethiopian New Year
        ethYear = year - 8;
    } else {
        // After Ethiopian New Year
        ethYear = year - 7;
    }

    // Calculate day of year
    const startOfYear = new Date(year, 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

    // Ethiopian New Year starts on day 254 of Gregorian year (Sept 11)
    // or day 255 in leap years
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const ethiopianNewYearDay = isLeap ? 255 : 254;

    let daysSinceEthiopianNewYear: number;
    if (dayOfYear >= ethiopianNewYearDay) {
        // After Ethiopian New Year
        daysSinceEthiopianNewYear = dayOfYear - ethiopianNewYearDay + 1;
    } else {
        // Before Ethiopian New Year - count from previous year
        const prevYear = year - 1;
        const prevYearDays = ((prevYear % 4 === 0 && prevYear % 100 !== 0) || prevYear % 400 === 0) ? 366 : 365;
        const prevEthNewYear = ((prevYear % 4 === 0 && prevYear % 100 !== 0) || prevYear % 400 === 0) ? 255 : 254;
        daysSinceEthiopianNewYear = prevYearDays - prevEthNewYear + dayOfYear + 1;
    }

    // Calculate month and day (each Ethiopian month has 30 days, except Pagume)
    ethMonth = Math.floor((daysSinceEthiopianNewYear - 1) / 30);
    ethDay = ((daysSinceEthiopianNewYear - 1) % 30) + 1;

    // Ensure month is within bounds
    if (ethMonth > 12) {
        ethMonth = 12;
        ethDay = daysSinceEthiopianNewYear - 360;
    }

    const dayOfWeek = ethiopianDays[date.getDay()];

    return {
        year: ethYear,
        month: ethiopianMonths[ethMonth],
        day: ethDay,
        dayOfWeek: dayOfWeek,
    };
}

// Get Ethiopian date for a specific day of the week starting from Monday
export function getEthiopianDateForDayOfWeek(dayName: string): EthiopianDate {
    const today = new Date();

    // Map Ethiopian day names to numbers (Monday = 0, Sunday = 6)
    const dayMap: { [key: string]: number } = {
        ሰኞ: 0,      // Monday
        ማክሰኞ: 1,    // Tuesday
        ረቡዕ: 2,     // Wednesday
        ሐሙስ: 3,     // Thursday
        አርብ: 4,     // Friday
        ቅዳሜ: 5,     // Saturday
        እሁድ: 6,     // Sunday
    };

    // Get current day (0 = Sunday, 1 = Monday, etc.)
    const currentGregorianDay = today.getDay();

    // Convert to Monday-based (0 = Monday, 6 = Sunday)
    const currentDay = currentGregorianDay === 0 ? 6 : currentGregorianDay - 1;

    const targetDay = dayMap[dayName];
    const daysToAdd = targetDay - currentDay;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    return gregorianToEthiopian(targetDate);
}

// Get current Ethiopian date
export function getCurrentEthiopianDate(): EthiopianDate {
    return gregorianToEthiopian(new Date());
}

// Get all days of current week with Ethiopian dates (Monday to Sunday)
export function getCurrentWeekEthiopianDates(): { [key: string]: EthiopianDate } {
    const days = ["ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ", "እሁድ"];
    const weekDates: { [key: string]: EthiopianDate } = {};

    days.forEach((day) => {
        weekDates[day] = getEthiopianDateForDayOfWeek(day);
    });

    return weekDates;
}
