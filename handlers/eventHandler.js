// KIKI Bot - Event Handler
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(chalk.magenta(`  [EVENT] Registered: ${event.name}`));
    } catch (err) {
      console.error(chalk.red(`[EVENT ERROR] ${file}: ${err.message}`));
    }
  }
};
