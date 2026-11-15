// ══════════════════════════════════════════════════════════════
//   KIKI - Gothic Purple Discord Bot | KIKI JS Edition v2.2
//   800+ Commands | Gothic Purple Theme | Dark Arts Utility
// ══════════════════════════════════════════════════════════════

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const chalk = require('chalk');
const config = require('./config.js');

// ── Create Client ───────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// ── Collections ─────────────────────────────────────────────────
client.commands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

// ── Load Handlers ───────────────────────────────────────────────
console.log(chalk.magenta('\n  🔮 KIKI is booting up...\n'));

try {
  require('./handlers/commandHandler')(client);
  require('./handlers/eventHandler')(client);
} catch (err) {
  console.error(chalk.red('[BOOT ERROR]'), err);
  process.exit(1);
}

// ── Token Validation ────────────────────────────────────────────
const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || require('./data/config.json').token;

if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error(chalk.red.bold('\n  ❌ ERROR: Railway / Environment Variables me apna Discord Bot Token add karein!'));
  console.error(chalk.yellow('  Railway Dashboard -> Variables -> Add "TOKEN = your_bot_token"\n'));
  process.exit(1);
}

// ── Railway / Cloud Web Keep-Alive (Health Check) ───────────────
if (process.env.PORT) {
  try {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', bot: 'KIKI', uptime: Math.floor(process.uptime()) }));
    });
    server.listen(process.env.PORT, () => {
      console.log(chalk.green(`  🌐 [HEALTH CHECK] Web server listening on port ${process.env.PORT}`));
    });
  } catch (e) {
    console.error('[HTTP ERROR]', e.message);
  }
}

// ── Login ───────────────────────────────────────────────────────
client.login(TOKEN).catch(err => {
  console.error(chalk.red.bold('\n  ❌ LOGIN FAILED:'), err.message);
  console.error(chalk.yellow('  Token galat hai ya expired hai. Discord Developer Portal se naya token lo.\n'));
  process.exit(1);
});

// ── Graceful Shutdown & Safe State Persistence ──────────────────
function onShutdown(signal) {
  console.log(chalk.magenta(`\n  🔮 KIKI shutting down (${signal})... Saving all levels, XP and configs!\n`));
  try {
    require('./utils/leveling.js').saveNow();
  } catch {}
  try {
    client.destroy();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', () => onShutdown('SIGINT'));
process.on('SIGTERM', () => onShutdown('SIGTERM'));
process.on('beforeExit', () => {
  try {
    require('./utils/leveling.js').saveNow();
  } catch {}
});
process.on('exit', () => {
  try {
    require('./utils/leveling.js').saveNow();
  } catch {}
});

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('[UNHANDLED REJECTION]'), err);
});

module.exports = client;
