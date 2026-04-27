const { Events, EmbedBuilder } = require('discord.js');
const { addXP, setLevel, xpNeeded, getLevel, getConfig, isBlacklisted } = require('../utils/database');

// ─── READY ────────────────────────────────────────────────────────────────
const ready = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`📡 Sur ${client.guilds.cache.size} serveur(s)`);
    client.user.setActivity('le serveur 👀', { type: 3 }); // WATCHING
  }
};

// ─── INTERACTION ──────────────────────────────────────────────────────────
const interactionCreate = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (isBlacklisted(interaction.user.id, interaction.guildId)) {
      return interaction.reply({ content: '❌ Vous êtes blacklisté de ce bot.', ephemeral: true });
    }
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Erreur sur /${interaction.commandName}:`, err);
      const reply = { content: '❌ Une erreur est survenue.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  }
};

// ─── MESSAGE XP ───────────────────────────────────────────────────────────
const messageCreate = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Anti-spam XP : 1 gain max toutes les 60 secondes
    const cacheKey = `${userId}_${guildId}`;
    if (!message.client._xpCache) message.client._xpCache = new Map();
    const lastXp = message.client._xpCache.get(cacheKey);
    if (lastXp && Date.now() - lastXp < 60000) return;
    message.client._xpCache.set(cacheKey, Date.now());

    const xpGain = Math.floor(Math.random() * 10) + 15;
    const before = getLevel(userId, guildId);
    const after = addXP(userId, guildId, xpGain);
    const needed = xpNeeded(after.level);

    if (after.xp >= needed) {
      const newLevel = after.level + 1;
      setLevel(userId, guildId, newLevel, after.xp - needed);

      const config = getConfig(guildId);
      const channel = config.level_channel
        ? message.guild.channels.cache.get(config.level_channel) || message.channel
        : message.channel;

      const e = new EmbedBuilder()
        .setTitle('⬆️ Niveau supérieur !')
        .setDescription(`Félicitations ${message.author} ! Tu es passé au **niveau ${newLevel}** ! 🎉`)
        .setColor(0x1D9E75)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();
      channel.send({ embeds: [e] }).catch(() => {});
    }
  }
};

// ─── MEMBER JOIN ──────────────────────────────────────────────────────────
const guildMemberAdd = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const config = getConfig(member.guild.id);
    if (!config.welcome_channel) return;
    const channel = member.guild.channels.cache.get(config.welcome_channel);
    if (!channel) return;
    const msg = config.welcome_message
      ? config.welcome_message.replace('{user}', member.toString()).replace('{server}', member.guild.name)
      : `Bienvenue sur **${member.guild.name}**, ${member} ! Tu es le membre numéro **${member.guild.memberCount}**. 🎉`;
    const e = new EmbedBuilder()
      .setTitle('👋 Nouveau membre !')
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setColor(0x1D9E75)
      .setTimestamp();
    channel.send({ embeds: [e] }).catch(() => {});
  }
};

// ─── MEMBER LEAVE ─────────────────────────────────────────────────────────
const guildMemberRemove = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const config = getConfig(member.guild.id);
    if (!config.welcome_channel) return;
    const channel = member.guild.channels.cache.get(config.welcome_channel);
    if (!channel) return;
    const e = new EmbedBuilder()
      .setTitle('👋 Au revoir !')
      .setDescription(`**${member.user.tag}** a quitté le serveur.`)
      .setColor(0xD85A30)
      .setTimestamp();
    channel.send({ embeds: [e] }).catch(() => {});
  }
};

module.exports = [ready, interactionCreate, messageCreate, guildMemberAdd, guildMemberRemove];
