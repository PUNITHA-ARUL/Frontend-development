import lamejs from '@breezystack/lamejs';

/**
 * Format time in seconds to mm:ss or mm:ss.S
 */
export function formatTime(seconds, includeDecimals = true) {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);

  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');

  if (includeDecimals) {
    return `${minStr}:${secStr}.${tenths}`;
  }
  return `${minStr}:${secStr}`;
}

/**
 * Format file size in bytes to readable string (e.g. 1.2 MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Cut an AudioBuffer between startSec and endSec, with optional fade-in and fade-out.
 */
export function sliceAudioBuffer(originalBuffer, startSec, endSec, options = {}) {
  const {
    fadeIn = false,
    fadeOut = false,
    fadeInDuration = 1.0,
    fadeOutDuration = 1.0,
  } = options;

  const sampleRate = originalBuffer.sampleRate;
  const numChannels = originalBuffer.numberOfChannels;
  const totalLength = originalBuffer.length;

  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(totalLength, Math.ceil(endSec * sampleRate));
  const sliceLength = Math.max(1, endSample - startSample);

  // Create an offline context or AudioBuffer for the sliced audio
  const offlineCtx = new (window.AudioContext || window.webkitAudioContext)();
  const slicedBuffer = offlineCtx.createBuffer(numChannels, sliceLength, sampleRate);

  // Fade calculation samples
  const fadeInSamples = fadeIn ? Math.min(sliceLength, Math.floor(fadeInDuration * sampleRate)) : 0;
  const fadeOutSamples = fadeOut ? Math.min(sliceLength, Math.floor(fadeOutDuration * sampleRate)) : 0;

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = originalBuffer.getChannelData(ch);
    const dstData = slicedBuffer.getChannelData(ch);

    for (let i = 0; i < sliceLength; i++) {
      let sample = srcData[startSample + i] || 0;

      // Apply fade in
      if (fadeInSamples > 0 && i < fadeInSamples) {
        sample *= i / fadeInSamples;
      }

      // Apply fade out
      if (fadeOutSamples > 0 && i >= sliceLength - fadeOutSamples) {
        sample *= (sliceLength - i) / fadeOutSamples;
      }

      dstData[i] = sample;
    }
  }

  return slicedBuffer;
}

/**
 * Convert an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // Write fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat: 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // Write data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channel samples and convert to 16-bit PCM
  let offset = 44;
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, channelData[ch][i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, Math.round(val), true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert an AudioBuffer into an MP3 Blob using lamejs
 */
export function audioBufferToMp3Blob(audioBuffer, kbps = 192) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  const Mp3Encoder = lamejs.Mp3Encoder || (lamejs.default && lamejs.default.Mp3Encoder);
  if (!Mp3Encoder) {
    throw new Error('Lamejs Mp3Encoder not available');
  }

  // Support up to 2 channels
  const channels = Math.min(numChannels, 2);
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);

  // Prepare Int16 audio buffers
  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : leftFloat;

  const leftInt16 = floatToInt16(leftFloat);
  const rightInt16 = channels > 1 ? floatToInt16(rightFloat) : leftInt16;

  const mp3Data = [];
  const chunkSize = 1152; // Standard MP3 frame size

  for (let i = 0; i < length; i += chunkSize) {
    const leftChunk = leftInt16.subarray(i, i + chunkSize);
    const rightChunk = channels > 1 ? rightInt16.subarray(i, i + chunkSize) : leftChunk;

    let mp3buf;
    if (channels === 1) {
      mp3buf = encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  const flushBuf = encoder.flush();
  if (flushBuf.length > 0) {
    mp3Data.push(flushBuf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

function floatToInt16(floatArray) {
  const len = floatArray.length;
  const int16 = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, floatArray[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Auto-pick the loudest / most energetic section of a song
 * Uses sliding window Root-Mean-Square (RMS) analysis.
 * Target duration defaults to 25s, max 30s.
 */
export function autoPickLoudestSection(audioBuffer, targetDuration = 25, maxDuration = 30) {
  if (!audioBuffer) return { start: 0, end: 25, duration: 25 };

  const duration = audioBuffer.duration;
  const pickDuration = Math.min(duration, Math.min(targetDuration, maxDuration));

  if (duration <= pickDuration) {
    return {
      start: 0,
      end: Math.round(duration * 10) / 10,
      duration: Math.round(duration * 10) / 10,
    };
  }

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // primary channel
  const stepSeconds = 0.5; // step size in seconds
  const stepSamples = Math.floor(stepSeconds * sampleRate);
  const windowSamples = Math.floor(pickDuration * sampleRate);
  const totalSamples = channelData.length;

  let maxEnergy = -1;
  let bestStartSample = 0;

  // Pre-calculate energy in small blocks for fast sliding window calculation
  const blockCount = Math.floor(totalSamples / stepSamples);
  const blockEnergies = new Float32Array(blockCount);

  for (let b = 0; b < blockCount; b++) {
    const blockStart = b * stepSamples;
    const blockEnd = Math.min(totalSamples, blockStart + stepSamples);
    let sumSq = 0;
    // Downsample inside block for speed
    const stride = 4;
    let count = 0;
    for (let i = blockStart; i < blockEnd; i += stride) {
      const val = channelData[i];
      sumSq += val * val;
      count++;
    }
    blockEnergies[b] = count > 0 ? sumSq / count : 0;
  }

  const blocksInWindow = Math.floor(windowSamples / stepSamples);

  // Compute first window energy
  let currentWindowEnergy = 0;
  for (let b = 0; b < Math.min(blocksInWindow, blockCount); b++) {
    currentWindowEnergy += blockEnergies[b];
  }
  maxEnergy = currentWindowEnergy;
  bestStartSample = 0;

  // Slide window across blocks
  for (let b = 1; b <= blockCount - blocksInWindow; b++) {
    currentWindowEnergy = currentWindowEnergy - blockEnergies[b - 1] + blockEnergies[b + blocksInWindow - 1];
    if (currentWindowEnergy > maxEnergy) {
      maxEnergy = currentWindowEnergy;
      bestStartSample = b * stepSamples;
    }
  }

  const startSec = Math.round((bestStartSample / sampleRate) * 10) / 10;
  const endSec = Math.min(duration, Math.round((startSec + pickDuration) * 10) / 10);

  return {
    start: startSec,
    end: endSec,
    duration: Math.round((endSec - startSec) * 10) / 10,
  };
}

