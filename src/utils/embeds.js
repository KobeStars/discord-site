const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x1D9E75,
  error: 0xD85A30,
  info: 0x378ADD,
  warning: 0xEF9F27,
  mod: 0x7F77DD,
  eco: 0xBA7517,
  fun: 0xD4537E,
  music: 0x639922,
};

function embed(type, title, description, fields = []) {
  const e = new EmbedBuilder()
    .setColor(COLORS[type] || COLORS.info)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  if (fields.length) e.addFields(fields);
  return e;
}

function successEmbed(title, desc, fields) { return embed('success', `✅ ${title}`, desc, fields); }
function errorEmbed(title, desc) { return embed('error', `❌ ${title}`, desc); }
function infoEmbed(title, desc, fields) { return embed('info', `ℹ️ ${title}`, desc, fields); }
function warnEmbed(title, desc) { return embed('warning', `⚠️ ${title}`, desc); }
function modEmbed(title, desc, fields) { return embed('mod', `🔨 ${title}`, desc, fields); }
function ecoEmbed(title, desc, fields) { return embed('eco', `💰 ${title}`, desc, fields); }
function funEmbed(title, desc, fields) { return embed('fun', `🎲 ${title}`, desc, fields); }
function musicEmbed(title, desc, fields) { return embed('music', `🎵 ${title}`, desc, fields); }

function msToTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatNumber(n) {
  return n.toLocaleString('fr-FR');
}

module.exports = { successEmbed, errorEmbed, infoEmbed, warnEmbed, modEmbed, ecoEmbed, funEmbed, musicEmbed, msToTime, formatNumber };
