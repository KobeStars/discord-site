// Base de données JSON — aucune compilation requise, fonctionne sur Windows et Railway
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '../data/bot_data.json');

let data = {
  economy: {},
  levels: {},
  warnings: [],
  config: {},
  blacklist: {},
};

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      data = { ...data, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Erreur chargement DB:', e.message);
  }
}

function save() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Erreur sauvegarde DB:', e.message);
  }
}

load();
setInterval(save, 30000);

// ─── ÉCONOMIE ────────────────────────────────────────────────────────────────

function getEconomy(userId, guildId) {
  const key = `${userId}_${guildId}`;
  if (!data.economy[key]) {
    data.economy[key] = { user_id: userId, guild_id: guildId, coins: 0, bank: 0, last_daily: null };
    save();
  }
  return data.economy[key];
}

function addCoins(userId, guildId, amount) {
  const eco = getEconomy(userId, guildId);
  eco.coins += amount;
  save();
}

function removeCoins(userId, guildId, amount) {
  const eco = getEconomy(userId, guildId);
  eco.coins = Math.max(0, eco.coins - amount);
  save();
}

function setLastDaily(userId, guildId) {
  const eco = getEconomy(userId, guildId);
  eco.last_daily = new Date().toISOString();
  save();
}

function getLeaderboardEco(guildId, limit = 10) {
  return Object.values(data.economy)
    .filter(e => e.guild_id === guildId)
    .sort((a, b) => (b.coins + b.bank) - (a.coins + a.bank))
    .slice(0, limit);
}

// ─── NIVEAUX ─────────────────────────────────────────────────────────────────

function getLevel(userId, guildId) {
  const key = `${userId}_${guildId}`;
  if (!data.levels[key]) {
    data.levels[key] = { user_id: userId, guild_id: guildId, xp: 0, level: 1, last_xp: null };
    save();
  }
  return data.levels[key];
}

function addXP(userId, guildId, amount) {
  const lvl = getLevel(userId, guildId);
  lvl.xp += amount;
  lvl.last_xp = new Date().toISOString();
  save();
  return lvl;
}

function setLevel(userId, guildId, level, xp) {
  const lvl = getLevel(userId, guildId);
  lvl.level = level;
  lvl.xp = xp;
  save();
}

function getLeaderboardXP(guildId, limit = 10) {
  return Object.values(data.levels)
    .filter(l => l.guild_id === guildId)
    .sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp))
    .slice(0, limit);
}

function xpNeeded(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ─── AVERTISSEMENTS ──────────────────────────────────────────────────────────

let _warnId = 1;

function addWarning(userId, guildId, modId, reason) {
  data.warnings.push({
    id: _warnId++,
    user_id: userId,
    guild_id: guildId,
    moderator_id: modId,
    reason,
    date: new Date().toISOString(),
  });
  save();
}

function getWarnings(userId, guildId) {
  return data.warnings
    .filter(w => w.user_id === userId && w.guild_id === guildId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function clearWarnings(userId, guildId) {
  data.warnings = data.warnings.filter(w => !(w.user_id === userId && w.guild_id === guildId));
  save();
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

function getConfig(guildId) {
  if (!data.config[guildId]) {
    data.config[guildId] = {
      guild_id: guildId,
      log_channel: null,
      welcome_channel: null,
      welcome_message: null,
      level_channel: null,
      mute_role: null,
    };
    save();
  }
  return data.config[guildId];
}

function setConfig(guildId, key, value) {
  const cfg = getConfig(guildId);
  cfg[key] = value;
  save();
}

// ─── BLACKLIST ────────────────────────────────────────────────────────────────

function isBlacklisted(userId, guildId) {
  return !!data.blacklist[`${userId}_${guildId}`];
}

function addBlacklist(userId, guildId) {
  data.blacklist[`${userId}_${guildId}`] = true;
  save();
}

function removeBlacklist(userId, guildId) {
  delete data.blacklist[`${userId}_${guildId}`];
  save();
}

module.exports = {
  getEconomy, addCoins, removeCoins, setLastDaily, getLeaderboardEco,
  getLevel, addXP, setLevel, getLeaderboardXP, xpNeeded,
  addWarning, getWarnings, clearWarnings,
  getConfig, setConfig,
  isBlacklisted, addBlacklist, removeBlacklist,
};
