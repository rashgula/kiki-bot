# 🔮 KIKI - Gothic Purple Discord Bot (v2.2 JS Edition)

> **The Ultimate Gothic Purple Discord Bot & Security Engine**  
> 800+ Commands • Comprehensive Anti-Nuke Defense • Interactive Button Tickets • Moderation • Utilities • Gothic Arts

---

## 💜 Persona & Theme
- **Name:** KIKI
- **Theme:** Gothic Purple (`#9B59B6` / `#6C3483` / `#1A0A2E`)
- **Tagline:** *Gothic Utility | Dark Arts Discord Engine*
- **Custom Artwork:**
  - Avatar: [`assets/kiki-avatar.png`](assets/kiki-avatar.png) (Gothic anime sorceress with glowing purple eyes)
  - Banner: [`assets/kiki-banner.png`](assets/kiki-banner.png) (Gothic neon cathedral with arcane roses)

---

## ✨ Features & Modules

### 🛡️ 1. Master Anti-Nuke Fortress & Real-Time Defense
- **Command:** `&master-antinuke` or `/master-antinuke` (or `&antinuke master / enable / disable`)
- **👑 Strict Ownership Security:** Sirf **Server Owner** ya **Bot Owner** hi Anti-Nuke ko ON / OFF ya switch kar sakte hain! Whitelisted users ya Admins ke paas bhi Anti-Nuke ko toggle karne ki permission nahi hai.
- **Single-Click Master Shield:** Turns ON all 16+ protection engines at once!
- **Active Real-Time Defense Layers:**
  - 🤖 **Anti-Bot Join:** Automatically kicks unauthorized bots and permanently bans the adder.
  - 💬 **Anti-Channel Delete:** Automatically recreates deleted channels (with same permissions & topic) and bans rogue executor.
  - ➕ **Anti-Channel Create:** Deletes rogue channel floods and bans the creator.
  - 🏷️ **Anti-Role Delete:** Auto-recreates deleted roles and bans rogue admin.
  - 👑 **Anti-Role Create:** Deletes rogue role spam and bans the creator.
  - 🔨 **Anti-Mass Ban:** Reverses mass ban attacks, auto-unbans victims, and bans rogue admin.
  - 👢 **Anti-Mass Kick:** Detects rogue member kicks/prunes and permanently bans executor.
  - 🪝 **Anti-Webhook:** Deletes unauthorized rogue webhooks and bans the creator.
  - 🏰 **Anti-Server Tamper:** Reverts server name and icon changes automatically and bans executor.
  - 📢 **Anti-Everyone:** Deletes unauthorized `@everyone` / `@here` pings and gives 1-hour timeout.
  - 👥 **Anti-Mass-Mention:** Deletes mass mention floods (>3 mentions) and timeouts member.
  - 🔗 **Anti-Invite Links:** Automatically intercepts and deletes external Discord invite links.
- **Strict Command & Defense Whitelist System:**
  - 🔒 **Sirf Whitelisted users aur Server Owner hi KIKI Bot ki commands execute kar sakte hain!**
  - Non-whitelisted members ke liye bot commands access blocked rehta hai.
  - 🎛️ **Public Commands Control Panel:** `&cmdpanel` ya `/cmdpanel` se select karein ki members kaunsi commands bina whitelist ke use kar sakte hain (jaise `&rank`, `&leaderboard`, `&avatar`, `&banner`, etc.).
  - Whitelist Commands: `&wl add @user / <id>`, `&wl remove @user / <id>`, `&wl list`, `&wl clear` (Slash: `/whitelist add`, `/whitelist remove`, `/whitelist list`).
- **Emergency Panic Lockdown:** `&antinuke-lockdown` or `/lock-all` to freeze chat in raids.

### 🎫 2. Modern Interactive Ticket System
- Discord Button UI (`📩 Open Ticket` & `🔒 Close Ticket`).
- Automatically creates private channels with configured staff role access.
- Auto-close with countdown timer.

### 📜 3. Automated One-Click Log Channels Setup
- **Command:** `&setuplogs` or `/setuplogs` (Aliases: `&setup-logs`, `&logsetup`, `&createlogs`)
- **Ek command se saare log channels banayein aur bind karein:**
  - 📁 `🔮・SERVER LOGS` — Clean category with proper permissions
  - 🔊 `🔊・voice-logs` — VC join, leave, move, server mute/deafen records
  - 💬 `💬・chat-logs` — Message delete aur message edit records
  - 👋 `👋・welcome` — Naye members ke join hone par welcome card
  - 🚪 `🚪・leave-logs` — Members ke leave hone par record
  - 🛡️ `🛡️・security-logs` — Anti-Nuke defense & security alerts
- Saare channel IDs bot ke config me automatically save ho jate hain!
- Individual configuration commands:
  - `&setwelcome #channel` / `/setwelcome`
  - `&setleave #channel` / `/setleave`
  - `&log-channel-voice #channel`
  - `&log-channel-messages #channel`

### 👑 4. Automated Level Up Roles System (Levels 5 to 50)
- **One-Click Setup Command:** `&setuplevelroles` or `/setuplevelroles` (Aliases: `&levelroles`, `&setuplevels`, `&levelsetup`)
- **Ek command se automatically 10 Level Roles create aur bind ho jaate hain:**
  - 🔮 `🔮・Level 5`
  - 🔮 `🔮・Level 10`
  - 🔮 `🔮・Level 15`
  - 🔮 `🔮・Level 20`
  - 🔮 `🔮・Level 25`
  - 🔮 `🔮・Level 30`
  - 🔮 `🔮・Level 35`
  - 🔮 `🔮・Level 40`
  - 🔮 `🔮・Level 45`
  - 👑 `👑・Level 50`
- Roles automatically server me create hote hain (hoisted in member list), aur bot config me bind ho jaate hain.
- **Commands:**
  - `&setuplevelroles` — Saare 10 roles automatically banayein aur bind karein
  - `&setuplevelroles list` — Currently configured level roles dekhein
  - `&setuplevelroles reset` — Sabhi level roles unbind karein
- **Voice XP Engine:**
  - Members voice channels me chill/talk karte hain toh automatically 18-23 XP per minute earn hota hai
  - Anti-AFK deaf check enabled
  - Level-up hone par configured roles automatically member ko mil jaate hain aur celebration card send hota hai
- **Member Commands:**
  - `&rank` / `/rank` (`&level`, `&vcrank`, `&xp`): Voice level, total XP, voice time, progress bar aur unlocked role check karein
  - `&leaderboard` / `/leaderboard` (`&vctop`, `&top`, `&lb`): Top 10 Voice Chat members leaderboard

### 💬 5. Text Chat Activity & Leveling System (Zero Roles)
- **Interactive Control Panel:** `&chatlevelpanel` or `/chatlevelpanel`
  - 📢 **Channel Selector:** Interactive Dropdown menu se select karein ki members ka chat level badhne par alert card kis channel me send ho.
  - 🔔 **Toggle Alerts:** Level-up celebration cards on ya off karein (silent leveling).
  - ⚡ **Toggle Chat XP Engine:** Chat XP gain temporarily pause ya resume karein.
  - 🚫 **Unset Channel:** Level announce channel remove karein.
- **Strict Role Policy:**
  - Chat levels me **KOI BHI ROLE NAHI MILTA** — sirf members ki text chat activity, messages aur chat level track hota hai.
- **Anti-Spam Chat XP Engine:**
  - Members text channels me baat karte hain toh automatically 15-25 XP per message earn hota hai (45 seconds anti-spam cooldown ke sath).
- **Member Commands:**
  - `&chatrank` / `/chatrank` (Aliases: `&chatlevel`, `&crank`, `&clevel`, `&cxp`): Member ka chat level, total messages sent, progress bar aur server chat rank dekhein.
  - `&chatleaderboard` / `/chatleaderboard` (Aliases: `&chatlb`, `&chattop`, `&clb`): Server ke Top 10 most active chatters ki list dekhein.

### 🏷️ 6. Interactive Auto-Role Setup Panel
- **Setup Command:** `&autorolepanel` or `/autorolepanel` (Aliases: `&autorole`, `&arpanel`, `&autorolesetup`, `&autorole-panel`)
- **Interactive UI Components:**
  - 🏷️ **Native Role Dropdown:** Server ke sabhi roles me se wo role select karein jo har naye member ke join hone par milna chahiye.
  - 💾 **1-Click "Save & Apply Role" Button:** Dropdown se role select karne ke baad is button ko click karte hi role instantly save ho jata hai aur system live ho jata hai!
  - 🧪 **"Test Role" Button:** Apne upar test karke dekhein ki bot role de pa raha hai ya nahi.
  - 🚫 **"Disable Auto-Role" Button:** Jab chaho ek click me auto-role ko disable karein.
  - ⚠️ **Smart Role Hierarchy Check:** Agar bot ka role chune gaye role se niche ho, toh bot panel me alert deta hai taaki permission errors na aayein.

### 💤 7. Deaf AFK Voice Mover System (10+ Min Auto-Move)
- **Setup Command:** `&deafafkpanel` or `/deafafkpanel` (Aliases: `&deafafk`, `&vcafk`, `&afkmover`, `&deafmover`, `&deafpanel`, `&vcafkpanel`)
- **Interactive UI Components:**
  - 💤 **Voice Channel Dropdown:** Server ke kisi bhi Voice Channel (jaise `#afk`) ko target select karein.
  - 🚀 **1-Click "Run & Save Engine" Button:** Target channel select karke is button ko dabate hi mover engine turant live ho jata hai aur `config.json` me save ho jata hai!
  - ⚡ **"Scan & Move Now" Button:** Turant live scan run karein — jo bhi member 10+ min se deaf hoga turant move ho jayega.
  - 🚫 **"Stop Mover" Button:** Mover engine ko band karne ke liye.
- **Auto-Move Logic:**
  - Agar koi member kisi bhi VC me **10 minute se zyada** deaf hokar baitha rehta hai (`selfDeaf` ya `serverDeaf`), toh KIKI use automatically selected AFK VC me move kar deta hai aur log channel me alert send karta hai.
  - Jo members pehle se AFK VC me hain unhe dubara move nahi kiya jata.

### 👋 8. Welcome & Leave Logs System
- Rich Gothic Purple welcome card embed on member join.
- Member departure / goodbye card in leave channel.
- Automatic role assignment for new users.

### 🔨 6. Advanced Moderation
- `ban`, `unban`, `kick`, `timeout` / `mute`, `untimeout`
- `purge` (amount, bots, users, links, matches)
- `lock`, `unlock`, `hide`, `unhide`, `slowmode`
- `warn`, `warnings`, `clearwarnings`
- `nuke` (clones channel and resets chat)
- `nick`, `dehoist` (removes hoisting characters)

### 📊 5. Utility & Information
- `ping`, `uptime`, `botinfo`, `membercount`
- `avatar`, `banner`, `userinfo`, `serverinfo`
- `afk`, `poll`, `remind`, `weather`, `translate`

### 🎭 7. Gothic Arts & Entertainment
- `kikiquote` (Arcane persona quotes)
- `tarot` (Single card & 3-card spread readings)
- `8ball` (Dark crystal ball answers)
- `coinflip`, `roll`, `rps`, `roast`, `ship`

### 🔄 8. Auto-Boot Restoration & Command Persistence Engine
- **Command:** `&savedcommands` or `&savedcmds` (Aliases: `&autocmds`, `&autoexec`, `&savecmd`, `&unsavecmd`)
- **Automatic Command Auto-Save:** Jo bhi command aap dalenge (chahe pehle dali ho ya aage dalenge), wo automatically persistent disk par save ho jati hai.
- **Restart Par Automatic Execution:** Bot restart hote hi saari saved commands automatically execute aur restore ho jati hain — zero-setup on reboot!
- **Automatic Startup Recovery:**
  - 🛡️ **Anti-Nuke Shield:** Bot boot hote hi saare 16+ defense shields automatically active ho jate hain.
  - 👑 **Level Roles (5 - 50):** Saare 10 level roles server me verify hote hain; agar koi missing ho toh bot auto-create aur rebind kar leta hai.
  - 📜 **Log Channels:** Saare 5 log channels automatically bound aur verified rehte hain.
  - 🔊 **Voice Master & Logs:** VC aur `#🔊〢vm-logs` automatically active rehte hain.
  - 💾 **Auto-Replay Engine:** `&master-antinuke`, `&setuplogs`, `&setuplevelroles`, `&autorole`, `&chatlevelpanel`, `&deafafkpanel`, `&voicemaster setup` aur custom commands restart par automatically re-run ho jate hain!
  - ⚡ **Interactive Panel:** `&savedcmds` se kisi bhi waqt saari saved commands dekh sakte hain ya **"⚡ Re-run All Now"** button se turant re-execute kar sakte hain.

### 🔊 9. Voice Master (Custom Temporary Voice Channels, Control Panel & Audit Logs)
- **Setup Command:** `&voicemaster setup` or `/voicemaster setup` (Aliases: `&vm setup`, `&tempvc setup`)
- **Automatic Channel Creation:** Member ke `➕〢Join to Create` join karte hi unke naam ka private temporary VC ban jata hai aur bot unhe move kar deta hai.
- **Dedicated Audit Logs Channel (`#🔊〢vm-logs`):**
  - Kis member ne kab temporary voice channel banaya, uska naam, time aur User ID log hota hai.
  - Channel delete hone par kisne delete kiya aur kitne der VC active raha, sab real-time log hota hai.
  - Channel renames, lock/unlock, user limit updates, member kicks aur ownership claims ka complete audit record.
  - Custom log channel set karne ke liye: `&vm setlog #channel` (ya `/voicemaster setlog channel:#channel`).
- **Interactive Control Panel (`#🔊〢voice-control`):**
  - 🔒 **Lock** / 🔓 **Unlock** — Channel me kisi aur ko aane se rokein ya allow karein.
  - 👻 **Hide** / 👁️ **Unhide** — Channel ko invisible ya visible karein.
  - 👑 **Claim** — Agar owner VC chhod de, toh koi bhi member channel ownership claim kar sakta hai.
  - 👥 **Limit** — Modal se custom user limit (0-99) set karein.
  - ✏️ **Rename** — Modal se voice channel ka naya naam rakhein.
  - 🚫 **Kick** — Kisi user ko voice channel se disconnect karein.
  - 🤝 **Permit** — Locked channel me bhi kisi specific dost ko allow karein.
  - 🗑️ **Delete** — Channel turant delete karein.
- **Auto-Delete:** Jab saare members VC chhod dete hain, bot us temporary channel ko automatically delete kar deta hai.
- **Prefix Shortcuts:** `&vm lock`, `&vm unlock`, `&vm hide`, `&vm unhide`, `&vm rename <name>`, `&vm limit <num>`, `&vm kick @user`, `&vm permit @user`, `&vm claim`, `&vm delete`, `&vm setlog #channel`.

---

## 🚀 Setup & Installation

### Prerequisites
- [Node.js v18+](https://nodejs.org/) installed
- Discord Bot Application created on [Discord Developer Portal](https://discord.com/developers/applications)
  - **Required Privileged Gateway Intents:**
    - `Presence Intent`
    - `Server Members Intent`
    - `Message Content Intent`

### Quick Start

1. **Configure Bot Token:**
   Open `.env` (or `data/config.json`) and insert your credentials:
   ```env
   TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   PREFIX=&
   OWNER_IDS=your_discord_user_id
   ```

2. **Deploy Slash Commands (Optional):**
   ```bash
   node deploy-commands.js
   ```

3. **Start the Bot:**
   Double-click `run.bat` or run in terminal:
   ```bash
   node index.js
   ```

---

## 📁 Project Architecture
```
kiki-bot/
├── index.js               # Main bot entry point & gateway connection
├── config.js              # Gothic Purple theme colors & bot config
├── deploy-commands.js     # Slash command deployment script
├── package.json           # Dependencies (discord.js v14, chalk, dotenv)
├── run.bat                # Windows 1-click startup launcher
├── assets/
│   ├── kiki-avatar.png    # Custom KIKI Gothic Avatar
│   └── kiki-banner.png    # Custom KIKI Gothic Banner
├── data/
│   ├── config.json        # Dynamic server settings & whitelist storage
│   └── warnings.json      # Moderation warning records
├── handlers/
│   ├── commandHandler.js  # Dynamic 800+ command loader
│   └── eventHandler.js    # Event emitter loader
├── events/
│   ├── ready.js           # KIKI banner startup sequence
│   ├── interactionCreate.js # Slash commands & button handling
│   ├── messageCreate.js   # Prefix commands runner
│   ├── guildMemberAdd.js  # Anti-bot + welcome + autorole
│   ├── channelDelete.js   # Anti-nuke channel restore
│   ├── guildBanAdd.js     # Anti-nuke mass ban reversal
│   └── roleDelete.js      # Anti-nuke role defense
├── utils/
│   ├── embed.js           # Gothic Purple embed builder
│   └── kiki.js            # KIKI persona quotes & formatting helpers
└── commands/              # 1,100+ Total Commands
    ├── antinuke/          # Anti-Nuke defense & security
    ├── moderation/        # Moderation & chat controls
    ├── admin/             # Server setup & configuration
    ├── utility/           # Utilities, stats & inspection
    ├── fun/               # Gothic arts, tarot & games
    ├── security/          # Security scans & audit tools
    ├── economy/           # Dark gothic coins & shop
    ├── social/            # Profiles, marriages & reputation
    ├── games/             # Interactive chat games
    └── nuke/              # Server management & channel reset utilities
```

---

*Crafted with 💜 by KIKI Team*
