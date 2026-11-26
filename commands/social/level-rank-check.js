const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const config = require('../../config.js');

function buildBar(cur, max, len = 12) {
  const pct = max > 0 ? Math.min(Math.max(cur / max, 0), 1) : 1;
  const filled = Math.round(pct * len);
  return `\`[${'█'.repeat(filled)}${'░'.repeat(len - filled)}]\` ${Math.floor(pct * 100)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level-rank-check')
    .setDescription('📊 View chat & voice XP level and rank card')
    .addUserOption(o => o.setName('user').setDescription('Member to check')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const u = Leveling.getUser(interaction.guildId, target.id);
    const prev = Leveling.getXpForLevel(u.chatLevel);
    const next = Leveling.getXpForLevel(u.chatLevel + 1);
    const bar = buildBar(Math.max(0, u.chatXp - prev), Math.max(1, next - prev));
    const embed = KikiEmbed.build({
      title: `📊 Activity Rank • ${target.username}`,
      description:
        `💬 **Chat Level:** \`Level ${u.chatLevel}\` (${u.chatXp.toLocaleString()} XP)\n` +
        `${bar}\n` +
        `✉️ **Messages:** \`${u.messages.toLocaleString()}\`\n\n` +
        `🎙️ **Voice Level:** \`Level ${u.level}\` (${u.xp.toLocaleString()} XP • ${Leveling.formatVoiceTime(u.voiceTime)})`,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      thumbnail: target.displayAvatarURL({ dynamic: true })
    });
    await interaction.reply({ embeds: [embed] });
  },

  name: 'level-rank-check',
  aliases: ['k-level-rank-check', 'levelrankcheck'],
  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null)
      || message.author;
    const u = Leveling.getUser(message.guild.id, target.id);
    const prev = Leveling.getXpForLevel(u.chatLevel);
    const next = Leveling.getXpForLevel(u.chatLevel + 1);
    const bar = buildBar(Math.max(0, u.chatXp - prev), Math.max(1, next - prev));
    const embed = KikiEmbed.build({
      title: `📊 Activity Rank • ${target.username}`,
      description:
        `💬 **Chat Level:** \`Level ${u.chatLevel}\` (${u.chatXp.toLocaleString()} XP)\n` +
        `${bar}\n` +
        `✉️ **Messages:** \`${u.messages.toLocaleString()}\`\n\n` +
        `🎙️ **Voice Level:** \`Level ${u.level}\` (${u.xp.toLocaleString()} XP • ${Leveling.formatVoiceTime(u.voiceTime)})`,
      color: config.COLORS.PRIMARY || 0x9B59B6,
      thumbnail: target.displayAvatarURL({ dynamic: true })
    });
    message.reply({ embeds: [embed] });
  }
};
