/**
 * Synthwave Audio Generator & Sound Effects Engine for "Cyberpunk 2099: Metropolis".
 * Zero-dependency procedural audio synthesized entirely using the Web Audio API.
 */

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let engineOsc = null;
let engineGain = null;

let isAudioInit = false;
let isMuted = false;
let bassInterval = null;
let beatInterval = null;
let currentSpeedRatio = 0;
let currentCombo = 1;

export function initSynthwaveAudio() {
  if (isAudioInit) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();

    // Master Output
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Music Sub-Bus
    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    musicGain.connect(masterGain);

    // SFX Sub-Bus
    sfxGain = audioCtx.createGain();
    sfxGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
    sfxGain.connect(masterGain);

    // Continuous Thruster Engine Hum Oscillator
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();

    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(75, audioCtx.currentTime);

    const engineFilter = audioCtx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(280, audioCtx.currentTime);

    engineGain.gain.setValueAtTime(0.18, audioCtx.currentTime);

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(sfxGain);

    engineOsc.start();

    // Start background Synthwave loops
    startBassLoop();
    startBeatLoop();

    isAudioInit = true;
    console.log('[SynthwaveAudio] Web Audio initialized successfully');
  } catch (err) {
    console.warn('[SynthwaveAudio] Init error:', err);
  }
}

export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Procedural Synthwave Bassline Arpeggio
 */
function startBassLoop() {
  // Cyberpunk driving progression: A -> F -> C -> G
  const bassPatterns = [
    [110.00, 110.00, 130.81, 146.83, 110.00, 164.81, 146.83, 130.81], // A2
    [87.31, 87.31, 110.00, 130.81, 87.31, 146.83, 130.81, 110.00],    // F2
    [130.81, 130.81, 146.83, 164.81, 130.81, 196.00, 164.81, 146.83], // C3
    [98.00, 98.00, 123.47, 146.83, 98.00, 164.81, 146.83, 123.47]     // G2
  ];
  let patternIdx = 0;
  let step = 0;

  bassInterval = setInterval(() => {
    if (!audioCtx || isMuted || audioCtx.state !== 'running') return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      const currentNotes = bassPatterns[patternIdx];
      const noteFreq = currentNotes[step];

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      filter.type = 'lowpass';
      // Filter cutoff opens up at higher speeds & combos
      const cutoff = 400 + currentSpeedRatio * 600 + (currentCombo - 1) * 300;
      filter.frequency.setValueAtTime(cutoff, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);

      osc.start(now);
      osc.stop(now + 0.15);

      step = (step + 1) % 8;
      if (step === 0) {
        patternIdx = (patternIdx + 1) % bassPatterns.length;
      }
    } catch (e) {}
  }, 145); // ~103 BPM double-time 16ths
}

/**
 * Cyberpunk Electro Kick & Snare Beat
 */
function startBeatLoop() {
  let beatStep = 0;

  beatInterval = setInterval(() => {
    if (!audioCtx || isMuted || audioCtx.state !== 'running') return;
    try {
      const now = audioCtx.currentTime;

      // Kick on 0, 4, 8, 12 (Four-on-the-floor)
      if (beatStep % 4 === 0) {
        playKick(now);
      }

      // Snare / Clap on 4, 12
      if (beatStep % 8 === 4) {
        playSnare(now);
      }

      // Hi-hat on offbeats
      if (beatStep % 2 === 1) {
        playHiHat(now);
      }

      beatStep = (beatStep + 1) % 16;
    } catch (e) {}
  }, 145);
}

function playKick(now) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(now);
  osc.stop(now + 0.13);
}

function playSnare(now) {
  // White noise burst for snappy snare
  const bufferSize = audioCtx.sampleRate * 0.1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1000, now);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);

  noise.start(now);
  noise.stop(now + 0.1);
}

function playHiHat(now) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.setValueAtTime(8000, now);
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, now);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);

  osc.start(now);
  osc.stop(now + 0.045);
}

export function updateEnginePitch(speedRatio) {
  currentSpeedRatio = speedRatio;
  if (!isAudioInit || !engineOsc || !audioCtx) return;
  const freq = 75 + speedRatio * 185;
  engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.08);
}

export function setMusicIntensity(combo) {
  currentCombo = Math.max(1, combo);
}

// ---------------------------------------------------------------------------
// Procedural Game Sound Effects (SFX)
// ---------------------------------------------------------------------------

/**
 * Ring Collected / Waypoint Cleared Chime
 */
export function playRingSound(isSpecial = false) {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const baseFreq = isSpecial ? 880 : 587.33; // D5 or A5

    // Dual chime arpeggio
    const freqs = isSpecial ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2] : [baseFreq, baseFreq * 1.33, baseFreq * 1.6];
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.35, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.26);
    });
  } catch (e) {}
}

/**
 * Data Core Collected
 */
export function playDataCoreSound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.18); // E6

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {}
}

/**
 * Metal Building / Obstacle Collision Impact
 */
export function playCrashSound(intensity = 1.0) {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const vol = Math.min(0.9, 0.4 + intensity * 0.5);

    // 1. Heavy low impact thump
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // 2. Metal crunch noise burst
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGain);

    noise.start(now);
    noise.stop(now + 0.22);
  } catch (e) {}
}

/**
 * Shield Deflection / Damage Electrical Zap
 */
export function playShieldHitSound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {}
}

/**
 * Boundary Forcefield Barrier Repulsion Pulse
 */
export function playBoundaryWarningSound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(330, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {}
}

/**
 * Nitro Warp Boost Sound
 */
export function playNitroSound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.55);

    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (e) {}
}

/**
 * Countdown Beep (3... 2... 1...)
 */
export function playCountdownBeep(isGo = false) {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.35 : 0.18));

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + (isGo ? 0.36 : 0.2));
  } catch (e) {}
}

/**
 * Mission Victory Fanfare
 */
export function playVictorySound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chord.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.4, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.65);
    });
  } catch (e) {}
}

/**
 * Game Over Flatline / Explosion Drone
 */
export function playGameOverSound() {
  if (!isAudioInit || !audioCtx || isMuted) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(now);
    osc.stop(now + 1.35);
  } catch (e) {}
}

export function toggleAudioMute() {
  isMuted = !isMuted;
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.7, audioCtx.currentTime);
  }
  return isMuted;
}
