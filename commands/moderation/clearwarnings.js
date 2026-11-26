const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(warningsPath)) return {};
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); }
  catch { return {}; }
}

function saveWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a user.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to clear warnings for').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const user = interaction.options.getUser('user');
    const warnings = loadWarnings();

    if (!warnings[user.id] || warnings[user.id].length === 0) {
      return interaction.reply({ embeds: [KikiEmbed.info('No Warnings', `**${user.tag}** has no warnings to clear.`)], ephemeral: true });
    }

    const count = warnings[user.id].length;
    delete warnings[user.id];
    saveWarnings(warnings);

    await interaction.reply({
      embeds: [KikiEmbed.success('Warnings Cleared', `Cleared **${count}** warning(s) for **${user.tag}**.`)]
    });
  },

  name: 'clearwarnings',
  aliases: ['clearwarns', 'cw'],
  async run(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [KikiEmbed.error('No Permission', 'You need **Administrator** permission.')] });
    }
    const target = message.mentions?.users?.first?.() || (args[0] ? await client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
    if (!target) return message.reply({ embeds: [KikiEmbed.error('Invalid User', 'Please mention a user.')] });

    const warnings = loadWarnings();
    if (!warnings[target.id] || warnings[target.id].length === 0) {
      return message.reply({ embeds: [KikiEmbed.info('No Warnings', `**${target.tag}** has no warnings to clear.`)] });
    }

    const count = warnings[target.id].length;
    delete warnings[target.id];
    saveWarnings(warnings);

    message.reply({ embeds: [KikiEmbed.success('Warnings Cleared', `Cleared **${count}** warning(s) for **${target.tag}**.`)] });
  },
};
