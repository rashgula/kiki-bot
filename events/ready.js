// KIKI Bot - Ready Event
const { ActivityType, REST, Routes } = require('discord.js');
const chalk = require('chalk');
const KIKI = require('../utils/kiki.js');
const config = require('../config.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    // Set KIKI presence
    client.user.setPresence({
      activities: [{
        name: `🔮 &help | ${client.totalCommands || '1,114+'} cmds | KIKI v${config.BOT_VERSION}`,
        type: ActivityType.Watching,
      }],
      status: 'dnd',
    });

    // Print KIKI banner
    console.log('\n');
    console.log(chalk.magenta.bold(config.BANNER));
    console.log(chalk.magenta('═'.repeat(55)));
    console.log(chalk.bold.white(`  BOT NAME   : `) + chalk.magenta.bold(client.user.tag));
    console.log(chalk.bold.white(`  BOT ID     : `) + chalk.gray(client.user.id));
    console.log(chalk.bold.white(`  SERVERS    : `) + chalk.magenta(client.guilds.cache.size));
    console.log(chalk.bold.white(`  COMMANDS   : `) + chalk.magenta.bold(`${client.totalCommands || 1114}+ (Catalog Loaded)`));
    console.log(chalk.bold.white(`  PREFIX     : `) + chalk.magenta(config.PREFIX));
    console.log(chalk.bold.white(`  VERSION    : `) + chalk.magenta(`v${config.BOT_VERSION}`));
    console.log(chalk.magenta('═'.repeat(55)));
    console.log(chalk.italic.magenta(`\n  ${KIKI.randomQuote()}\n`));
    console.log(chalk.bold.green('  ✅ KIKI is ONLINE and ready to serve!\n'));

    // ── 1. Start Voice XP Ticker IMMEDIATELY on boot ────────────
    try {
      require('../utils/leveling.js').initVoiceTicker(client);
    } catch (e) {
      console.error(chalk.red('[LEVELING INIT ERROR]'), e.message);
    }

    // ── 2. Start Deaf AFK Mover Ticker ──────────────────────────
    try {
      require('../utils/deafMover.js').init(client);
    } catch (e) {
      console.error(chalk.red('[DEAF MOVER INIT ERROR]'), e.message);
    }

    // ── 3. Start Voice Master Temporary Channels Engine ─────────
    try {
      require('../utils/voiceMaster.js').init(client);
    } catch (e) {
      console.error(chalk.red('[VOICE MASTER INIT ERROR]'), e.message);
    }

    // ── 4. Initialize Invite Tracker Engine ──────────────────────
    try {
      await require('../utils/inviteTracker.js').init(client);
    } catch (e) {
      console.error(chalk.red('[INVITE TRACKER INIT ERROR]'), e.message);
    }

    // ── 5. Run Auto-Boot Restorer & Self-Healing Engine ──────────
    try {
      const bootRestorer = require('../utils/bootRestorer.js');
      await bootRestorer.restoreAndVerify(client);
    } catch (e) {
      console.error(chalk.red('[BOOT RESTORER ERROR]'), e.message);
    }

    // ── 5. Run Command Auto-Execution Engine (Replay all saved commands) ──
    try {
      const CommandAutoExec = require('../utils/commandAutoExec.js');
      await CommandAutoExec.replayOnStartup(client);
    } catch (e) {
      console.error(chalk.red('[COMMAND AUTO-EXEC ERROR]'), e.message);
    }

    // ── 4. Non-blocking background slash command registration ────
    (async () => {
      try {
        const slashCmds = [];
        for (const [, cmd] of client.commands) {
          if (slashCmds.length >= 100) break;
          if (cmd.data) slashCmds.push(cmd.data.toJSON());
        }
        if (slashCmds.length > 0) {
          for (const [, guild] of client.guilds.cache) {
            await guild.commands.set(slashCmds).catch(() => {});
          }
        }
      } catch (e) {}
    })();
  }
};
