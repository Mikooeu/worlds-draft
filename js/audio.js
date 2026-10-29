// Musique et effets sonores originaux, générés en direct (Web Audio) — aucun fichier, aucun asset Riot.
// Le son ne démarre qu'après une première interaction (règle des navigateurs).
const PREF = 'wd.audio';
let ctx = null, master = null, musicBus = null, sfxBus = null, musicTimer = null, bar = 0;
const prefs = (() => { try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(PREF) || '{}') }; } catch { return { music: true, sfx: true }; } })();
const save = () => { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {} };

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = prefs.music ? 0.055 : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = prefs.sfx ? 0.35 : 0; sfxBus.connect(master);
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

// Ambiance : nappe lente (accords mineurs épiques) + basse, très douce
const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G (MIDI)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function playBar() {
  if (!ctx || !prefs.music) return;
  const chord = CHORDS[bar % CHORDS.length]; bar++;
  for (const m of chord) {
    for (const det of [-4, 4]) {
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.12, t0 + 1.6); g.gain.linearRampToValueAtTime(0.0001, t0 + 6.4);
      o.connect(f); f.connect(g); g.connect(musicBus); o.start(t0); o.stop(t0 + 6.6);
    }
  }
  tone({ freq: hz(chord[0] - 24), type: 'triangle', dur: 5.5, gain: 0.5, attack: 0.8, bus: musicBus });
  // petite note de cloche aléatoire
  if (Math.random() < 0.6) tone({ freq: hz(chord[(bar) % 3] + 12), type: 'sine', start: 2 + Math.random() * 2, dur: 2.2, gain: 0.25, bus: musicBus });
}
function startMusic() { if (!ensure() || musicTimer) return; playBar(); musicTimer = setInterval(playBar, 6000); }

export const sound = {
  // à appeler sur la première interaction de l'utilisateur
  unlock() { if (ensure() && prefs.music) startMusic(); },
  get prefs() { return { ...prefs }; },
  toggle(kind) {
    prefs[kind] = !prefs[kind]; save(); ensure();
    if (!ctx) return prefs[kind];
    const bus = kind === 'music' ? musicBus : sfxBus;
    bus.gain.setTargetAtTime(prefs[kind] ? (kind === 'music' ? 0.055 : 0.35) : 0, ctx.currentTime, 0.1);
    if (kind === 'music' && prefs.music) startMusic();
    return prefs[kind];
  },
  // Effets
  select() { if (!ensure() || !prefs.sfx) return; tone({ freq: 880, type: 'triangle', dur: 0.08, gain: 0.25 }); },
  lock() { if (!ensure() || !prefs.sfx) return; tone({ freq: 110, to: 55, type: 'sine', dur: 0.35, gain: 0.9 }); tone({ freq: 523, type: 'triangle', start: 0.03, dur: 0.5, gain: 0.35 }); tone({ freq: 784, type: 'triangle', start: 0.09, dur: 0.6, gain: 0.25 }); },
  ban() { if (!ensure() || !prefs.sfx) return; tone({ freq: 330, to: 110, type: 'sawtooth', dur: 0.45, gain: 0.3, filter: 1400 }); tone({ freq: 70, type: 'sine', dur: 0.3, gain: 0.7 }); },
  yourTurn() { if (!ensure() || !prefs.sfx) return; tone({ freq: 660, type: 'sine', dur: 0.18, gain: 0.3 }); tone({ freq: 990, type: 'sine', start: 0.12, dur: 0.3, gain: 0.25 }); },
  tick() { if (!ensure() || !prefs.sfx) return; tone({ freq: 1500, type: 'square', dur: 0.04, gain: 0.12, filter: 3000 }); },
  win() { if (!ensure() || !prefs.sfx) return; [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.12, dur: 0.7, gain: 0.3 })); },
  lose() { if (!ensure() || !prefs.sfx) return; [392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.18, dur: 0.8, gain: 0.28 })); },
};
