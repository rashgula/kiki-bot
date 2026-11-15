// KIKI Bot - Gothic Purple Embed Builder Utility
const { EmbedBuilder } = require('discord.js');
const config = require('../config.js');

class KikiEmbed {
  /**
   * Create a standard KIKI gothic purple embed
   * @param {Object} options - Embed options
   */
  static build(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color ?? config.COLORS.PRIMARY);

    const footerText = options.footer?.text ?? config.EMBED.FOOTER;
    const footerIcon = options.footer?.iconURL ?? (config.EMBED.FOOTER_ICON?.startsWith('http') && !config.EMBED.FOOTER_ICON.includes('imgur.com/kiki') ? config.EMBED.FOOTER_ICON : null);

    if (footerText) {
      const footerObj = { text: footerText };
      if (footerIcon) footerObj.iconURL = footerIcon;
      embed.setFooter(footerObj);
    }

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail && options.thumbnail.startsWith('http')) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.url) embed.setURL(options.url);
    if (options.author) embed.setAuthor(options.author);
    if (options.timestamp !== false) embed.setTimestamp();
    if (options.fields?.length) embed.addFields(options.fields);

    return embed;
  }

  static success(title, description) {
    return this.build({ title: `✅ ${title}`, description, color: config.COLORS.GREEN });
  }

  static error(title, description) {
    return this.build({ title: `❌ ${title}`, description, color: config.COLORS.RED });
  }

  static warn(title, description) {
    return this.build({ title: `⚠️ ${title}`, description, color: config.COLORS.GOLD });
  }

  static info(title, description) {
    return this.build({ title: `ℹ️ ${title}`, description, color: config.COLORS.TEAL });
  }

  static nuke(title, description) {
    return this.build({ title: `💥 ${title}`, description, color: config.COLORS.NUKE });
  }

  static purple(title, description) {
    return this.build({ title: `🔮 ${title}`, description, color: config.COLORS.PRIMARY });
  }
}

module.exports = KikiEmbed;
