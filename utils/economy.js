// KIKI Bot - Full Gothic Economy & RPG Engine
const fs = require('fs');
const path = require('path');

const ECO_FILE = path.join(__dirname, '..', 'data', 'economy.json');

// Ensure economy data file exists
function loadEcoData() {
  try {
    if (fs.existsSync(ECO_FILE)) {
      return JSON.parse(fs.readFileSync(ECO_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[ECO LOAD ERROR]', err.message);
  }
  return { users: {}, shop: {} };
}

function saveEcoData(data) {
  try {
    fs.writeFileSync(ECO_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[ECO SAVE ERROR]', err.message);
  }
}

// Available shop items
const SHOP_ITEMS = [
  { id: 'shield', name: '🛡️ Gothic Aegis Shield', price: 2500, desc: 'Protects you from 1 crime or robbery attempt' },
  { id: 'tarot_charm', name: '🔮 Obsidian Tarot Charm', price: 1500, desc: 'Increases gamble win chance by 10%' },
  { id: 'dark_crown', name: '👑 Phantom Crown', price: 10000, desc: 'Prestige role symbol of the dark elite' },
  { id: 'shadow_dagger', name: '🗡️ Shadow Dagger', price: 3000, desc: 'Increases crime success rate and hunt payouts' },
  { id: 'golden_ring', name: '💍 Gothic Marriage Ring', price: 5000, desc: 'Required to propose a gothic union to a partner' },
  { id: 'lucky_dice', name: '🎲 Cursed Lucky Dice', price: 2000, desc: 'Gives +20% bonus coins on successful dice rolls' }
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

const Economy = {
  SHOP_ITEMS,

  // Get user profile in guild
  getUser(guildId, userId) {
    const data = loadEcoData();
    if (!data.users) data.users = {};
    const key = `${guildId || 'global'}_${userId}`;
    if (!data.users[key]) {
      data.users[key] = {
        wallet: 500, // starting gift
        bank: 0,
        bankMax: 50000,
        streak: 0,
        lastDaily: 0,
        lastWork: 0,
        lastCrime: 0,
        lastFish: 0,
        lastHunt: 0,
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
    const { data, key, user } = this.getUser(guildId, userId);
    user.wallet = Math.max(0, (user.wallet || 0) + Math.floor(amount));
    saveEcoData(data);
    return user.wallet;
  },

  removeWallet(guildId, userId, amount) {
    const { data, key, user } = this.getUser(guildId, userId);
    user.wallet = Math.max(0, (user.wallet || 0) - Math.floor(amount));
    saveEcoData(data);
    return user.wallet;
  },

  deposit(guildId, userId, amount) {
    const { data, key, user } = this.getUser(guildId, userId);
    const wallet = user.wallet || 0;
    const toDeposit = amount === 'all' || amount === 'max' ? wallet : parseInt(amount);

    if (isNaN(toDeposit) || toDeposit <= 0) return { error: 'Valid amount enter karein!' };
    if (wallet < toDeposit) return { error: `Aapke wallet mein sirf **${wallet} coins** hain!` };

    const maxSpace = (user.bankMax || 50000) - (user.bank || 0);
    if (maxSpace <= 0) return { error: 'Aapka bank account already full hai!' };

    const actual = Math.min(toDeposit, maxSpace);
    user.wallet -= actual;
    user.bank = (user.bank || 0) + actual;
    saveEcoData(data);

    return { success: true, amount: actual, wallet: user.wallet, bank: user.bank };
  },

  withdraw(guildId, userId, amount) {
    const { data, key, user } = this.getUser(guildId, userId);
    const bank = user.bank || 0;
    const toWithdraw = amount === 'all' || amount === 'max' ? bank : parseInt(amount);

    if (isNaN(toWithdraw) || toWithdraw <= 0) return { error: 'Valid amount enter karein!' };
    if (bank < toWithdraw) return { error: `Aapke bank mein sirf **${bank} coins** hain!` };

    user.bank -= toWithdraw;
    user.wallet = (user.wallet || 0) + toWithdraw;
    saveEcoData(data);

    return { success: true, amount: toWithdraw, wallet: user.wallet, bank: user.bank };
  },

  transfer(guildId, fromUserId, toUserId, amount) {
    const from = this.getUser(guildId, fromUserId);
    const to = this.getUser(guildId, toUserId);

    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return { error: 'Valid amount enter karein!' };
    if ((from.user.wallet || 0) < val) return { error: `Aapke wallet mein sirf **${from.user.wallet || 0} coins** hain!` };

    from.user.wallet -= val;
    to.user.wallet = (to.user.wallet || 0) + val;

    const data = from.data;
    data.users[from.key] = from.user;
    data.users[to.key] = to.user;
    saveEcoData(data);

    return { success: true, amount: val, fromWallet: from.user.wallet, toWallet: to.user.wallet };
  },

  claimDaily(guildId, userId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const diff = now - (user.lastDaily || 0);

    if (diff < cooldown) {
      const remainingMs = cooldown - diff;
      return { cooldown: true, remainingMs };
    }

    // Check streak
    if (diff < cooldown * 2) {
      user.streak = (user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }

    const baseReward = 500;
    const streakBonus = Math.min(user.streak * 50, 1000);
    const totalReward = baseReward + streakBonus;

    user.wallet = (user.wallet || 0) + totalReward;
    user.lastDaily = now;
    saveEcoData(data);

    return { success: true, amount: totalReward, streak: user.streak, wallet: user.wallet };
  },

  work(guildId, userId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour
    const diff = now - (user.lastWork || 0);

    if (diff < cooldown) {
      const remainingMs = cooldown - diff;
      return { cooldown: true, remainingMs };
    }

    const job = GOTHIC_JOBS[Math.floor(Math.random() * GOTHIC_JOBS.length)];
    const pay = Math.floor(Math.random() * (job.pay[1] - job.pay[0] + 1)) + job.pay[0];

    user.wallet = (user.wallet || 0) + pay;
    user.lastWork = now;
    saveEcoData(data);

    return { success: true, job: job.title, desc: job.desc, amount: pay, wallet: user.wallet };
  },

  crime(guildId, userId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 2 * 60 * 60 * 1000; // 2 hours
    const diff = now - (user.lastCrime || 0);

    if (diff < cooldown) {
      const remainingMs = cooldown - diff;
      return { cooldown: true, remainingMs };
    }

    user.lastCrime = now;
    const success = Math.random() < 0.65; // 65% success

    if (success) {
      const loot = Math.floor(Math.random() * 600) + 300;
      user.wallet = (user.wallet || 0) + loot;
      saveEcoData(data);
      return { success: true, amount: loot, wallet: user.wallet };
    } else {
      const fine = Math.min(user.wallet || 0, Math.floor(Math.random() * 250) + 150);
      user.wallet = Math.max(0, (user.wallet || 0) - fine);
      saveEcoData(data);
      return { success: false, fine, wallet: user.wallet };
    }
  },

  fish(guildId, userId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 5 * 60 * 1000; // 5 min
    const diff = now - (user.lastFish || 0);

    if (diff < cooldown) {
      return { cooldown: true, remainingMs: cooldown - diff };
    }

    user.lastFish = now;
    const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
    user.wallet = (user.wallet || 0) + fish.value;
    saveEcoData(data);

    return { success: true, fish: fish.name, rarity: fish.rarity, value: fish.value, wallet: user.wallet };
  },

  hunt(guildId, userId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const now = Date.now();
    const cooldown = 10 * 60 * 1000; // 10 min
    const diff = now - (user.lastHunt || 0);

    if (diff < cooldown) {
      return { cooldown: true, remainingMs: cooldown - diff };
    }

    user.lastHunt = now;
    const animal = HUNT_TYPES[Math.floor(Math.random() * HUNT_TYPES.length)];
    user.wallet = (user.wallet || 0) + animal.value;
    saveEcoData(data);

    return { success: true, animal: animal.name, rarity: animal.rarity, value: animal.value, wallet: user.wallet };
  },

  gamble(guildId, userId, amount) {
    const { data, key, user } = this.getUser(guildId, userId);
    const bet = parseInt(amount);
    if (isNaN(bet) || bet <= 0) return { error: 'Valid bet amount enter karein!' };
    if ((user.wallet || 0) < bet) return { error: `Aapke wallet mein sirf **${user.wallet || 0} coins** hain!` };

    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const total = roll1 + roll2;
    const win = total >= 7;

    if (win) {
      const payout = bet;
      user.wallet = (user.wallet || 0) + payout;
      saveEcoData(data);
      return { win: true, roll1, roll2, total, profit: payout, wallet: user.wallet };
    } else {
      user.wallet = (user.wallet || 0) - bet;
      saveEcoData(data);
      return { win: false, roll1, roll2, total, lost: bet, wallet: user.wallet };
    }
  },

  slots(guildId, userId, amount) {
    const { data, key, user } = this.getUser(guildId, userId);
    const bet = parseInt(amount);
    if (isNaN(bet) || bet <= 0) return { error: 'Valid bet amount enter karein!' };
    if ((user.wallet || 0) < bet) return { error: `Aapke wallet mein sirf **${user.wallet || 0} coins** hain!` };

    const icons = ['🍒', '🍇', '💎', '7️⃣', '🔮'];
    const s1 = icons[Math.floor(Math.random() * icons.length)];
    const s2 = icons[Math.floor(Math.random() * icons.length)];
    const s3 = icons[Math.floor(Math.random() * icons.length)];

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
      return { win: true, slots: [s1, s2, s3], multiplier, winAmount, wallet: user.wallet };
    } else {
      user.wallet = (user.wallet || 0) - bet;
      saveEcoData(data);
      return { win: false, slots: [s1, s2, s3], lost: bet, wallet: user.wallet };
    }
  },

  getInventory(guildId, userId) {
    const { user } = this.getUser(guildId, userId);
    return user.inventory || {};
  },

  buyItem(guildId, userId, itemId) {
    const { data, key, user } = this.getUser(guildId, userId);
    const item = SHOP_ITEMS.find(i => i.id === itemId.toLowerCase());
    if (!item) return { error: 'Aisa koi item shop mein nahi hai!' };

    if ((user.wallet || 0) < item.price) {
      return { error: `Aapko **${item.name}** khareedne ke liye **${item.price} coins** chahiye! (Aapke paas: ${user.wallet || 0})` };
    }

    user.wallet -= item.price;
    if (!user.inventory) user.inventory = {};
    user.inventory[item.id] = (user.inventory[item.id] || 0) + 1;
    saveEcoData(data);

    return { success: true, item, wallet: user.wallet, count: user.inventory[item.id] };
  },

  getLeaderboard(guildId) {
    const data = loadEcoData();
    const prefix = `${guildId || 'global'}_`;
    const list = [];

    for (const [k, v] of Object.entries(data.users || {})) {
      if (k.startsWith(prefix) || !guildId) {
        const uId = k.replace(prefix, '');
        const total = (v.wallet || 0) + (v.bank || 0);
        list.push({ userId: uId, wallet: v.wallet || 0, bank: v.bank || 0, total });
      }
    }

    list.sort((a, b) => b.total - a.total);
    return list.slice(0, 10);
  }
};

module.exports = Economy;
