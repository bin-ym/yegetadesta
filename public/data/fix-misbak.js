const fs = require("fs");
const d = require("./misbak.json");

const amharicMonths = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
];

const perfectDates = [];
for (let month of amharicMonths) {
  for (let day = 1; day <= 30; day++) {
    perfectDates.push(`${month} ${day}`);
  }
}
for (let day = 1; day <= 6; day++) {
  perfectDates.push(`ጳጒሜ ${day}`);
}

// Generate the new misbak
const newMisbak = [];

// Try to build sequentially
for (let i = 0; i < 366; i++) {
  const pDate = perfectDates[i];

  // Check if the current element at index i seems to match?
  // Because they were sequential initially, most should just map index -> date.
  // However, user sometimes inserted/deleted items.
  // Let's just create a new object.
  const oldItem = i < d.length ? d[i] : null;

  newMisbak.push({
    id: i + 1,
    date: pDate,
    geez: oldItem ? oldItem.geez : "",
    translation: oldItem ? oldItem.translation : "",
    liturgy: oldItem ? oldItem.liturgy : "",
  });
}

fs.writeFileSync("./misbak.json", JSON.stringify(newMisbak, null, 4));
console.log("Fixed misbak.json to 366 days sequentially");
