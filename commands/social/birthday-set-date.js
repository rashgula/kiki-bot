const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday-set-date')
    .setDescription('🎂 Register your birthday (DD-MM)')
    .addStringOption(o => o.setName('date').setDescription('Format: DD-MM (e.g. 14-02)').setRequired(true)),

  async execute(interaction) {
    const res = Social.setBirthday(interaction.guildId, interaction.user.id, interaction.options.getString('date'));
    if (!res.success) return interaction.reply({ embeds: [KikiEmbed.error('Invalid Date', res.message)], ephemeral: true });
    await interaction.reply({ embeds: [KikiEmbed.success('Birthday Saved 🎂', `Aapka birthday **${String(res.birthday.day).padStart(2, '0')}/${String(res.birthday.month).padStart(2, '0')}** save ho gaya!`)] });
  },

  name: 'birthday-set-date',
  aliases: ['k-birthday-set-date', 'birthdaysetdate', 'setbday'],
  async run(message, args) {
    if (!args[0]) return message.reply({ embeds: [KikiEmbed.warn('Date Missing', 'Usage: `&setbday 14-02`')] });
    const res = Social.setBirthday(message.guild.id, message.author.id, args[0]);
    if (!res.success) return message.reply({ embeds: [KikiEmbed.error('Invalid Date', res.message)] });
    message.reply({ embeds: [KikiEmbed.success('Birthday Saved 🎂', `Aapka birthday **${String(res.birthday.day).padStart(2, '0')}/${String(res.birthday.month).padStart(2, '0')}** save ho gaya!`)] });
  }
};
