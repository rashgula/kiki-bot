const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

function resolveUnix(input) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (!input) return nowSec;
  const rel = String(input).trim().match(/^\+?(\d+)\s*([smhd])$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const mult = { s: 1, m: 60, h: 3600, d: 86400 }[rel[2].toLowerCase()];
    return nowSec + n * mult;
  }
  if (/^\d{9,11}$/.test(input.trim())) return parseInt(input.trim(), 10);
  const parsed = Date.parse(input);
  return Number.isNaN(parsed) ? nowSec : Math.floor(parsed / 1000);
}

function buildEmbed(unix) {
  const formats = ['f', 'F', 'R', 'd', 't'];
  const lines = formats.map(f => `• \`<t:${unix}:${f}>\` → <t:${unix}:${f}>`).join('\n');
  return KikiEmbed.purple(`⏰ Discord Timestamp Generator (\`${unix}\`)`, lines);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timestamp-gen')
    .setDescription('⏰ Generate Discord dynamic timestamps (e.g. now, +2h, 2026-12-31)')
    .addStringOption(o => o.setName('time').setDescription('Offset (+30m, +2h, +1d) or date/unix')),

  aliases: ['k-timestamp-gen', 'timestampgen', 'timestamp', 'ts'],
  name: 'timestamp-gen',

  async execute(interaction) {
    const unix = resolveUnix(interaction.options.getString('time'));
    await interaction.reply({ embeds: [buildEmbed(unix)] });
  },

  async run(message, args) {
    const unix = resolveUnix(args.join(' '));
    message.reply({ embeds: [buildEmbed(unix)] });
  }
};
