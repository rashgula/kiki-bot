const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble-slots-bet')
    .setDescription('🎰 Spin the gothic cursed slot machine')
    .addIntegerOption(o => o.setName('amount').setDescription('Coins to spin').setRequired(true)),

  aliases: ['slots', 'slot'],
  name: 'gamble-slots-bet',

  async execute(interaction, client) {
    const amt = interaction.options.getInteger('amount');
    const res = Economy.slots(interaction.guildId, interaction.user.id, amt);
    if (!res.success || res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Slot Error ⚠️', res.message || res.error)] });
    }
    const embed = res.win
      ? KikiEmbed.success('JACKPOT! 🎰', `${res.display}\n\n${res.message}\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``)
      : KikiEmbed.purple('Gothic Slots 🎰', `${res.display}\n\n${res.message}\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const amt = args[0] === undefined ? 50 : parseInt(args[0], 10);
    const res = Economy.slots(message.guild.id, message.author.id, amt);
    if (!res.success || res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Slot Error ⚠️', res.message || res.error)] });
    }
    const embed = res.win
      ? KikiEmbed.success('JACKPOT! 🎰', `${res.display}\n\n${res.message}\n**New Wallet:** \`${res.balance.toLocaleString()} Coins\``)
      : KikiEmbed.purple('Gothic Slots 🎰', `${res.display}\n\n${res.message}\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``);
    message.reply({ embeds: [embed] });
  }
};
