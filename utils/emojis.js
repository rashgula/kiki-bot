// KIKI Bot - Centralized Custom Server Emoji System
// Contains all 50 custom uploaded server emojis with animated support, text format & button objects

const EMOJI_REGISTRY = {
  // Navigation & Directional
  arrow: { id: '1574842647229505691', name: 'arrow', animated: true, fallback: '➡️' },
  freccia: { id: '1574842690116386933', name: 'GD_Freccia', animated: true, fallback: '🏹' },

  // Aesthetic & Sparkles
  sparkle: { id: '1574842679945068639', name: 'Moon_Sparkle', animated: true, fallback: '✨' },
  butterfly: { id: '1574842663058804736', name: 'Chrome_Butterfly', animated: true, fallback: '🦋' },
  animated: { id: '1574842673624522762', name: 'Animated', animated: true, fallback: '🔮' },
  animated_1: { id: '1574842676002693293', name: 'animated_1', animated: true, fallback: '🌟' },

  // Economy & Coins
  coin: { id: '1574842622550478859', name: 'coin', animated: true, fallback: '🪙' },
  fire: { id: '1574842687318655158', name: 'Fire', animated: true, fallback: '🔥' },
  countdown: { id: '1574842649205018634', name: 'countdown', animated: true, fallback: '⏱️' },

  // Hearts, Love & Social
  heart: { id: '1574842653345054728', name: 'heart', animated: true, fallback: '💜' },
  heart_alt: { id: '1574842682071842837', name: 'heart', animated: true, fallback: '💖' },
  flyingHearts: { id: '1574842655303540748', name: 'ffflyingheartsbr', animated: true, fallback: '💕' },
  blueHeartCloud: { id: '1574843689401061639', name: 'itemblueheartclo', animated: true, fallback: '☁️' },
  angel: { id: '1574843681020707039', name: 'Angel', animated: true, fallback: '🪽' },

  // Actions & Verification
  check: { id: '1574842652049014864', name: 'hacken', animated: true, fallback: '✅' },
  cross: { id: '1574842685502660748', name: 'Cross', animated: true, fallback: '❌' },
  loading: { id: '1574842657757331629', name: 'Load', animated: true, fallback: '⏳' },
  attention: { id: '1574843687454638101', name: 'atencin', animated: true, fallback: '⚠️' },

  // Fun, Anime & Characters
  catDance: { id: '1574843716588281867', name: 'Cat_dance', animated: true, fallback: '🐱' },
  zeroTwo: { id: '1574842677797847132', name: 'Zero_two', animated: true, fallback: '🌸' },
  cuteRun: { id: '1574843714579341383', name: 'inc_cute_bby_girl_run', animated: true, fallback: '🏃‍♀️' },
  cute: { id: '1574843707268800532', name: 'You_are_cute', animated: true, fallback: '🥰' },
  excited: { id: '1574843699920371943', name: 'excited', animated: true, fallback: '🎉' },
  anime: { id: '1574842664937984061', name: 'emojis_anime', animated: true, fallback: '🎭' },
  peepoPing: { id: '1574843692450193408', name: 'peepopinging', animated: false, fallback: '🏓' },
  hutao: { id: '1574843690826997891', name: 'hutaoweapon2', animated: true, fallback: '⚔️' },
  halloween: { id: '1574843696585773086', name: 'halloween18', animated: true, fallback: '🎃' },
  koibaatni: { id: '1574842618624352259', name: 'koibaatni', animated: true, fallback: '🤝' },
  fuckyeah: { id: '1574842626622881994', name: 'fuckyeah', animated: true, fallback: '🤘' },
  personal: { id: '1574843656345493645', name: 'personal', animated: true, fallback: '👑' },
  discore: { id: '1574843676847247524', name: 'discore', animated: true, fallback: '🎵' },
  gay: { id: '1574843679095652527', name: 'gay', animated: true, fallback: '🌈' },
  e_260704: { id: '1574842628413984978', name: 'e_260704', animated: false, fallback: '🔮' },
  e_226147: { id: '1574842641982562344', name: 'e_226147', animated: true, fallback: '✨' },
  e_258720: { id: '1574843658681843744', name: 'e_258720', animated: true, fallback: '🖤' },
  e_161085: { id: '1574843683021389864', name: 'e_161085', animated: true, fallback: '🥀' },
  e_161341: { id: '1574843694224252948', name: 'e_161341', animated: true, fallback: '🌙' },
  e_31853: { id: '1574843709151776778', name: 'e_31853', animated: true, fallback: '⚡' },
  e_269608: { id: '1574843712050040995', name: 'e_269608', animated: true, fallback: '💫' }
};

const KikiEmojis = {
  // Direct formatted string getters
  get(key) {
    const entry = EMOJI_REGISTRY[key];
    if (!entry) return '✨';
    return entry.animated
      ? `<a:${entry.name}:${entry.id}>`
      : `<:${entry.name}:${entry.id}>`;
  },

  // Button emoji object getter (compatible with ButtonBuilder.setEmoji)
  btn(key) {
    const entry = EMOJI_REGISTRY[key];
    if (!entry) return '✨';
    return {
      id: entry.id,
      name: entry.name,
      animated: !!entry.animated
    };
  },

  // Top header floating bar for panels
  header() {
    return `${this.get('sparkle')} ${this.get('butterfly')} ${this.get('fire')} ${this.get('personal')}`;
  },

  // Goodbye floating bar for leave cards
  goodbyeBanner() {
    return `${this.get('flyingHearts')} ${this.get('butterfly')} ${this.get('sparkle')} 🥀 🖤 ${this.get('blueHeartCloud')} 🥺 💔 ${this.get('angel')}`;
  },

  // Shortcut constants
  ARROW: `<a:arrow:1574842647229505691>`,
  COIN: `<a:coin:1574842622550478859>`,
  SPARKLE: `<a:Moon_Sparkle:1574842679945068639>`,
  BUTTERFLY: `<a:Chrome_Butterfly:1574842663058804736>`,
  FIRE: `<a:Fire:1574842687318655158>`,
  CHECK: `<a:hacken:1574842652049014864>`,
  CROSS: `<a:Cross:1574842685502660748>`,
  LOADING: `<a:Load:1574842657757331629>`,
  HEART: `<a:heart:1574842653345054728>`,
  CAT: `<a:Cat_dance:1574843716588281867>`,
  EXCITED: `<a:excited:1574843699920371943>`,
  PING: `<:peepopinging:1574843692450193408>`,
  ANGEL: `<a:Angel:1574843681020707039>`,
  ZERO_TWO: `<a:Zero_two:1574842677797847132>`,
  CUTE_RUN: `<a:inc_cute_bby_girl_run:1574843714579341383>`,
  COUNTDOWN: `<a:countdown:1574842649205018634>`,
  EMOJI_REGISTRY
};

module.exports = KikiEmojis;
