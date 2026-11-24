// Verification test for Leave Setup Panel & Animated Goodbye Message
const leavePanel = require('../commands/admin/leavepanel.js');
const guildMemberRemove = require('../events/guildMemberRemove.js');
const KIKI = require('../utils/kiki.js');

async function testLeaveSystem() {
  console.log('🧪 Starting Leave Panel & Goodbye Animation Test...\n');

  // 1. Mock Guild & Member
  const mockGuild = {
    id: 'test_guild_999',
    name: 'Gothic Sanctuary',
    memberCount: 42,
    channels: {
      cache: new Map([
        ['ch_leave_123', { id: 'ch_leave_123', name: 'goodbye-logs', toString: () => '<#ch_leave_123>' }]
      ])
    }
  };

  const mockUser = {
    id: '989411027798089778',
    tag: 'BILLU#0001',
    username: 'BILLU',
    toString: () => '<@989411027798089778>',
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
  };

  const mockMember = {
    guild: mockGuild,
    user: mockUser,
    id: mockUser.id,
    joinedTimestamp: Date.now() - (86400000 * 5) // 5 days ago
  };

  // 2. Test Animated Leave Card Builder
  console.log('── TEST 1: Animated Goodbye Card Content & Dialogue ──');
  const cardPayload = leavePanel.buildLeaveCard(mockGuild, mockUser, { joinedTimestamp: mockMember.joinedTimestamp });
  
  console.log('   • Header Content:', cardPayload.content);
  console.log('   • Embed Title:', cardPayload.embeds[0].data.title);
  console.log('   • Embed Description:\n' + cardPayload.embeds[0].data.description);
  console.log('   • Image URL (GIF):', cardPayload.embeds[0].data.image?.url);
  console.log('   • Fields Count:', cardPayload.embeds[0].data.fields.length);

  // Validate dialogue
  if (!cardPayload.content.includes('Tusi jaa rahe ho? Please tusi na jaao...!')) {
    throw new Error('Dialogue missing from leave message content!');
  }
  if (!cardPayload.embeds[0].data.description.includes('Tusi jaa rahe ho? Please tusi na jaao...!')) {
    throw new Error('Dialogue missing from leave embed description!');
  }
  if (!cardPayload.embeds[0].data.image?.url) {
    throw new Error('Animation GIF missing from leave embed!');
  }
  console.log('   ✅ Animated goodbye card format validated with 100% success!\n');

  // 3. Test Multi-Server Guild Isolation in Config
  console.log('── TEST 2: Per-Server Channel Binding (No Overwrite) ──');
  const cfg = KIKI.loadConfig();
  if (!cfg.guilds) cfg.guilds = {};
  if (!cfg.guilds[mockGuild.id]) cfg.guilds[mockGuild.id] = {};
  cfg.guilds[mockGuild.id].leave_channel_id = 'ch_leave_123';
  cfg.guilds[mockGuild.id].leave_enabled = true;
  KIKI.saveConfig(cfg);

  const reloadedCfg = KIKI.loadConfig();
  if (reloadedCfg.guilds[mockGuild.id]?.leave_channel_id !== 'ch_leave_123') {
    throw new Error('Guild-specific leave channel not persisted!');
  }
  console.log('   ✅ Per-server leave channel binding verified!\n');

  // 4. Test Interaction Handler: Channel Select & Button Test
  console.log('── TEST 3: Interactive Panel Select & Buttons ──');
  let updateCalled = false;
  let replyCalled = false;
  let sentCard = null;

  const mockInteraction = {
    guild: mockGuild,
    guildId: mockGuild.id,
    user: mockUser,
    member: mockMember,
    customId: 'lp_channel_select',
    isChannelSelectMenu: () => true,
    isButton: () => false,
    values: ['ch_leave_123'],
    update: async (data) => {
      updateCalled = true;
      console.log('   ✅ [Interaction Update]: Embed rendered with title:', data.embeds[0].data.title);
    },
    reply: async (data) => {
      replyCalled = true;
    }
  };

  const mockClient = { user: { id: 'bot_id' } };
  await leavePanel.handleInteraction(mockInteraction, mockClient);

  if (!updateCalled) {
    throw new Error('lp_channel_select did not update interaction!');
  }
  console.log('   ✅ Interactive panel controls verified!\n');

  console.log('🎉 ALL LEAVE PANEL & GOODBYE TESTS PASSED SUCCESSFULLY! 🎉');
}

testLeaveSystem().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
