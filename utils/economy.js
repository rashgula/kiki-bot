// KIKI Bot - Full Gothic Economy & RPG Engine (Atomic Persistence + CloudSync Ready)
const fs = require('fs');
const path = require('path');
const CloudSync = require('./cloudSync.js');

const LEGACY_ECO_FILE = path.join(__dirname, '..', 'data', 'economy.json');

function getEcoFile() {
  const target = CloudSync.getDataFile('economy.json');
  if (!fs.existsSync(target) && fs.existsSync(LEGACY_ECO_FILE)) {
    try {
      const legacy = CloudSync.readJsonSafe(LEGACY_ECO_FILE, null);
      if (legacy && typeof legacy === 'object') CloudSync.writeJsonAtomic(target, legacy);
    } catch {}
  }
  return target;
}

function loadEcoData() {
  const data = CloudSync.readJsonSafe(getEcoFile(), null);
  if (data && typeof data === 'object') {
    if (!data.users) data.users = {};
    if (!data.shop) data.shop = {};
    return data;
  }
  return { users: {}, shop: {} };
}

function saveEcoData(data) {
  try {
    CloudSync.writeJsonAtomic(getEcoFile(), data);
  } catch (err) {
    console.error('[ECO SAVE ERROR]', err.message);
  }
}

const SHOP_ITEMS = [
  { id: 'shield', name: '🛡️ Gothic Aegis Shield', price: 2500, desc: 'Blocks 1 robbery attempt against you or halves crime fines' },
  { id: 'tarot_charm', name: '🔮 Obsidian Tarot Charm', price: 1500, desc: 'Increases dice gamble win chance (+17% odds)' },
  { id: 'dark_crown', name: '👑 Phantom Crown', price: 10000, desc: 'Prestige role symbol of the dark elite' },
  { id: 'shadow_dagger', name: '🗡️ Shadow Dagger', price: 3000, desc: 'Boosts crime/robbery success and hunt payouts (+20%)' },
  { id: 'golden_ring', name: '💍 Gothic Marriage Ring', price: 5000, desc: 'Prestige gothic union ring' },
  { id: 'lucky_dice', name: '🎲 Cursed Lucky Dice', price: 2000, desc: 'Gives +20% bonus coins on successful dice gambles' },
  { id: 'pickaxe', name: '⛏️ Abyssal Pickaxe', price: 2200, desc: 'Boosts cavern ore mining payouts by +25%' }
];

const GOTHIC_JOBS = [
  { title: '⚰️ Graveyard Caretaker', pay: [300, 550], desc: 'Patrolled the midnight catacombs and warded off ghouls.' },
  { title: '🔮 Tarot Card Reader', pay: [350, 600], desc: 'Read the dark fortunes of travelers in the purple mist.' },
  { title: '🧪 Alchemist Apprentice', pay: [400, 650], desc: 'Brewed potent glowing elixirs for the coven.' },
  { title: '🗡️ Demon Slayer Scout', pay: [450, 700], desc: 'Tracked rogue shadow beasts across the nether peaks.' },
  { title: '📜 Ancient Grimoire Scribe', pay: [300, 500], desc: 'Transcribed cursed runic spells into gothic leather tomes.' },
  { title: '🌙 Lunar Clockmaker', pay: [350, 580], desc: 'Calibrated the silver gears of the eternal eclipse clock.' }
];

const FISH_TYPES = [
  { name: '🐟 Shadow Guppy', value: 150, rarity: 'Common' },
  { name: '🐠 Neon Phantom Tetra', value: 300, rarity: 'Uncommon' },
  { name: '🐡 Abyssal Puffer', value: 500, rarity: 'Rare' },
  { name: '🦈 Void Leviathan Pup', value: 1200, rarity: 'Legendary' },
  { name: '🌿 Slimy Swamp Eel', value: 80, rarity: 'Common' }
];

const HUNT_TYPES = [
  { name: '🦇 Twilight Vampire Bat', value: 180, rarity: 'Common' },
  { name: '🐺 Shadow Direwolf', value: 450, rarity: 'Uncommon' },
  { name: '🦅 Night Phantom Raven', value: 320, rarity: 'Common' },
  { name: '🦌 Eclipse Ghost Stag', value: 1500, rarity: 'Mythic' },
  { name: '🕷️ Bloodweb Arachnid', value: 250, rarity: 'Common' }
];

const ORE_TYPES = [
  { name: '🪨 Obsidian Shard', value: 200, rarity: 'Common' },
  { name: '🔮 Amethyst Cluster', value: 420, rarity: 'Uncommon' },
  { name: '💎 Void Quartz', value: 650, rarity: 'Rare' },
  { name: '🩸 Blood Ruby', value: 980, rarity: 'Epic' },
  { name: '✨ Astral Diamond', value: 1650, rarity: 'Legendary' }
];

const Economy = {
  SHOP_ITEMS,

  saveNow() {
    const data = loadEcoData();
    saveEcoData(data);
  },

  getUser(guildId, userId) {
    const data = loadEcoData();
    if (!data.users) data.users = {};
    const key = `${guildId || 'global'}_${userId}`;
    if (!data.users[key]) {
      data.users[key] = {
        wallet: 500,
        bank: 0,
        bankMax: 50000,
        streak: 0,
        lastDaily: 0,
        lastWeekly: 0,
        lastMonthly: 0,
        lastWork: 0,
        lastCrime: 0,
        lastFish: 0,
        lastHunt: 0,
        lastMine: 0,
        lastRob: 0,
        inventory: {}
      };
      saveEcoData(data);
    }
    return { data, key, user: data.users[key] };
  },

  getBalance(guildId, userId) {
    const { user } = this.getUser(guildId, userId);
    const total = (user.wallet || 0) + (user.bank || 0);
    return {
      wallet: user.wallet || 0,
      bank: user.bank || 0,
      total,
      netWorth: total,
      bankMax: user.bankMax || 50000
    };
  },

  addWallet(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    user.wallet = Math.max(0, (user.wallet || 0) + Math.floor(amount));
    saveEcoData(data);
    return user.wallet;
  },

  removeWallet(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    user.wallet = Math.max(0, (user.wallet || 0) - Math.floor(amount));
    saveEcoData(data);
    return user.wallet;
  },

  deposit(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    const wallet = user.wallet || 0;
    const raw = String(amount || '').toLowerCase();
    const toDeposit = raw === 'all' || raw === 'max' ? wallet : parseInt(amount, 10);

    if (isNaN(toDeposit) || toDeposit <= 0) {
      return { success: false, error: 'Valid amount enter karein!', message: 'Valid positive amount enter karein (e.g. `&dep 500` ya `&dep all`).' };
    }
    if (wallet < toDeposit) {
      const msg = `Aapke wallet mein sirf **${wallet.toLocaleString()} coins** hain!`;
      return { success: false, error: msg, message: msg };
    }

    const maxSpace = (user.bankMax || 50000) - (user.bank || 0);
    if (maxSpace <= 0) {
      const msg = 'Aapka bank account full hai! Pehle capacity use karein.';
      return { success: false, error: msg, message: msg };
    }

    const actual = Math.min(toDeposit, maxSpace);
    user.wallet -= actual;
    user.bank = (user.bank || 0) + actual;
    saveEcoData(data);

    return {
      success: true,
      amount: actual,
      wallet: user.wallet,
      bank: user.bank,
      balance: user.wallet,
      message: `Aapne **${actual.toLocaleString()} Gothic Coins** safely Bank Vault me deposit kar diye!`
    };
  },

  withdraw(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    const bank = user.bank || 0;
    const raw = String(amount || '').toLowerCase();
    const toWithdraw = raw === 'all' || raw === 'max' ? bank : parseInt(amount, 10);

    if (isNaN(toWithdraw) || toWithdraw <= 0) {
      return { success: false, error: 'Valid amount enter karein!', message: 'Valid positive amount enter karein (e.g. `&with 500` ya `&with all`).' };
    }
    if (bank < toWithdraw) {
      const msg = `Aapke bank mein sirf **${bank.toLocaleString()} coins** hain!`;
      return { success: false, error: msg, message: msg };
    }

    user.bank -= toWithdraw;
    user.wallet = (user.wallet || 0) + toWithdraw;
    saveEcoData(data);

    return {
      success: true,
      amount: toWithdraw,
      wallet: user.wallet,
      bank: user.bank,
      balance: user.wallet,
      message: `Aapne Bank Vault se **${toWithdraw.toLocaleString()} Gothic Coins** withdraw kar liye!`
    };
  },

  transfer(guildId, fromUserId, toUserId, amount) {
    if (fromUserId === toUserId) {
      return { success: false, error: 'Khud ko transfer nahi kar sakte!', message: 'Aap khud ko coins transfer nahi kar sakte!' };
    }
    const val = parseInt(amount, 10);
    if (isNaN(val) || val <= 0) {
      return { success: false, error: 'Valid amount enter karein!', message: 'Valid positive coin amount enter karein!' };
    }

    const from = this.getUser(guildId, fromUserId);
    if ((from.user.wallet || 0) < val) {
      const msg = `Aapke wallet mein sirf **${(from.user.wallet || 0).toLocaleString()} coins** hain!`;
      return { success: false, error: msg, message: msg };
    }

    const to = this.getUser(guildId, toUserId);
    const data = loadEcoData();
    data.users[from.key].wallet -= val;
    data.users[to.key].wallet = (data.users[to.key].wallet || 0) + val;
    saveEcoData(data);

    const newFromWallet = data.users[from.key].wallet;
    return {
      success: true,
      amount: val,
      fromWallet: newFromWallet,
      toWallet: data.users[to.key].wallet,
      wallet: newFromWallet,
      balance: newFromWallet,
      message: `Successfully transferred **${val.toLocaleString()} Gothic Coins**!`
    };
  },

  claimDaily(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const diff = now - (user.lastDaily || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Daily reward cooldown active!' };
    }

    user.streak = diff < cooldown * 2 ? (user.streak || 0) + 1 : 1;
    const baseReward = 500;
    const streakBonus = Math.min(user.streak * 50, 1000);
    const totalReward = baseReward + streakBonus;

    user.wallet = (user.wallet || 0) + totalReward;
    user.lastDaily = now;
    saveEcoData(data);

    return {
      success: true,
      amount: totalReward,
      payout: totalReward,
      streak: user.streak,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Aapko **+${totalReward.toLocaleString()} Gothic Coins** daily gift mila!`
    };
  },

  claimWeekly(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    const diff = now - (user.lastWeekly || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Weekly reward cooldown active!' };
    }

    const reward = 2500 + Math.min((user.streak || 0) * 100, 1500);
    user.wallet = (user.wallet || 0) + reward;
    user.lastWeekly = now;
    saveEcoData(data);

    return {
      success: true,
      amount: reward,
      payout: reward,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Aapko weekly allowance **+${reward.toLocaleString()} Gothic Coins** mile!`
    };
  },

  claimMonthly(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 30 * 24 * 60 * 60 * 1000;
    const diff = now - (user.lastMonthly || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Monthly jackpot cooldown active!' };
    }

    const reward = 10000;
    user.wallet = (user.wallet || 0) + reward;
    user.lastMonthly = now;
    saveEcoData(data);

    return {
      success: true,
      amount: reward,
      payout: reward,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Monthly Elite Jackpot **+${reward.toLocaleString()} Gothic Coins** aapke wallet mein add ho gaya!`
    };
  },

  work(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 60 * 60 * 1000;
    const diff = now - (user.lastWork || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Work cooldown active!' };
    }

    const job = GOTHIC_JOBS[Math.floor(Math.random() * GOTHIC_JOBS.length)];
    const pay = Math.floor(Math.random() * (job.pay[1] - job.pay[0] + 1)) + job.pay[0];

    user.wallet = (user.wallet || 0) + pay;
    user.lastWork = now;
    saveEcoData(data);

    return {
      success: true,
      job: job.title,
      desc: job.desc,
      amount: pay,
      payout: pay,
      wallet: user.wallet,
      balance: user.wallet
    };
  },

  crime(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 2 * 60 * 60 * 1000;
    const diff = now - (user.lastCrime || 0);

    if (diff < cooldown) {
      return {
        success: false,
        cooldown: true,
        remainingMs: cooldown - diff,
        wallet: user.wallet || 0,
        balance: user.wallet || 0,
        message: 'Aap abhi cooldown me hain! Thoda intezar karein.'
      };
    }

    user.lastCrime = now;
    const hasDagger = (user.inventory?.shadow_dagger || 0) > 0;
    const hasShield = (user.inventory?.shield || 0) > 0;
    const chance = hasDagger ? 0.77 : 0.65;

    if (Math.random() < chance) {
      const loot = Math.floor(Math.random() * 600) + 350;
      user.wallet = (user.wallet || 0) + loot;
      saveEcoData(data);
      return {
        success: true,
        win: true,
        amount: loot,
        payout: loot,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Dark heist kamyab rahi! Aapne shadows se **+${loot.toLocaleString()} Gothic Coins** loot liye!`
      };
    } else {
      let fine = Math.min(user.wallet || 0, Math.floor(Math.random() * 250) + 150);
      if (hasShield && fine > 0) fine = Math.floor(fine / 2);
      user.wallet = Math.max(0, (user.wallet || 0) - fine);
      saveEcoData(data);
      return {
        success: false,
        win: false,
        fine,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Coven Guards ne aapko pakad liya! Aap par **-${fine.toLocaleString()} Coins** ka fine laga.`
      };
    }
  },

  fish(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 5 * 60 * 1000;
    const diff = now - (user.lastFish || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Fishing cooldown active!' };
    }

    user.lastFish = now;
    const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
    user.wallet = (user.wallet || 0) + fish.value;
    saveEcoData(data);

    return {
      success: true,
      fish: fish.name,
      rarity: fish.rarity,
      value: fish.value,
      payout: fish.value,
      amount: fish.value,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Aapne obsidian lake se **${fish.name}** (${fish.rarity}) pakdi aur **+${fish.value} Coins** kamaye!`
    };
  },

  hunt(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 10 * 60 * 1000;
    const diff = now - (user.lastHunt || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Hunting cooldown active!' };
    }

    user.lastHunt = now;
    const animal = HUNT_TYPES[Math.floor(Math.random() * HUNT_TYPES.length)];
    const hasDagger = (user.inventory?.shadow_dagger || 0) > 0;
    const payout = hasDagger ? Math.floor(animal.value * 1.2) : animal.value;
    user.wallet = (user.wallet || 0) + payout;
    saveEcoData(data);

    return {
      success: true,
      animal: animal.name,
      rarity: animal.rarity,
      value: payout,
      payout,
      amount: payout,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Aapne **${animal.name}** (${animal.rarity}) ka shikar kiya${hasDagger ? ' *(🗡️ Dagger +20%)*' : ''}!`
    };
  },

  mine(guildId, userId) {
    const { data, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 8 * 60 * 1000;
    const diff = now - (user.lastMine || 0);

    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Mining cooldown active!' };
    }

    user.lastMine = now;
    const ore = ORE_TYPES[Math.floor(Math.random() * ORE_TYPES.length)];
    const hasPickaxe = (user.inventory?.pickaxe || 0) > 0;
    const payout = hasPickaxe ? Math.floor(ore.value * 1.25) : ore.value;
    user.wallet = (user.wallet || 0) + payout;
    saveEcoData(data);

    return {
      success: true,
      ore: ore.name,
      rarity: ore.rarity,
      value: payout,
      payout,
      amount: payout,
      wallet: user.wallet,
      balance: user.wallet,
      message: `Cavern se aapko **${ore.name}** (${ore.rarity}) mila${hasPickaxe ? ' *(⛏️ Pickaxe +25%)*' : ''}!`
    };
  },

  rob(guildId, robberId, victimId) {
    if (robberId === victimId) {
      return { success: false, error: 'Khud ko rob nahi kar sakte!', message: 'Aap khud ki jeb nahi kaat sakte!' };
    }
    const { data, key: rKey, user: robber } = this.getUser(guildId, robberId);
    const { key: vKey, user: victim } = this.getUser(guildId, victimId);

    const now = Date.now();
    const cooldown = 60 * 60 * 1000;
    const diff = now - (robber.lastRob || 0);
    if (diff < cooldown) {
      return { success: false, cooldown: true, remainingMs: cooldown - diff, message: 'Robbery cooldown active!' };
    }

    if ((victim.wallet || 0) < 100) {
      return { success: false, error: 'Victim poor hai!', message: 'Target ke wallet me kam se kam **100 Coins** hone chahiye!' };
    }

    const freshData = loadEcoData();
    const r = freshData.users[rKey];
    const v = freshData.users[vKey];
    r.lastRob = now;

    if ((v.inventory?.shield || 0) > 0) {
      v.inventory.shield -= 1;
      if (v.inventory.shield <= 0) delete v.inventory.shield;
      saveEcoData(freshData);
      return {
        success: false,
        blockedByShield: true,
        wallet: r.wallet,
        balance: r.wallet,
        message: '🛡️ Target ke paas **Gothic Aegis Shield** tha! Shield toot gaya aur chori block ho gayi!'
      };
    }

    const hasDagger = (r.inventory?.shadow_dagger || 0) > 0;
    if (Math.random() < (hasDagger ? 0.58 : 0.45)) {
      const pct = 0.15 + Math.random() * 0.2;
      const stolen = Math.max(50, Math.min(v.wallet, Math.floor(v.wallet * pct)));
      v.wallet -= stolen;
      r.wallet = (r.wallet || 0) + stolen;
      saveEcoData(freshData);
      return {
        success: true,
        amount: stolen,
        payout: stolen,
        wallet: r.wallet,
        balance: r.wallet,
        message: `Chुपचाप safalta! Aapne target ke wallet se **+${stolen.toLocaleString()} Coins** uda liye!`
      };
    } else {
      const fine = Math.min(r.wallet || 0, Math.floor(Math.random() * 250) + 120);
      r.wallet = Math.max(0, (r.wallet || 0) - fine);
      saveEcoData(freshData);
      return {
        success: false,
        fine,
        wallet: r.wallet,
        balance: r.wallet,
        message: `Pakde gaye! Guards ko **-${fine.toLocaleString()} Coins** penalty bharna pada!`
      };
    }
  },

  gamble(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    const bet = parseInt(amount, 10);
    if (isNaN(bet) || bet <= 0) {
      return { success: false, error: 'Invalid bet amount! Positive number dein.', message: 'Invalid bet amount! Positive number enter karein.' };
    }
    if ((user.wallet || 0) < bet) {
      const msg = `Aapke paas itne coins nahi hain! Wallet: **${(user.wallet || 0).toLocaleString()} coins**`;
      return { success: false, error: msg, message: msg };
    }

    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const total = roll1 + roll2;
    const hasCharm = (user.inventory?.tarot_charm || 0) > 0;
    const hasDice = (user.inventory?.lucky_dice || 0) > 0;
    const winThreshold = hasCharm ? 6 : 7;
    const win = total >= winThreshold;

    if (win) {
      const payout = hasDice ? Math.floor(bet * 1.2) : bet;
      user.wallet = (user.wallet || 0) + payout;
      saveEcoData(data);
      return {
        success: true,
        win: true,
        roll1,
        roll2,
        total,
        profit: payout,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Dice Rolled **${roll1} + ${roll2} = ${total}**! Aapne **+${payout.toLocaleString()} Coins** jeete!`
      };
    } else {
      user.wallet = (user.wallet || 0) - bet;
      saveEcoData(data);
      return {
        success: true,
        win: false,
        roll1,
        roll2,
        total,
        lost: bet,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Dice Rolled **${roll1} + ${roll2} = ${total}** (Need ${winThreshold}+). Aap **-${bet.toLocaleString()} Coins** haar gaye!`
      };
    }
  },

  slots(guildId, userId, amount) {
    const { data, user } = this.getUser(guildId, userId);
    const bet = parseInt(amount, 10);
    if (isNaN(bet) || bet <= 0) {
      return { success: false, error: 'Invalid bet amount! Positive number dein.', message: 'Invalid bet amount! Positive number enter karein.' };
    }
    if ((user.wallet || 0) < bet) {
      const msg = `Aapke paas itne coins nahi hain! Wallet: **${(user.wallet || 0).toLocaleString()} coins**`;
      return { success: false, error: msg, message: msg };
    }

    const icons = ['🍒', '🍇', '💎', '7️⃣', '🔮'];
    const s1 = icons[Math.floor(Math.random() * icons.length)];
    const s2 = icons[Math.floor(Math.random() * icons.length)];
    const s3 = icons[Math.floor(Math.random() * icons.length)];
    const display = `[ ${s1} | ${s2} | ${s3} ]`;

    let multiplier = 0;
    if (s1 === s2 && s2 === s3) {
      multiplier = s1 === '7️⃣' ? 10 : (s1 === '💎' ? 7 : (s1 === '🔮' ? 5 : 3));
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      multiplier = 1.5;
    }

    if (multiplier > 0) {
      const winAmount = Math.floor(bet * multiplier);
      user.wallet = (user.wallet || 0) + winAmount;
      saveEcoData(data);
      return {
        success: true,
        win: true,
        slots: [s1, s2, s3],
        display,
        multiplier,
        winAmount,
        wallet: user.wallet,
        balance: user.wallet,
        message: `${multiplier}x Multiplier! Aapne **+${winAmount.toLocaleString()} Coins** jeete!`
      };
    } else {
      user.wallet = (user.wallet || 0) - bet;
      saveEcoData(data);
      return {
        success: true,
        win: false,
        slots: [s1, s2, s3],
        display,
        lost: bet,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Koi match nahi mila! Aapne **-${bet.toLocaleString()} Coins** lose kiye.`
      };
    }
  },

  getInventory(guildId, userId) {
    const { user } = this.getUser(guildId, userId);
    return user.inventory || {};
  },

  getInventoryList(guildId, userId) {
    const inv = this.getInventory(guildId, userId);
    const items = [];
    for (const [id, count] of Object.entries(inv)) {
      if (count > 0) {
        const meta = SHOP_ITEMS.find(i => i.id === id);
        items.push({
          id,
          name: meta ? meta.name : id,
          desc: meta ? meta.desc : 'Special gothic relic',
          count
        });
      }
    }
    return items;
  },

  buyItem(guildId, userId, itemId) {
    const { data, user } = this.getUser(guildId, userId);
    const query = String(itemId || '').toLowerCase().trim();
    const item = SHOP_ITEMS.find(i => i.id === query || i.name.toLowerCase().includes(query));
    if (!item) {
      const msg = `Aisa koi item shop mein nahi hai! Available IDs: ${SHOP_ITEMS.map(i => `\`${i.id}\``).join(', ')}`;
      return { success: false, error: msg, message: msg };
    }

    if ((user.wallet || 0) < item.price) {
      const msg = `Aapko **${item.name}** khareedne ke liye **${item.price.toLocaleString()} coins** chahiye! (Aapke paas: ${(user.wallet || 0).toLocaleString()})`;
      return { success: false, error: msg, message: msg };
    }

    user.wallet -= item.price;
    if (!user.inventory) user.inventory = {};
    user.inventory[item.id] = (user.inventory[item.id] || 0) + 1;
    saveEcoData(data);

    return {
      success: true,
      item,
      wallet: user.wallet,
      balance: user.wallet,
      count: user.inventory[item.id],
      message: `Aapne **${item.name}** successfully purchase kar liya! (Owned: \`${user.inventory[item.id]}\`)`
    };
  },

  useItem(guildId, userId, itemId) {
    const { data, user } = this.getUser(guildId, userId);
    const query = String(itemId || '').toLowerCase().trim();
    const item = SHOP_ITEMS.find(i => i.id === query || i.name.toLowerCase().includes(query));
    if (!item) {
      return { success: false, error: 'Item nahi mila!', message: `Valid item ID dein: ${SHOP_ITEMS.map(i => `\`${i.id}\``).join(', ')}` };
    }
    const owned = user.inventory?.[item.id] || 0;
    if (owned <= 0) {
      return { success: false, error: 'Owned nahi hai!', message: `Aapke inventory me **${item.name}** nahi hai! \`&buy ${item.id}\` se khareedein.` };
    }

    // Passive relics give an active status boost/bonus without wasting permanent gear unnecessarily, OR let consumable luck activate bonus coins
    if (item.id === 'tarot_charm' || item.id === 'lucky_dice') {
      user.inventory[item.id] -= 1;
      if (user.inventory[item.id] <= 0) delete user.inventory[item.id];
      const bonus = Math.floor(Math.random() * 1200) + 800;
      user.wallet = (user.wallet || 0) + bonus;
      saveEcoData(data);
      return {
        success: true,
        consumed: true,
        bonus,
        wallet: user.wallet,
        balance: user.wallet,
        message: `Aapne **${item.name}** activate kiya! Dark energy se aapko **+${bonus.toLocaleString()} Bonus Coins** prapt hue!`
      };
    }

    return {
      success: true,
      consumed: false,
      wallet: user.wallet,
      balance: user.wallet,
      message: `**${item.name}** (\`x${owned}\`) actively equipped hai! Passive effect: *${item.desc}*`
    };
  },

  getLeaderboard(guildId, limit = 10) {
    const data = loadEcoData();
    const prefix = `${guildId || 'global'}_`;
    const list = [];

    for (const [k, v] of Object.entries(data.users || {})) {
      if (k.startsWith(prefix) || !guildId) {
        const uId = k.replace(prefix, '');
        const total = (v.wallet || 0) + (v.bank || 0);
        list.push({ userId: uId, wallet: v.wallet || 0, bank: v.bank || 0, total, netWorth: total });
      }
    }

    list.sort((a, b) => b.total - a.total);
    return list.slice(0, limit);
  }
};

module.exports = Economy;
