require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "https://nexushubbyank-six.vercel.app",
  }),
);

const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  console.log(`📡 API lancée sur http://localhost:3000`);
});

// ── Infos du serveur ──────────────────────────────
app.get("/api/server", async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.fetch(); // pour avoir approximatePresenceCount

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

// ── Membres en ligne ──────────────────────────────
app.get("/api/members", async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const members = await guild.members.fetch({ withPresences: true });

    const list = members
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

// ── Démarrage ─────────────────────────────────────
app.listen(process.env.PORT || 4223);
client.login(process.env.BOT_TOKEN);
