const { SlashCommandBuilder } = require('discord.js');
const { musicEmbed, errorEmbed, successEmbed, infoEmbed } = require('../../utils/embeds');
const { musicQueue, play_song, joinAndPlay } = require('../../utils/music');
const play = require('play-dl');

module.exports = [

  // ─── PLAY ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Jouer une musique depuis YouTube')
      .addStringOption(o => o.setName('recherche').setDescription('Titre ou URL YouTube').setRequired(true)),
    async execute(interaction) {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) return interaction.reply({ embeds: [errorEmbed('Pas dans un salon', 'Rejoignez un salon vocal d\'abord.')], ephemeral: true });
      await interaction.deferReply();
      const recherche = interaction.options.getString('recherche');
      try {
        let trackInfo;
        if (play.yt_validate(recherche) === 'video') {
          const info = await play.video_info(recherche);
          trackInfo = { title: info.video_details.title, url: recherche, duration: info.video_details.durationRaw, requester: interaction.user.tag };
        } else {
          const results = await play.search(recherche, { limit: 1 });
          if (!results.length) return interaction.editReply({ embeds: [errorEmbed('Introuvable', 'Aucune musique trouvée.')] });
          const v = results[0];
          trackInfo = { title: v.title, url: v.url, duration: v.durationRaw, requester: interaction.user.tag };
        }
        let q = musicQueue.get(interaction.guildId);
        if (!q) q = musicQueue.create(interaction.guildId, voiceChannel, interaction.channel);
        q.tracks.push(trackInfo);
        if (!q.playing) {
          await joinAndPlay(interaction, interaction.guildId, voiceChannel);
          await interaction.editReply({ embeds: [musicEmbed('Lecture lancée', `**${trackInfo.title}**\nDurée : ${trackInfo.duration}`)] });
        } else {
          await interaction.editReply({ embeds: [musicEmbed('Ajouté à la file', `**${trackInfo.title}** ajouté en position **${q.tracks.length}**.`)] });
        }
      } catch (err) {
        console.error(err);
        await interaction.editReply({ embeds: [errorEmbed('Erreur', 'Impossible de lire cette musique.')] });
      }
    }
  },

  // ─── PAUSE ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Mettre la musique en pause'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q || !q.playing) return interaction.reply({ embeds: [errorEmbed('Aucune musique', 'Rien en cours de lecture.')], ephemeral: true });
      q.player.pause();
      await interaction.reply({ embeds: [musicEmbed('En pause', 'La musique est en pause.')] });
    }
  },

  // ─── RESUME ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Reprendre la musique'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q) return interaction.reply({ embeds: [errorEmbed('Aucune musique', 'Rien en attente.')], ephemeral: true });
      q.player.unpause();
      await interaction.reply({ embeds: [musicEmbed('Reprise', 'La musique reprend !')] });
    }
  },

  // ─── SKIP ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Passer à la musique suivante'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q) return interaction.reply({ embeds: [errorEmbed('Aucune file', 'La file est vide.')], ephemeral: true });
      q.player.stop();
      await interaction.reply({ embeds: [musicEmbed('Skipped', 'Musique suivante !')] });
    }
  },

  // ─── STOP ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Arrêter la musique et vider la file'),
    async execute(interaction) {
      const guildId = interaction.guildId;
      const q = musicQueue.get(guildId);
      if (!q) return interaction.reply({ embeds: [errorEmbed('Aucune musique', 'Rien en cours.')], ephemeral: true });
      musicQueue.delete(guildId);
      await interaction.reply({ embeds: [musicEmbed('Arrêté', 'Musique arrêtée et file vidée.')] });
    }
  },

  // ─── QUEUE ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Voir la file d\'attente'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q || (!q.current && !q.tracks.length)) return interaction.reply({ embeds: [infoEmbed('File vide', 'Aucune musique en file.')] });
      const current = q.current ? `**En cours :** ${q.current.title}\n\n` : '';
      const list = q.tracks.length
        ? q.tracks.map((t, i) => `**${i + 1}.** ${t.title} (${t.duration})`).slice(0, 10).join('\n')
        : 'Aucune musique suivante.';
      await interaction.reply({ embeds: [musicEmbed('File d\'attente', current + list)] });
    }
  },

  // ─── VOLUME ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('volume')
      .setDescription('Régler le volume (1-100)')
      .addIntegerOption(o => o.setName('niveau').setDescription('Volume').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q) return interaction.reply({ embeds: [errorEmbed('Aucune musique', 'Rien en cours.')], ephemeral: true });
      const vol = interaction.options.getInteger('niveau');
      q.volume = vol;
      await interaction.reply({ embeds: [musicEmbed('Volume', `Volume réglé à **${vol}%**`)] });
    }
  },

  // ─── LOOP ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('loop').setDescription('Activer / désactiver la répétition'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q) return interaction.reply({ embeds: [errorEmbed('Aucune musique', 'Rien en cours.')], ephemeral: true });
      q.loop = !q.loop;
      await interaction.reply({ embeds: [musicEmbed('Répétition', q.loop ? '🔁 Répétition activée.' : '➡️ Répétition désactivée.')] });
    }
  },

  // ─── NOWPLAYING ───────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Voir la musique en cours'),
    async execute(interaction) {
      const q = musicQueue.get(interaction.guildId);
      if (!q || !q.current) return interaction.reply({ embeds: [infoEmbed('Rien en cours', 'Aucune musique en lecture.')] });
      await interaction.reply({
        embeds: [musicEmbed('En cours de lecture', `**${q.current.title}**\nDurée : ${q.current.duration}\nDemandé par : ${q.current.requester}\nVolume : ${q.volume}% ${q.loop ? '| 🔁 Répétition' : ''}`,)]
      });
    }
  },
];
