// Test suite for Leveling anti-downgrade & Billu level restoration
const Leveling = require('../utils/leveling.js');

async function testLeveling() {
  console.log('🧪 Starting Voice Level & Anti-Downgrade Test...\n');

  const guildId = '1563548609960742942';
  const billuId = '989411027798089778';
  const aryanId = '1523336201896067091';

  // 1. Verify Billu's restored stats
  const billu = Leveling.getUser(guildId, billuId);
  console.log('👑 [BILLU RESTORED STATS]:');
  console.log(`   • Level: ${billu.level} (Expected >= 25)`);
  console.log(`   • Total XP: ${billu.xp} XP (Expected >= 14000)`);
  console.log(`   • Voice Time: ${Leveling.formatVoiceTime(billu.voiceTime)}`);
  console.log(`   • Highest Level: ${billu.highestLevel}`);

  if (billu.level < 25) {
    throw new Error(`Billu level is ${billu.level}, expected >= 25`);
  }
  console.log('   ✅ Billu level restoration verified!\n');

  // 2. Verify Aryan's restored stats
  const aryan = Leveling.getUser(guildId, aryanId);
  console.log('👤 [ARYAN RESTORED STATS]:');
  console.log(`   • Level: ${aryan.level} (Expected >= 19)`);
  console.log(`   • Total XP: ${aryan.xp} XP`);
  console.log(`   • Voice Time: ${Leveling.formatVoiceTime(aryan.voiceTime)}`);

  if (aryan.level < 19) {
    throw new Error(`Aryan level is ${aryan.level}, expected >= 19`);
  }
  console.log('   ✅ Aryan level restoration verified!\n');

  // 3. Test Anti-Downgrade logic
  console.log('🛡️ Testing Anti-Downgrade Protection:');
  const mockMember = {
    id: billuId,
    user: { id: billuId, tag: 'BILLU#0001', bot: false },
    roles: { cache: new Map(), add: async () => {}, remove: async () => {} }
  };
  const mockGuild = {
    id: guildId,
    roles: { cache: new Map() }
  };

  const currentLevelBefore = billu.level;
  const currentXpBefore = billu.xp;

  // Add 20 XP
  const res = await Leveling.addVoiceXp(mockGuild, mockMember, 20, 60);
  console.log(`   • Old Level: ${res.oldLevel}`);
  console.log(`   • New Level: ${res.newLevel} (Must be >= ${currentLevelBefore})`);
  console.log(`   • Total XP: ${res.user.xp} XP`);
  console.log(`   • Leveled Up: ${res.leveledUp}`);

  if (res.user.level < currentLevelBefore) {
    throw new Error('CRITICAL BUG: Level decreased!');
  }
  console.log('   ✅ Level never decrements on XP gain!\n');

  console.log('🎉 ALL LEVELING CHECKS PASSED WITH 100% SUCCESS! 🎉');
}

testLeveling().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
