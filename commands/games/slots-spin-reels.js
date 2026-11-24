const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots-spin-reels')
    .setDescription('🎰 Spin three reels on the gothic slot machine')
    .addIntegerOption(o => o.setName('bet').setDescription('Coins to spin')),

  aliases: ['spin', 'gothicslots'],
  name: 'slots-spin-reels',

  async execute(interaction, client) {
    const bet = interaction.options.getInteger('bet') || 50;
    const res = Economy.slots(interaction.guildId, interaction.user.id, bet);
    if (res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Slot Error ⚠️', res.error)] });
    }
    const display = '[ ' + res.slots.join(' | ') + ' ]';
    const embed = res.win ?
      KikiEmbed.success('GOTHIC JACKPOT! 🎰', display + '\n\n🎉 **Aap jeet gaye!** +' + res.winAmount.toLocaleString() + ' Coins (' + res.multiplier + 'x)\n💰 **New Wallet:** `' + res.wallet.toLocaleString() + ' Coins`') :
      KikiEmbed.purple('Gothic Slot Machine 🎰', display + '\n\n💀 **Afsos, match nahi hua!** Lost: ' + bet + ' Coins\n💰 **Remaining Wallet:** `' + res.wallet.toLocaleString() + ' Coins`');
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const bet = parseInt(args[0]) || 50;
    const res = Economy.slots(message.guild.id, message.author.id, bet);
    if (res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Slot Error ⚠️', res.error)] });
    }
    const display = '[ ' + res.slots.join(' | ') + ' ]';
    const embed = res.win ?
      KikiEmbed.success('GOTHIC JACKPOT! 🎰', display + '\n\n🎉 **Aap jeet gaye!** +' + res.winAmount.toLocaleString() + ' Coins (' + res.multiplier + 'x)\n💰 **New Wallet:** `' + res.wallet.toLocaleString() + ' Coins`') :
      KikiEmbed.purple('Gothic Slot Machine 🎰', display + '\n\n💀 **Afsos, match nahi hua!** Lost: ' + bet + ' Coins\n💰 **Remaining Wallet:** `' + res.wallet.toLocaleString() + ' Coins`');
    message.reply({ embeds: [embed] });
  }
};
