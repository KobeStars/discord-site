const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { infoEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const { getLevel, addXP, setLevel, getLeaderboardXP, xpNeeded } = require('../../utils/database');

module.exports = [

  // ─── NIVEAU ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('niveau')
      .setDescription('Voir votre niveau et votre XP')
      .addUserOption(o => o.setName('membre').setDescription('Membre')),
    async execute(interaction) {
      const target = interaction.options.getUser('membre') || interaction.user;
      const data = getLevel(target.id, interaction.guildId);
      const needed = xpNeeded(data.level);
      const barLength = 20;
      const filled = Math.round((data.xp / needed) * barLength);
      const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
      await interaction.reply({
        embeds: [infoEmbed(`Niveau de ${target.username}`,
          `⭐ Niveau **${data.level}**\n\n\`${bar}\`\n${data.xp} / ${needed} XP`,
        )]
      });
    }
  },

  // ─── CLASSEMENT XP ────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('classement')
      .setDescription('Top 10 des membres les plus actifs'),
    async execute(interaction) {
      const top = getLeaderboardXP(interaction.guildId);
      if (!top.length) return interaction.reply({ embeds: [errorEmbed('Vide', 'Aucune donnée disponible.')], ephemeral: true });
      const medals = ['🥇', '🥈', '🥉'];
      const list = top.map((r, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${r.user_id}> — Niveau **${r.level}** (${r.xp} XP)`;
      }).join('\n');
      await interaction.reply({ embeds: [infoEmbed('Classement d\'activité', list)] });
    }
  },

  // ─── DONNERXP (ADMIN) ─────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('donnerxp')
      .setDescription('Donner de l\'XP à un membre (admin)')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addIntegerOption(o => o.setName('quantite').setDescription('Quantité d\'XP').setRequired(true).setMinValue(1))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const amount = interaction.options.getInteger('quantite');
      const data = addXP(target.id, interaction.guildId, amount);
      const needed = xpNeeded(data.level);
      if (data.xp >= needed) {
        setLevel(target.id, interaction.guildId, data.level + 1, 0);
      }
      await interaction.reply({ embeds: [successEmbed('XP ajouté', `**${amount} XP** ajoutés à **${target.username}**. (Niveau ${data.level})`)] });
    }
  },

  // ─── RESETXP (ADMIN) ──────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('resetxp')
      .setDescription('Remettre l\'XP d\'un membre à zéro')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      setLevel(target.id, interaction.guildId, 1, 0);
      await interaction.reply({ embeds: [successEmbed('XP réinitialisé', `L\'XP de **${target.username}** a été remis à zéro.`)] });
    }
  },
];
