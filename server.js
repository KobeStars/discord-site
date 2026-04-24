require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));

const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

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
    res.status(500).json({ error: err.message });
  }
});

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
    res.status(500).json({ error: err.message });
  }
});

client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 API lancée sur le port ${PORT}`);
  });
});

client.login(process.env.BOT_TOKEN);
