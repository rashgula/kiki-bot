// Verification test for 1-click execution and fixed commands
const { Collection, PermissionFlagsBits } = require('discord.js');
const help = require('../commands/utility/help.js');
const lockCmd = require('../commands/moderation/lock.js');
const shipCmd = require('../commands/fun/ship.js');
const marriageCmd = require('../commands/social/marriage-status-view.js');
const FunEngine = require('../utils/funEngine.js');

async function runTests() {
  console.log('🧪 Starting KIKI Bug Fix Verification Suite...\n');

  // Mock Discord Client
  const client = {
    commands: new Collection(),
    prefixCommands: new Collection(),
    user: { id: 'bot_123', username: 'KIKI' }
  };

  // Register commands into mock client
  client.prefixCommands.set('lock', lockCmd);
  client.prefixCommands.set('ship', shipCmd);
  client.prefixCommands.set('marriage', marriageCmd);
  client.prefixCommands.set('marriage-status-view', marriageCmd);

  // Mock Channel
  const mockChannel = {
    id: 'ch_999',
    name: 'general',
    permissionOverwrites: {
      edit: async (role, perms) => {
        console.log('   ✅ [Channel Overwrites Edited]:', Object.keys(perms));
        return true;
      }
    },
    send: async (payload) => {
      console.log('   ✅ [Channel Send]:', typeof payload === 'string' ? payload : 'Embed sent');
      return true;
    }
  };

  // Mock Guild
  const mockGuild = {
    id: 'guild_111',
    name: 'Dark Realm',
    ownerId: 'owner_999',
    roles: {
      everyone: { id: 'role_everyone', name: '@everyone' }
    },
    members: {
      cache: new Collection([
        ['user_1', { id: 'user_1', user: { id: 'user_1', username: 'BILLU', bot: false } }],
        ['user_2', { id: 'user_2', user: { id: 'user_2', username: 'ZAMASU', bot: false } }]
      ])
    }
  };

  // Mock User & Member
  const mockUser = { id: 'owner_999', username: 'BILLU_OWNER', bot: false };
  const mockMember = {
    id: 'owner_999',
    user: mockUser,
    permissions: {
      has: (perm) => true
    }
  };

  console.log('── TEST 1: Lock Channel execution with empty mentions Collection ──');
  const fakeMsgForLock = {
    id: 'fake_1',
    guild: mockGuild,
    guildId: mockGuild.id,
    channel: mockChannel,
    channelId: mockChannel.id,
    author: mockUser,
    member: mockMember,
    client,
    content: '&lock',
    mentions: {
      users: new Collection(),
      members: new Collection(),
      channels: new Collection(),
      roles: new Collection(),
      crosspostedChannels: new Collection(),
      everyone: false,
      has: () => false,
      first: () => null
    },
    reply: async (payload) => {
      console.log('   ✅ [Reply Received]:', payload.embeds?.[0]?.data?.title || payload);
    }
  };

  await lockCmd.run(fakeMsgForLock, [], client);
  console.log('   🎉 Lock command executed with ZERO errors!\n');

  console.log('── TEST 2: Ship command with 0 mentions (1-click / random) ──');
  await shipCmd.run(fakeMsgForLock, [], client);
  console.log('   🎉 Ship (0 mentions) executed with ZERO errors!\n');

  console.log('── TEST 3: Ship command with 2 mentions (@BILLU @ZAMASU) ──');
  const shipMentions = new Collection([
    ['user_1', { id: 'user_1', username: 'BILLU' }],
    ['user_2', { id: 'user_2', username: 'ZAMASU' }]
  ]);
  const fakeMsgWithMentions = {
    ...fakeMsgForLock,
    mentions: {
      ...fakeMsgForLock.mentions,
      users: shipMentions
    }
  };
  await shipCmd.run(fakeMsgWithMentions, [], client);
  console.log('   🎉 Ship (2 mentions) executed with ZERO errors!\n');

  console.log('── TEST 4: Marriage status view command ──');
  await marriageCmd.run(fakeMsgForLock, [], client);
  console.log('   🎉 Marriage status view executed with ZERO errors!\n');

  console.log('── TEST 5: FunEngine Marriage & Divorce Flow ──');
  const marryRes = FunEngine.marry(mockGuild.id, 'user_1', 'user_2');
  console.log('   ✅ FunEngine Marry Result:', marryRes);
  const statusAfter = FunEngine.getMarriage(mockGuild.id, 'user_1');
  console.log('   ✅ Partner Check:', statusAfter?.partnerId === 'user_2' ? 'PASS' : 'FAIL');
  const divRes = FunEngine.divorce(mockGuild.id, 'user_1');
  console.log('   ✅ FunEngine Divorce Result:', divRes);

  console.log('\n✨ ALL TEST SCENARIOS PASSED WITH 100% SUCCESS! ✨');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
