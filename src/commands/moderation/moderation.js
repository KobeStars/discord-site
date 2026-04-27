const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { modEmbed, successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const { addWarning, getWarnings, clearWarnings, getConfig } = require('../../utils/database');

async function sendLog(guild, embed, config) {
  if (!config?.log_channel) return;
  const ch = guild.channels.cache.get(config.log_channel);
  if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}

module.exports = [

  // ─── BAN ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Bannir un membre du serveur')
      .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison du bannissement'))
      .addIntegerOption(o => o.setName('jours').setDescription('Jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const target = interaction.options.getMember('membre');
      const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
      const jours = interaction.options.getInteger('jours') || 0;
      if (!target) return interaction.reply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')], ephemeral: true });
      if (!target.bannable) return interaction.reply({ embeds: [errorEmbed('Impossible', 'Je ne peux pas bannir ce membre.')], ephemeral: true });
      await target.ban({ reason: raison, deleteMessageDays: jours });
      const e = modEmbed('Membre banni', `**${target.user.tag}** a été banni.`, [
        { name: 'Raison', value: raison, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
      ]);
      await interaction.reply({ embeds: [e] });
      await sendLog(interaction.guild, e, getConfig(interaction.guildId));
    }
  },

  // ─── KICK ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Expulser un membre du serveur')
      .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
      const target = interaction.options.getMember('membre');
      const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
      if (!target?.kickable) return interaction.reply({ embeds: [errorEmbed('Impossible', 'Je ne peux pas expulser ce membre.')], ephemeral: true });
      await target.kick(raison);
      const e = modEmbed('Membre expulsé', `**${target.user.tag}** a été expulsé.`, [
        { name: 'Raison', value: raison, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
      ]);
      await interaction.reply({ embeds: [e] });
      await sendLog(interaction.guild, e, getConfig(interaction.guildId));
    }
  },

  // ─── TIMEOUT ──────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Mettre un membre en timeout')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes').setRequired(true).setMinValue(1).setMaxValue(40320))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const target = interaction.options.getMember('membre');
      const minutes = interaction.options.getInteger('minutes');
      const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
      if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
      await target.timeout(minutes * 60 * 1000, raison);
      const e = modEmbed('Timeout appliqué', `**${target.user.tag}** est en timeout pour **${minutes} minute(s)**.`, [
        { name: 'Raison', value: raison, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
      ]);
      await interaction.reply({ embeds: [e] });
      await sendLog(interaction.guild, e, getConfig(interaction.guildId));
    }
  },

  // ─── UNTIMEOUT ────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('untimeout')
      .setDescription('Retirer le timeout d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const target = interaction.options.getMember('membre');
      if (!target) return interaction.reply({ embeds: [errorEmbed('Introuvable', 'Membre introuvable.')], ephemeral: true });
      await target.timeout(null);
      await interaction.reply({ embeds: [successEmbed('Timeout retiré', `Le timeout de **${target.user.tag}** a été retiré.`)] });
    }
  },

  // ─── WARN ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Avertir un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const raison = interaction.options.getString('raison');
      addWarning(target.id, interaction.guildId, interaction.user.id, raison);
      const warns = getWarnings(target.id, interaction.guildId);
      const e = modEmbed('Avertissement émis', `**${target.tag}** a reçu un avertissement.`, [
        { name: 'Raison', value: raison, inline: true },
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Total avertissements', value: `${warns.length}`, inline: true },
      ]);
      await interaction.reply({ embeds: [e] });
      await sendLog(interaction.guild, e, getConfig(interaction.guildId));
    }
  },

  // ─── WARNS ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('warns')
      .setDescription('Voir les avertissements d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const warns = getWarnings(target.id, interaction.guildId);
      if (!warns.length) return interaction.reply({ embeds: [infoEmbed('Aucun avertissement', `**${target.tag}** n'a aucun avertissement.`)] });
      const list = warns.map((w, i) => `**${i + 1}.** ${w.reason} — *<t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>*`).join('\n');
      await interaction.reply({ embeds: [modEmbed(`Avertissements de ${target.tag}`, list, [{ name: 'Total', value: `${warns.length}`, inline: true }])] });
    }
  },

  // ─── CLEARWARNS ───────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('clearwarns')
      .setDescription('Supprimer tous les avertissements d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      clearWarnings(target.id, interaction.guildId);
      await interaction.reply({ embeds: [successEmbed('Avertissements effacés', `Tous les avertissements de **${target.tag}** ont été supprimés.`)] });
    }
  },

  // ─── CLEAR ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Supprimer des messages dans le salon')
      .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
      .addUserOption(o => o.setName('membre').setDescription('Filtrer par membre'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
      const nombre = interaction.options.getInteger('nombre');
      const membre = interaction.options.getUser('membre');
      await interaction.deferReply({ ephemeral: true });
      let messages = await interaction.channel.messages.fetch({ limit: 100 });
      if (membre) messages = messages.filter(m => m.author.id === membre.id);
      const toDelete = [...messages.values()].slice(0, nombre);
      const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);
      await interaction.editReply({ embeds: [successEmbed('Messages supprimés', `**${deleted?.size || 0}** message(s) supprimé(s).`)] });
    }
  },

  // ─── LOCK / UNLOCK ────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Verrouiller le salon actuel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ embeds: [modEmbed('Salon verrouillé', `${interaction.channel} est maintenant verrouillé.`)] });
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('unlock')
      .setDescription('Déverrouiller le salon actuel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply({ embeds: [successEmbed('Salon déverrouillé', `${interaction.channel} est maintenant accessible.`)] });
    }
  },

  // ─── SLOWMODE ─────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Activer le mode lent dans ce salon')
      .addIntegerOption(o => o.setName('secondes').setDescription('0 = désactiver, max 21600').setRequired(true).setMinValue(0).setMaxValue(21600))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      const sec = interaction.options.getInteger('secondes');
      await interaction.channel.setRateLimitPerUser(sec);
      const msg = sec === 0 ? 'Mode lent désactivé.' : `Mode lent réglé à **${sec}s** par message.`;
      await interaction.reply({ embeds: [successEmbed('Mode lent', msg)] });
    }
  },

  // ─── UNBAN ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Débannir un utilisateur par son ID')
      .addStringOption(o => o.setName('id').setDescription('ID de l\'utilisateur').setRequired(true))
      .addStringOption(o => o.setName('raison').setDescription('Raison'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const id = interaction.options.getString('id');
      const raison = interaction.options.getString('raison') || 'Aucune raison';
      try {
        await interaction.guild.members.unban(id, raison);
        await interaction.reply({ embeds: [successEmbed('Débannissement', `L'utilisateur \`${id}\` a été débanni.`)] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('Erreur', 'Utilisateur introuvable dans la liste des bans.')], ephemeral: true });
      }
    }
  },

  // ─── SETLOGS ──────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('setlogs')
      .setDescription('Définir le salon pour les logs de modération')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de logs').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const ch = interaction.options.getChannel('salon');
      const { setConfig } = require('../../utils/database');
      setConfig(interaction.guildId, 'log_channel', ch.id);
      await interaction.reply({ embeds: [successEmbed('Logs configurés', `Les logs seront envoyés dans ${ch}.`)] });
    }
  },

];
