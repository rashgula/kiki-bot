// KIKI Bot - Gothic Purple Theme Config
module.exports = {
  // ═══════════════════════════════════════
  //   KIKI IDENTITY
  // ═══════════════════════════════════════
  BOT_NAME: 'KIKI',
  BOT_VERSION: '2.2',
  BOT_TAGLINE: '🔮 Gothic Utility | Dark Arts Discord Engine',
  AVATAR_URL: 'https://cdn.discordapp.com/avatars/1571080458404503684/e94dee9baa9bc52eb4dbf95fa11343b0.webp?size=1024',
  BANNER_URL: 'https://cdn.discordapp.com/banners/1571080458404503684/19023011183cb85d8d8b649cbb9c287e.webp?size=1024',

  // ═══════════════════════════════════════
  //   GOTHIC PURPLE THEME COLORS
  // ═══════════════════════════════════════
  COLORS: {
    PRIMARY: 0x9B59B6,       // Gothic Purple
    DARK: 0x6C3483,          // Dark Purple
    LIGHT: 0xBB8FCE,         // Light Lavender
    BLACK: 0x1A0A2E,         // Dark Background
    RED: 0xC0392B,           // Error Red
    GREEN: 0x27AE60,         // Success Green
    GOLD: 0xF39C12,          // Warning Gold
    TEAL: 0x1ABC9C,          // Info Teal
    NUKE: 0xFF0000,          // Nuke Red
  },

  // ═══════════════════════════════════════
  //   EMBED DEFAULTS
  // ═══════════════════════════════════════
  EMBED: {
    FOOTER: '「 KIKI 」• Gothic Utility v2.2',
    FOOTER_ICON: 'https://cdn.discordapp.com/avatars/1571080458404503684/e94dee9baa9bc52eb4dbf95fa11343b0.webp?size=128',
    THUMBNAIL: 'https://cdn.discordapp.com/avatars/1571080458404503684/e94dee9baa9bc52eb4dbf95fa11343b0.webp?size=128',
  },

  // ═══════════════════════════════════════
  //   BOT SETTINGS
  // ═══════════════════════════════════════
  PREFIX: process.env.PREFIX || '&',
  OWNER_IDS: (process.env.OWNER_IDS || '').split(',').map(id => id.trim()),

  // ═══════════════════════════════════════
  //   KIKI ASCII BANNER
  // ═══════════════════════════════════════
  BANNER: `
  ██╗  ██╗██╗██╗  ██╗██╗
  ██║ ██╔╝██║██║ ██╔╝██║
  █████╔╝ ██║█████╔╝ ██║
  ██╔═██╗ ██║██╔═██╗ ██║
  ██║  ██╗██║██║  ██╗██║
  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝
  `,
};
