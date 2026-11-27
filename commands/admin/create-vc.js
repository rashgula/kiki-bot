const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-vc')
    .setDescription('🔊 Create a new voice channel')
    .addStringOption(o => o.setName('name').setDescription('Name of the voice channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    const name = interaction.options.getString('name') || 'yashu vc';
    
    try {
      const channel = await interaction.guild.channels.create({
        name: name,
        type: ChannelType.GuildVoice,
      });

      const embed = KikiEmbed.purple('🔊 CREATE-VC',
        '**Action:** Create a new voice channel\n' +
        '**Status:** Successfully created\n' +
        '**Channel:** <#' + channel.id + '> (`' + channel.name + '`)\n' +
        '\n*「 KIKI 」• Gothic Utility v2.2*'
      );
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: '❌ I need `Manage Channels` permission to do this.', ephemeral: true });
    }
  },

  name: 'create-vc',
  aliases: ['cvc', 'makevc', 'yashuvc'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ You need `Manage Channels` permission.');
    }
    
    const name = args.join(' ') || 'yashu vc';
    
    try {
      const channel = await message.guild.channels.create({
        name: name,
        type: ChannelType.GuildVoice,
      });

      const embed = KikiEmbed.purple('🔊 CREATE-VC',
        '**Command:** `create-vc`\n' +
        '**Description:** Create a new voice channel\n' +
        '**Channel:** <#' + channel.id + '> (`' + channel.name + '`)\n' +
        '\n*「 KIKI 」• Gothic Utility v2.2*'
      );
      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply('❌ I need `Manage Channels` permission to do this.');
    }
  }
};
