// KIKI Bot - Saved Commands & Auto-Boot Replay Controller
// Displays all saved commands that auto-run on boot, with options to re-run or manage them

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const CommandAutoExec = require('../../utils/commandAutoExec.js');
const config = require('../../config.js');

function buildSavedCommandsEmbed() {
  const commands = CommandAutoExec.getSavedCommands();

  let desc =
    `**KIKI Auto-Replay & Command Persistence Engine**\n\n` +
    `Bot band hokar dobara restart hone par niche di gayi **saari commands automatically execute/restore** ho jati hain!\n` +
    `Aapko restart ke baad koi bhi command dubara type karne ki zaroorat nahi hai. ✨\n\n` +
    `• 💾 **Total Auto-Replay Commands:** \`${commands.length} Commands Active\`\n` +
    `• 🔁 **Reboot Behavior:** Automatic zero-setup auto-execution\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `**📋 Currently Saved Commands:**\n`;

  if (commands.length === 0) {
    desc += `*Abhi koi command saved nahi hai. Koi bhi command chalayein, wo automatically save ho jayegi!*`;
  } else {
    commands.forEach((c, idx) => {
      const timeStr = c.timestamp ? `<t:${Math.floor(c.timestamp / 1000)}:R>` : 'Active';
      const descText = c.description ? `*(${c.description})*` : '';
      desc += `${idx + 1}. \`${c.command}\` ${descText} — ${timeStr}\n`;
    });
  }

  desc +=
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 **Kaise Kaam Karta Hai?**\n` +
    `• **Aage jo bhi command aap dalenge**, wo automatically is list me save ho jayegi.\n` +
    `• **"⚡ Re-run All Now"** par click karke aap sabhi commands ko turant re-execute kar sakte hain!`;

  return KikiEmbed.build({
    title: '💾 KIKI • Auto-Replay Saved Commands',
    description: desc,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `Command Persistence Engine • KIKI v${config.BOT_VERSION}` }
  });
}

function buildActionButtons() {
  const rerunBtn = new ButtonBuilder()
    .setCustomId('sec_btn_rerun')
    .setLabel('Re-run All Now')
    .setEmoji('⚡')
    .setStyle(ButtonStyle.Success);

  const refreshBtn = new ButtonBuilder()
    .setCustomId('sec_btn_refresh')
    .setLabel('Refresh')
    .setEmoji('🔃')
    .setStyle(ButtonStyle.Secondary);

  const clearBtn = new ButtonBuilder()
    .setCustomId('sec_btn_clear')
    .setLabel('Clear All')
    .setEmoji('🗑️')
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(rerunBtn, refreshBtn, clearBtn);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('savedcommands')
    .setDescription('💾 View and manage all commands that automatically run upon bot restart')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** is panel ko dekh sakte hain!')],
        ephemeral: true
      });
    }

    const embed = buildSavedCommandsEmbed();
    const row = buildActionButtons();
    await interaction.reply({ embeds: [embed], components: [row] });
  },

  name: 'savedcommands',
  aliases: ['savedcmds', 'autocmds', 'autoexec', 'savecmd', 'unsavecmd'],
  async run(message, args, client) {
    if (!KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf **Server Owner** ya **Whitelisted members** is panel ko dekh sakte hain!')]
      });
    }

    const sub = args[0]?.toLowerCase();

    // Add command manually
    if (sub === 'add' || message.content.includes('&savecmd ')) {
      const rawCmd = message.content.replace(/^&(savecmd|savedcommands add|autocmds add)\s+/i, '').trim();
      if (!rawCmd) {
        return message.reply({ embeds: [KikiEmbed.error('Invalid Command', 'Usage: `&savecmd <command>` (e.g. `&savecmd &voicemaster setup`)')] });
      }

      const parts = rawCmd.replace(/^[&/]/, '').split(/ +/);
      const name = parts[0];
      const cmdArgs = parts.slice(1);

      CommandAutoExec.recordCommand(name, cmdArgs, message);
      return message.reply({
        embeds: [KikiEmbed.success('Command Saved 💾', `Command \`${rawCmd}\` ko auto-replay list me save kar diya gaya hai!`)]
      });
    }

    // Remove command manually
    if (sub === 'remove' || sub === 'delete' || message.content.includes('&unsavecmd ')) {
      const target = args[1] || args[0];
      const removed = CommandAutoExec.removeCommand(target);
      if (removed) {
        return message.reply({
          embeds: [KikiEmbed.success('Command Removed 🗑️', `Command \`${target}\` ko auto-replay list se hata diya gaya hai.`)]
        });
      } else {
        return message.reply({
          embeds: [KikiEmbed.error('Not Found', `Command \`${target}\` saved list me nahi mili.`)]
        });
      }
    }

    // Default view
    const embed = buildSavedCommandsEmbed();
    const row = buildActionButtons();
    await message.reply({ embeds: [embed], components: [row] });
  },

  // ── Button Interactions ─────────────────────────────────────────
  async handleInteraction(interaction, client) {
    const customId = interaction.customId;
    if (!customId || !customId.startsWith('sec_btn_')) return;

    if (!KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Aapke paas is panel ko control karne ki permission nahi hai!')],
        ephemeral: true
      });
    }

    if (customId === 'sec_btn_rerun') {
      await interaction.deferUpdate();
      const count = await CommandAutoExec.replayOnStartup(client);
      const embed = buildSavedCommandsEmbed();
      const noticeEmbed = KikiEmbed.success(
        'All Commands Replayed ⚡',
        `Saari **${count} saved commands** turant live re-execute aur restore kar di gayi hain!`
      );

      await interaction.followUp({ embeds: [noticeEmbed], ephemeral: true });
      await interaction.editReply({ embeds: [embed], components: [buildActionButtons()] });
      return;
    }

    if (customId === 'sec_btn_refresh') {
      const embed = buildSavedCommandsEmbed();
      await interaction.update({ embeds: [embed], components: [buildActionButtons()] });
      return;
    }

    if (customId === 'sec_btn_clear') {
      CommandAutoExec.clearCommands();
      const embed = buildSavedCommandsEmbed();
      await interaction.update({ embeds: [embed], components: [buildActionButtons()] });
      return;
    }
  }
};
