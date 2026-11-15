const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in a channel.')
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('user').setDescription('Only delete messages from this user').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      if (user) {
        messages = messages.filter(m => m.author.id === user.id).first(amount);
      } else {
        messages = messages.first(amount);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = messages.filter ? 
        [...messages.values()].filter(m => m.createdTimestamp > twoWeeksAgo) :
        messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      const deleted = await interaction.channel.bulkDelete(deletable, true);

      await interaction.editReply({
        embeds: [KikiEmbed.success('Messages Purged',
          `Successfully deleted **${deleted.size}** message(s)${user ? ` from **${user.tag}**` : ''}.`
        )]
      });
    } catch (err) {
      await interaction.editReply({ embeds: [KikiEmbed.error('Purge Failed', err.message)] });
    }
  },

  name: 'purge',
  aliases: ['clear', 'prune'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Manage Messages** permission.')] });
    }
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ embeds: [KikiEmbed.error('Invalid Amount', 'Please provide a number between 1 and 100.')] });
    }
    const targetUser = message.mentions.users.first();

    await message.delete().catch(() => {});

    try {
      let messages = await message.channel.messages.fetch({ limit: 100 });
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

      if (targetUser) {
        messages = [...messages.values()].filter(m => m.author.id === targetUser.id && m.createdTimestamp > twoWeeksAgo).slice(0, amount);
      } else {
        messages = [...messages.values()].filter(m => m.createdTimestamp > twoWeeksAgo).slice(0, amount);
      }

      const deleted = await message.channel.bulkDelete(messages, true);
      const reply = await message.channel.send({
        embeds: [KikiEmbed.success('Messages Purged',
          `Deleted **${deleted.size}** message(s)${targetUser ? ` from **${targetUser.tag}**` : ''}.`
        )]
      });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch (err) {
      message.channel.send({ embeds: [KikiEmbed.error('Purge Failed', err.message)] });
    }
  },
};
