import discord
from discord.ext import commands
import json
import os
import asyncio
from datetime import datetime, timedelta

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")

def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_config(data):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

config = load_config()

intents = discord.Intents.all()
bot = commands.Bot(command_prefix=config.get("prefix", "&"), intents=intents, help_command=None)

# ----------------- HELPER CHECKS -----------------
def is_owner_or_whitelisted(user_id):
    cfg = load_config()
    owners = cfg.get("owners", [])
    whitelist = cfg.get("whitelist", [])
    return user_id in owners or user_id in whitelist

# ----------------- TICKET UI (BUTTONS) -----------------
class CloseTicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Close Ticket", style=discord.ButtonStyle.danger, emoji="🔒", custom_id="close_ticket_btn")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("⚠️ Ye ticket 5 second mein close ho jayega...", ephemeral=False)
        await asyncio.sleep(5)
        await interaction.channel.delete(reason="Ticket Closed by User/Staff")

class TicketLaunchView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Open Ticket", style=discord.ButtonStyle.primary, emoji="📩", custom_id="open_ticket_btn")
    async def open_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        cfg = load_config()
        guild = interaction.guild
        category_id = cfg.get("ticket_category_id")
        category = guild.get_channel(category_id) if category_id else None

        channel_name = f"ticket-{interaction.user.name.lower()}"
        
        # Check if user already has an open ticket
        existing = discord.utils.get(guild.text_channels, name=channel_name)
        if existing:
            return await interaction.response.send_message(f"❌ Aapka ticket pehle se open hai: {existing.mention}", ephemeral=True)

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            interaction.user: discord.PermissionOverwrite(read_messages=True, send_messages=True, attach_files=True),
            guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)
        }

        staff_role_id = cfg.get("staff_role_id")
        if staff_role_id:
            staff_role = guild.get_role(staff_role_id)
            if staff_role:
                overwrites[staff_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        ticket_channel = await guild.create_text_channel(
            name=channel_name,
            category=category,
            overwrites=overwrites,
            reason=f"Ticket created for {interaction.user}"
        )

        embed = discord.Embed(
            title="🎫 Support Ticket",
            description=f"Namaste {interaction.user.mention}!\nStaff jald hi aapse yahan connect karega.\nApni problem detail me likhein.\n\nTicket close karne ke liye niche diya gaya **Close Ticket** button dabayein.",
            color=discord.Color.blue()
        )
        embed.set_footer(text="Bitzxier Ticket System")

        await ticket_channel.send(content=f"{interaction.user.mention}", embed=embed, view=CloseTicketView())
        await interaction.response.send_message(f"✅ Aapka ticket create ho gaya hai: {ticket_channel.mention}", ephemeral=True)

# ----------------- EVENTS -----------------
@bot.event
async def on_ready():
    bot.add_view(TicketLaunchView())
    bot.add_view(CloseTicketView())
    print(f"========================================")
    print(f"Logged in as: {bot.user.name} ({bot.user.id})")
    print(f"Bitzxier Core Python System Active!")
    print(f"Connected to {len(bot.guilds)} servers")
    print(f"========================================")
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name=f"{config.get('prefix', '&')}help | Chit Chat Protection"))

# Welcome & Auto-role
@bot.event
async def on_member_join(member):
    cfg = load_config()
    
    # 1. Anti-Bot Protection
    if member.bot and cfg.get("antinuke", True):
        async for entry in member.guild.audit_logs(action=discord.AuditLogAction.bot_add, limit=1):
            adder = entry.user
            if not is_owner_or_whitelisted(adder.id):
                try:
                    await member.kick(reason="Anti-Bot: Bot added by non-whitelisted member.")
                    await member.guild.ban(adder, reason="Anti-Bot: Rogue bot added without whitelist.")
                    print(f"[SECURITY] Unauthorized bot {member} kicked and adder {adder} banned.")
                except Exception as e:
                    print(f"[ERROR] Anti-bot trigger failed: {e}")
                return

    # 2. Auto-Role
    role_id = cfg.get("autorole_id")
    if role_id and not member.bot:
        role = member.guild.get_role(role_id)
        if role:
            try:
                await member.add_roles(role)
            except Exception as e:
                print(f"[ERROR] Auto-role assignment failed: {e}")

    # 3. Welcome Message
    channel_id = cfg.get("welcome_channel_id")
    if channel_id:
        channel = member.guild.get_channel(channel_id)
        if channel:
            embed = discord.Embed(
                title=f"👋 Welcome to {member.guild.name}!",
                description=f"Hey {member.mention}, welcome to the server!\nMake sure to read the rules and enjoy chit-chatting with everyone! 💬",
                color=discord.Color.green(),
                timestamp=datetime.utcnow()
            )
            embed.set_thumbnail(url=member.display_avatar.url)
            embed.add_field(name="Member Count", value=f"#{member.guild.member_count}", inline=True)
            embed.set_footer(text="Bitzxier Welcome System")
            try:
                await channel.send(embed=embed)
            except Exception as e:
                print(f"[ERROR] Welcome message failed: {e}")

# ----------------- ANTI-NUKE EVENTS -----------------
@bot.event
async def on_guild_channel_delete(channel):
    cfg = load_config()
    if not cfg.get("antinuke", True):
        return

    guild = channel.guild
    async for entry in guild.audit_logs(action=discord.AuditLogAction.channel_delete, limit=1):
        executor = entry.user
        if executor.id == bot.user.id or is_owner_or_whitelisted(executor.id):
            return

        try:
            await guild.ban(executor, reason="[ANTINUKE] Channel Delete without Whitelist")
            # Recreate deleted channel
            await guild.create_text_channel(name=channel.name, category=channel.category, topic=channel.topic)
            print(f"[SECURITY] Channel {channel.name} restored. Rogue user {executor} banned.")
        except Exception as e:
            print(f"[ERROR] Anti-Channel-Delete failed: {e}")

@bot.event
async def on_member_ban(guild, user):
    cfg = load_config()
    if not cfg.get("antinuke", True):
        return

    async for entry in guild.audit_logs(action=discord.AuditLogAction.ban, limit=1):
        executor = entry.user
        if executor.id == bot.user.id or is_owner_or_whitelisted(executor.id):
            return

        try:
            await guild.ban(executor, reason="[ANTINUKE] Member Ban without Whitelist")
            await guild.unban(user, reason="[ANTINUKE] Auto-Unban from Rogue Action")
            print(f"[SECURITY] Rogue user {executor} banned for mass ban.")
        except Exception as e:
            print(f"[ERROR] Anti-Ban failed: {e}")

@bot.event
async def on_guild_role_delete(role):
    cfg = load_config()
    if not cfg.get("antinuke", True):
        return

    guild = role.guild
    async for entry in guild.audit_logs(action=discord.AuditLogAction.role_delete, limit=1):
        executor = entry.user
        if executor.id == bot.user.id or is_owner_or_whitelisted(executor.id):
            return

        try:
            await guild.ban(executor, reason="[ANTINUKE] Role Delete without Whitelist")
            print(f"[SECURITY] Rogue user {executor} banned for deleting role {role.name}.")
        except Exception as e:
            print(f"[ERROR] Anti-Role-Delete failed: {e}")

# ----------------- SECURITY & ANTI-NUKE COMMANDS -----------------
@bot.group(name="antinuke", invoke_without_command=True)
async def antinuke(ctx):
    cfg = load_config()
    status = "✅ Enabled" if cfg.get("antinuke", True) else "❌ Disabled"
    embed = discord.Embed(
        title="🛡️ Bitzxier Anti-Nuke Settings",
        description=f"**Current Status:** {status}\n\n**Sub-Commands:**\n`{ctx.prefix}antinuke enable` - Turn Anti-Nuke ON\n`{ctx.prefix}antinuke disable` - Turn Anti-Nuke OFF",
        color=discord.Color.red()
    )
    await ctx.send(embed=embed)

@antinuke.command(name="enable")
async def antinuke_enable(ctx):
    if not is_owner_or_whitelisted(ctx.author.id):
        return await ctx.send("❌ Sirf bot owner ya whitelisted user ye command use kar sakte hain!")
    cfg = load_config()
    cfg["antinuke"] = True
    save_config(cfg)
    await ctx.send("✅ **Anti-Nuke successfully ENABLED!** Server ab full protected hai.")

@antinuke.command(name="disable")
async def antinuke_disable(ctx):
    if not is_owner_or_whitelisted(ctx.author.id):
        return await ctx.send("❌ Sirf bot owner ya whitelisted user ye command use kar sakte hain!")
    cfg = load_config()
    cfg["antinuke"] = False
    save_config(cfg)
    await ctx.send("⚠️ **Anti-Nuke DISABLED!** Server protection band ho gayi hai.")

@bot.group(name="whitelist", invoke_without_command=True)
async def whitelist(ctx):
    await ctx.send(f"Commands: `{ctx.prefix}whitelist add <@user>` | `{ctx.prefix}whitelist remove <@user>` | `{ctx.prefix}whitelisted`")

@whitelist.command(name="add")
async def whitelist_add(ctx, member: discord.Member):
    if ctx.author.id not in load_config().get("owners", []):
        return await ctx.send("❌ Sirf Bot Owner hi whitelist mein user add kar sakta hai!")
    cfg = load_config()
    if member.id not in cfg["whitelist"]:
        cfg["whitelist"].append(member.id)
        save_config(cfg)
        await ctx.send(f"✅ {member.mention} ko **Whitelist** mein add kar diya gaya hai.")
    else:
        await ctx.send("⚠️ Ye user pehle se whitelisted hai.")

@whitelist.command(name="remove")
async def whitelist_remove(ctx, member: discord.Member):
    if ctx.author.id not in load_config().get("owners", []):
        return await ctx.send("❌ Sirf Bot Owner hi whitelist se user remove kar sakta hai!")
    cfg = load_config()
    if member.id in cfg["whitelist"]:
        cfg["whitelist"].remove(member.id)
        save_config(cfg)
        await ctx.send(f"✅ {member.mention} ko **Whitelist** se hata diya gaya hai.")
    else:
        await ctx.send("⚠️ Ye user whitelist mein nahi tha.")

@bot.command(name="whitelisted")
async def whitelisted(ctx):
    cfg = load_config()
    wl = cfg.get("whitelist", [])
    if not wl:
        return await ctx.send("ℹ️ Abhi koi user whitelisted nahi hai.")
    users = [f"<@{uid}>" for uid in wl]
    embed = discord.Embed(
        title="🛡️ Whitelisted Users",
        description="\n".join(users),
        color=discord.Color.gold()
    )
    await ctx.send(embed=embed)

# ----------------- MODERATION COMMANDS -----------------
@bot.command(name="ban")
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason="No reason provided"):
    if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
        return await ctx.send("❌ Aap is user ko ban nahi kar sakte (Higher or equal role)!")
    await member.ban(reason=f"{reason} | Banned by {ctx.author}")
    await ctx.send(f"🔨 **{member}** ko ban kar diya gaya. Reason: `{reason}`")

@bot.command(name="unban")
@commands.has_permissions(ban_members=True)
async def unban(ctx, user_id: int):
    user = await bot.fetch_user(user_id)
    await ctx.guild.unban(user)
    await ctx.send(f"🔓 **{user}** ko unban kar diya gaya.")

@bot.command(name="kick")
@commands.has_permissions(kick_members=True)
async def kick(ctx, member: discord.Member, *, reason="No reason provided"):
    if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
        return await ctx.send("❌ Aap is user ko kick nahi kar sakte (Higher or equal role)!")
    await member.kick(reason=f"{reason} | Kicked by {ctx.author}")
    await ctx.send(f"👢 **{member}** ko kick kar diya gaya. Reason: `{reason}`")

@bot.command(name="timeout", aliases=["mute"])
@commands.has_permissions(moderate_members=True)
async def timeout(ctx, member: discord.Member, minutes: int, *, reason="No reason provided"):
    duration = timedelta(minutes=minutes)
    await member.timeout(duration, reason=reason)
    await ctx.send(f"⏳ **{member}** ko `{minutes}` minutes ke liye mute/timeout kar diya gaya.")

@bot.command(name="untimeout", aliases=["unmute"])
@commands.has_permissions(moderate_members=True)
async def untimeout(ctx, member: discord.Member):
    await member.timeout(None, reason="Untimed out by staff")
    await ctx.send(f"🔊 **{member}** ka timeout/mute hata diya gaya hai.")

@bot.command(name="purge", aliases=["clear"])
@commands.has_permissions(manage_messages=True)
async def purge(ctx, amount: int = 10):
    await ctx.channel.purge(limit=amount + 1)
    msg = await ctx.send(f"🧹 `{amount}` messages delete kar diye gaye!")
    await asyncio.sleep(3)
    await msg.delete()

@bot.command(name="lock")
@commands.has_permissions(manage_channels=True)
async def lock(ctx, channel: discord.TextChannel = None):
    channel = channel or ctx.channel
    await channel.set_permissions(ctx.guild.default_role, send_messages=False)
    await ctx.send(f"🔒 {channel.mention} ko **LOCK** kar diya gaya hai.")

@bot.command(name="unlock")
@commands.has_permissions(manage_channels=True)
async def unlock(ctx, channel: discord.TextChannel = None):
    channel = channel or ctx.channel
    await channel.set_permissions(ctx.guild.default_role, send_messages=True)
    await ctx.send(f"🔓 {channel.mention} ko **UNLOCK** kar diya gaya hai.")

@bot.command(name="hide")
@commands.has_permissions(manage_channels=True)
async def hide(ctx, channel: discord.TextChannel = None):
    channel = channel or ctx.channel
    await channel.set_permissions(ctx.guild.default_role, view_channel=False)
    await ctx.send(f"👁️‍🗨️ {channel.mention} ko **HIDE** kar diya gaya hai.")

@bot.command(name="unhide")
@commands.has_permissions(manage_channels=True)
async def unhide(ctx, channel: discord.TextChannel = None):
    channel = channel or ctx.channel
    await channel.set_permissions(ctx.guild.default_role, view_channel=True)
    await ctx.send(f"👁️ {channel.mention} ab **VISIBLE** hai.")

@bot.command(name="nuke")
@commands.has_permissions(manage_channels=True)
async def nuke(ctx):
    pos = ctx.channel.position
    new_channel = await ctx.channel.clone(reason="Channel Nuked")
    await ctx.channel.delete(reason="Channel Nuked")
    await new_channel.edit(position=pos)
    embed = discord.Embed(
        title="💥 Channel Nuked!",
        description=f"Ye channel **{ctx.author.name}** dwara saaf kiya gaya.",
        color=discord.Color.red()
    )
    embed.set_image(url="https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif")
    await new_channel.send(embed=embed)

# ----------------- SERVER SETUP COMMANDS -----------------
@bot.command(name="setwelcome")
@commands.has_permissions(administrator=True)
async def setwelcome(ctx, channel: discord.TextChannel):
    cfg = load_config()
    cfg["welcome_channel_id"] = channel.id
    save_config(cfg)
    await ctx.send(f"✅ Welcome channel set kar diya gaya hai: {channel.mention}")

@bot.command(name="setautorole")
@commands.has_permissions(administrator=True)
async def setautorole(ctx, role: discord.Role):
    cfg = load_config()
    cfg["autorole_id"] = role.id
    save_config(cfg)
    await ctx.send(f"✅ Auto-Role set kar diya gaya hai: {role.name}")

@bot.command(name="setticketstaff")
@commands.has_permissions(administrator=True)
async def setticketstaff(ctx, role: discord.Role):
    cfg = load_config()
    cfg["staff_role_id"] = role.id
    save_config(cfg)
    await ctx.send(f"✅ Ticket Staff Role set kar diya gaya hai: {role.name}")

@bot.command(name="setticketcategory")
@commands.has_permissions(administrator=True)
async def setticketcategory(ctx, category_id: int):
    cfg = load_config()
    cfg["ticket_category_id"] = category_id
    save_config(cfg)
    await ctx.send(f"✅ Ticket Category ID set ho gaya hai.")

@bot.command(name="ticketsetup")
@commands.has_permissions(administrator=True)
async def ticketsetup(ctx):
    embed = discord.Embed(
        title="🎫 Support & Ticket Center",
        description="Agar aapko server me koi help chahiye ya staff se baat karni hai, toh niche diye gaye **'Open Ticket'** button par click karein!\n\nEk private channel open ho jayega jahan sirf aap aur server staff honge.",
        color=discord.Color.blue()
    )
    embed.set_footer(text="Bitzxier Interactive Ticket Panel")
    await ctx.send(embed=embed, view=TicketLaunchView())
    await ctx.message.delete()

# ----------------- UTILITY & INFO COMMANDS -----------------
@bot.command(name="ping")
async def ping(ctx):
    latency = round(bot.latency * 1000)
    await ctx.send(f"🏓 Pong! Latency: `{latency}ms`")

@bot.command(name="avatar", aliases=["av"])
async def avatar(ctx, member: discord.Member = None):
    member = member or ctx.author
    embed = discord.Embed(title=f"{member.name}'s Avatar", color=discord.Color.purple())
    embed.set_image(url=member.display_avatar.url)
    await ctx.send(embed=embed)

@bot.command(name="userinfo", aliases=["ui"])
async def userinfo(ctx, member: discord.Member = None):
    member = member or ctx.author
    roles = [r.mention for r in member.roles if r != ctx.guild.default_role]
    embed = discord.Embed(title=f"User Info - {member.name}", color=discord.Color.teal())
    embed.set_thumbnail(url=member.display_avatar.url)
    embed.add_field(name="User ID", value=member.id, inline=True)
    embed.add_field(name="Joined Server", value=member.joined_at.strftime("%d %b %Y"), inline=True)
    embed.add_field(name="Account Created", value=member.created_at.strftime("%d %b %Y"), inline=True)
    embed.add_field(name=f"Roles ({len(roles)})", value=" ".join(roles) if roles else "None", inline=False)
    await ctx.send(embed=embed)

@bot.command(name="serverinfo", aliases=["si"])
async def serverinfo(ctx):
    g = ctx.guild
    embed = discord.Embed(title=f"Server Info - {g.name}", color=discord.Color.blue())
    if g.icon:
        embed.set_thumbnail(url=g.icon.url)
    embed.add_field(name="Owner", value=f"<@{g.owner_id}>", inline=True)
    embed.add_field(name="Total Members", value=g.member_count, inline=True)
    embed.add_field(name="Text Channels", value=len(g.text_channels), inline=True)
    embed.add_field(name="Voice Channels", value=len(g.voice_channels), inline=True)
    embed.add_field(name="Roles Count", value=len(g.roles), inline=True)
    embed.add_field(name="Created On", value=g.created_at.strftime("%d %b %Y"), inline=True)
    await ctx.send(embed=embed)

@bot.command(name="help")
async def help_command(ctx):
    p = ctx.prefix
    embed = discord.Embed(
        title="⚡ Bitzxier Bot - All Commands & Help Panel",
        description="Yeh Python-based Bitzxier clone bot hai jo Anti-Nuke, Moderation, Tickets aur Utility features provide karta hai.",
        color=discord.Color.from_rgb(43, 45, 49)
    )
    embed.add_field(
        name="🛡️ Anti-Nuke & Security",
        value=f"`{p}antinuke enable/disable`\n`{p}whitelist add/remove @user`\n`{p}whitelisted`",
        inline=False
    )
    embed.add_field(
        name="🔨 Moderation",
        value=f"`{p}ban`, `{p}unban`, `{p}kick`\n`{p}timeout/mute`, `{p}unmute`\n`{p}purge <amount>`, `{p}nuke`\n`{p}lock`, `{p}unlock`, `{p}hide`, `{p}unhide`",
        inline=False
    )
    embed.add_field(
        name="🎫 Ticket System",
        value=f"`{p}ticketsetup` - Interactive Button Panel Send Karein\n`{p}setticketstaff @role` - Support Staff Role\n`{p}setticketcategory <id>` - Ticket Channel Category",
        inline=False
    )
    embed.add_field(
        name="⚙️ Server Setup",
        value=f"`{p}setwelcome #channel` - Welcome Channel Setup\n`{p}setautorole @role` - Auto Role on Join",
        inline=False
    )
    embed.add_field(
        name="📊 Utility & Info",
        value=f"`{p}ping`, `{p}avatar [@user]`, `{p}userinfo [@user]`, `{p}serverinfo`",
        inline=False
    )
    embed.set_footer(text=f"Prefix: {p} | Bitzxier Python System")
    await ctx.send(embed=embed)

if __name__ == "__main__":
    TOKEN = config.get("token")
    if not TOKEN or TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ ERROR: config.json me apna Discord Bot Token daalein!")
    else:
        bot.run(TOKEN)
