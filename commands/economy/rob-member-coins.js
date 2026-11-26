const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Economy = require('../../utils/economy.js');
const KIKI = require('../../utils/kiki.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob-member-coins')
    .setDescription('🦹 Attempt pickpocketing coins from a member')
    .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true)),

  aliases: ['rob', 'pickpocket'],
  name: 'rob-member-coins',

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    if (target.bot) {
      return interaction.reply({ embeds: [KikiEmbed.error('Invalid Target', 'Bots ke paas jeb nahi hoti!')] });
    }
    const res = Economy.rob(interaction.guildId, interaction.user.id, target.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return interaction.reply({ embeds: [KikiEmbed.error('Rob Cooldown ⏳', `Police abhi dhoondh rahi hai! Wait: **${wait}**`)] });
    }
    if (res.error) {
      return interaction.reply({ embeds: [KikiEmbed.error('Robbery Failed ⚠️', res.message || res.error)] });
    }
    const embed = res.success
      ? KikiEmbed.success('Heist Success! 🦹', `${res.message}\n\n**Victim:** ${target.toString()}\n**Your Wallet:** \`${res.wallet.toLocaleString()} Coins\``)
      : KikiEmbed.error(res.blockedByShield ? 'Shield Blocked! 🛡️' : 'Caught Red-Handed! 🚨', `${res.message}\n\n**Your Wallet:** \`${res.wallet.toLocaleString()} Coins\``);
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const cleanId = args[0]?.replace(/[<@!>]/g, '');
    const target = message.mentions?.users?.first?.()
      || (cleanId && /^\d{17,20}$/.test(cleanId) ? await client.users.fetch(cleanId).catch(() => null) : null);

    if (!target || target.bot) {
      return message.reply({ embeds: [KikiEmbed.error('Target Missing', 'Usage: `&rob @user` (kisi real member ko mention karein!)')] });
    }

    const res = Economy.rob(message.guild.id, message.author.id, target.id);
    if (res.cooldown) {
      const wait = KIKI.formatDuration(res.remainingMs);
      return message.reply({ embeds: [KikiEmbed.error('Rob Cooldown ⏳', `Police abhi dhoondh rahi hai! Wait: **${wait}**`)] });
    }
    if (res.error) {
      return message.reply({ embeds: [KikiEmbed.error('Robbery Failed ⚠️', res.message || res.error)] });
    }
    const embed = res.success
      ? KikiEmbed.success('Heist Success! 🦹', `${res.message}\n\n**Victim:** ${target.toString()}\n**Your Wallet:** \`${res.wallet.toLocaleString()} Coins\``)
      : KikiEmbed.error(res.blockedByShield ? 'Shield Blocked! 🛡️' : 'Caught Red-Handed! 🚨', `${res.message}\n\n**Your Wallet:** \`${res.wallet.toLocaleString()} Coins\``);
    message.reply({ embeds: [embed] });
  }
};
