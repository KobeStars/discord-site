require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commandModules = [
  require("./src/commands/moderation/moderation"),
  require("./src/commands/economie/economie"),
  require("./src/commands/niveaux/niveaux"),
  require("./src/commands/fun/fun"),
  require("./src/commands/sondages/sondages"),
  require("./src/commands/musique/musique"),
];

const commands = [];
for (const module of commandModules) {
  for (const cmd of module) {
    commands.push(cmd.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`📡 Déploiement de ${commands.length} commandes slash...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commandes déployées avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors du déploiement :", err);
  }
})();
