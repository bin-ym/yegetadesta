// lib/ethiopian-calendar.ts
// Ethiopian Calendar Utilities - More accurate conversion

export interface EthiopianDate {
    year: number;
    month: string;
    day: number;
    dayOfWeek: string;
}

const ethiopianMonths = [
    "መስከረም", // 1
    "ጥቅምት",   // 2
    "ኅዳር",     // 3
    "ታኅሣሥ",   // 4
    "ጥር",      // 5
    "የካቲት",   // 6
    "መጋቢት",   // 7
    "ሚያዝያ",   // 8
    "ግንቦት",   // 9
    "ሰኔ",      // 10
    "ሐምሌ",    // 11
    "ነሐሴ",    // 12
    "ጳጉሜ",    // 13
];

const ethiopianDays = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];

// More accurate Gregorian to Ethiopian conversion
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

    // Calculate Ethiopian month and day
    // Ethiopian months are 30 days each (except Pagume which is 5-6 days)
    const daysInGregorianYear = Math.floor(
        (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86400000
    );

    // Ethiopian New Year starts on day 254 of Gregorian year (Sept 11)
    const ethiopianNewYearDay = 254;

    let daysSinceEthiopianNewYear: number;
    if (daysInGregorianYear >= ethiopianNewYearDay) {
        daysSinceEthiopianNewYear = daysInGregorianYear - ethiopianNewYearDay;
    } else {
        // Before Ethiopian New Year, count from previous year
        const prevYearDays = isLeapYear(year - 1) ? 366 : 365;
        daysSinceEthiopianNewYear =
            prevYearDays - ethiopianNewYearDay + daysInGregorianYear;
    }

    // Calculate month and day
    ethMonth = Math.floor(daysSinceEthiopianNewYear / 30);
    ethDay = (daysSinceEthiopianNewYear % 30) + 1;

    // Adjust for 0-based month index
    if (ethMonth > 12) {
        ethMonth = 12;
        ethDay = daysSinceEthiopianNewYear - 360 + 1;
    }

    const dayOfWeek = ethiopianDays[date.getDay()];

    return {
        year: ethYear,
        month: ethiopianMonths[ethMonth],
        day: ethDay,
        dayOfWeek: dayOfWeek,
    };
}

function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get Ethiopian date for a specific day of the week in current week
export function getEthiopianDateForDayOfWeek(dayName: string): EthiopianDate {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Map Ethiopian day names to numbers
    const dayMap: { [key: string]: number } = {
        እሁድ: 0,
        ሰኞ: 1,
        ማክሰኞ: 2,
        ረቡዕ: 3,
        ሐሙስ: 4,
        አርብ: 5,
        ቅዳሜ: 6,
    };

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

// Get all days of current week with Ethiopian dates
export function getCurrentWeekEthiopianDates(): { [key: string]: EthiopianDate } {
    const days = ["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"];
    const weekDates: { [key: string]: EthiopianDate } = {};

    days.forEach((day) => {
        weekDates[day] = getEthiopianDateForDayOfWeek(day);
    });

    return weekDates;
}
