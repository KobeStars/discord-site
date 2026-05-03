const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ecoEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');
const { getEconomy, addCoins, removeCoins, setLastDaily, getLeaderboardEco, formatNumber } = require('../../utils/database');
const { formatNumber: fmt } = require('../../utils/embeds');

const DAILY_AMOUNT = 200;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

module.exports = [

  // ─── SOLDE ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('solde')
      .setDescription('Voir votre solde ou celui d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre')),
    async execute(interaction) {
      const target = interaction.options.getUser('membre') || interaction.user;
      const eco = getEconomy(target.id, interaction.guildId);
      await interaction.reply({
        embeds: [ecoEmbed(`Solde de ${target.username}`, `💵 Portefeuille : **${eco.coins.toLocaleString('fr-FR')} pièces**\n🏦 Banque : **${eco.bank.toLocaleString('fr-FR')} pièces**\n\n💎 Total : **${(eco.coins + eco.bank).toLocaleString('fr-FR')} pièces**`)]
      });
    }
  },

  // ─── DAILY ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('daily')
      .setDescription('Réclamer votre récompense quotidienne'),
    async execute(interaction) {
      const eco = getEconomy(interaction.user.id, interaction.guildId);
      if (eco.last_daily) {
        const elapsed = Date.now() - new Date(eco.last_daily).getTime();
        if (elapsed < DAILY_COOLDOWN) {
          const remaining = DAILY_COOLDOWN - elapsed;
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          return interaction.reply({ embeds: [errorEmbed('Daily déjà réclamé', `Revenez dans **${h}h ${m}m**.`)], ephemeral: true });
        }
      }
      addCoins(interaction.user.id, interaction.guildId, DAILY_AMOUNT);
      setLastDaily(interaction.user.id, interaction.guildId);
      const newEco = getEconomy(interaction.user.id, interaction.guildId);
      await interaction.reply({
        embeds: [ecoEmbed('Daily réclamé !', `Vous avez reçu **${DAILY_AMOUNT.toLocaleString('fr-FR')} pièces** !\n💵 Nouveau solde : **${newEco.coins.toLocaleString('fr-FR')} pièces**`)]
      });
    }
  },

  // ─── PAYER ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('payer')
      .setDescription('Envoyer des pièces à un membre')
      .addUserOption(o => o.setName('membre').setDescription('Destinataire').setRequired(true))
      .addIntegerOption(o => o.setName('montant').setDescription('Montant').setRequired(true).setMinValue(1)),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const amount = interaction.options.getInteger('montant');
      if (target.id === interaction.user.id) return interaction.reply({ embeds: [errorEmbed('Erreur', 'Vous ne pouvez pas vous payer vous-même.')], ephemeral: true });
      const senderEco = getEconomy(interaction.user.id, interaction.guildId);
      if (senderEco.coins < amount) return interaction.reply({ embeds: [errorEmbed('Fonds insuffisants', `Vous n'avez que **${senderEco.coins.toLocaleString('fr-FR')} pièces**.`)], ephemeral: true });
      removeCoins(interaction.user.id, interaction.guildId, amount);
      addCoins(target.id, interaction.guildId, amount);
      await interaction.reply({
        embeds: [ecoEmbed('Transfert effectué', `**${amount.toLocaleString('fr-FR')} pièces** envoyées à **${target.username}**.`)]
      });
    }
  },

  // ─── TRAVAIL ──────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('travail')
      .setDescription('Travailler pour gagner des pièces (cooldown 1h)'),
    async execute(interaction) {
      const eco = getEconomy(interaction.user.id, interaction.guildId);
      // On réutilise last_daily pour le cooldown travail avec une clé séparée
      // Pour simplifier, on stocke dans le champ last_daily un objet JSON
      const WORK_COOLDOWN = 60 * 60 * 1000;
      const cacheKey = `work_${interaction.user.id}_${interaction.guildId}`;
      const lastWork = interaction.client._workCache?.get(cacheKey);
      if (lastWork && Date.now() - lastWork < WORK_COOLDOWN) {
        const rem = WORK_COOLDOWN - (Date.now() - lastWork);
        const m = Math.ceil(rem / 60000);
        return interaction.reply({ embeds: [errorEmbed('Trop fatigué', `Reposez-vous encore **${m} minute(s)**.`)], ephemeral: true });
      }
      if (!interaction.client._workCache) interaction.client._workCache = new Map();
      interaction.client._workCache.set(cacheKey, Date.now());
      const jobs = ['développeur', 'cuisinier', 'charpentier', 'médecin', 'chauffeur', 'jardinier', 'enseignant'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * 150) + 50;
      addCoins(interaction.user.id, interaction.guildId, earned);
      await interaction.reply({
        embeds: [ecoEmbed('Travail effectué', `En tant que **${job}**, vous avez gagné **${earned} pièces** ! 💼`)]
      });
    }
  },

  // ─── SLOT ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('slot')
      .setDescription('Jouer aux machines à sous')
      .addIntegerOption(o => o.setName('mise').setDescription('Montant à miser').setRequired(true).setMinValue(10)),
    async execute(interaction) {
      const mise = interaction.options.getInteger('mise');
      const eco = getEconomy(interaction.user.id, interaction.guildId);
      if (eco.coins < mise) return interaction.reply({ embeds: [errorEmbed('Fonds insuffisants', `Vous n'avez que **${eco.coins.toLocaleString('fr-FR')} pièces**.`)], ephemeral: true });
      const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
      const s1 = symbols[Math.floor(Math.random() * symbols.length)];
      const s2 = symbols[Math.floor(Math.random() * symbols.length)];
      const s3 = symbols[Math.floor(Math.random() * symbols.length)];
      let gain = 0;
      let result = '';
      if (s1 === s2 && s2 === s3) {
        gain = s1 === '💎' ? mise * 10 : mise * 3;
        result = `**JACKPOT !** Vous gagnez **${gain.toLocaleString('fr-FR')} pièces** ! 🎉`;
        addCoins(interaction.user.id, interaction.guildId, gain);
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        gain = Math.floor(mise * 1.5);
        result = `Deux symboles identiques ! Vous gagnez **${gain.toLocaleString('fr-FR')} pièces** !`;
        addCoins(interaction.user.id, interaction.guildId, gain);
      } else {
        result = `Vous perdez **${mise.toLocaleString('fr-FR')} pièces**. 😢`;
        removeCoins(interaction.user.id, interaction.guildId, mise);
      }
      await interaction.reply({
        embeds: [ecoEmbed('Machine à sous', `[ ${s1} | ${s2} | ${s3} ]\n\n${result}`)]
      });
    }
  },

  // ─── CLASSEMENT ÉCO ───────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('richesse')
      .setDescription('Top 10 des membres les plus riches'),
    async execute(interaction) {
      const top = getLeaderboardEco(interaction.guildId);
      if (!top.length) return interaction.reply({ embeds: [errorEmbed('Vide', 'Aucune donnée disponible.')], ephemeral: true });
      const medals = ['🥇', '🥈', '🥉'];
      const list = top.map((r, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${r.user_id}> — **${(r.coins + r.bank).toLocaleString('fr-FR')} pièces**`;
      }).join('\n');
      await interaction.reply({ embeds: [ecoEmbed('Classement des richesses', list)] });
    }
  },

  // ─── ADD COINS (ADMIN) ────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('addcoins')
      .setDescription('Ajouter des pièces à un membre (admin)')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addIntegerOption(o => o.setName('montant').setDescription('Montant').setRequired(true).setMinValue(1))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const amount = interaction.options.getInteger('montant');
      addCoins(target.id, interaction.guildId, amount);
      await interaction.reply({ embeds: [successEmbed('Pièces ajoutées', `**${amount.toLocaleString('fr-FR')} pièces** ajoutées à **${target.username}**.`)] });
    }
  },

  // ─── REMOVE COINS (ADMIN) ─────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('removecoins')
      .setDescription('Retirer des pièces à un membre (admin)')
      .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
      .addIntegerOption(o => o.setName('montant').setDescription('Montant').setRequired(true).setMinValue(1))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
      const target = interaction.options.getUser('membre');
      const amount = interaction.options.getInteger('montant');
      removeCoins(target.id, interaction.guildId, amount);
      await interaction.reply({ embeds: [successEmbed('Pièces retirées', `**${amount.toLocaleString('fr-FR')} pièces** retirées à **${target.username}**.`)] });
    }
  },
];
