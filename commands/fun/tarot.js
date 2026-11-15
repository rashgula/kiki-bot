const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const cards = [
  { name: 'The Void (0)', meaning: 'Infinite potential, step boldly into the shadows.' },
  { name: 'The Magician (I)', meaning: 'Mastery over the arcane elements, manifestation.' },
  { name: 'The High Priestess (II)', meaning: 'Intuition, hidden knowledge, gothic mysteries.' },
  { name: 'The Empress (III)', meaning: 'Dark abundance, velvet roses, creative power.' },
  { name: 'Death (XIII)', meaning: 'Transformation, old endings making way for rebirth.' },
  { name: 'The Moon (XVIII)', meaning: 'Illusions, nocturnal visions, unseen forces.' },
  { name: 'The Star (XVII)', meaning: 'Hope gleaming through the deepest violet night.' }
];

module.exports = {
  data: new SlashCommandBuilder().setName('tarot').setDescription('🔮 Draw a gothic arcane tarot card'),
  async execute(interaction) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    const embed = KikiEmbed.purple(`🔮 Tarot Card: ${card.name}`, `*${card.meaning}*`);
    await interaction.reply({ embeds: [embed] });
  },
  name: 'tarot', aliases: ['tarotcard'],
  async run(message) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    message.reply({ embeds: [KikiEmbed.purple(`🔮 ${card.name}`, card.meaning)] });
  }
};
