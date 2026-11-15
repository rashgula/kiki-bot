// KIKI Bot - Setup Level Roles (Levels 5 to 50)
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const levelRolesCmd = require('./levelroles.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuplevelroles')
    .setDescription('⚡ Automatically create and bind Level 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  execute: levelRolesCmd.execute,
  name: 'setuplevelroles',
  aliases: ['setuplevels'],
  run: levelRolesCmd.run
};
