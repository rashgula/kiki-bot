const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-channel')
    .setDescription('🛠️ Create a new text channel in the server')
    .addStringOption(o => o.setName('name').setDescription('Name of the channel').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const name = interaction.options.getString('name');
    
    try {
      const channel = await interaction.guild.channels.create({
        name: name,
        type: ChannelType.GuildText,
      });

      const embed = KikiEmbed.purple('🛠️ CHANNEL CREATED',
        `**Action:** Create Text Channel\n` +
        `**Channel:** <#${channel.id}>\n` +
        `**Status:** Successfully created\n\n` +
        `*「 KIKI 」• Gothic Utility v2.2*`
      );
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = KikiEmbed.purple('❌ ERROR', `Failed to create channel: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  name: 'create-channel',
  aliases: ['cc', 'make-channel', 'channel-create'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return message.reply("You don't have permission to manage channels.");
    }

    // If no args provided, default to the requested name 'lulli-billi'
    const name = args.length > 0 ? args.join('-') : 'lulli-billi';
    
    try {
      const channel = await message.guild.channels.create({
        name: name,
        type: ChannelType.GuildText,
      });

      const embed = KikiEmbed.purple('🛠️ CHANNEL CREATED',
        `**Command:** \`create-channel\`\n` +
        `**Channel:** <#${channel.id}>\n` +
        `**Status:** Successfully created\n\n` +
        `*「 KIKI 」• Gothic Utility v2.2*`
      );
      message.reply({ embeds: [embed] });
    } catch (error) {
      message.reply(`Failed to create channel: ${error.message}`);
    }
  }
};
