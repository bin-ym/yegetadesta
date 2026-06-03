import fs from "fs";

let MEMBERS: any[] = [];
if (fs.existsSync("prisma/members.txt")) {
  const content = fs.readFileSync("prisma/members.txt", "utf-8");
  const lines = content.split("\n");
  let currentMember: any = {};

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (Object.keys(currentMember).length > 0) {
        if (!currentMember.fullName) currentMember.fullName = "Unknown";
        MEMBERS.push(currentMember);
        currentMember = {};
      }
      continue;
    }

    // Parse using common Amharic and English colons
    const splitMatch = line.match(/(፡-|:-|:|፤-)/);
    if (splitMatch) {
      const splitIndex = line.indexOf(splitMatch[0]);
      const key = line.substring(0, splitIndex).trim();
      const value = line.substring(splitIndex + splitMatch[0].length).trim();

      if (key.includes("የክርስትና ስም")) {
        currentMember.baptismName = value;
      } else if (key.includes("ስልክ ቁጥር")) {
        currentMember.phoneNumber = value;
      } else if (key.includes("ስም")) {
        currentMember.fullName = value;
      } else if (key.includes("አድራሻ")) {
        currentMember.address = value;
      }
    }
  }
  if (Object.keys(currentMember).length > 0) {
    if (!currentMember.fullName) currentMember.fullName = "Unknown";
    MEMBERS.push(currentMember);
  }
}
console.log(MEMBERS.length);
