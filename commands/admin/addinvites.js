// KIKI Bot - Admin Add Invites Command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const InviteTracker = require('../../utils/inviteTracker.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addinvites')
    .setDescription('🎁 Add or remove bonus invites for a member (Admin Only)')
    .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Number of bonus invites to add (use negative to remove)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members hi bonus invites de sakte hain!')],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    const updated = InviteTracker.addBonus(interaction.guild.id, targetUser.id, amount);

    const embed = KikiEmbed.success(
      'Bonus Invites Updated 🎁',
      `**Target Member:** ${targetUser.toString()} (\`${targetUser.tag}\`)\n` +
      `**Amount Adjusted:** \`${amount > 0 ? '+' : ''}${amount}\`\n\n` +
      `• 👑 **All-Time Total:** \`${updated.total}\`\n` +
      `• 📊 **Current Effective:** \`${updated.effective}\` *(Active: ${updated.regular} | Bonus: ${updated.bonus})*`
    );

    await interaction.reply({ embeds: [embed] });
  },

  name: 'addinvites',
  aliases: ['giveinvites', 'bonusinvites', 'setinvites'],
  description: 'Add bonus invites to a member',
  category: 'admin',
  usage: '&addinvites @user <amount>',

  async run(client, message, args) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.channel.send({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members hi bonus invites de sakte hain!')]
      });
    }

    const targetUser = message.mentions.users.first() || (args[0] && await client.users.fetch(args[0]).catch(() => null));
    const amount = parseInt(args[1], 10);

    if (!targetUser || isNaN(amount)) {
      return message.channel.send({
        embeds: [KikiEmbed.error('Usage Error', 'Sahi format: `&addinvites @user <amount>`\nExample: `&addinvites @member 5`')]
      });
    }

    const updated = InviteTracker.addBonus(message.guild.id, targetUser.id, amount);

    const embed = KikiEmbed.success(
      'Bonus Invites Updated 🎁',
      `**Target Member:** ${targetUser.toString()} (\`${targetUser.tag}\`)\n` +
      `**Amount Adjusted:** \`${amount > 0 ? '+' : ''}${amount}\`\n\n` +
      `• 👑 **All-Time Total:** \`${updated.total}\`\n` +
      `• 📊 **Current Effective:** \`${updated.effective}\` *(Active: ${updated.regular} | Bonus: ${updated.bonus})*`
    );

    await message.channel.send({ embeds: [embed] });
  }
};
