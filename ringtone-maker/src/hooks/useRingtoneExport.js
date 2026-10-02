import { useState } from 'react';
import {
  sliceAudioBuffer,
  audioBufferToWavBlob,
  audioBufferToMp3Blob,
} from '../utils/audioUtils';

export function useRingtoneExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const cutAndExport = async ({
    audioBuffer,
    startSec,
    endSec,
    name,
    format = 'MP3',
    fadeIn = false,
    fadeOut = false,
    fadeInDuration = 1.0,
    fadeOutDuration = 1.0,
  }) => {
    if (!audioBuffer) {
      throw new Error('No audio loaded to cut.');
    }

    setIsExporting(true);
    setExportError(null);

    try {
      // 1. Slice audio buffer
      const slicedBuffer = sliceAudioBuffer(audioBuffer, startSec, endSec, {
        fadeIn,
        fadeOut,
        fadeInDuration,
        fadeOutDuration,
      });

      const actualDuration = slicedBuffer.duration;

      // 2. Encode to requested format
      let blob;
      if (format.toUpperCase() === 'WAV') {
        blob = audioBufferToWavBlob(slicedBuffer);
      } else {
        blob = audioBufferToMp3Blob(slicedBuffer, 192);
      }

      setIsExporting(false);
      return {
        blob,
        duration: Math.round(actualDuration * 10) / 10,
        format: format.toUpperCase(),
        name: name || 'Custom Ringtone',
      };
    } catch (err) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to process audio');
      setIsExporting(false);
      throw err;
    }
  };

  return {
    isExporting,
    exportError,
    cutAndExport,
  };
}

