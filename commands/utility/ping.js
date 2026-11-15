const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('🏓 KIKI bot and WebSocket latency check karo'),
  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [KikiEmbed.purple('Pinging...', '🔮 Consulting the void...')], fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = client.ws.ping;
    const embed = KikiEmbed.purple('🏓 Pong! | KIKI Gothic Utility', `**Roundtrip Latency:** \`${latency}ms\`\n**WebSocket Heartbeat:** \`${ws}ms\`\n**Status:** 🔮 All Dark Systems Functional`);
    await interaction.editReply({ embeds: [embed] });
  },
  name: 'ping', aliases: ['latency', 'p'],
  async run(message, args, client) {
    const ws = client.ws.ping;
    message.reply({ embeds: [KikiEmbed.purple('🏓 Pong!', `WebSocket Ping: \`${ws}ms\``)] });
  }
};
