// KIKI Bot - Command Handler
const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

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

        const cmdName = command.data?.name || command.name || file.replace('.js', '');
        const cmdDesc = command.data?.description || command.description || 'Gothic command';
        categoryCmdList.push({
          name: cmdName,
          description: cmdDesc,
          aliases: command.aliases || [],
          isSlash: !!(command.data && command.execute)
        });

        // Slash command
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          totalSlash++;
        }

        // Prefix command
        if (command.name && command.run) {
          client.prefixCommands.set(command.name, command);
          if (command.aliases) {
            command.aliases.forEach(alias => client.prefixCommands.set(alias, command));
          }
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
