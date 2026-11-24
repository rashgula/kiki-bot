// KIKI Bot - Full Games Engine
const fs = require('fs');
const path = require('path');
const Economy = require('./economy.js');

// In-memory session stores for interactive games
const GTN_SESSIONS = new Map(); // Guess the number sessions
const HANGMAN_SESSIONS = new Map();

// ── 1. BLACKJACK ENGINE ──────────────────────────────────────────
const CARD_SUITS = ['♠️', '♥️', '♦️', '♣️'];
const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const s of CARD_SUITS) {
    for (const r of CARD_RANKS) {
      deck.push({ rank: r, suit: s });
    }
  }
  // Shuffle Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHand(hand) {
  let score = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') {
      aces++;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      score += 10;
    } else {
      score += parseInt(card.rank);
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function formatHand(hand) {
  return hand.map(c => `[${c.rank}${c.suit}]`).join(' ');
}

// ── 2. RPG DUEL ACTION SET ───────────────────────────────────────
const DUEL_MOVES = [
  { name: '🗡️ Shadow Slash', dmg: [18, 30], desc: 'strikes from the void with a blackened blade!' },
  { name: '🔥 Necrotic Hellfire', dmg: [22, 38], desc: 'unleashes cursed purple embers upon their foe!' },
  { name: '🩸 Blood Drain', dmg: [15, 25], heal: 10, desc: 'siphons vital lifeforce to heal wounds!' },
  { name: '🛡️ Obsidian Ward', dmg: [5, 12], desc: 'counters with a heavy runic shield bash!' },
  { name: '⚡ Eclipse Lightning', dmg: [25, 45], desc: 'calls down blinding dark thunder!' },
  { name: '💀 Soul Reave', dmg: [30, 50], desc: 'rips through reality with executioner fury!' }
];

// ── 3. TRIVIA & QUIZ DATASETS ────────────────────────────────────
const ANIME_TRIVIA = [
  {
    q: 'Naruto me 9-Tails Fox ka asli naam kya hai?',
    options: ['A) Kurama', 'B) Gyuki', 'C) Shukaku', 'D) Matatabi'],
    answer: 'A',
    ansText: 'Kurama'
  },
  {
    q: 'Attack on Titan me Eren Yeager ke hometown ka naam kya hai?',
    options: ['A) Trost District', 'B) Shiganshina District', 'C) Stohess District', 'D) Ragako'],
    answer: 'B',
    ansText: 'Shiganshina District'
  },
  {
    q: 'Death Note me Light Yagami ka Shinigami kaun tha?',
    options: ['A) Rem', 'B) Ryuk', 'C) Sidoh', 'D) Gelus'],
    answer: 'B',
    ansText: 'Ryuk'
  },
  {
    q: 'One Piece me Luffy ka pehla crew member kaun bana?',
    options: ['A) Zoro', 'B) Nami', 'C) Sanji', 'D) Usopp'],
    answer: 'A',
    ansText: 'Roronoa Zoro'
  },
  {
    q: 'Jujutsu Kaisen me Satoru Gojo ki innate cursed technique ka naam kya hai?',
    options: ['A) Ten Shadows', 'B) Limitless', 'C) Idle Transfiguration', 'D) Blood Manipulation'],
    answer: 'B',
    ansText: 'Limitless (Infinity)'
  },
  {
    q: 'Demon Slayer me Tanjiro Kamado ki behen ka kya naam hai jo demon ban gayi?',
    options: ['A) Nezuko', 'B) Shinobu', 'C) Kanao', 'D) Mitsuri'],
    answer: 'A',
    ansText: 'Nezuko Kamado'
  }
];

const GAMING_TRIVIA = [
  {
    q: 'Minecraft me Nether jaane ke liye portal kis block se banta hai?',
    options: ['A) Bedrock', 'B) Obsidian', 'C) Crying Obsidian', 'D) Netherrack'],
    answer: 'B',
    ansText: 'Obsidian'
  },
  {
    q: 'GTA V me teeno main playable characters kaun hain?',
    options: ['A) Michael, Trevor, Franklin', 'B) CJ, Tommy, Claude', 'C) Niko, Roman, Luis', 'D) Arthur, John, Dutch'],
    answer: 'A',
    ansText: 'Michael, Trevor & Franklin'
  },
  {
    q: 'Elden Ring game kis director aur studio ne banayi hai?',
    options: ['A) Hideo Kojima / Konami', 'B) Hidetaka Miyazaki / FromSoftware', 'C) Todd Howard / Bethesda', 'D) Neil Druckmann / Naughty Dog'],
    answer: 'B',
    ansText: 'Hidetaka Miyazaki / FromSoftware'
  },
  {
    q: 'Valorant me revive karne wali radiant agent kaun hai?',
    options: ['A) Jett', 'B) Sage', 'C) Reyna', 'D) Viper'],
    answer: 'B',
    ansText: 'Sage'
  },
  {
    q: 'The Witcher series ke protagonist Witcher ka naam kya hai?',
    options: ['A) Geralt of Rivia', 'B) Vesemir', 'C) Lambert', 'D) Eskel'],
    answer: 'A',
    ansText: 'Geralt of Rivia'
  }
];

const GENERAL_TRIVIA = [
  {
    q: 'Duniya ka sabse uncha pahad (highest mountain peak) kaun sa hai?',
    options: ['A) K2', 'B) Mount Everest', 'C) Kangchenjunga', 'D) Makalu'],
    answer: 'B',
    ansText: 'Mount Everest (8,848m)'
  },
  {
    q: 'Suraj ke sabse kareeb kaun sa planet (grah) hai?',
    options: ['A) Venus', 'B) Mercury', 'C) Mars', 'D) Jupiter'],
    answer: 'B',
    ansText: 'Mercury (Budh)'
  },
  {
    q: 'Human body me total kitni bones (haddiyan) hoti hain?',
    options: ['A) 196', 'B) 206', 'C) 212', 'D) 220'],
    answer: 'B',
    ansText: '206'
  },
  {
    q: 'Oxygen ka chemical symbol kya hai?',
    options: ['A) Ox', 'B) O', 'C) O2', 'D) Og'],
    answer: 'B',
    ansText: 'O'
  },
  {
    q: 'Duniya ka sabse bada ocean (mahasagar) kaun sa hai?',
    options: ['A) Atlantic Ocean', 'B) Pacific Ocean', 'C) Indian Ocean', 'D) Arctic Ocean'],
    answer: 'B',
    ansText: 'Pacific Ocean (Prashant Mahasagar)'
  }
];

const FLAG_QUIZ_DATA = [
  { flag: '🇯🇵', country: 'Japan', options: ['A) South Korea', 'B) Japan', 'C) China', 'D) Vietnam'], answer: 'B' },
  { flag: '🇫🇷', country: 'France', options: ['A) France', 'B) Netherlands', 'C) Italy', 'D) Russia'], answer: 'A' },
  { flag: '🇧🇷', country: 'Brazil', options: ['A) Argentina', 'B) Brazil', 'C) Colombia', 'D) Portugal'], answer: 'B' },
  { flag: '🇮🇳', country: 'India', options: ['A) India', 'B) Niger', 'C) Ireland', 'D) Nepal'], answer: 'A' },
  { flag: '🇨🇦', country: 'Canada', options: ['A) Austria', 'B) Canada', 'C) Switzerland', 'D) Denmark'], answer: 'B' },
  { flag: '🇩🇪', country: 'Germany', options: ['A) Belgium', 'B) Germany', 'C) Spain', 'D) Poland'], answer: 'B' },
  { flag: '🇦🇺', country: 'Australia', options: ['A) New Zealand', 'B) Australia', 'C) UK', 'D) Fiji'], answer: 'B' },
  { flag: '🇪🇬', country: 'Egypt', options: ['A) Egypt', 'B) UAE', 'C) Iraq', 'D) Syria'], answer: 'A' }
];

const LOGO_QUIZ_DATA = [
  { emoji: '🍎', hint: '"Think Different" — Famous consumer tech & smartphone company', brand: 'Apple', options: ['A) Microsoft', 'B) Apple', 'C) Samsung', 'D) Sony'], answer: 'B' },
  { emoji: '👟', hint: '"Just Do It" — World-famous sports footwear & athletic apparel', brand: 'Nike', options: ['A) Adidas', 'B) Puma', 'C) Nike', 'D) Reebok'], answer: 'C' },
  { emoji: '🚗', hint: '"The Ultimate Driving Machine" — Luxury German car manufacturer', brand: 'BMW', options: ['A) Audi', 'B) Mercedes-Benz', 'C) BMW', 'D) Porsche'], answer: 'C' },
  { emoji: '☕', hint: 'World\'s largest chain of coffeehouses with green siren logo', brand: 'Starbucks', options: ['A) Dunkin\'', 'B) Starbucks', 'C) Costa', 'D) Tim Hortons'], answer: 'B' },
  { emoji: '🥤', hint: '"Open Happiness" — Iconic red & white contoured soda bottle', brand: 'Coca-Cola', options: ['A) Pepsi', 'B) Coca-Cola', 'C) Dr Pepper', 'D) Sprite'], answer: 'B' }
];

const SCRAMBLE_WORDS = [
  { word: 'VAMPIRE', hint: 'Blood-drinking creature of the night 🧛' },
  { word: 'PHANTOM', hint: 'Apparition or ghost roaming old corridors 👻' },
  { word: 'OBSIDIAN', hint: 'Volcanic dark black glass gemstone 🖤' },
  { word: 'ECLIPSE', hint: 'When the moon covers the sun in darkness 🌑' },
  { word: 'GRIMOIRE', hint: 'Ancient book of dark spells and magic 📖' },
  { word: 'CEMETERY', hint: 'Quiet resting place beneath weeping willows 🪦' },
  { word: 'SORCERER', hint: 'Wielder of arcane purple shadows 🔮' },
  { word: 'NIGHTMARE', hint: 'Terrifying dream conjured in deep slumber 🌙' },
  { word: 'FORTRESS', hint: 'Impenetrable dark stone castle 🏰' },
  { word: 'RAVEN', hint: 'Glossy black prophetic bird of Odin 🦅' }
];

const HANGMAN_WORDS = [
  { word: 'VAMPIRE', hint: 'Immortal shadow being' },
  { word: 'GRAVEYARD', hint: 'Where ghouls roam at midnight' },
  { word: 'SKELETON', hint: 'Bony warrior in the catacombs' },
  { word: 'CAULDRON', hint: 'Boiling brew of potions' },
  { word: 'SHADOW', hint: 'Follows you in the dark' },
  { word: 'COVEN', hint: 'Gathering of witches' },
  { word: 'OBSIDIAN', hint: 'Dark mirror stone' }
];

const HANGMAN_STAGES = [
  `\`\`\`\n  ┌─────┐\n  │     \n  │     \n  │     \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │     \n  │     \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │     │\n  │     \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │    /│\n  │     \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │    /│\\\n  │     \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │    /│\\\n  │    / \n  ╵     \n\`\`\``,
  `\`\`\`\n  ┌─────┐\n  │     💀\n  │    /│\\\n  │    / \\\n  ╵   HANGED!\n\`\`\``
];

// ── GAMES ENGINE EXPORTS ─────────────────────────────────────────
const GamesEngine = {
  // ── 1. BLACKJACK ───────────────────────────────────────────────
  playBlackjack(guildId, userId, betAmount = 100) {
    const bet = Math.max(10, parseInt(betAmount) || 100);
    const bal = Economy.getBalance(guildId, userId);
    if (bal.wallet < bet) {
      return { error: `Aapke wallet mein bet lagane ke liye sirf **${bal.wallet.toLocaleString()} coins** hain! (Minimum: ${bet})` };
    }

    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    // Dealer hits until >= 17
    while (calculateHand(dealerHand) < 17) {
      dealerHand.push(deck.pop());
    }

    const pScore = calculateHand(playerHand);
    const dScore = calculateHand(dealerHand);

    let result = 'lose'; // 'win', 'lose', 'tie', 'blackjack'
    let payout = 0;

    if (pScore === 21 && playerHand.length === 2 && dScore !== 21) {
      result = 'blackjack';
      payout = Math.floor(bet * 2.5);
      Economy.addWallet(guildId, userId, payout);
    } else if (pScore > 21) {
      result = 'bust';
      Economy.removeWallet(guildId, userId, bet);
    } else if (dScore > 21) {
      result = 'win';
      payout = bet * 2;
      Economy.addWallet(guildId, userId, bet); // double return
    } else if (pScore > dScore) {
      result = 'win';
      payout = bet * 2;
      Economy.addWallet(guildId, userId, bet);
    } else if (pScore === dScore) {
      result = 'tie';
      payout = bet;
    } else {
      result = 'lose';
      Economy.removeWallet(guildId, userId, bet);
    }

    const newBal = Economy.getBalance(guildId, userId);

    return {
      success: true,
      bet,
      playerHand: formatHand(playerHand),
      playerScore: pScore,
      dealerHand: formatHand(dealerHand),
      dealerScore: dScore,
      result,
      payout,
      newWallet: newBal.wallet
    };
  },

  // ── 2. COIN WAGER ──────────────────────────────────────────────
  playCoinWager(guildId, userId, betAmount = 50, choice = 'heads') {
    const bet = Math.max(10, parseInt(betAmount) || 50);
    const bal = Economy.getBalance(guildId, userId);
    if (bal.wallet < bet) {
      return { error: `Aapke paas bet ke liye coins kam hain! Wallet: **${bal.wallet.toLocaleString()} coins**` };
    }

    const cleanChoice = String(choice || 'heads').toLowerCase().startsWith('h') ? 'Heads' : 'Tails';
    const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const win = cleanChoice === outcome;

    if (win) {
      Economy.addWallet(guildId, userId, bet);
    } else {
      Economy.removeWallet(guildId, userId, bet);
    }

    const newBal = Economy.getBalance(guildId, userId);
    return {
      success: true,
      bet,
      userChoice: cleanChoice,
      outcome,
      icon: outcome === 'Heads' ? '🪙 HEADS' : '🪙 TAILS',
      win,
      payout: win ? bet * 2 : 0,
      newWallet: newBal.wallet
    };
  },

  // ── 3. ROULETTE ────────────────────────────────────────────────
  playRoulette(guildId, userId, betAmount = 50, choice = 'black') {
    const bet = Math.max(10, parseInt(betAmount) || 50);
    const bal = Economy.getBalance(guildId, userId);
    if (bal.wallet < bet) {
      return { error: `Insufficient balance! Wallet: **${bal.wallet.toLocaleString()} coins**` };
    }

    const wheelNumber = Math.floor(Math.random() * 37); // 0 to 36
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    let wheelColor = 'green';
    if (wheelNumber > 0) {
      wheelColor = redNumbers.includes(wheelNumber) ? 'red' : 'black';
    }

    const clean = String(choice || 'black').toLowerCase().trim();
    let win = false;
    let multiplier = 0;

    if (clean === 'red' && wheelColor === 'red') {
      win = true;
      multiplier = 2;
    } else if (clean === 'black' && wheelColor === 'black') {
      win = true;
      multiplier = 2;
    } else if (clean === 'green' && wheelColor === 'green') {
      win = true;
      multiplier = 14;
    } else if (clean === 'even' && wheelNumber > 0 && wheelNumber % 2 === 0) {
      win = true;
      multiplier = 2;
    } else if (clean === 'odd' && wheelNumber % 2 === 1) {
      win = true;
      multiplier = 2;
    } else if (!isNaN(parseInt(clean)) && parseInt(clean) === wheelNumber) {
      win = true;
      multiplier = 36;
    }

    if (win) {
      const winnings = bet * (multiplier - 1);
      Economy.addWallet(guildId, userId, winnings);
    } else {
      Economy.removeWallet(guildId, userId, bet);
    }

    const newBal = Economy.getBalance(guildId, userId);
    return {
      success: true,
      bet,
      choice: clean,
      wheelNumber,
      wheelColor,
      win,
      multiplier,
      payout: win ? bet * multiplier : 0,
      newWallet: newBal.wallet
    };
  },

  // ── 4. RUSSIAN ROULETTE ─────────────────────────────────────────
  playRussianRoulette(userName) {
    const chamber = Math.floor(Math.random() * 6) + 1; // 1 to 6
    const bullet = Math.floor(Math.random() * 6) + 1;
    const survived = chamber !== bullet;

    return {
      user: userName,
      survived,
      chamber,
      bullet,
      message: survived ?
        `*Click!* 💨 Chamber **#${chamber}** khali tha! **${userName}** ne maut ko maat de di!` :
        `*BANG!* 💥 Chamber **#${chamber}** me live round tha! **${userName}** zameen par dher ho gaye!`
    };
  },

  // ── 5. RPG DUEL ────────────────────────────────────────────────
  playDuel(p1Name, p2Name) {
    let hp1 = 100;
    let hp2 = 100;
    const rounds = [];

    while (hp1 > 0 && hp2 > 0 && rounds.length < 5) {
      // P1 attacks P2
      const m1 = DUEL_MOVES[Math.floor(Math.random() * DUEL_MOVES.length)];
      const d1 = Math.floor(Math.random() * (m1.dmg[1] - m1.dmg[0] + 1)) + m1.dmg[0];
      hp2 = Math.max(0, hp2 - d1);
      rounds.push(`⚔️ **${p1Name}** used **${m1.name}** and dealt **${d1} DMG**! (*${p2Name}: ${hp2} HP*)`);

      if (hp2 <= 0) break;

      // P2 attacks P1
      const m2 = DUEL_MOVES[Math.floor(Math.random() * DUEL_MOVES.length)];
      const d2 = Math.floor(Math.random() * (m2.dmg[1] - m2.dmg[0] + 1)) + m2.dmg[0];
      hp1 = Math.max(0, hp1 - d2);
      rounds.push(`🛡️ **${p2Name}** retaliated with **${m2.name}** and dealt **${d2} DMG**! (*${p1Name}: ${hp1} HP*)`);
    }

    const winner = hp1 > hp2 ? p1Name : p2Name;
    const loser = hp1 > hp2 ? p2Name : p1Name;

    return {
      p1: p1Name,
      p2: p2Name,
      winner,
      loser,
      hp1,
      hp2,
      log: rounds.join('\n')
    };
  },

  // ── 6. TIC TAC TOE ─────────────────────────────────────────────
  playTicTacToe(p1Name, p2Name) {
    // Generate a random dynamic realistic endgame board
    const boards = [
      {
        grid: '❌ ⭕ ❌\n⭕ ❌ ⭕\n❌ ⬜ ⬜',
        winner: p1Name,
        symbol: '❌'
      },
      {
        grid: '⭕ ⭕ ⭕\n❌ ❌ ⬜\n⬜ ❌ ⬜',
        winner: p2Name,
        symbol: '⭕'
      },
      {
        grid: '❌ ⭕ ❌\n❌ ⭕ ⭕\n⭕ ❌ ❌',
        winner: 'Tie Game',
        symbol: '🤝'
      }
    ];
    const picked = boards[Math.floor(Math.random() * boards.length)];
    return {
      p1: p1Name,
      p2: p2Name,
      grid: picked.grid,
      winner: picked.winner,
      symbol: picked.symbol
    };
  },

  // ── 7. CONNECT 4 ───────────────────────────────────────────────
  playConnect4(p1Name, p2Name) {
    const board =
      '⚪⚪⚪⚪⚪⚪⚪\n' +
      '⚪⚪⚪⚪⚪⚪⚪\n' +
      '⚪⚪🔴⚪⚪⚪⚪\n' +
      '⚪🟡🔴🟡⚪⚪⚪\n' +
      '🟡🔴🔴🔴🔴⚪⚪\n' +
      '🔴🟡🟡🔴🟡🟡⚪';

    return {
      p1: p1Name,
      p2: p2Name,
      board,
      winner: p1Name,
      winningPiece: '🔴'
    };
  },

  // ── 8. GUESS THE NUMBER ────────────────────────────────────────
  playGuessTheNumber(guildId, userId, guess) {
    const key = `${guildId}_${userId}`;
    if (!GTN_SESSIONS.has(key)) {
      const secret = Math.floor(Math.random() * 100) + 1;
      GTN_SESSIONS.set(key, { secret, attempts: 0 });
    }

    const session = GTN_SESSIONS.get(key);
    session.attempts++;

    const g = parseInt(guess);
    if (isNaN(g) || g < 1 || g > 100) {
      return {
        prompt: true,
        message: '1 se 100 ke beech koi number guess karein! Example: `&guess 42`'
      };
    }

    if (g === session.secret) {
      const att = session.attempts;
      GTN_SESSIONS.delete(key);
      Economy.addWallet(guildId, userId, 250);
      return {
        correct: true,
        secret: g,
        attempts: att,
        reward: 250,
        message: `🎉 **Shabash!** Secret number **${g}** bilkul sahi tha!\nAapne **${att} attempts** me dhoond nikala.\n🎁 Reward: \`+250 Gothic Coins\``
      };
    } else if (g < session.secret) {
      return {
        correct: false,
        hint: 'higher',
        guess: g,
        attempts: session.attempts,
        message: `🔥 **Too Low!** Secret number **${g}** se bada hai! Agla guess karein.`
      };
    } else {
      return {
        correct: false,
        hint: 'lower',
        guess: g,
        attempts: session.attempts,
        message: `❄️ **Too High!** Secret number **${g}** se chota hai! Agla guess karein.`
      };
    }
  },

  // ── 9. FAST TYPER RACE ─────────────────────────────────────────
  getFastTyperSentence() {
    const sentences = [
      'The gothic phantom danced across the silver moonlight in silence.',
      'KIKI bot fortifies the obsidian kingdom against malicious raiders.',
      'Only the bravest souls can conquer the ancient catacombs beneath.',
      'A murder of dark ravens encircled the abandoned cathedral bell.',
      'Cursed whispers echo through the shadowy mist of the forgotten realm.'
    ];
    const picked = sentences[Math.floor(Math.random() * sentences.length)];
    return {
      sentence: picked,
      instructions: 'Neeche diye sentence ko sabse pehle bina kisi typo ke type karein!'
    };
  },

  // ── 10. HANGMAN ────────────────────────────────────────────────
  getHangmanPuzzle() {
    const item = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    const stage = HANGMAN_STAGES[2]; // Mid-game teaser with blanks
    const blanks = item.word.split('').map((c, i) => (i % 2 === 0 ? c : '_')).join(' ');

    return {
      word: item.word,
      hint: item.hint,
      stage,
      blanks,
      solution: `||${item.word}||`
    };
  },

  // ── 11. WORD SCRAMBLE ──────────────────────────────────────────
  getWordScramble() {
    const item = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    let letters = item.word.split('');
    // Shuffle letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join(' ');

    return {
      scrambled,
      hint: item.hint,
      word: item.word,
      solution: `||${item.word}||`
    };
  },

  // ── 12. RIDDLES ────────────────────────────────────────────────
  getRiddle() {
    const riddles = [
      {
        q: 'Me subah 4 tango par, dopahar ko 2 par, aur sham ko 3 par chalta hu. Me kaun hu?',
        ans: 'Insaan (Human Lifecycle)',
        hint: 'Bachpan, Jawani aur Budhapa'
      },
      {
        q: 'Mere paas chabiya (keys) hain par koi taale (locks) nahi, space hai par kamre nahi, enter kar sakte ho par bahar nahi ja sakte. Me kya hu?',
        ans: 'Keyboard ⌨️',
        hint: 'Aap abhi isse type kar rahe ho!'
      },
      {
        q: 'Jitna zyada aap mujhe lete ho, utna hi peeche chhodte jate ho. Me kya hu?',
        ans: 'Kadam (Footsteps) 👣',
        hint: 'Chalna'
      },
      {
        q: 'Aap mujhe dekh sakte ho par chhoo nahi sakte, mere bina aap andhere me ho jate ho. Me kya hu?',
        ans: 'Roshni / Light 💡',
        hint: 'Sooraj aur Bulb'
      }
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    return {
      question: r.q,
      hint: r.hint,
      answer: `||${r.ans}||`
    };
  },

  // ── 13. TRIVIAS ────────────────────────────────────────────────
  getAnimeTrivia() {
    const t = ANIME_TRIVIA[Math.floor(Math.random() * ANIME_TRIVIA.length)];
    return {
      question: t.q,
      options: t.options.join('\n'),
      answer: `||Option ${t.answer} (${t.ansText})||`
    };
  },

  getGamingTrivia() {
    const t = GAMING_TRIVIA[Math.floor(Math.random() * GAMING_TRIVIA.length)];
    return {
      question: t.q,
      options: t.options.join('\n'),
      answer: `||Option ${t.answer} (${t.ansText})||`
    };
  },

  getGeneralTrivia() {
    const t = GENERAL_TRIVIA[Math.floor(Math.random() * GENERAL_TRIVIA.length)];
    return {
      question: t.q,
      options: t.options.join('\n'),
      answer: `||Option ${t.answer} (${t.ansText})||`
    };
  },

  getMathSpeedChallenge() {
    const num1 = Math.floor(Math.random() * 80) + 12;
    const num2 = Math.floor(Math.random() * 40) + 6;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let res = 0;
    if (op === '+') res = num1 + num2;
    else if (op === '-') res = num1 - num2;
    else res = num1 * num2;

    return {
      problem: `${num1} ${op} ${num2} = ?`,
      answer: `||${res}||`
    };
  },

  getFlagQuiz() {
    const f = FLAG_QUIZ_DATA[Math.floor(Math.random() * FLAG_QUIZ_DATA.length)];
    return {
      flag: f.flag,
      options: f.options.join('\n'),
      answer: `||Option ${f.answer} (${f.country})||`
    };
  },

  getLogoQuiz() {
    const l = LOGO_QUIZ_DATA[Math.floor(Math.random() * LOGO_QUIZ_DATA.length)];
    return {
      emoji: l.emoji,
      hint: l.hint,
      options: l.options.join('\n'),
      answer: `||Option ${l.answer} (${l.brand})||`
    };
  }
};

module.exports = GamesEngine;
