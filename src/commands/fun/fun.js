const { SlashCommandBuilder } = require('discord.js');
const { funEmbed, infoEmbed } = require('../../utils/embeds');

const blagues = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau !',
  'Un homme entre dans une bibliothèque et demande : "Vous avez des livres sur la paranoïa ?" La bibliothécaire répond : "Ils sont juste derrière vous !"',
  'Qu\'est-ce qu\'un crocodile qui surveille la cour d\'école ? Un sac à dents !',
  'Pourquoi les robots n\'ont-ils pas peur ? Parce qu\'ils ont des nerfs d\'acier !',
  'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël !',
  'Pourquoi les canards ont-ils des plumes ? Pour couvrir leur derrière de canard !',
  'Qu\'est-ce qu\'un avocat sous la mer ? Maître Gims !',
];

const citations = [
  '"La vie, c\'est comme une bicyclette, il faut avancer pour ne pas perdre l\'équilibre." — Einstein',
  '"Le seul moyen de faire du bon travail est d\'aimer ce qu\'on fait." — Steve Jobs',
  '"Tu rates 100% des tirs que tu ne tentes pas." — Wayne Gretzky',
  '"La créativité, c\'est l\'intelligence qui s\'amuse." — Einstein',
  '"Sois le changement que tu veux voir dans le monde." — Gandhi',
  '"Le succès, c\'est aller d\'échecs en échecs sans perdre son enthousiasme." — Churchill',
];

const eightBallResponses = [
  '✅ Absolument !', '✅ C\'est certain.', '✅ Sans aucun doute.', '✅ Oui, bien sûr.',
  '⚠️ C\'est pas clair...', '⚠️ Demandez plus tard.', '⚠️ Difficile à dire.',
  '❌ Non.', '❌ Mes sources disent non.', '❌ Absolument pas.', '❌ Très improbable.',
];

module.exports = [

  // ─── BLAGUE ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('blague').setDescription('Afficher une blague aléatoire'),
    async execute(interaction) {
      const blague = blagues[Math.floor(Math.random() * blagues.length)];
      await interaction.reply({ embeds: [funEmbed('Blague du jour', blague)] });
    }
  },

  // ─── COINFLIP ─────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('coinflip').setDescription('Lancer une pièce'),
    async execute(interaction) {
      const result = Math.random() < 0.5 ? '🪙 Pile !' : '🪙 Face !';
      await interaction.reply({ embeds: [funEmbed('Lancer de pièce', result)] });
    }
  },

  // ─── DÉS ──────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('des')
      .setDescription('Lancer des dés (ex: 2d6)')
      .addStringOption(o => o.setName('formule').setDescription('Formule (ex: 2d6, 1d20)').setRequired(true)),
    async execute(interaction) {
      const formule = interaction.options.getString('formule').toLowerCase();
      const match = formule.match(/^(\d+)d(\d+)$/);
      if (!match) return interaction.reply({ content: '❌ Format invalide. Utilise par exemple `2d6` ou `1d20`.', ephemeral: true });
      const nb = Math.min(parseInt(match[1]), 20);
      const faces = Math.min(parseInt(match[2]), 1000);
      const results = Array.from({ length: nb }, () => Math.floor(Math.random() * faces) + 1);
      const total = results.reduce((a, b) => a + b, 0);
      await interaction.reply({
        embeds: [funEmbed(`Lancer de ${nb}d${faces}`, `🎲 Résultats : **${results.join(', ')}**\nTotal : **${total}**`)]
      });
    }
  },

  // ─── 8BALL ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('8ball')
      .setDescription('La boule magique répond à vos questions')
      .addStringOption(o => o.setName('question').setDescription('Votre question').setRequired(true)),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
      await interaction.reply({
        embeds: [funEmbed('🎱 Boule magique', `**Question :** ${question}\n**Réponse :** ${response}`)]
      });
    }
  },

  // ─── PIERRE FEUILLE CISEAUX ───────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('rps')
      .setDescription('Jouer à pierre-feuille-ciseaux')
      .addStringOption(o => o.setName('choix').setDescription('Votre choix').setRequired(true)
        .addChoices(
          { name: 'Pierre', value: 'pierre' },
          { name: 'Feuille', value: 'feuille' },
          { name: 'Ciseaux', value: 'ciseaux' },
        )),
    async execute(interaction) {
      const choix = interaction.options.getString('choix');
      const options = ['pierre', 'feuille', 'ciseaux'];
      const emoji = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' };
      const bot = options[Math.floor(Math.random() * options.length)];
      let result;
      if (choix === bot) result = '🤝 Égalité !';
      else if ((choix === 'pierre' && bot === 'ciseaux') || (choix === 'feuille' && bot === 'pierre') || (choix === 'ciseaux' && bot === 'feuille')) result = '🎉 Vous avez gagné !';
      else result = '😢 Vous avez perdu !';
      await interaction.reply({
        embeds: [funEmbed('Pierre-Feuille-Ciseaux', `Vous : ${emoji[choix]} **${choix}**\nMoi : ${emoji[bot]} **${bot}**\n\n${result}`)]
      });
    }
  },

  // ─── CITATION ─────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName('citation').setDescription('Afficher une citation inspirante'),
    async execute(interaction) {
      const c = citations[Math.floor(Math.random() * citations.length)];
      await interaction.reply({ embeds: [funEmbed('Citation', c)] });
    }
  },

  // ─── AVATAR ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Afficher l\'avatar d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre')),
    async execute(interaction) {
      const target = interaction.options.getUser('membre') || interaction.user;
      const { EmbedBuilder } = require('discord.js');
      const e = new EmbedBuilder()
        .setTitle(`Avatar de ${target.username}`)
        .setImage(target.displayAvatarURL({ size: 512 }))
        .setColor(0x378ADD);
      await interaction.reply({ embeds: [e] });
    }
  },

  // ─── PROFIL ───────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('profil')
      .setDescription('Voir le profil d\'un membre')
      .addUserOption(o => o.setName('membre').setDescription('Membre')),
    async execute(interaction) {
      const target = interaction.options.getMember('membre') || interaction.member;
      const roles = target.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(', ') || 'Aucun';
      const { EmbedBuilder } = require('discord.js');
      const e = new EmbedBuilder()
        .setTitle(`Profil de ${target.user.username}`)
        .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
        .setColor(0x7F77DD)
        .addFields(
          { name: '📅 Membre depuis', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '📅 Compte créé', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: `🎭 Rôles (${target.roles.cache.size - 1})`, value: roles.length > 1000 ? roles.substring(0, 997) + '...' : roles },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [e] });
    }
  },

  // ─── MEME ─────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('meme')
      .setDescription('Afficher un meme aléatoire'),
    async execute(interaction) {
      await interaction.deferReply();
      try {
        const res = await fetch('https://meme-api.com/gimme');
        if (!res.ok) throw new Error('API indisponible');
        const data = await res.json();
        const { EmbedBuilder } = require('discord.js');
        const e = new EmbedBuilder()
          .setTitle(data.title || 'Meme du jour')
          .setURL(data.postLink || null)
          .setImage(data.url)
          .setColor(0xD4537E)
          .setFooter({ text: `👍 ${data.ups || 0} • r/${data.subreddit || 'memes'}` })
          .setTimestamp();
        await interaction.editReply({ embeds: [e] });
      } catch {
        const { errorEmbed } = require('../../utils/embeds');
        await interaction.editReply({ embeds: [errorEmbed('Erreur', 'Impossible de récupérer un meme. Réessaie plus tard.')] });
      }
    }
  },

  // ─── LOVEMETRE ────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('lovemetre')
      .setDescription('Calcule la compatibilité entre deux membres')
      .addUserOption(o => o.setName('membre1').setDescription('Premier membre').setRequired(true))
      .addUserOption(o => o.setName('membre2').setDescription('Deuxième membre').setRequired(true)),
    async execute(interaction) {
      const u1 = interaction.options.getUser('membre1');
      const u2 = interaction.options.getUser('membre2');
      // Score fixe basé sur les IDs (reproductible)
      const combined = BigInt(u1.id) + BigInt(u2.id);
      const score = Number(combined % 101n);
      const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
      let label;
      if (score >= 90) label = '💞 Âmes sœurs !';
      else if (score >= 70) label = '❤️ Très compatible !';
      else if (score >= 50) label = '💛 Compatible';
      else if (score >= 30) label = '🤝 Amis avant tout';
      else label = '💔 Pas vraiment...';
      await interaction.reply({
        embeds: [funEmbed('Love Mètre 💘', `${u1} ❤️ ${u2}`, [
          { name: 'Compatibilité', value: `\`[${bar}]\` **${score}%**`, inline: false },
          { name: 'Verdict', value: label, inline: false },
        ])]
      });
    }
  },

  // ─── ASCII ────────────────────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('ascii')
      .setDescription('Convertir du texte en art ASCII simple')
      .addStringOption(o => o.setName('texte').setDescription('Texte à convertir (max 10 caractères)').setRequired(true)),
    async execute(interaction) {
      const texte = interaction.options.getString('texte').toUpperCase().substring(0, 10);
      // Fonte ASCII 5 lignes (lettres majuscules + espace)
      const font = {
        'A': [' ██ ', '█  █', '████', '█  █', '█  █'],
        'B': ['███ ', '█  █', '███ ', '█  █', '███ '],
        'C': [' ███', '█   ', '█   ', '█   ', ' ███'],
        'D': ['███ ', '█  █', '█  █', '█  █', '███ '],
        'E': ['████', '█   ', '███ ', '█   ', '████'],
        'F': ['████', '█   ', '███ ', '█   ', '█   '],
        'G': [' ███', '█   ', '█ ██', '█  █', ' ███'],
        'H': ['█  █', '█  █', '████', '█  █', '█  █'],
        'I': ['███', ' █ ', ' █ ', ' █ ', '███'],
        'J': ['  █', '  █', '  █', '█ █', ' █ '],
        'K': ['█  █', '█ █ ', '██  ', '█ █ ', '█  █'],
        'L': ['█   ', '█   ', '█   ', '█   ', '████'],
        'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
        'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
        'O': [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
        'P': ['███ ', '█  █', '███ ', '█   ', '█   '],
        'Q': [' ██ ', '█  █', '█  █', '█ ██', ' ███'],
        'R': ['███ ', '█  █', '███ ', '█ █ ', '█  █'],
        'S': [' ███', '█   ', ' ██ ', '   █', '███ '],
        'T': ['████', ' █  ', ' █  ', ' █  ', ' █  '],
        'U': ['█  █', '█  █', '█  █', '█  █', ' ██ '],
        'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
        'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
        'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
        'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
        'Z': ['████', '  █ ', ' █  ', '█   ', '████'],
        ' ': ['  ', '  ', '  ', '  ', '  '],
        '0': [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
        '1': [' █ ', '██ ', ' █ ', ' █ ', '███'],
        '2': [' ██ ', '   █', ' ██ ', '█   ', '████'],
        '3': ['███ ', '   █', ' ██ ', '   █', '███ '],
        '!': ['█', '█', '█', ' ', '█'],
        '?': [' ██ ', '   █', ' ██ ', '    ', '  █ '],
      };
      const lines = ['', '', '', '', ''];
      for (const char of texte) {
        const glyph = font[char] || font[' '];
        for (let i = 0; i < 5; i++) {
          lines[i] += (glyph[i] || '  ') + ' ';
        }
      }
      const result = lines.join('\n');
      if (result.length > 1900) {
        return interaction.reply({ embeds: [require('../../utils/embeds').errorEmbed('Trop long', 'Le texte généré est trop grand. Réduis le nombre de caractères.')], ephemeral: true });
      }
      await interaction.reply({ embeds: [funEmbed('Art ASCII', `\`\`\`\n${result}\n\`\`\``)] });
    }
  },

];
