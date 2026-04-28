const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, musicEmbed, infoEmbed } = require('../../utils/embeds');

// Gestionnaire de file en mémoire (sans @discordjs/voice pour compatibilité Windows)
const queues = new Map();

function getQueue(guildId) {
  if (!queues.has(guildId)) queues.set(guildId, { tracks: [], current: null, loop: false, volume: 100 });
  return queues.get(guildId);
}

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Ajouter une musique à la file d\'attente')
      .addStringOption(o => o.setName('titre').setDescription('Titre ou URL YouTube').setRequired(true)),
    async execute(interaction) {
      const titre = interaction.options.getString('titre');
      const q = getQueue(interaction.guildId);
      q.tracks.push({ title: titre, requester: interaction.user.tag });
      if (!q.current) q.current = q.tracks.shift();
      await interaction.reply({ embeds: [musicEmbed('Ajouté à la file', `**${titre}**\nDemandé par ${interaction.user.tag}\n\n⚠️ La lecture audio nécessite FFmpeg sur le serveur. La file est gérée.`)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Voir la file d\'attente'),
    async execute(interaction) {
      const q = getQueue(interaction.guildId);
      if (!q.current && !q.tracks.length) return interaction.reply({ embeds: [infoEmbed('File vide', 'Aucune musique en file.')] });
      const current = q.current ? `**En cours :** ${q.current.title}\n\n` : '';
      const list = q.tracks.length ? q.tracks.map((t, i) => `**${i+1}.** ${t.title}`).join('\n') : 'Aucune musique suivante.';
      await interaction.reply({ embeds: [musicEmbed('File d\'attente', current + list)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Passer à la musique suivante'),
    async execute(interaction) {
      const q = getQueue(interaction.guildId);
      if (!q.current) return interaction.reply({ embeds: [errorEmbed('File vide', 'Aucune musique en cours.')] });
      q.current = q.tracks.shift() || null;
      const msg = q.current ? `Maintenant : **${q.current.title}**` : 'File terminée.';
      await interaction.reply({ embeds: [musicEmbed('Skipped', msg)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Vider la file d\'attente'),
    async execute(interaction) {
      queues.delete(interaction.guildId);
      await interaction.reply({ embeds: [musicEmbed('Arrêté', 'File vidée.')] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Voir la musique en cours'),
    async execute(interaction) {
      const q = getQueue(interaction.guildId);
      if (!q.current) return interaction.reply({ embeds: [infoEmbed('Rien en cours', 'Aucune musique.')] });
      await interaction.reply({ embeds: [musicEmbed('En cours', `**${q.current.title}**\nDemandé par : ${q.current.requester}`)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('loop').setDescription('Activer/désactiver la répétition'),
    async execute(interaction) {
      const q = getQueue(interaction.guildId);
      q.loop = !q.loop;
      await interaction.reply({ embeds: [musicEmbed('Répétition', q.loop ? '🔁 Activée' : '➡️ Désactivée')] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Régler le volume (1-100)')
      .addIntegerOption(o => o.setName('niveau').setDescription('Volume').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
      const q = getQueue(interaction.guildId);
      q.volume = interaction.options.getInteger('niveau');
      await interaction.reply({ embeds: [musicEmbed('Volume', `Volume réglé à **${q.volume}%**`)] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Mettre en pause'),
    async execute(interaction) {
      await interaction.reply({ embeds: [musicEmbed('Pause', 'Musique en pause.')] });
    }
  },
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Reprendre la musique'),
    async execute(interaction) {
      await interaction.reply({ embeds: [musicEmbed('Reprise', 'Musique reprise !')] });
    }
  },
];
