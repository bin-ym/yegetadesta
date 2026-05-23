# How to Get Telegram ID from Phone Number

## 📱 Method 1: Using @userinfobot (Recommended)

This is the easiest method for users.

### Steps:
1. **User opens Telegram app**
2. **User searches for** `@userinfobot`
3. **User clicks "Start" or sends any message**
4. **Bot instantly replies with:**
   ```
   Id: 123456789
   First name: John
   Username: @johndoe
   Language: en
   ```
5. **User shares the ID number with admin**
6. **Admin enters ID in the Add User form**

### Visual Flow:
```
User → Opens Telegram
     → Searches "@userinfobot"
     → Sends message
     → Receives ID: 123456789
     → Shares ID with Admin
     
Admin → Opens Admin Dashboard
      → Clicks "Add User"
      → Enters ID: 123456789
      → Fills other details
      → Saves
```

---

## 📱 Method 2: Using Contact Share

### Steps:
1. **User opens Telegram**
2. **User goes to Settings → Edit Profile**
3. **User shares their contact with admin via Telegram**
4. **Admin receives contact with Telegram ID embedded**
5. **Admin uses ID to add user**

---

## 📱 Method 3: Using Telegram Bot API (For Developers)

If you have a Telegram bot set up, you can search by phone number.

### Requirements:
- Active Telegram Bot
- Bot Token
- User must have started conversation with bot

### API Call:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getChat \
  -d "chat_id=+251911000001"
```

**Note:** This only works if the user has interacted with your bot before.

---

## 🔍 Method 4: Third-Party Services

Several websites offer Telegram ID lookup:
- https://t.me/username_to_id_bot
- https://t.me/getidsbot
- https://t.me/myidbot

**Warning:** Use trusted bots only. Never share sensitive information.

---

## ✅ Best Practice for Your App

### Recommended Workflow:

1. **Admin receives new member request**
   - Gets: Name, Phone Number, Address

2. **Admin contacts user via phone/WhatsApp**
   - Asks: "Please message @userinfobot on Telegram and share your ID"

3. **User follows instructions**
   - Opens Telegram
   - Messages @userinfobot
   - Gets ID instantly
   - Shares with admin

4. **Admin adds user**
   - Opens Admin Dashboard
   - Clicks "Add User"
   - Enters all details including Telegram ID
   - Saves

5. **User can now access the app**
   - Opens Telegram
   - Starts your bot
   - Gets authenticated automatically

---

## 📝 Template Message for Admin

Copy this message to send to new users:

```
Welcome to Kidase Call! 🙏

To complete your registration, please follow these steps:

1. Open Telegram
2. Search for @userinfobot
3. Send any message to the bot
4. The bot will reply with your Telegram ID
5. Share that ID number with me

Example: "My Telegram ID is 123456789"

Thank you!
```

---

## 🎯 In the Admin Interface

When adding a user, you'll see:

```
┌─────────────────────────────────────────┐
│  Add New User                           │
├─────────────────────────────────────────┤
│  ስም (Full Name)                         │
│  [አበበ ተስፋዬ                    ]        │
│                                         │
│  ክርስትና ስም (Baptism Name)               │
│  [ሚካኤል                        ]        │
│                                         │
│  ስልክ ቁጥር (Phone Number)                │
│  [+251911000001                ]        │
│                                         │
│  አድራሻ (Address)                         │
│  [ቦሌ                           ]        │
│                                         │
│  Telegram ID (e.g., 123456789)         │
│  [123456789                    ]        │
│                                         │
│  ℹ️ To get Telegram ID: Ask user to    │
│     message @userinfobot on Telegram   │
│                                         │
│  [        Add User        ]            │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Telegram ID is permanent** - It never changes for a user
2. **Phone number can change** - User can change phone but ID stays same
3. **Username can change** - User can change @username but ID stays same
4. **ID is numeric** - Always a number like 123456789
5. **No @ symbol** - Don't include @ in the ID field

---

## 🔒 Privacy & Security

- Telegram IDs are public information
- They don't reveal personal data
- Safe to share with trusted admins
- Used only for authentication
- Cannot be used to spam or hack accounts

---

## 💡 Pro Tips

1. **Save IDs in a spreadsheet** - Keep a backup list
2. **Verify before adding** - Ask user to confirm their ID
3. **Test immediately** - Have user try logging in right after adding
4. **Document the process** - Share this guide with all admins
5. **Use @userinfobot** - It's the fastest and most reliable method
