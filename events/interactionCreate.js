const KikiEmbed = require('../utils/embed.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ── Slash Commands ──────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const KIKI = require('../utils/kiki.js');
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // ── STRICT ANTINUKE OWNERSHIP GUARD ─────────────────────────
      const isAntiNukeCmd = interaction.commandName === 'antinuke' || interaction.commandName === 'master-antinuke' ||
        interaction.commandName === 'whitelist' || interaction.commandName.startsWith('anti-') || interaction.commandName.startsWith('antinuke');

      if (isAntiNukeCmd && !KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
        const deniedEmbed = KikiEmbed.error(
          'Ownership Required 👑',
          '⚠️ Anti-Nuke security commands sirf **Server Owner** ya **Bot Owner** ke liye reserved hain!\nKisi aur ke paas isko ON / OFF karne ki permission nahi hai.'
        );
        return interaction.reply({ embeds: [deniedEmbed], ephemeral: true });
      }

      const isWhitelisted = KIKI.isSafe(interaction.guild, interaction.user.id, client);
      const isPublic = KIKI.isCommandPublic(interaction.commandName, command);

      if (!isWhitelisted && !isPublic) {
        const deniedEmbed = KikiEmbed.error(
          'Access Denied 🔒',
          '⚠️ Aap whitelisted nahi hain!\nSirf **Whitelisted members** hi ye command chala sakte hain.\n\n*Server Owner `/cmdpanel` se public commands allow kar sakte hain.*'
        );
        return interaction.reply({ embeds: [deniedEmbed], ephemeral: true });
      }

      try {
        await command.execute(interaction, client);

        // Auto-save command for automatic replay on restart
        if (isWhitelisted || KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id)) {
          try {
            const CommandAutoExec = require('../utils/commandAutoExec.js');
            const sub = interaction.options.getSubcommand(false);
            const args = sub ? [sub] : [];
            CommandAutoExec.recordCommand(interaction.commandName, args, interaction);
          } catch {}
        }
      } catch (err) {
        console.error(`[CMD ERROR] /${interaction.commandName}:`, err);
        const errEmbed = KikiEmbed.error('Command Error', `Kuch toh gadbad hai bhai!\n\`\`\`${err.message}\`\`\``);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
      }
      return;
    }

    // ── Command Access Panel Interactions ────────────────────────
    if (interaction.customId && interaction.customId.startsWith('cp_')) {
      const cpHandler = require('../commands/admin/cmdpanel.js');
      if (cpHandler.handleInteraction) {
        await cpHandler.handleInteraction(interaction, client);
        return;
      }
    }

    // ── Chat Level Panel Interactions ───────────────────────────
    if (interaction.customId && interaction.customId.startsWith('cl_')) {
      const clHandler = require('../commands/admin/chatlevelpanel.js');
      if (clHandler.handleInteraction) {
        await clHandler.handleInteraction(interaction, client);
        return;
      }
    }

    // ── Auto-Role Panel Interactions ─────────────────────────────
    if (interaction.customId && interaction.customId.startsWith('ar_')) {
      const arHandler = require('../commands/admin/autorolepanel.js');
      if (arHandler.handleInteraction) {
        await arHandler.handleInteraction(interaction, client);
        return;
      }
    }

    // ── Deaf AFK Mover Panel Interactions ────────────────────────
    if (interaction.customId && interaction.customId.startsWith('dm_')) {
      const dmHandler = require('../commands/admin/deafafkpanel.js');
      if (dmHandler.handleInteraction) {
        await dmHandler.handleInteraction(interaction, client);
        return;
      }
    }

    // ── Voice Master Panel Interactions (Buttons & Modals) ───────
    if (interaction.customId && interaction.customId.startsWith('vm_')) {
      const VoiceMaster = require('../utils/voiceMaster.js');
      try {
        await VoiceMaster.handleInteraction(interaction, client);
      } catch (err) {
        console.error('[VOICEMASTER INTERACTION ERROR]', err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '⚠️ Voice Master error: ' + err.message, ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // ── Button Interactions ─────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      try {
        // Saved Commands Panel buttons
        if (customId.startsWith('sec_btn_')) {
          const secHandler = require('../commands/admin/savedcommands.js');
          if (secHandler.handleInteraction) await secHandler.handleInteraction(interaction, client);
          return;
        }

        // Master Anti-Nuke buttons
        if (customId.startsWith('man_')) {
          const manHandler = require('../commands/antinuke/master-antinuke.js');
          if (manHandler.handleButton) await manHandler.handleButton(interaction, client);
          return;
        }

        // Help navigation buttons
        if (customId.startsWith('help_')) {
          const helpHandler = require('../commands/utility/help.js');
          if (helpHandler.handleButton) await helpHandler.handleButton(interaction, client);
          return;
        }

        // Ticket system buttons
        if (customId === 'open_ticket_btn') {
          const ticketHandler = require('../commands/utility/ticket.js');
          if (ticketHandler.handleButton) await ticketHandler.handleButton(interaction, client);
          return;
        }

        if (customId === 'close_ticket_btn') {
          await interaction.reply({ content: '⚠️ Ticket 5 seconds mein close ho jayega...', ephemeral: false });
          setTimeout(async () => {
            try { await interaction.channel.delete('Ticket closed by user/staff'); } catch {}
          }, 5000);
          return;
        }

        if (customId === 'confirm_nuke') {
          const nukeHandler = require('../commands/nuke/nuke.js');
          if (nukeHandler.handleConfirm) await nukeHandler.handleConfirm(interaction, client);
          return;
        }

        if (customId === 'cancel_nuke') {
          const cancelEmbed = KikiEmbed.warn('Action Cancelled', 'Nuke operation cancel kar di gayi hai.');
          await interaction.update({ embeds: [cancelEmbed], components: [] });
          return;
        }
      } catch (btnErr) {
        console.error('[BUTTON INTERACTION ERROR]', btnErr);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '⚠️ Button action error: ' + btnErr.message, ephemeral: true }).catch(() => {});
        }
      }
    }

    // ── Select Menu Interactions ────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      try {
        if (interaction.customId === 'help_category') {
          const helpHandler = require('../commands/utility/help.js');
          if (helpHandler.handleSelect) await helpHandler.handleSelect(interaction, client);
          return;
        }
      } catch (selErr) {
        console.error('[SELECT MENU INTERACTION ERROR]', selErr);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '⚠️ Selection error: ' + selErr.message, ephemeral: true }).catch(() => {});
        }
      }
    }
  }
};
