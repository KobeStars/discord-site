const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/bot.db'));

// Initialisation des tables
db.exec(`
  CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    coins INTEGER DEFAULT 0,
    bank INTEGER DEFAULT 0,
    last_daily TEXT DEFAULT NULL,
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS levels (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_xp TEXT DEFAULT NULL,
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS config (
    guild_id TEXT PRIMARY KEY,
    log_channel TEXT DEFAULT NULL,
    welcome_channel TEXT DEFAULT NULL,
    welcome_message TEXT DEFAULT NULL,
    level_channel TEXT DEFAULT NULL,
    mute_role TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS blacklist (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    PRIMARY KEY (user_id, guild_id)
  );
`);

// ─── ÉCONOMIE ───────────────────────────────────────────────────────────────

function getEconomy(userId, guildId) {
  let row = db.prepare('SELECT * FROM economy WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  if (!row) {
    db.prepare('INSERT INTO economy (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
    row = db.prepare('SELECT * FROM economy WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  }
  return row;
}

function addCoins(userId, guildId, amount) {
  getEconomy(userId, guildId);
  db.prepare('UPDATE economy SET coins = coins + ? WHERE user_id = ? AND guild_id = ?').run(amount, userId, guildId);
}

function removeCoins(userId, guildId, amount) {
  getEconomy(userId, guildId);
  db.prepare('UPDATE economy SET coins = MAX(0, coins - ?) WHERE user_id = ? AND guild_id = ?').run(amount, userId, guildId);
}

function setLastDaily(userId, guildId) {
  db.prepare('UPDATE economy SET last_daily = ? WHERE user_id = ? AND guild_id = ?').run(new Date().toISOString(), userId, guildId);
}

function getLeaderboardEco(guildId, limit = 10) {
  return db.prepare('SELECT * FROM economy WHERE guild_id = ? ORDER BY (coins + bank) DESC LIMIT ?').all(guildId, limit);
}

// ─── NIVEAUX ────────────────────────────────────────────────────────────────

function getLevel(userId, guildId) {
  let row = db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  if (!row) {
    db.prepare('INSERT INTO levels (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
    row = db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
  }
  return row;
}

function addXP(userId, guildId, amount) {
  getLevel(userId, guildId);
  db.prepare('UPDATE levels SET xp = xp + ?, last_xp = ? WHERE user_id = ? AND guild_id = ?')
    .run(amount, new Date().toISOString(), userId, guildId);
  return db.prepare('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
}

function setLevel(userId, guildId, level, xp) {
  db.prepare('UPDATE levels SET level = ?, xp = ? WHERE user_id = ? AND guild_id = ?').run(level, xp, userId, guildId);
}

function getLeaderboardXP(guildId, limit = 10) {
  return db.prepare('SELECT * FROM levels WHERE guild_id = ? ORDER BY (level * 1000 + xp) DESC LIMIT ?').all(guildId, limit);
}

function xpNeeded(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ─── AVERTISSEMENTS ─────────────────────────────────────────────────────────

function addWarning(userId, guildId, modId, reason) {
  db.prepare('INSERT INTO warnings (user_id, guild_id, moderator_id, reason, date) VALUES (?, ?, ?, ?, ?)')
    .run(userId, guildId, modId, reason, new Date().toISOString());
}

function getWarnings(userId, guildId) {
  return db.prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY date DESC').all(userId, guildId);
}

function clearWarnings(userId, guildId) {
  db.prepare('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?').run(userId, guildId);
}

// ─── CONFIG ─────────────────────────────────────────────────────────────────

function getConfig(guildId) {
  let row = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT INTO config (guild_id) VALUES (?)').run(guildId);
    row = db.prepare('SELECT * FROM config WHERE guild_id = ?').get(guildId);
  }
  return row;
}

function setConfig(guildId, key, value) {
  getConfig(guildId);
  db.prepare(`UPDATE config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
}

// ─── BLACKLIST ──────────────────────────────────────────────────────────────

function isBlacklisted(userId, guildId) {
  return !!db.prepare('SELECT 1 FROM blacklist WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
}

function addBlacklist(userId, guildId) {
  db.prepare('INSERT OR IGNORE INTO blacklist (user_id, guild_id) VALUES (?, ?)').run(userId, guildId);
}

function removeBlacklist(userId, guildId) {
  db.prepare('DELETE FROM blacklist WHERE user_id = ? AND guild_id = ?').run(userId, guildId);
}

module.exports = {
  db,
  getEconomy, addCoins, removeCoins, setLastDaily, getLeaderboardEco,
  getLevel, addXP, setLevel, getLeaderboardXP, xpNeeded,
  addWarning, getWarnings, clearWarnings,
  getConfig, setConfig,
  isBlacklisted, addBlacklist, removeBlacklist
};
