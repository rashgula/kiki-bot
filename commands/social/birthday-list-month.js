const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const Social = require('../../utils/social.js');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday-list-month')
    .setDescription('🎉 View birthdays registered in the server')
    .addIntegerOption(o => o.setName('month').setDescription('Optional month (1-12)')),

  async execute(interaction) {
    const mFilter = interaction.options.getInteger('month');
    const list = Social.getBirthdays(interaction.guildId, mFilter);
    const desc = list.length
      ? list.map(b => `🎂 <@${b.userId}> — **${String(b.day).padStart(2, '0')} ${MONTHS[b.month - 1]}**`).join('\n')
      : 'Abhi koi birthday registered nahi hai! `&setbday DD-MM` se register karein.';
    await interaction.reply({ embeds: [KikiEmbed.purple('🎉 Server Birthdays', desc)] });
  },

  name: 'birthday-list-month',
  aliases: ['k-birthday-list-month', 'birthdaylistmonth', 'birthdays', 'bdays'],
  async run(message, args) {
    const mFilter = args[0] && /^\d+$/.test(args[0]) ? parseInt(args[0], 10) : null;
    const list = Social.getBirthdays(message.guild.id, mFilter);
    const desc = list.length
      ? list.map(b => `🎂 <@${b.userId}> — **${String(b.day).padStart(2, '0')} ${MONTHS[b.month - 1]}**`).join('\n')
      : 'Abhi koi birthday registered nahi hai! `&setbday DD-MM` se register karein.';
    message.reply({ embeds: [KikiEmbed.purple('🎉 Server Birthdays', desc)] });
  }
};
