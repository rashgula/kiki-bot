
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
const fs = require('fs');
const path = require('path');
const cfgPath = path.join(__dirname, '../../data/config.json');
function loadCfg(){return JSON.parse(fs.readFileSync(cfgPath,'utf-8'));}
function saveCfg(d){fs.writeFileSync(cfgPath,JSON.stringify(d,null,2));}
module.exports = {
  data: new SlashCommandBuilder().setName('anti-raid-mode').setDescription('🛡️ Anti-raid mode toggle karo')
    .addStringOption(o=>o.setName('mode').setDescription('on/off').setRequired(true).addChoices({name:'ON',value:'on'},{name:'OFF',value:'off'}))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const mode=interaction.options.getString('mode')==='on';
    const cfg=loadCfg();cfg.anti_raid=mode;saveCfg(cfg);
    await interaction.reply({embeds:[mode?KikiEmbed.success('Anti-Raid ON','🛡️ Anti-raid mode enabled! New joins will be auto-kicked.'):KikiEmbed.warn('Anti-Raid OFF','Anti-raid mode disabled.')]});
  },
  name:'anti-raid-mode',aliases:['raidmode','antiraid'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.Administrator))return;
    const cfg=loadCfg();cfg.anti_raid=args[0]==='on';saveCfg(cfg);
    message.reply({embeds:[KikiEmbed.success('Anti-Raid Mode',`${args[0]==='on'?'Enabled':'Disabled'}!`)]});
  }
};
