const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping-check')
    .setDescription('📡 Check KIKI WebSocket & API latency'),

  aliases: ['k-ping-check', 'pingcheck'],
  name: 'ping-check',

  async execute(interaction, client) {
    const start = Date.now();
    await interaction.reply({ embeds: [KikiEmbed.purple('📡 Measuring Latency...', 'Checking gateway & REST roundtrip...')] });
    const apiLatency = Date.now() - start;
    const ws = Math.round(client.ws?.ping ?? 0);
    await interaction.editReply({
      embeds: [KikiEmbed.purple('📡 Pong • KIKI Latency', `• **WebSocket Gateway:** \`${ws}ms\`\n• **API Roundtrip:** \`${apiLatency}ms\``)]
    });
  },

  async run(message, args, client) {
    const start = Date.now();
    const sent = await message.reply({ embeds: [KikiEmbed.purple('📡 Pinging...', 'Measuring response time...')] });
    const apiLatency = Date.now() - start;
    const ws = Math.round(client.ws?.ping ?? 0);
    await sent.edit({
      embeds: [KikiEmbed.purple('📡 Pong • KIKI Latency', `• **WebSocket Gateway:** \`${ws}ms\`\n• **Message Latency:** \`${apiLatency}ms\``)]
    });
  }
};
