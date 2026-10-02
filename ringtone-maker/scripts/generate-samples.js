import fs from 'fs';
import path from 'path';

function createWavBuffer(sampleRate, channels, samplesL, samplesR) {
  const numSamples = samplesL.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(channels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp to -1..1 and scale to 16-bit signed integer
    const sL = Math.max(-1, Math.min(1, samplesL[i]));
    const valL = sL < 0 ? sL * 32768 : sL * 32767;
    buffer.writeInt16LE(Math.round(valL), offset);
    offset += 2;

    if (channels === 2) {
      const sR = Math.max(-1, Math.min(1, samplesR ? samplesR[i] : samplesL[i]));
      const valR = sR < 0 ? sR * 32768 : sR * 32767;
      buffer.writeInt16LE(Math.round(valR), offset);
      offset += 2;
    }
  }

  return buffer;
}

// 1. Neon Sunset (Synthwave - 38 seconds)
function generateSynthwave(sampleRate = 44100, duration = 38) {
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const bpm = 120;
  const beatDuration = 60 / bpm; // 0.5s per beat
  const bassNotes = [55, 55, 65.4, 49]; // A1, A1, C2, G1
  const chordNotes = [
    [220, 261.63, 329.63], // Am
    [174.61, 220, 261.63], // F
    [261.63, 329.63, 392], // C
    [196, 246.94, 293.66], // G
  ];
  const melodyNotes = [440, 493.88, 523.25, 587.33, 659.25, 523.25, 493.88, 392];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beat = t / beatDuration;
    const beatFract = beat % 1;
    const bar = Math.floor(beat / 4);
    const chordIdx = bar % 4;

    // Structure:
    // 0-8s: Intro (subtle bass + soft pad)
    // 8-28s: CHORUS / ENERGETIC DROP (full drums, arp, lead melody, thick bass)
    // 28-38s: Outro
    let energy = 0.4;
    if (t >= 8 && t < 28) energy = 1.0;
    else if (t >= 28) energy = 0.5 * (1 - (t - 28) / 10);

    // Drum Kick on beats 0, 1, 2, 3 in chorus
    let kick = 0;
    if (t >= 8 && t < 28) {
      if (beatFract < 0.25) {
        const kt = beatFract * beatDuration;
        const freq = 120 * Math.exp(-kt * 25);
        kick = Math.sin(2 * Math.PI * freq * kt) * Math.exp(-kt * 15) * 0.9;
      }
    }

    // Snare / clap on beats 1 and 3 (0-indexed: 1, 3)
    let snare = 0;
    if (t >= 8 && t < 28) {
      const beatInBar = beat % 4;
      if ((beatInBar >= 1 && beatInBar < 1.25) || (beatInBar >= 3 && beatInBar < 3.25)) {
        const st = (beatInBar % 1) * beatDuration;
        const noise = (Math.random() * 2 - 1) * Math.exp(-st * 18);
        const tone = Math.sin(2 * Math.PI * 180 * st) * Math.exp(-st * 25);
        snare = (noise * 0.5 + tone * 0.5) * 0.7;
      }
    }

    // Hi-hat on 8th notes
    let hat = 0;
    if (t >= 8 && t < 28) {
      const eighth = (beat * 2) % 1;
      if (eighth < 0.1) {
        const ht = eighth * (beatDuration / 2);
        hat = (Math.random() * 2 - 1) * Math.exp(-ht * 60) * 0.25;
      }
    }

    // Bassline (16th notes synth bass)
    const sixteenth = (beat * 4) % 1;
    const bassFreq = bassNotes[chordIdx];
    const bassEnv = Math.exp(-sixteenth * 5);
    const bass = (Math.sin(2 * Math.PI * bassFreq * t) + 0.3 * Math.sin(4 * Math.PI * bassFreq * t)) * bassEnv * 0.35 * energy;

    // Chords Pad
    const chords = chordNotes[chordIdx];
    let pad = 0;
    for (const f of chords) {
      pad += (Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(2 * Math.PI * (f * 2) * t)) * 0.08;
    }
    pad *= energy;

    // Lead Arp / Melody in chorus
    let lead = 0;
    if (t >= 8 && t < 28) {
      const noteIdx = Math.floor(beat * 2) % melodyNotes.length;
      const mFreq = melodyNotes[noteIdx];
      const mEnv = Math.exp(-((beat * 2) % 1) * 3);
      lead = Math.sin(2 * Math.PI * mFreq * t + Math.sin(2 * Math.PI * 8 * t) * 0.1) * mEnv * 0.28;
    }

    const mixed = kick + snare + hat + bass + pad + lead;
    left[i] = Math.max(-0.95, Math.min(0.95, mixed * 0.85 + (lead * 0.1)));
    right[i] = Math.max(-0.95, Math.min(0.95, mixed * 0.85 - (lead * 0.1)));
  }

  return createWavBuffer(sampleRate, 2, left, right);
}

// 2. Cyber Chill (Lo-Fi Beats - 35 seconds)
function generateCyberChill(sampleRate = 44100, duration = 35) {
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const bpm = 85;
  const beatDuration = 60 / bpm;
  // Jazzy chords (Cmaj7 -> Am7 -> Dm7 -> G7)
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [293.66, 349.23, 440.00, 523.25], // Dm7
    [196.00, 246.94, 293.66, 349.23], // G7
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beat = t / beatDuration;
    const bar = Math.floor(beat / 4);
    const chordIdx = bar % chords.length;

    // Structure:
    // 0-6s intro mellow keys
    // 6-26s full lofi beat + rich Rhodes + vinyl
    // 26-35s fading chillout
    let energy = 0.5;
    if (t >= 6 && t < 26) energy = 1.0;
    else if (t >= 26) energy = 0.6 * (1 - (t - 26) / 10);

    // Lo-fi Vinyl hiss
    const vinyl = (Math.random() * 2 - 1) * 0.015;

    // Mellow kick drum on beat 0 and 2.5
    let kick = 0;
    if (t >= 6 && t < 26) {
      const beatInBar = beat % 4;
      const kickDist1 = beatInBar;
      const kickDist2 = Math.abs(beatInBar - 2.5);
      const minKick = Math.min(kickDist1, kickDist2);
      if (minKick < 0.3) {
        const kt = minKick * beatDuration;
        kick = Math.sin(2 * Math.PI * (90 * Math.exp(-kt * 20)) * kt) * Math.exp(-kt * 10) * 0.65;
      }
    }

    // Soft Rimshot / Snare on beat 1 and 3
    let rim = 0;
    if (t >= 6 && t < 26) {
      const beatInBar = beat % 4;
      const rimDist1 = Math.abs(beatInBar - 1);
      const rimDist2 = Math.abs(beatInBar - 3);
      const minRim = Math.min(rimDist1, rimDist2);
      if (minRim < 0.2) {
        const rt = minRim * beatDuration;
        rim = ((Math.random() * 2 - 1) * 0.4 + Math.sin(2 * Math.PI * 340 * rt) * 0.6) * Math.exp(-rt * 25) * 0.5;
      }
    }

    // Warm Rhodes electric piano chords
    const activeChord = chords[chordIdx];
    let epiano = 0;
    const chordBeat = (beat % 2) / 2;
    const epEnv = Math.exp(-chordBeat * 2.5);
    for (const f of activeChord) {
      const vibrato = Math.sin(2 * Math.PI * 4.5 * t) * 1.5;
      epiano += (Math.sin(2 * Math.PI * (f + vibrato) * t) * 0.7 + Math.sin(2 * Math.PI * (f * 2) * t) * 0.2) * epEnv * 0.08;
    }

    // Warm Sub Bass
    const rootFreq = activeChord[0] / 2;
    const bass = Math.sin(2 * Math.PI * rootFreq * t) * 0.3 * (energy > 0.8 ? 1.0 : 0.4);

    const mix = (kick + rim + epiano + bass + vinyl) * 0.85;
    left[i] = Math.max(-0.95, Math.min(0.95, mix));
    right[i] = Math.max(-0.95, Math.min(0.95, mix * 0.95 + epiano * 0.1));
  }

  return createWavBuffer(sampleRate, 2, left, right);
}

// 3. Energetic Beat (Modern Dance / EDM Anthem - 40 seconds)
function generateEnergeticBeat(sampleRate = 44100, duration = 40) {
  const numSamples = Math.floor(sampleRate * duration);
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  const bpm = 126;
  const beatDuration = 60 / bpm;
  const dropChords = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beat = t / beatDuration;
    const beatFract = beat % 1;

    // Structure:
    // 0-10s: Build-up with rising snare roll & sweep
    // 10-30s: MASSIVE ENERGETIC DROP (heavy punchy beat, saw chords, pumping sidechain)
    // 30-40s: Cooldown
    const isDrop = t >= 10 && t < 30;
    const isBuild = t < 10;

    let kick = 0;
    let clap = 0;
    let synth = 0;
    let riser = 0;

    if (isBuild) {
      // Build-up snare roll accelerating
      const rollSpeed = t < 6 ? 1 : (t < 8.5 ? 2 : 4);
      const rollFrac = (beat * rollSpeed) % 1;
      if (rollFrac < 0.2) {
        const rt = rollFrac * (beatDuration / rollSpeed);
        riser = (Math.random() * 2 - 1) * Math.exp(-rt * 15) * (0.2 + (t / 10) * 0.4);
      }
      // Pitch riser sweep
      const sweepFreq = 200 + Math.pow(t / 10, 2) * 1200;
      riser += Math.sin(2 * Math.PI * sweepFreq * t) * 0.1 * (t / 10);
    }

    if (isDrop) {
      // Punchy 4-on-the-floor kick
      if (beatFract < 0.2) {
        const kt = beatFract * beatDuration;
        const kFreq = 150 * Math.exp(-kt * 30);
        kick = Math.sin(2 * Math.PI * kFreq * kt) * Math.exp(-kt * 12) * 0.95;
      }

      // Layered Clap on beats 1 and 3 (every 2 beats)
      const beatIn2 = beat % 2;
      if (beatIn2 >= 1 && beatIn2 < 1.3) {
        const ct = (beatIn2 - 1) * beatDuration;
        clap = (Math.random() * 2 - 1) * Math.exp(-ct * 16) * 0.6;
      }

      // High-energy SuperSaw chord with sidechain compression effect (duck on kick)
      const chordIdx = Math.floor(beat / 4) % dropChords.length;
      const baseFreq = dropChords[chordIdx];
      const sidechain = Math.min(1, Math.pow(beatFract, 0.6) * 1.4); // volume dips on beat

      // Detuned saw waves
      const detunes = [-0.015, 0, 0.015, 1.0, 1.01];
      let saw = 0;
      for (const d of detunes) {
        const f = baseFreq * 2 * (1 + d);
        // Saw approximation using 3 harmonics
        saw += (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t)) * 0.1;
      }
      synth = saw * sidechain * 0.7;
    }

    const mix = kick + clap + synth + riser;
    left[i] = Math.max(-0.95, Math.min(0.95, mix));
    right[i] = Math.max(-0.95, Math.min(0.95, mix * 0.9 + synth * 0.15));
  }

  return createWavBuffer(sampleRate, 2, left, right);
}

// Generate files
const outDir = path.resolve('public', 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating sample 1: Neon Sunset (Synthwave)...');
fs.writeFileSync(path.join(outDir, 'neon-sunset.wav'), generateSynthwave());

console.log('Generating sample 2: Cyber Chill (Lo-Fi)...');
fs.writeFileSync(path.join(outDir, 'cyber-chill.wav'), generateCyberChill());

console.log('Generating sample 3: Energetic Beat (Dance Anthem)...');
fs.writeFileSync(path.join(outDir, 'energetic-beat.wav'), generateEnergeticBeat());

console.log('Sample generation completed successfully!');

