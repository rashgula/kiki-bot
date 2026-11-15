// Script to update KIKI Bot Avatar, Banner, and Username on Discord
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const avatarPath = path.join(__dirname, '..', 'assets', 'kiki-avatar.png');
const bannerPath = path.join(__dirname, '..', 'assets', 'kiki-banner.png');

console.log('Logging in to Discord to update profile...');

client.once('ready', async () => {
  console.log(`Logged in as: ${client.user.tag} (${client.user.id})`);

  // 1. Update Username to KIKI if needed
  try {
    if (client.user.username !== 'KIKI') {
      console.log('Updating username to KIKI...');
      await client.user.setUsername('KIKI');
      console.log('✅ Username updated to KIKI!');
    } else {
      console.log('ℹ️ Username is already KIKI.');
    }
  } catch (err) {
    console.warn('⚠️ Username update notice:', err.message);
  }

  // 2. Update Avatar
  try {
    if (fs.existsSync(avatarPath)) {
      console.log('Uploading KIKI Gothic Avatar to Discord...');
      await client.user.setAvatar(avatarPath);
      console.log('✅ KIKI Avatar successfully updated on Discord!');
    } else {
      console.error('❌ Avatar file not found at:', avatarPath);
    }
  } catch (err) {
    console.error('❌ Failed to update avatar:', err.message);
  }

  // 3. Update Banner
  try {
    if (fs.existsSync(bannerPath)) {
      console.log('Uploading KIKI Gothic Banner to Discord...');
      await client.user.setBanner(bannerPath);
      console.log('✅ KIKI Banner successfully updated on Discord!');
    } else {
      console.error('❌ Banner file not found at:', bannerPath);
    }
  } catch (err) {
    console.error('⚠️ Banner update notice (Discord may require Developer Portal for bot banner):', err.message);
  }

  console.log('\n🎉 Profile update process complete!');
  setTimeout(() => {
    client.destroy();
    process.exit(0);
  }, 2000);
});

const TOKEN = process.env.TOKEN;
if (!TOKEN) {
  console.error('❌ TOKEN not found in .env');
  process.exit(1);
}

client.login(TOKEN).catch(err => {
  console.error('❌ Login failed:', err.message);
  process.exit(1);
});
