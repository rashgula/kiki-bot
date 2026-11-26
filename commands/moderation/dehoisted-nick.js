const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dehoisted-nick')
    .setDescription('Remove hoisting characters (!, @, #) from a member\'s nickname.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to dehoist').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member) return interaction.reply({ embeds: [KikiEmbed.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!member.manageable) return interaction.reply({ embeds: [KikiEmbed.error('Cannot Manage', 'I cannot manage this member\'s nickname.')], ephemeral: true });

    const currentNick = member.displayName;
    const cleaned = currentNick.replace(/^[!@#$%^&*()\[\]{}\-_+=|\\<>,.?/~`'"]+/, '').trim() || 'Moderated User';

    if (cleaned === currentNick) {
      return interaction.reply({ embeds: [KikiEmbed.info('No Change', `**${user.tag}** does not have any hoisting characters in their nickname.`)], ephemeral: true });
    }

    try {
      await member.setNickname(cleaned, 'Dehoisted by KIKI');
      await interaction.reply({
        embeds: [KikiEmbed.success('Nickname Dehoisted',
          `Removed hoisting characters from **${user.tag}**.\n**Before:** ${currentNick}\n**After:** ${cleaned}`
        )]
      });
    } catch (err) {
      await interaction.reply({ embeds: [KikiEmbed.error('Dehoist Failed', err.message)], ephemeral: true });
    }
  },

  name: 'dehoisted-nick',
  aliases: ['dehoist'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Nicknames** permission.')] });
    }
    const target = message.mentions?.members?.first?.() || (args[0] ? await message.guild.members.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a member.')] });
    if (!target.manageable) return message.reply({ embeds: [KikiEmbed.error('Cannot Manage', 'I cannot manage this member\'s nickname.')] });

    const currentNick = target.displayName;
    const cleaned = currentNick.replace(/^[!@#$%^&*()\[\]{}\-_+=|\\<>,.?/~`'"]+/, '').trim() || 'Moderated User';

    if (cleaned === currentNick) {
      return message.reply({ embeds: [KikiEmbed.info('No Change', `**${target.user.tag}** has no hoisting characters.`)] });
    }

    try {
      await target.setNickname(cleaned, 'Dehoisted by KIKI');
      message.reply({
        embeds: [KikiEmbed.success('Nickname Dehoisted',
          `**Before:** ${currentNick}\n**After:** ${cleaned}`
        )]
      });
    } catch (err) {
      message.reply({ embeds: [KikiEmbed.error('Dehoist Failed', err.message)] });
    }
  },
};
