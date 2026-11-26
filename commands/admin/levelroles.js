// KIKI Bot - Automated Level Up Roles Setup (Levels 5, 10, 15, 20, 25, 30, 35, 40, 45, 50)
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const KIKI = require('../../utils/kiki.js');
const config = require('../../config.js');

const LEVEL_DEFINITIONS = [
  { level: 5,  name: '🔮・Level 5',  color: '#9B59B6' },
  { level: 10, name: '🔮・Level 10', color: '#8E44AD' },
  { level: 15, name: '🔮・Level 15', color: '#3498DB' },
  { level: 20, name: '🔮・Level 20', color: '#1ABC9C' },
  { level: 25, name: '🔮・Level 25', color: '#2ECC71' },
  { level: 30, name: '🔮・Level 30', color: '#F1C40F' },
  { level: 35, name: '🔮・Level 35', color: '#E67E22' },
  { level: 40, name: '🔮・Level 40', color: '#E74C3C' },
  { level: 45, name: '🔮・Level 45', color: '#E91E63' },
  { level: 50, name: '👑・Level 50', color: '#FFD700' }
];

async function setupLevelRoles(guild, member, client) {
  // 1. Permission checks
  if (!member.permissions.has(PermissionFlagsBits.Administrator) && !KIKI.isSafe(guild, member.id, client)) {
    throw new Error('Aapke paas **Administrator** permission honi chahiye!');
  }

  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Bot ke paas **Manage Roles** permission nahi hai! Kripya bot ko Manage Roles ya Administrator permission dein.');
  }

  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[guild.id]) cfg.guilds[guild.id] = {};
  if (!cfg.guilds[guild.id].level_roles) cfg.guilds[guild.id].level_roles = {};

  const createdRoles = [];

  // 2. Loop through each of the 10 levels and create/find the role
  for (const def of LEVEL_DEFINITIONS) {
    // Check if role already exists in guild
    let role = guild.roles.cache.find(r =>
      r.name.toLowerCase() === def.name.toLowerCase() ||
      r.name.toLowerCase() === `level ${def.level}` ||
      r.name.toLowerCase() === `level-${def.level}` ||
      r.name.toLowerCase().endsWith(`level ${def.level}`)
    );

    if (!role) {
      // Create new role
      role = await guild.roles.create({
        name: def.name,
        color: def.color,
        hoist: true,
        reason: `[KIKI] Auto Level Roles Setup (Level ${def.level}) in ${guild.name}`
      });
    }

    // Bind in guild config
    cfg.guilds[guild.id].level_roles[String(def.level)] = role.id;
    createdRoles.push({ level: def.level, role });
  }

  if (!cfg.level_roles) cfg.level_roles = { ...cfg.guilds[guild.id].level_roles };
  cfg.level_stack_roles = true;
  KIKI.saveConfig(cfg);

  // 3. Format result embed
  const rolesList = createdRoles
    .map(r => `• ⭐ **Level ${r.level.toString().padStart(2, ' ')}** ➔ ${r.role.toString()} (\`${r.role.id}\`)`)
    .join('\n');

  const embed = KikiEmbed.build({
    title: '👑 Level Up Roles Setup Complete!',
    description:
      `Ek hi command se sabhi **10 Level Roles** automatically server me setup aur bind ho chuke hain!\n\n` +
      `📋 **Configured Level Roles (5 - 50):**\n${rolesList}\n\n` +
      `⚙️ **Voice Leveling Engine:**\n` +
      `> • **Voice XP Rate:** \`18-23 XP per minute\`\n` +
      `> • **Deaf Protection:** Deafen members ko XP nahi milega (Anti-AFK)\n` +
      `> • **Auto-Assign:** Jaise hi member in levels par pahuchega, bot role turant de dega!\n` +
      `> • **Roles Hoisted:** Ye roles server list me alag se highlight honge.\n\n` +
      `*Members \`&rank\` command se apna level aur agla role check kar sakte hain!*`,
    color: config.COLORS.PRIMARY || 0x9B59B6,
    footer: { text: `Total 10 Level Roles Configured • KIKI v${config.BOT_VERSION}` }
  });

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelroles')
    .setDescription('⚡ Ek command se Level 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 roles automatically banayein')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply();
    try {
      const embed = await setupLevelRoles(interaction.guild, interaction.member, client);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[SETUP LEVEL ROLES ERROR]', err);
      await interaction.editReply({ embeds: [KikiEmbed.error('Setup Failed', err.message)] });
    }
  },

  name: 'levelroles',
  aliases: ['levelsetup', 'vclevelsetup', 'vcrolesetup', 'levelpanel', 'levelrole'],
  async run(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // Reset option if needed
    if (sub === 'reset' || sub === 'clear') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && !KIKI.isSafe(message.guild, message.author.id, client)) {
        return message.reply({ embeds: [KikiEmbed.error('Permission Denied', 'Aapke paas **Administrator** permission honi chahiye!')] });
      }
      const cfg = KIKI.loadConfig();
      if (!cfg.guilds) cfg.guilds = {};
      if (!cfg.guilds[message.guild.id]) cfg.guilds[message.guild.id] = {};
      cfg.guilds[message.guild.id].level_roles = {};
      KIKI.saveConfig(cfg);
      return message.reply({
        embeds: [KikiEmbed.warn('Level Roles Cleared', '🧹 Sabhi configured level roles bot se unbind kar diye gaye hain.')]
      });
    }

    // List option
    if (sub === 'list' || sub === 'view') {
      const levelRoles = KIKI.getGuildLevelRoles(message.guild);
      const sorted = Object.keys(levelRoles).map(Number).sort((a, b) => a - b);

      if (sorted.length === 0) {
        return message.reply({
          embeds: [KikiEmbed.warn('No Level Roles', 'Abhi tak koi level role set nahi hai! Role create karne ke liye `&setuplevelroles` likhein.')]
        });
      }

      const list = sorted.map(lvl => `• **Level ${lvl}** ➔ <@&${levelRoles[String(lvl)]}>`).join('\n');
      return message.reply({
        embeds: [KikiEmbed.purple('📋 Current Level Roles', list)]
      });
    }

    // Run automated role setup
    const loadingMsg = await message.reply({
      embeds: [KikiEmbed.purple('⏳ Creating Level Roles...', 'Server me Level 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 roles create aur configure ho rahe hain, please wait...')]
    });

    try {
      const embed = await setupLevelRoles(message.guild, message.member, client);
      await loadingMsg.edit({ embeds: [embed] });
    } catch (err) {
      console.error('[SETUP LEVEL ROLES ERROR]', err);
      await loadingMsg.edit({ embeds: [KikiEmbed.error('Setup Failed', err.message)] });
    }
  }
};
