require("dotenv").config();
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");

// ─── EXPRESS APP ────────────────────────────────────────────────────────────
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── CLIENT DISCORD ─────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});

client.commands = new Collection();

// ─── CHARGEMENT DES COMMANDES ───────────────────────────────────────────────
const commandModules = [
  require("./src/commands/moderation/moderation"),
  require("./src/commands/economie/economie"),
  require("./src/commands/niveaux/niveaux"),
  require("./src/commands/fun/fun"),
  require("./src/commands/sondages/sondages"),
  require("./src/commands/musique/musique"),
];

for (const module of commandModules) {
  for (const command of module) {
    client.commands.set(command.data.name, command);
  }
}

// ─── CHARGEMENT DES EVENTS ──────────────────────────────────────────────────
const events = require("./src/events/events");
for (const event of events) {
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// ─── ROUTES API EXPRESS (inchangées) ────────────────────────────────────────
const GUILD_ID = process.env.GUILD_ID;

app.get("/api/server", async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.fetch();
    res.json({
      name: guild.name,
      description: guild.description || "",
      icon: guild.icon,
      member_count: guild.memberCount,
      approximate_presence_count: guild.approximatePresenceCount,
      channels: guild.channels.cache.size,
    });
  } catch (err) {
    console.error("Erreur /api/server :", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/members", async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch({ withPresences: true });
    const list = [...members.values()]
      .filter((m) => !m.user.bot)
      .map((m) => ({
        id: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar,
        status: m.presence?.status ?? "offline",
        topRole:
          m.roles.highest.name !== "@everyone" ? m.roles.highest.name : null,
      }))
      .slice(0, 20);
    res.json(list);
  } catch (err) {
    console.error("Erreur /api/members :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DÉMARRAGE ──────────────────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  console.log(`🤖 ${client.commands.size} commandes slash chargées`);

  client.user.setActivity("le serveur 👀", { type: 3 });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 API Express lancée sur le port ${PORT}`);
  });
});

client.login(process.env.BOT_TOKEN);
