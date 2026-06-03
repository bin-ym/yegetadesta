import fs from "fs";

const users = [
  {

    fullName: "ማህሌት አማረ",

    baptismName: "ወለተመድህን",

    phoneNumber: "0923491483",

    address: "ፓስተር",

  },

  {

    fullName: "መቅደላዊት ታሪኩ",

    baptismName: "መንበረ ማርያም",

    phoneNumber: "0966996601",

    address: "አ.አ, አብነት",

  },

  {

    fullName: "ታሪኳ ታደለ",

    baptismName: "ወለተ ሰንበት",

    phoneNumber: "0970230532",

    address: "ሳሪስ",

  },

  {

    fullName: "ኪድስቲን ሚንወሌት",

    baptismName: "እህተ ማርያም",

    phoneNumber: "0973383985",

    address: "ጎሮ",

  },

  {

    fullName: "ረድኤት ኃይሉ አበበ",

    baptismName: "አስካለ ማርያም",

    phoneNumber: "0982181479",

    address: "ኮተቤ",

  },

  {

    fullName: "አርሴማ ጌታቸው",

    baptismName: "ፍቅርተ አማኑኤል",

    phoneNumber: "0994438618",

    address: "ቂርቆስ",

  },

  {

    fullName: "ዕፀገነት በቃሉ",

    baptismName: "ኪዳነ ድንግል",

    phoneNumber: "0977056541",

    address: "ሀዋሳ ደብረ ምሕረት ቅዱስ ገብርኤል ገዳም",

  },

  {

    fullName: "ናርዶስ አለማየሁ",

    baptismName: "ፍቅርተ ሥላሴ",

    phoneNumber: "0983501598",

    address: "አዲስ አበባ, ጥቁር አንበሳ",

  },

  {

    fullName: "ገብርኤላ በሀይሉ",

    baptismName: "እሴተ ገብርኤል",

    phoneNumber: "0923462202",

    address: "ቀጨኔ መድሃኔዓለም",

  },

  {

    fullName: "ዳዊት ጌቱ",

    baptismName: "ተክለማርያም",

    phoneNumber: "0908813115",

    address: "አዲስ አበባ, ላምበረት",

  },

  {

    fullName: "ጽዮን ብሩ",

    baptismName: "እኅተ መልአክ",

    phoneNumber: "0963345089",

    address: "አዲስ አበባ, ልደታ",

  },

  {

    fullName: "ሰንሴት ዳምጠው",

    baptismName: "እሴተ ፃዲቅ",

    phoneNumber: "0916039583",

    address: "ጅማ ዮኒቨርስቲ",

  },

  {

    fullName: "አዜብ አስፋ",

    baptismName: "",

    phoneNumber: "0945968554",

    address: "አዲስ አበባ 6 ኪሎ",

  },

  {

    fullName: "ምልኪ ሔይኢ",

    baptismName: "ወለተ ኪዳን",

    phoneNumber: "0937809441",

    address: "",

  },

  {

    fullName: "ናርዶስ ካሳዬ",

    baptismName: "ወለተ ሚካኤል",

    phoneNumber: "0913016716",

    address: "አዲስ አበባ",

  },

  {

    fullName: "ትንሣኤ ግርማ",

    baptismName: "እህተ ጻድቅ",

    phoneNumber: "0909776615",

    address: "ሰሚት መድኃኔዓለም",

  },

  {

    fullName: "አፍሬም ትግሬ",

    baptismName: "ጽጌ ማርያም",

    phoneNumber: "0923205241",

    address: "ጅማ",

  },

  {

    fullName: "ኢየሩሳለም ፋንቱ",

    baptismName: "ወለተ ትንሣኤ",

    phoneNumber: "0905329188",

    address: "ጅማ ቅዱስ ገብርኤል",

  },

  {

    fullName: "ቤተልሔም ዘርዓይ",

    baptismName: "ወለተ ኢየሱስ",

    phoneNumber: "0988240811",

    address: "ኮዬ ፈጬ",

  },

  {

    fullName: "ፍሬወርቅ",

    baptismName: "ወለተ ወልድ",

    phoneNumber: "0964262359",

    address: "ወይራ ሰፈር",

  },

  {

    fullName: "ሀብታሙ ተመስገን",

    baptismName: "ገብረመስቀል",

    phoneNumber: "0974321389",

    address: "መገናኛ",

  },

  {

    fullName: "ሰብለ ጣሰው",

    baptismName: "ወለተዮሐንስ",

    phoneNumber: "0985011541",

    address: "የካ ሚካኤል",

  },

  {

    fullName: "ሃና",

    baptismName: "አስካለ ማርያም",

    phoneNumber: "+251985451319",

    address: "",

  },

  {

    fullName: "ይደነቁ አስማማው",

    baptismName: "ወለተ ፃድቅ",

    phoneNumber: "0935204962",

    address: "ሰሚት",

  },

  {

    fullName: "ሀናኒ ካሳ",

    baptismName: "ወለተ ሚካኤል",

    phoneNumber: "0929419294",

    address: "ቦሌ ሚካኤል",

  },

  {

    fullName: "ቤተልሔም ኃይሉ",

    baptismName: "እህተ ማርያም",

    phoneNumber: "0962103743",

    address: "መስቀል ፍላወር",

  },

  {

    fullName: "ታምራት ተስፋዬ",

    baptismName: "ኪንፈ ሚካኤል",

    phoneNumber: "0975834748",

    address: "አዲስ አበባ, ሰሚት",

  },

  {

    fullName: "ናሆም ካሳዬ",

    baptismName: "ገብረ  hiwot",

    phoneNumber: "0945439812",

    address: "ወለቴ",

  },

  {

    fullName: "ቤተልሔም ንስራነ",

    baptismName: "እህተ ማርያም",

    phoneNumber: "0988384910",

    address: "አዳማ / አዲስ አበባ",

  },

  {

    fullName: "ስርጉተ",

    baptismName: "እየሩስ ሚካኤል",

    phoneNumber: "0903103321",

    address: "ሳሪስ",

  },

  {

    fullName: "ናርዶስ በሽር",

    baptismName: "ብርሃነ መድህን",

    phoneNumber: "0974328485",

    address: "ብስራተ ገብርኤል",

  },

  {

    fullName: "ሜሮን አክሊሉ",

    baptismName: "ፅጌ ማርያም",

    phoneNumber: "0916585233",

    address: "ቡልጋሪያ ወይም ሰበታ",

  },

];

const text = users
  .map(
    (u) => `ስም፡- ${u.fullName}
የክርስትና ስም፡- ${u.baptismName ?? ""}
ስልክ ቁጥር፡- ${u.phoneNumber ?? ""}
አድራሻ፡- ${u.address ?? ""}`
  )
  .join("\n\n");

fs.writeFileSync("prisma/members.txt", text, "utf8");

console.log(`Generated ${users.length} members`);