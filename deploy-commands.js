// KIKI Bot - Deploy Slash Commands to Discord
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // Optional: for instant guild command testing

if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE' || !CLIENT_ID || CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
  console.error(chalk.red('\n  ❌ .env me apna TOKEN aur CLIENT_ID daalein!'));
  console.error(chalk.yellow('  Edit file: .env\n'));
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// High priority categories first for top 100 global slash commands
const priorityCategories = ['antinuke', 'utility', 'admin', 'moderation', 'nuke', 'fun', 'security'];
const allCategories = fs.readdirSync(commandsPath).filter(f =>
  fs.statSync(path.join(commandsPath, f)).isDirectory()
);

// Sort so priority categories are picked first
const sortedCategories = [
  ...priorityCategories.filter(c => allCategories.includes(c)),
  ...allCategories.filter(c => !priorityCategories.includes(c))
];

for (const category of sortedCategories) {
  const files = fs.readdirSync(path.join(commandsPath, category)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    if (commands.length >= 100 && !GUILD_ID) break; // Discord global cap is 100 commands
    try {
      const cmd = require(path.join(commandsPath, category, file));
      if (cmd.data) {
        commands.push(cmd.data.toJSON());
      }
    } catch {}
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(chalk.magenta(`\n🔮 [KIKI] Registering ${commands.length} primary Slash Commands with Discord...`));
    console.log(chalk.gray(`  (Discord allows max 100 global slash commands; all 800+ commands are active via prefix commands)\n`));

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(chalk.green(`✅ Successfully deployed ${commands.length} guild slash commands to guild ${GUILD_ID}!\n`));
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(chalk.green(`✅ Successfully deployed ${commands.length} global slash commands!\n`));
    }
  } catch (err) {
    console.error(chalk.red('❌ Deploy failed:'), err);
  }
})();
