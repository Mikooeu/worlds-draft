// Musique et effets de sélection/validation : fichiers libres de droits fournis par l'auteur ; autres effets générés en direct (Web Audio). Aucun asset Riot.
// Le son ne démarre qu'après une première interaction (règle des navigateurs).
const PREF = 'wd.audio';
let ctx = null, master = null, musicBus = null, sfxBus = null, bar = 0;
const prefs = (() => { try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(PREF) || '{}') }; } catch { return { music: true, sfx: true }; } })();
const save = () => { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {} };

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = prefs.music ? MUSIC_GAIN : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = prefs.sfx ? 0.35 : 0; sfxBus.connect(master);
  loadSfx();
  return true;
}

function tone({ freq, type = 'sine', start = 0, dur = 0.2, gain = 0.5, to = null, bus = sfxBus, attack = 0.005, filter = null }) {
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = o;
  if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
  node.connect(g); g.connect(bus);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

// Musique de fond : fichier libre de droits fourni par l'auteur du site, lu en boucle (streaming).
const MUSIC_SRC = new URL('../audio/draft-music.mp3?q=192', import.meta.url).href;
const MUSIC_GAIN = 0.22;
let musicEl = null, inGame = false;
// Effets fournis par l'auteur du site (normalisés à -1 dB) : sélection d'un champion, validation d'un pick/ban
const SFX = { select: { src: '../audio/select.mp3', level: 1.4 }, validate: { src: '../audio/validate.mp3', level: 2 } };
const buffers = {};
function loadSfx() {
  for (const [k, { src }] of Object.entries(SFX)) {
    if (buffers[k] !== undefined) continue;
    buffers[k] = null;
    fetch(new URL(src, import.meta.url)).then(r => r.arrayBuffer())
      .then(b => new Promise((ok, ko) => ctx.decodeAudioData(b, ok, ko)))
      .then(buf => { buffers[k] = buf; }).catch(() => { delete buffers[k]; });
  }
}
function sample(k) {
  if (!ensure() || !prefs.sfx) return false;
  const buf = buffers[k]; if (!buf) { loadSfx(); return false; }
  const s = ctx.createBufferSource(), g = ctx.createGain();
  s.buffer = buf; g.gain.value = SFX[k].level; s.connect(g); g.connect(sfxBus); s.start();
  return true;
}
function musicElement() {
  if (!musicEl) {
    musicEl = new Audio(MUSIC_SRC);
    musicEl.loop = true; musicEl.preload = 'auto';
    try { ctx.createMediaElementSource(musicEl).connect(musicBus); } catch { musicEl.volume = MUSIC_GAIN; }
  }
  return musicEl;
}
// La musique ne joue que pendant une partie lancée (draft → résultats), jamais sur l'accueil ni le lobby.
function syncMusic() {
  if (!ctx) return;
  const el = musicElement();
  if (inGame && prefs.music) { if (el.paused) el.play().catch(() => {}); }
  else if (!el.paused) el.pause();
}

export const sound = {
  // à appeler sur la première interaction de l'utilisateur
  unlock() {
    if (!ensure()) return;
    // iOS : on « amorce » l'élément audio pendant le geste pour pouvoir le lancer plus tard sans clic
    const el = musicElement();
    if (!inGame && el.paused) { el.muted = true; el.play().then(() => { if (!inGame) el.pause(); el.muted = false; }).catch(() => { el.muted = false; }); }
    syncMusic();
  },
  setInGame(v) { if (inGame === v) return; inGame = v; syncMusic(); },
  get prefs() { return { ...prefs }; },
  toggle(kind) {
    prefs[kind] = !prefs[kind]; save(); ensure();
    if (!ctx) return prefs[kind];
    const bus = kind === 'music' ? musicBus : sfxBus;
    bus.gain.setTargetAtTime(prefs[kind] ? (kind === 'music' ? MUSIC_GAIN : 0.35) : 0, ctx.currentTime, 0.1);
    if (kind === 'music') syncMusic();
    return prefs[kind];
  },
  // Effets
  select() { if (!sample('select') && ctx && prefs.sfx) tone({ freq: 880, type: 'triangle', dur: 0.08, gain: 0.25 }); },
  lock() { sample('validate'); },
  ban() { sample('validate'); },
  yourTurn() { if (!ensure() || !prefs.sfx) return; tone({ freq: 660, type: 'sine', dur: 0.18, gain: 0.3 }); tone({ freq: 990, type: 'sine', start: 0.12, dur: 0.3, gain: 0.25 }); },
  tick() { if (!ensure() || !prefs.sfx) return; tone({ freq: 1500, type: 'square', dur: 0.04, gain: 0.12, filter: 3000 }); },
  win() { if (!ensure() || !prefs.sfx) return; [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.12, dur: 0.7, gain: 0.3 })); },
  lose() { if (!ensure() || !prefs.sfx) return; [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.18, dur: 0.8, gain: 0.28 })); },
};
