const { SlashCommandBuilder } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');

const TAROT_CARDS = [
  { name: '0 • The Fool', upright: 'New beginnings, leap of faith, fearlessness', reversed: 'Recklessness, hesitation' },
  { name: 'I • The Magician', upright: 'Willpower, mastery, manifestation', reversed: 'Untapped potential, illusions' },
  { name: 'II • The High Priestess', upright: 'Intuition, sacred secrets, inner voice', reversed: 'Hidden agendas, ignoring instinct' },
  { name: 'XIII • Death', upright: 'Profound transformation, rebirth, ending cycles', reversed: 'Fear of change, stagnation' },
  { name: 'XVI • The Tower', upright: 'Sudden awakening, shattering falsehoods', reversed: 'Delaying the inevitable shift' },
  { name: 'XVII • The Star', upright: 'Hope, healing, celestial guidance', reversed: 'Self-doubt, disconnection' },
  { name: 'XVIII • The Moon', upright: 'Dreams, mystery, shadow navigation', reversed: 'Clarity emerging through fog' },
  { name: 'XXI • The World', upright: 'Completion, victory, cosmic harmony', reversed: 'Unfinished chapters awaiting closure' }
];

function drawCard() {
  const c = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
  const reversed = Math.random() < 0.35;
  return {
    title: `${c.name} ${reversed ? '(Reversed 🔄)' : '(Upright ✨)'}`,
    meaning: reversed ? c.reversed : c.upright
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gothic-tarot-draw')
    .setDescription('🃏 Draw a card from KIKI’s obsidian tarot deck'),

  aliases: ['k-gothic-tarot-draw', 'gothictarotdraw'],
  name: 'gothic-tarot-draw',

  async execute(interaction) {
    const c = drawCard();
    await interaction.reply({ embeds: [KikiEmbed.purple(`🃏 ${c.title}`, `**Omen Meaning:** ${c.meaning}`)] });
  },

  async run(message) {
    const c = drawCard();
    message.reply({ embeds: [KikiEmbed.purple(`🃏 ${c.title}`, `**Omen Meaning:** ${c.meaning}`)] });
  }
};
