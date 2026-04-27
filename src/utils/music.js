const { createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');

class MusicQueue {
  constructor() {
    this.queue = new Map(); // guildId -> GuildQueue
  }

  get(guildId) {
    return this.queue.get(guildId);
  }

  create(guildId, voiceChannel, textChannel) {
    const q = {
      voiceChannel,
      textChannel,
      connection: null,
      player: createAudioPlayer(),
      tracks: [],
      current: null,
      volume: 100,
      loop: false,
      playing: false,
    };
    this.queue.set(guildId, q);
    return q;
  }

  delete(guildId) {
    const q = this.queue.get(guildId);
    if (q) {
      if (q.connection) q.connection.destroy();
      q.player.stop();
      this.queue.delete(guildId);
    }
  }
}

const musicQueue = new MusicQueue();

async function play_song(guildId, q) {
  if (!q.tracks.length) {
    q.current = null;
    q.playing = false;
    setTimeout(() => {
      if (!q.playing) musicQueue.delete(guildId);
    }, 60000);
    return;
  }

  const track = q.tracks.shift();
  q.current = track;
  q.playing = true;

  try {
    const stream = await play.stream(track.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
    resource.volume?.setVolume(q.volume / 100);
    q.player.play(resource);

    q.player.removeAllListeners(AudioPlayerStatus.Idle);
    q.player.on(AudioPlayerStatus.Idle, () => {
      if (q.loop) q.tracks.unshift(track);
      play_song(guildId, q);
    });

    q.textChannel.send({ embeds: [require('./embeds').musicEmbed('Lecture en cours', `**${track.title}**\nDurée : ${track.duration} • Demandé par ${track.requester}`, [])] }).catch(() => {});
  } catch (err) {
    console.error('Erreur lecture:', err);
    play_song(guildId, q);
  }
}

async function joinAndPlay(interaction, guildId, voiceChannel) {
  let q = musicQueue.get(guildId);
  if (!q) {
    q = musicQueue.create(guildId, voiceChannel, interaction.channel);
    q.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    q.connection.subscribe(q.player);
    q.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(q.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(q.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        musicQueue.delete(guildId);
      }
    });
  }
  if (!q.playing) await play_song(guildId, q);
}

module.exports = { musicQueue, play_song, joinAndPlay };
