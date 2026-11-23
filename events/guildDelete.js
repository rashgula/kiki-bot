// KIKI Bot - Guild Delete / Leave Event
const chalk = require('chalk');

module.exports = {
  name: 'guildDelete',
  async execute(guild, client) {
    console.log(chalk.yellow(`\n  👋 [SERVER LEFT] KIKI was removed from: ${guild.name} (${guild.id})`));
  }
};
