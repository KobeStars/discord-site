const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');

module.exports = [

  // ─── SERVERSTATS ──────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('serverstats')
      .setDescription('Afficher les statistiques détaillées du serveur'),
    async execute(interaction) {
      const guild = interaction.guild;
      await guild.members.fetch();

      const total = guild.memberCount;
      const online = guild.members.cache.filter(m => m.presence?.status && m.presence.status !== 'offline').size;
      const offline = total - online;
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const roles = guild.roles.cache.size - 1;
      const boosts = guild.premiumSubscriptionCount || 0;
      const boostLevel = guild.premiumTier;
      const createdAt = Math.floor(guild.createdTimestamp / 1000);
      const verificationLevels = ['Aucune', 'Faible', 'Moyenne', 'Élevée', 'Très élevée'];
      const verification = verificationLevels[guild.verificationLevel] || 'Inconnue';

      await interaction.reply({
        embeds: [infoEmbed(`Statistiques de ${guild.name}`, `Serveur créé <t:${createdAt}:R>`, [
          { name: '👥 Membres', value: `Total : **${total}**\nEn ligne : **${online}**\nHors ligne : **${offline}**`, inline: true },
          { name: '💬 Salons', value: `Texte : **${textChannels}**\nVocal : **${voiceChannels}**`, inline: true },
          { name: '🎭 Rôles', value: `**${roles}**`, inline: true },
          { name: '🚀 Boosts', value: `**${boosts}** boost(s)\nNiveau **${boostLevel}**`, inline: true },
          { name: '🔒 Vérification', value: verification, inline: true },
          { name: '🆔 ID Serveur', value: guild.id, inline: true },
        ])]
      });
    }
  },

  // ─── USERSTATS ────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('userstats')
      .setDescription('Statistiques d\'un utilisateur')
      .addUserOption(o => o.setName('membre').setDescription('Membre (défaut : vous)')),
    async execute(interaction) {
      const member = interaction.options.getMember('membre') || interaction.member;
      const user = member.user;

      const createdAt = Math.floor(user.createdTimestamp / 1000);
      const joinedAt = Math.floor(member.joinedTimestamp / 1000);
      const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(', ') || 'Aucun';
      const status = member.presence?.status || 'offline';
      const statusLabel = { online: '🟢 En ligne', idle: '🌙 Absent', dnd: '🔴 Ne pas déranger', offline: '⚫ Hors ligne' }[status] || '⚫ Hors ligne';

      const flags = user.flags?.toArray() || [];
      const badgeMap = {
        Staff: '👮 Staff Discord',
        Partner: '🤝 Partenaire',
        Hypesquad: '🏠 HypeSquad Events',
        BugHunterLevel1: '🐛 Bug Hunter',
        BugHunterLevel2: '🐛 Bug Hunter Gold',
        HypeSquadOnlineHouse1: '🏡 Bravery',
        HypeSquadOnlineHouse2: '🏡 Brilliance',
        HypeSquadOnlineHouse3: '🏡 Balance',
        PremiumEarlySupporter: '⭐ Early Supporter',
        VerifiedDeveloper: '🤖 Développeur Vérifié',
        ActiveDeveloper: '🛠️ Développeur Actif',
      };
      const badges = flags.map(f => badgeMap[f]).filter(Boolean).join(', ') || 'Aucun badge';

      await interaction.reply({
        embeds: [infoEmbed(`Statistiques de ${user.username}`, `Profil de ${user.toString()}`, [
          { name: '📅 Compte créé', value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: true },
          { name: '📥 Arrivée serveur', value: `<t:${joinedAt}:D> (<t:${joinedAt}:R>)`, inline: true },
          { name: '🔵 Statut', value: statusLabel, inline: true },
          { name: `🎭 Rôles (${member.roles.cache.size - 1})`, value: roles.length > 1000 ? roles.substring(0, 997) + '...' : roles },
          { name: '🏅 Badges', value: badges },
        ])]
      });
    }
  },

  // ─── BOTSTATS ─────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('botstats')
      .setDescription('Statistiques du bot'),
    async execute(interaction) {
      const client = interaction.client;
      const uptimeMs = client.uptime || 0;
      const s = Math.floor(uptimeMs / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      const uptime = d > 0
        ? `${d}j ${h % 24}h ${m % 60}m`
        : h > 0
          ? `${h}h ${m % 60}m ${s % 60}s`
          : `${m}m ${s % 60}s`;

      const mem = process.memoryUsage();
      const memUsed = (mem.heapUsed / 1024 / 1024).toFixed(2);
      const memTotal = (mem.heapTotal / 1024 / 1024).toFixed(2);
      const ping = client.ws.ping;
      const nodeVersion = process.version;
      const guildCount = client.guilds.cache.size;

      await interaction.reply({
        embeds: [infoEmbed('Statistiques du Bot', `**${client.user.username}**`, [
          { name: '⏱️ Uptime', value: uptime, inline: true },
          { name: '📡 Ping API', value: `**${ping}ms**`, inline: true },
          { name: '🖥️ Serveurs', value: `**${guildCount}**`, inline: true },
          { name: '💾 Mémoire', value: `${memUsed} MB / ${memTotal} MB`, inline: true },
          { name: '🟢 Node.js', value: nodeVersion, inline: true },
          { name: '📦 discord.js', value: require('discord.js').version, inline: true },
        ])]
      });
    }
  },

];
