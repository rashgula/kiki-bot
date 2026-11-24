const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const GamesEngine = require('../../utils/gamesEngine.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duel-challenge-fight')
    .setDescription('⚔️ Engage a friend in turn-based mock RPG duel')
    .addUserOption(o => o.setName('opponent').setDescription('Member to fight')),

  aliases: ['duel', 'fight'],
  name: 'duel-challenge-fight',

  async execute(interaction, client) {
    const opp = interaction.options.getUser('opponent') || { username: 'Abyssal Daemon' };
    const res = GamesEngine.playDuel(interaction.user.username, opp.username);
    const embed = KikiEmbed.purple('⚔️ Gothic RPG Duel: ' + res.p1 + ' vs ' + res.p2,
      '**Combat Rounds:**\n' + res.log + '\n\n' +
      '👑 **Victor:** **' + res.winner + '** stands triumphant!\n' +
      '💀 **Defeated:** **' + res.loser + '** has fallen in battle.'
    );
    await interaction.reply({ embeds: [embed] });
  },

  async run(message, args, client) {
    const opp = (message.mentions?.users?.first ? message.mentions.users.first() : null) || { username: 'Abyssal Daemon' };
    const res = GamesEngine.playDuel(message.author.username, opp.username);
    const embed = KikiEmbed.purple('⚔️ Gothic RPG Duel: ' + res.p1 + ' vs ' + res.p2,
      '**Combat Rounds:**\n' + res.log + '\n\n' +
      '👑 **Victor:** **' + res.winner + '** stands triumphant!\n' +
      '💀 **Defeated:** **' + res.loser + '** has fallen in battle.'
    );
    message.reply({ embeds: [embed] });
  }
};
