// KIKI Bot - Command Handler
const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Popular intuitive aliases mapping
const POPULAR_SHORT_ALIASES = {
  // Economy
  'balance-wallet-view': ['balance', 'bal', 'wallet', 'paisa'],
  'daily-reward-claim': ['daily'],
  'weekly-reward-claim': ['weekly'],
  'monthly-reward-claim': ['monthly'],
  'work-job-shift': ['work', 'job'],
  'crime-heist-attempt': ['crime', 'heist'],
  'fish-catch-lake': ['fish', 'fishing'],
  'hunt-forest-game': ['hunt', 'hunting'],
  'mine-ore-cavern': ['mine', 'mining'],
  'deposit-bank-coins': ['deposit', 'dep'],
  'withdraw-bank-coins': ['withdraw', 'with'],
  'transfer-pay-coins': ['pay', 'transfer', 'give'],
  'shop-browse-items': ['shop', 'store'],
  'buy-shop-item': ['buy'],
  'inventory-view-bag': ['inventory', 'inv', 'bag'],
  'leaderboard-rich': ['rich', 'ecotop', 'ecolb'],
  'gamble-dice-bet': ['bet', 'gamble'],
  'gamble-slots-bet': ['slots', 'slot'],
  'rob-member-coins': ['rob'],
  'use-inventory-item': ['use'],

  // Steal & Utility
  'emojisteal': ['steal', 'esteal', 'stealemoji', 'stealall', 'masssteal'],

  // Fun & Animals
  'cat-photo-random': ['cat', 'meow', 'catphoto'],
  'dog-photo-random': ['dog', 'woof', 'dogphoto'],
  'bird-photo-random': ['bird', 'birdphoto'],
  'fox-photo-random': ['fox'],
  'panda-photo-random': ['panda'],
  'dark-meme-fetch': ['meme', 'darkmeme'],
  'dadjoke-random': ['joke', 'dadjoke'],
  'joke-random-humor': ['pun'],
  'fact-random-real': ['fact'],
  'punch-member-send': ['punch'],
  'highfive-member': ['highfive'],
  'wink-member-send': ['wink'],
  'rate-anything-scale': ['rate'],
  'iq-test-mock': ['iq'],
  'simp-meter-check': ['simp', 'simpmeter'],
  'sus-meter-check': ['sus', 'susmeter'],
  'trivia-question-play': ['trivia', 'quiz'],
  'rps-challenge-bot': ['grps', 'rockpaperscissors'],
  'gothic-coinflip': ['coin', 'gcoinflip'],
  'gothic-dice-roll': ['gdice', 'groll'],
  'gothic-roast-user': ['groast', 'burn'],
  'dark-romance-ship': ['darkship'],

  // Actions
  'hug-member-send': ['hug'],
  'kiss-member-send': ['kiss'],
  'slap-member-send': ['slap'],
  'bite-member-send': ['bite'],
  'cuddle-member-send': ['cuddle'],
  'pat-member-send': ['pat'],
  'kill-member-send': ['kill'],

  // Social & Marriage
  'marry-propose-user': ['marry', 'propose'],
  'divorce-partner-user': ['divorce'],
  'marriage-status-view': ['marriage', 'partner'],

  // Games
  'blackjack-game-deal': ['blackjack', 'bj', '21'],
  'coin-wager-bet': ['coinwager', 'wager'],
  'connect4-challenge': ['connect4', 'c4'],
  'duel-challenge-fight': ['duel', 'fight'],
  'fast-typer-race': ['type', 'typerace'],
  'flag-quiz-guess': ['flag', 'flagquiz'],
  'guess-the-number': ['gtn', 'guess'],
  'hangman-game-play': ['hangman'],
  'logo-quiz-guess': ['logo', 'logoquiz'],
  'minesweeper-grid': ['minesweeper', 'mines'],
  'riddle-solve-puzzle': ['riddle'],
  'roulette-spin-wheel': ['roulette'],
  'russian-roulette': ['rr', 'russianroulette'],
  'slots-spin-reels': ['spin'],
  'tictactoe-challenge': ['tictactoe', 'ttt'],
  'trivia-anime-quiz': ['animetrivia', 'animequiz'],
  'trivia-gaming-quiz': ['gamingtrivia', 'gamequiz'],
  'trivia-general-quiz': ['generaltrivia', 'gkquiz'],
  'trivia-math-speed': ['mathspeed', 'mathquiz'],
  'word-scramble-play': ['scramble', 'wordscramble']
};

module.exports = (client) => {
  client.commands = new Collection();
  client.prefixCommands = new Collection();
  client.categories = new Collection();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  let totalFiles = 0;
  let totalSlash = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
    const categoryCmdList = [];

    for (const file of files) {
      try {
        const filePath = path.join(categoryPath, file);
        const command = require(filePath);
        totalFiles++;

        // Attach category to command
        command.category = category;

        const cmdName = command.data?.name || command.name || file.replace('.js', '');
        const cmdDesc = command.data?.description || command.description || 'Gothic command';
        const fileBase = file.replace('.js', '');

        // Gather all aliases
        const aliases = new Set(command.aliases || []);
        if (POPULAR_SHORT_ALIASES[fileBase]) {
          POPULAR_SHORT_ALIASES[fileBase].forEach(a => aliases.add(a));
        }
        if (POPULAR_SHORT_ALIASES[cmdName]) {
          POPULAR_SHORT_ALIASES[cmdName].forEach(a => aliases.add(a));
        }
        // Add dash-free alias if distinct
        const noDash = cmdName.replace(/-/g, '');
        if (noDash !== cmdName) aliases.add(noDash);

        command.aliases = Array.from(aliases);

        categoryCmdList.push({
          name: cmdName,
          description: cmdDesc,
          aliases: command.aliases,
          category: category,
          isSlash: !!(command.data && command.execute)
        });

        // Slash command
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          totalSlash++;
        }

        // Prefix command
        if (command.run || (command.data && command.execute)) {
          // Main name registration
          client.prefixCommands.set(cmdName, command);
          client.prefixCommands.set(fileBase, command);

          // Register all aliases
          command.aliases.forEach(alias => {
            if (!client.prefixCommands.has(alias)) {
              client.prefixCommands.set(alias, command);
            }
          });
        }

      } catch (err) {
        console.error(chalk.red(`[CMD ERROR] ${category}/${file}: ${err.message}`));
      }
    }

    client.categories.set(category, categoryCmdList);
    console.log(chalk.magenta(`  [KIKI] Category: ${chalk.bold(category.padEnd(12))} | ${files.length} commands`));
  }

  console.log(chalk.bold.magenta(`\n  🔮 ═════════════════════════════════════════════════════`));
  console.log(chalk.bold.magenta(`     ✨ TOTAL KIKI COMMANDS LOADED : ${chalk.bold.white(totalFiles + '+')}`));
  console.log(chalk.bold.magenta(`     ⚡ Active Prefix Commands     : ${chalk.bold.white(client.prefixCommands.size)}`));
  console.log(chalk.bold.magenta(`     🗡️ Slash Command Handlers     : ${chalk.bold.white(totalSlash)}`));
  console.log(chalk.bold.magenta(`  ═══════════════════════════════════════════════════════\n`));

  client.totalCommands = totalFiles;

  // Auto-Sync Documentation into "kiki all cmd" folder
  try {
    const commandDocsSync = require('../utils/commandDocsSync.js');
    commandDocsSync.syncAll(false);
  } catch (err) {
    console.error(chalk.yellow(`[KIKI DOCS SYNC ERROR]: ${err.message}`));
  }
};
