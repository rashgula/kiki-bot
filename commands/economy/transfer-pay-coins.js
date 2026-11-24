const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer-pay-coins')
    .setDescription('💸 Pay/Transfer coins to another member')
    .addUserOption(o => o.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),

  aliases: ['pay', 'transfer', 'give'],
  name: 'transfer-pay-coins',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const amt = interaction.options.getInteger('amount');
    const res = Economy.transfer(interaction.guildId, interaction.user.id, target.id, amt);
    if (!res.success) {
      return interaction.reply({ embeds: [KikiEmbed.error('Transfer Error', res.message)] });
    }
    const embed = KikiEmbed.success('Payment Sent 💸',
      `Aapne **${target.username}** ko \`${amt.toLocaleString()} Gothic Coins\` transfer kiye!\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const target = message.mentions.users.first();
    const amt = parseInt(args[1]) || parseInt(args[0]);
    if (!target) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid Target', 'Kripya kisi member ko mention karein: `&pay @user 500`')] });
    }
    const res = Economy.transfer(message.guild.id, message.author.id, target.id, amt);
    if (!res.success) {
      return message.reply({ embeds: [KikiEmbed.error('Transfer Error', res.message)] });
    }
    const embed = KikiEmbed.success('Payment Sent 💸',
      `Aapne **${target.username}** ko \`${amt.toLocaleString()} Gothic Coins\` transfer kiye!\n\n**Remaining Wallet:** \`${res.balance.toLocaleString()} Coins\``
    );
    message.reply({ embeds: [embed] });
  }
};
