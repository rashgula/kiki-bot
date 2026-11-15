// KIKI Bot - Sync Commands Documentation Engine
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const commandDocsSync = require('../../utils/commandDocsSync.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('synccmds')
    .setDescription('📂 Re-sync and generate all command documentation in "kiki all cmd" folder')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members commands sync kar sakte hain!')],
        ephemeral: true
      });
    }

    await interaction.deferReply();
    const count = commandDocsSync.syncAll(true);

    const embed = KikiEmbed.success(
      'Commands Documentation Synced 📂',
      `Saari commands successfully scan aur sync ho chuki hain!\n\n` +
      `📁 **Target Folder:** \`kiki all cmd/\`\n` +
      `⚡ **Total Commands Indexed:** \`${count.toLocaleString()}\`\n\n` +
      `**Generated Files:**\n` +
      `• 📜 \`kiki all cmd/BUILT_TOGETHER_COMMANDS.md\` *(Ham dono ne jo banayi)*\n` +
      `• 📚 \`kiki all cmd/ALL_BOT_COMMANDS.md\` *(Bot ki saari categories aur commands)*\n` +
      `• 💾 \`kiki all cmd/commands_registry.json\` *(JSON database)*\n` +
      `• 📖 \`kiki all cmd/README.md\`\n\n` +
      `> 💡 *Note: Jab bhi nayi command add hogi ya bot restart hoga, ye automatically sync ho jata hai!*`
    );

    await interaction.editReply({ embeds: [embed] });
  },

  name: 'synccmds',
  aliases: ['synccommand', 'synccommands', 'syncallcmds', 'updatecmds'],
  description: 'Sync all commands into the "kiki all cmd" folder',
  category: 'admin',
  usage: '&synccmds',

  async run(client, message, args) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.channel.send({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members commands sync kar sakte hain!')]
      });
    }

    const m = await message.channel.send({
      embeds: [KikiEmbed.info('Syncing Commands...', 'Bot commands scan aur update ho rahe hain...')]
    });

    const count = commandDocsSync.syncAll(true);

    const embed = KikiEmbed.success(
      'Commands Documentation Synced 📂',
      `Saari commands successfully scan aur sync ho chuki hain!\n\n` +
      `📁 **Target Folder:** \`kiki all cmd/\`\n` +
      `⚡ **Total Commands Indexed:** \`${count.toLocaleString()}\`\n\n` +
      `**Generated Files:**\n` +
      `• 📜 \`kiki all cmd/BUILT_TOGETHER_COMMANDS.md\` *(Ham dono ne jo banayi)*\n` +
      `• 📚 \`kiki all cmd/ALL_BOT_COMMANDS.md\` *(Bot ki saari categories aur commands)*\n` +
      `• 💾 \`kiki all cmd/commands_registry.json\` *(JSON database)*\n` +
      `• 📖 \`kiki all cmd/README.md\`\n\n` +
      `> 💡 *Note: Jab bhi nayi command add hogi ya bot restart hoga, ye automatically sync ho jata hai!*`
    );

    await m.edit({ embeds: [embed] });
  }
};
