const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const roasts = [
  'You are proof that evolution can go in reverse.',
  'Your secrets are always safe with me. I never even listen when you speak.',
  'I would explain it to you, but I do not have enough crayons.',
  'You bring everyone so much joy... whenever you leave the voice channel.',
  'If silence is golden, you are completely bankrupt.'
];

module.exports = {
  data: new SlashCommandBuilder().setName('roast').setDescription('🔥 Deliver a playful gothic roast')
    .addUserOption(o => o.setName('user').setDescription('Target user')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    await interaction.reply({ embeds: [KikiEmbed.purple('🔥 Gothic Roast', `${user.toString()}, ${roast}`)] });
  },
  name: 'roast', aliases: [],
  async run(message) {
    const user = message.mentions.users.first() || message.author;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    message.reply({ embeds: [KikiEmbed.purple('🔥 Roast', `${user.username}, ${roast}`)] });
  }
};
