// KIKI Bot - Admin XP Management & Level Test Command
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Leveling = require('../../utils/leveling.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('⚡ Add Voice XP to a member to test level-ups and role rewards (Admin Only)')
    .addUserOption(o => o.setName('user').setDescription('Target member').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount of XP to add (e.g. 100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!KIKI.isServerOrBotOwner(interaction.guild, interaction.user.id) && !KIKI.isSafe(interaction.guild, interaction.user.id, client)) {
      return interaction.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members XP add kar sakte hain!')],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ embeds: [KikiEmbed.error('Member Error', 'Target member server me nahi mila!')], ephemeral: true });
    }

    const prevData = Leveling.getUser(interaction.guild.id, member.id);
    const oldLevel = prevData.level;
    const oldXp = prevData.xp;

    const res = await Leveling.addVoiceXp(interaction.guild, member, amount, 0);

    const embed = KikiEmbed.success(
      'Voice XP Added ⚡',
      `**Target Member:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
      `**XP Added:** \`+${amount.toLocaleString()} XP\`\n\n` +
      `• 📊 **Old Stats:** \`Level ${oldLevel}\` (\`${oldXp.toLocaleString()} XP\`)\n` +
      `• 🚀 **New Stats:** \`Level ${res.user.level}\` (\`${res.user.xp.toLocaleString()} XP\`)\n` +
      `• 🎉 **Level-Up Triggered:** ${res.leveledUp ? `🟢 **YES (Leveled up to Level ${res.user.level}!)**` : '⚪ No'}`
    );

    await interaction.reply({ embeds: [embed] });
  },

  name: 'addxp',
  aliases: ['givexp', 'setxp', 'setlevel', 'addlevel', 'vctest'],
  async run(message, args, client) {
    if (!KIKI.isServerOrBotOwner(message.guild, message.author.id) && !KIKI.isSafe(message.guild, message.author.id, client)) {
      return message.reply({
        embeds: [KikiEmbed.error('Access Denied 🔒', 'Sirf Server Owner ya Whitelisted members XP aur Level manage kar sakte hain!')]
      });
    }

    const isSetLevel = message.content.toLowerCase().includes('setlevel') || message.content.toLowerCase().includes('addlevel');
    const isSetXp = message.content.toLowerCase().includes('setxp');

    const targetUser = message.mentions.users.first() ||
      (args[0] ? message.guild.members.cache.get(args[0])?.user : null);

    const amount = parseInt(args[1], 10);

    if (!targetUser || isNaN(amount)) {
      const usageTip = isSetLevel ? '`&setlevel @user <level>` (e.g. `&setlevel @user 26`)' :
        isSetXp ? '`&setxp @user <xp>` (e.g. `&setxp @user 15000`)' :
        '`&addxp @user <amount>` (e.g. `&addxp @user 500`)';
      return message.reply({
        embeds: [KikiEmbed.warn('Usage Galat Hai', `Usage: ${usageTip}`)]
      });
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return message.reply({ embeds: [KikiEmbed.error('Member Error', 'Target member server me nahi mila!')] });
    }

    if (isSetLevel) {
      const updatedUser = await Leveling.setUserLevel(message.guild, member, amount);
      const embed = KikiEmbed.success(
        'Voice Level Updated 👑',
        `**Target Member:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
        `**New Level:** \`Level ${updatedUser.level}\`\n` +
        `**Total XP Set:** \`${updatedUser.xp.toLocaleString()} XP\`\n\n` +
        `*Member ka level aur corresponding role successfully update ho gaya!*`
      );
      return message.reply({ embeds: [embed] });
    }

    if (isSetXp) {
      const updatedUser = await Leveling.setUserXp(message.guild, member, amount);
      const embed = KikiEmbed.success(
        'Voice XP Set ⚡',
        `**Target Member:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
        `**New XP:** \`${updatedUser.xp.toLocaleString()} XP\`\n` +
        `**Computed Level:** \`Level ${updatedUser.level}\`\n\n` +
        `*Member ka XP successfully set ho gaya!*`
      );
      return message.reply({ embeds: [embed] });
    }

    const prevData = Leveling.getUser(message.guild.id, member.id);
    const oldLevel = prevData.level;
    const oldXp = prevData.xp;

    const res = await Leveling.addVoiceXp(message.guild, member, amount, 0);

    const embed = KikiEmbed.success(
      'Voice XP Added ⚡',
      `**Target Member:** ${member.user.toString()} (\`${member.user.tag}\`)\n` +
      `**XP Added:** \`+${amount.toLocaleString()} XP\`\n\n` +
      `• 📊 **Old Stats:** \`Level ${oldLevel}\` (\`${oldXp.toLocaleString()} XP\`)\n` +
      `• 🚀 **New Stats:** \`Level ${res.user.level}\` (\`${res.user.xp.toLocaleString()} XP\`)\n` +
      `• 🎉 **Level-Up Triggered:** ${res.leveledUp ? `🟢 **YES (Leveled up to Level ${res.user.level}!)**` : '⚪ No'}`
    );

    message.reply({ embeds: [embed] });
  }
};
