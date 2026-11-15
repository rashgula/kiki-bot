
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const KikiEmbed = require('../../utils/embed.js');
module.exports = {
  data: new SlashCommandBuilder().setName('emoji-delete-all').setDescription('🗑️ Saare custom emojis delete karo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),
  async execute(interaction, client) {
    await interaction.deferReply();
    let deleted=0,failed=0;
    for(const [,emoji] of interaction.guild.emojis.cache){
      try{await emoji.delete('[KIKI] Emoji nuke');deleted++;}catch{failed++;}
    }
    await interaction.editReply({embeds:[KikiEmbed.nuke('Emoji Nuke',`Deleted: **${deleted}** emojis | Failed: **${failed}**`)]});
  },
  name:'emoji-delete-all',aliases:['eda'],
  async run(message,args){
    if(!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))return;
    let d=0;
    for(const [,e] of message.guild.emojis.cache){try{await e.delete();d++;}catch{}}
    message.reply({embeds:[KikiEmbed.nuke('Emoji Nuke',`${d} emojis deleted!`)]});
  }
};
