const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = [

  // ─── SONDAGE ──────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('sondage')
      .setDescription('Créer un sondage oui/non')
      .addStringOption(o => o.setName('question').setDescription('La question du sondage').setRequired(true))
      .addChannelOption(o => o.setName('salon').setDescription('Salon où envoyer le sondage (défaut: ici)')),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const salon = interaction.options.getChannel('salon') || interaction.channel;
      const e = new EmbedBuilder()
        .setTitle('📊 Sondage')
        .setDescription(`**${question}**`)
        .setColor(0x378ADD)
        .setFooter({ text: `Sondage lancé par ${interaction.user.tag}` })
        .setTimestamp();
      const msg = await salon.send({ embeds: [e] });
      await msg.react('✅');
      await msg.react('❌');
      await interaction.reply({ embeds: [successEmbed('Sondage créé', `Sondage envoyé dans ${salon}.`)], ephemeral: true });
    }
  },

  // ─── CHOIX ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('choix')
      .setDescription('Sondage à choix multiples (2 à 4 options)')
      .addStringOption(o => o.setName('question').setDescription('La question').setRequired(true))
      .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
      .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
      .addStringOption(o => o.setName('option3').setDescription('Option 3'))
      .addStringOption(o => o.setName('option4').setDescription('Option 4')),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
      const options = [
        interaction.options.getString('option1'),
        interaction.options.getString('option2'),
        interaction.options.getString('option3'),
        interaction.options.getString('option4'),
      ].filter(Boolean);
      const desc = options.map((o, i) => `${emojis[i]} ${o}`).join('\n\n');
      const e = new EmbedBuilder()
        .setTitle('📊 ' + question)
        .setDescription(desc)
        .setColor(0x378ADD)
        .setFooter({ text: `Sondage lancé par ${interaction.user.tag}` })
        .setTimestamp();
      const msg = await interaction.channel.send({ embeds: [e] });
      for (let i = 0; i < options.length; i++) await msg.react(emojis[i]);
      await interaction.reply({ embeds: [successEmbed('Sondage créé', 'Sondage à choix multiples envoyé !')], ephemeral: true });
    }
  },

  // ─── GIVEAWAY ─────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('giveaway')
      .setDescription('Lancer un giveaway')
      .addStringOption(o => o.setName('lot').setDescription('Ce qu\'on gagne').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes').setRequired(true).setMinValue(1).setMaxValue(10080))
      .addIntegerOption(o => o.setName('gagnants').setDescription('Nombre de gagnants').setMinValue(1).setMaxValue(10))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const lot = interaction.options.getString('lot');
      const minutes = interaction.options.getInteger('minutes');
      const nbGagnants = interaction.options.getInteger('gagnants') || 1;
      const endTime = Math.floor((Date.now() + minutes * 60 * 1000) / 1000);

      const e = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**${lot}**\n\nRéagissez avec 🎉 pour participer !\n\nTermine : <t:${endTime}:R>\nGagnant(s) : **${nbGagnants}**`)
        .setColor(0xD4537E)
        .setFooter({ text: `Lancé par ${interaction.user.tag}` })
        .setTimestamp(new Date(endTime * 1000));

      const msg = await interaction.channel.send({ embeds: [e] });
      await msg.react('🎉');
      await interaction.reply({ embeds: [successEmbed('Giveaway lancé !', `Se termine <t:${endTime}:R> dans ce salon.`)], ephemeral: true });

      setTimeout(async () => {
        try {
          const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
          const reaction = fetchedMsg.reactions.cache.get('🎉');
          const users = await reaction.users.fetch();
          const participants = users.filter(u => !u.bot);
          if (participants.size === 0) {
            return interaction.channel.send({ embeds: [errorEmbed('Giveaway terminé', 'Aucun participant. Pas de gagnant.')] });
          }
          const participantArr = [...participants.values()];
          const winners = [];
          for (let i = 0; i < Math.min(nbGagnants, participantArr.length); i++) {
            const idx = Math.floor(Math.random() * participantArr.length);
            winners.push(participantArr.splice(idx, 1)[0]);
          }
          const winnerMentions = winners.map(w => w.toString()).join(', ');
          await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle('🎉 Giveaway terminé !').setDescription(`Félicitations ${winnerMentions} !\nVous avez gagné **${lot}** !`).setColor(0x1D9E75)] });
        } catch (err) {
          console.error('Erreur giveaway:', err);
        }
      }, minutes * 60 * 1000);
    }
  },

  // ─── INFO SERVEUR ─────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('info')
      .setDescription('Informations sur le serveur'),
    async execute(interaction) {
      const guild = interaction.guild;
      await guild.members.fetch();
      const bots = guild.members.cache.filter(m => m.user.bot).size;
      const humans = guild.memberCount - bots;
      const e = new EmbedBuilder()
        .setTitle(`📋 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .setColor(0x7F77DD)
        .addFields(
          { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '👥 Membres', value: `${humans} humains • ${bots} bots`, inline: true },
          { name: '📁 Salons', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [e] });
    }
  },

  // ─── AIDE ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('aide')
      .setDescription('Afficher toutes les commandes disponibles'),
    async execute(interaction) {
      const e = new EmbedBuilder()
        .setTitle('📖 Aide — Toutes les commandes')
        .setColor(0x7F77DD)
        .addFields(
          { name: '🔨 Modération', value: '`/ban` `/kick` `/timeout` `/warn` `/warns` `/clearwarns` `/clear` `/lock` `/unlock` `/slowmode` `/unban` `/setlogs`' },
          { name: '💰 Économie', value: '`/solde` `/daily` `/payer` `/travail` `/slot` `/richesse` `/addcoins` `/removecoins`' },
          { name: '⭐ Niveaux', value: '`/niveau` `/classement` `/donnerxp` `/resetxp`' },
          { name: '🎵 Musique', value: '`/play` `/pause` `/resume` `/skip` `/stop` `/queue` `/volume` `/loop` `/nowplaying`' },
          { name: '🎲 Fun', value: '`/blague` `/coinflip` `/des` `/8ball` `/rps` `/citation` `/avatar` `/profil`' },
          { name: '📊 Sondages', value: '`/sondage` `/choix` `/giveaway` `/info`' },
        )
        .setFooter({ text: 'Utilisez / pour voir toutes les commandes' })
        .setTimestamp();
      await interaction.reply({ embeds: [e] });
    }
  },

  // ─── PING ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Vérifier la latence du bot'),
    async execute(interaction) {
      const sent = await interaction.reply({ content: 'Calcul en cours...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);
      await interaction.editReply({
        content: null,
        embeds: [infoEmbed('Pong !', `🏓 Latence : **${latency}ms**\n💡 API Discord : **${apiLatency}ms**`)]
      });
    }
  },
];
