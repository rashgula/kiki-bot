// KIKI Bot - Full Fun, Games, Social & Anime Actions Engine
const fs = require('fs');
const path = require('path');

const MARRIAGE_FILE = path.join(__dirname, '..', 'data', 'marriages.json');

function loadMarriages() {
  try {
    if (fs.existsSync(MARRIAGE_FILE)) {
      return JSON.parse(fs.readFileSync(MARRIAGE_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function saveMarriages(data) {
  try {
    fs.writeFileSync(MARRIAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

const CAT_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600',
  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600',
  'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600',
  'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600'
];

const DOG_IMAGES = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'
];

const BIRD_IMAGES = [
  'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600',
  'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=600',
  'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600',
  'https://images.unsplash.com/photo-1516606588441-2a189c9ecfa5?w=600'
];

const MEMES = [
  { title: 'When the code works on the first try', url: 'https://i.imgur.com/7D7zVpC.jpeg' },
  { title: 'Server owner sleeping peacefully while bot defends', url: 'https://i.imgur.com/W3duS1b.jpeg' },
  { title: 'Me explaining Discord bot architecture at 3 AM', url: 'https://i.imgur.com/9nL0bPn.jpeg' },
  { title: 'When someone tries to raid and master anti-nuke is live', url: 'https://i.imgur.com/1Gv1eG7.jpeg' },
  { title: 'Gothic KIKI vibes on a Monday', url: 'https://i.imgur.com/0Z8hT9F.jpeg' },
  { title: 'One does not simply bypass KIKI shields', url: 'https://i.imgur.com/4hG3T2F.jpeg' }
];

const JOKES = [
  'Why do programmers prefer dark mode? Because light attracts bugs! 🪲',
  'Why did the developer go broke? Because he used up all his cache! 💸',
  'There are 10 types of people in the world: those who understand binary, and those who don’t. 🤖',
  'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?" 🍺',
  'Why was the JavaScript developer sad? Because they didn’t know how to `null` their feelings. 🥺',
  'What is a ghost’s favorite Discord channel? #boo-general! 👻',
  'How do vampires like their coffee? Decaf-finated! 🧛'
];

const ROASTS = [
  'Aapka existence proof hai ki bhagwan ke paas bhi sense of humor hai. 😂',
  'Aapko dekh kar lagta hai ki Wi-Fi ka signal bhi sharma kar chala jaye. 📶',
  'Aapka dimag Google ki 2nd page jaisa hai — koi wahan jaata hi nahi! 🔍',
  'Agar stupidity currency hoti, toh aap Forbes list ke top par hote! 💵',
  'Aapke jokes sun kar Discord server ka ping 999ms chala gaya. 💀',
  'Aapke opinion ki value 2026 me Internet Explorer jaisi hai. 📉',
  'Mirror me dekhna ek bravery test hai jo aap roz fail karte ho! 🪞'
];

const FACTS = [
  'Honey never spoils! Archaeologists have found 3,000-year-old honey in Egyptian tombs that is still edible. 🍯',
  'Octopuses have three hearts, nine brains, and blue blood! 🐙',
  'Bananas are curved because they grow towards the sun against gravity. 🍌',
  'A day on Venus is longer than a year on Venus! 🪐',
  'The heart of a blue whale is the size of a small car and beats only 5 to 6 times a minute. 🐋',
  'Discord was originally created in 2015 for gamers to communicate while playing FFXIV and League of Legends! 🎮'
];

const QUOTES = [
  '🔮 "The dark arts serve those who dare to wield them." — KIKI',
  '🕷️ "Chaos is not destruction — it is transformation."',
  '⚡ "Every server bows before the purple storm."',
  '🌙 "Stars cannot shine without darkness."',
  '👑 "Greatness is forged in the silence of the night."',
  '💜 "Walk through the shadow, for you are the night."'
];

const RIDDLES = [
  { q: 'What has keys but cannot open locks?', a: 'A Piano! 🎹' },
  { q: 'What gets wetter the more it dries?', a: 'A Towel! 🧖' },
  { q: 'What can travel around the world while staying in a corner?', a: 'A Postage Stamp! ✉️' },
  { q: 'The more of this there is, the less you see. What is it?', a: 'Darkness! 🌑' },
  { q: 'I have branches, but no fruit, trunk or leaves. What am I?', a: 'A Bank! 🏦' }
];

const EIGHT_BALL = [
  '🔮 Ha, bilkul nishchit roop se!',
  '🔮 KIKI kehta hai: 100% Yes!',
  '🔮 Mere tarot cards keh rahe hain: Haan!',
  '🔮 Taare aapke paksh me hain ✨',
  '🔮 Abhi kehna mushkil hai, thoda intezaar karein...',
  '🔮 Dobara puchho, dhyan bhatak gaya tha...',
  '🔮 KIKI kehti hai: Bilkul Nahi! ❌',
  '🔮 Meri aatma bol rahi hai: Chance bohot kam hai.',
  '🔮 Ghata chhai hai, jawab na me hai.',
  '🔮 Sapne dekhna achhi baat hai, par ye nahi hoga! 😂'
];

const ACTION_GIFS = {
  hug: [
    'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
    'https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/giphy.gif',
    'https://media.giphy.com/media/u9BxQbM5bxvwA/giphy.gif'
  ],
  kiss: [
    'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
    'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif'
  ],
  slap: [
    'https://media.giphy.com/media/Zau0yrl15jD20/giphy.gif',
    'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif'
  ],
  bite: [
    'https://media.giphy.com/media/OqQvAAmb66vAc/giphy.gif'
  ],
  cuddle: [
    'https://media.giphy.com/media/svIX2E146w9QQ/giphy.gif'
  ],
  pat: [
    'https://media.giphy.com/media/ye7OTQgwmVuNTY22s3/giphy.gif',
    'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif'
  ],
  kill: [
    'https://media.giphy.com/media/11HeubLHnQJSAU/giphy.gif'
  ]
};

const TRIVIA_QUESTIONS = [
  { q: 'What is the capital of Japan?', a: 'Tokyo', options: ['Kyoto', 'Tokyo', 'Osaka', 'Nagoya'] },
  { q: 'Which planet is known as the Red Planet?', a: 'Mars', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'] },
  { q: 'What is the largest ocean on Earth?', a: 'Pacific Ocean', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'] },
  { q: 'Who wrote the play "Hamlet"?', a: 'William Shakespeare', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'] },
  { q: 'In programming, what does HTML stand for?', a: 'HyperText Markup Language', options: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTransfer Mode Link', 'Home Tool Markup Language'] }
];

const FunEngine = {
  getCat() {
    return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
  },

  getDog() {
    return DOG_IMAGES[Math.floor(Math.random() * DOG_IMAGES.length)];
  },

  getBird() {
    return BIRD_IMAGES[Math.floor(Math.random() * BIRD_IMAGES.length)];
  },

  getMeme() {
    return MEMES[Math.floor(Math.random() * MEMES.length)];
  },

  getJoke() {
    return JOKES[Math.floor(Math.random() * JOKES.length)];
  },

  getRoast(targetName) {
    const r = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    return targetName ? `**${targetName}**, ${r}` : r;
  },

  getFact() {
    return FACTS[Math.floor(Math.random() * FACTS.length)];
  },

  getQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  },

  getRiddle() {
    return RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
  },

  get8Ball(question) {
    const answer = EIGHT_BALL[Math.floor(Math.random() * EIGHT_BALL.length)];
    return { question: question || 'Will today be a gothic day?', answer };
  },

  getTrivia() {
    return TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
  },

  playRPS(userChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    const cleanUser = String(userChoice || '').toLowerCase().trim();

    if (!choices.includes(cleanUser)) {
      return { error: 'Kripya `rock`, `paper`, ya `scissors` chunein!' };
    }

    const emojis = { rock: '🪨 Rock', paper: '📄 Paper', scissors: '✂️ Scissors' };

    let result = 'tie';
    if (cleanUser === botChoice) {
      result = 'tie';
    } else if (
      (cleanUser === 'rock' && botChoice === 'scissors') ||
      (cleanUser === 'paper' && botChoice === 'rock') ||
      (cleanUser === 'scissors' && botChoice === 'paper')
    ) {
      result = 'win';
    } else {
      result = 'lose';
    }

    return {
      userChoice: emojis[cleanUser],
      botChoice: emojis[botChoice],
      result
    };
  },

  flipCoin(userGuess) {
    const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const isWin = userGuess ? userGuess.toLowerCase().startsWith(outcome[0].toLowerCase()) : null;
    return {
      outcome,
      icon: outcome === 'Heads' ? '🪙 HEADS' : '🪙 TAILS',
      isWin
    };
  },

  rollDice(sides = 6, count = 1) {
    const numSides = Math.max(2, parseInt(sides) || 6);
    const numDice = Math.min(Math.max(1, parseInt(count) || 1), 6);
    const rolls = [];
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    let total = 0;
    for (let i = 0; i < numDice; i++) {
      const r = Math.floor(Math.random() * numSides) + 1;
      rolls.push(r);
      total += r;
    }

    return {
      rolls,
      total,
      sides: numSides,
      faces: rolls.map(r => (r <= 6 ? diceFaces[r - 1] : `[${r}]`)).join(' ')
    };
  },

  getMinesweeper(rows = 6, cols = 6, minesCount = 6) {
    const board = Array(rows).fill(null).map(() => Array(cols).fill(0));
    let placed = 0;
    while (placed < minesCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (board[r][c] !== 'M') {
        board[r][c] = 'M';
        placed++;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === 'M') continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === 'M') count++;
          }
        }
        board[r][c] = count;
      }
    }

    const numEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const lines = board.map(row =>
      row.map(cell => `||${cell === 'M' ? '💣' : numEmojis[cell]}||`).join('')
    );

    return lines.join('\n');
  },

  getAction(type, authorName, targetName) {
    const list = ACTION_GIFS[type] || ACTION_GIFS.hug;
    const gif = list[Math.floor(Math.random() * list.length)];
    const messages = {
      hug: `💜 **${authorName}** gave a warm gothic hug to **${targetName}**!`,
      kiss: `💋 **${authorName}** passionately kissed **${targetName}**!`,
      slap: `👋 **${authorName}** slapped **${targetName}** right across the face!`,
      bite: `🧛 **${authorName}** took a sweet bite of **${targetName}**!`,
      cuddle: `🤗 **${authorName}** cuddled up closely with **${targetName}**!`,
      pat: `✨ **${authorName}** gently headpatted **${targetName}**!`,
      kill: `🗡️ **${authorName}** sent **${targetName}** directly to the shadow realm!`
    };
    return {
      text: messages[type] || `✨ **${authorName}** interacted with **${targetName}**!`,
      gif
    };
  },

  calculateShip(user1, user2) {
    const name1 = (typeof user1 === 'object' ? (user1.username || user1.id || 'User1') : String(user1 || 'User1')).toLowerCase();
    const name2 = (typeof user2 === 'object' ? (user2.username || user2.id || 'User2') : String(user2 || 'User2')).toLowerCase();
    // Sort names so ship(A, B) === ship(B, A) consistently
    const pair = [name1, name2].sort().join(':');
    const hash = pair.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const percent = Math.abs(hash * 37) % 101;

    let verdict = '💔 No Chemistry... Dark skies ahead!';
    if (percent > 85) verdict = '💍 Soulmates! Made for each other in the gothic heavens!';
    else if (percent > 65) verdict = '💖 Great Match! High compatibility & dark sparks flying!';
    else if (percent > 40) verdict = '🤝 Decent Friends! Could become something special.';
    else if (percent > 20) verdict = '⚡ A bit turbulent, proceed with caution!';

    const filled = Math.round(percent / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

    return { percent, bar, verdict, comment: verdict };
  },

  marry(guildId, u1Id, u2Id) {
    if (u1Id === u2Id) {
      return { success: false, error: 'Aap khud se shaadi nahi kar sakte! Kisi aur partner ko mention karein.', message: 'Aap khud se shaadi nahi kar sakte! Kisi aur partner ko mention karein.' };
    }
    const m = loadMarriages();
    const gKey = guildId || 'global';
    if (!m[gKey]) m[gKey] = {};

    if (m[gKey][u1Id]) {
      return { success: false, error: 'Aap already married ho! Pehle `&divorce` karein.', message: 'Aap already married ho! Pehle `&divorce` karein.' };
    }
    if (m[gKey][u2Id]) {
      return { success: false, error: 'Ye user already kisi aur ke sath married hai!', message: 'Ye user already kisi aur ke sath married hai!' };
    }

    const now = Date.now();
    m[gKey][u1Id] = { partnerId: u2Id, date: now };
    m[gKey][u2Id] = { partnerId: u1Id, date: now };
    saveMarriages(m);

    return { success: true, message: 'Gothic union successfully sealed!' };
  },

  divorce(guildId, uId) {
    const m = loadMarriages();
    const gKey = guildId || 'global';
    if (!m[gKey] || !m[gKey][uId]) {
      return { success: false, error: 'Aap abhi kisi ke sath married nahi hain!', message: 'Aap abhi kisi ke sath married nahi hain!' };
    }

    const partnerId = m[gKey][uId].partnerId;
    delete m[gKey][uId];
    if (partnerId && m[gKey][partnerId]) delete m[gKey][partnerId];
    saveMarriages(m);

    return { success: true, exPartnerId: partnerId, message: `<@${uId}> aur <@${partnerId}> ka gothic covenant officially dissolve ho gaya.` };
  },

  getMarriage(guildId, uId) {
    const m = loadMarriages();
    const gKey = guildId || 'global';
    return m[gKey]?.[uId] || null;
  }
};

module.exports = FunEngine;
