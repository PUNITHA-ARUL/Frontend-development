import { useState, useEffect, useRef } from 'react';
import {
  getSavedRingtonesMetadata,
  saveRingtoneToStorage,
  deleteRingtoneFromStorage,
  getRingtoneAudioBlob,
} from '../utils/storage';

export function useSavedRingtones() {
  const [savedRingtones, setSavedRingtones] = useState(() => getSavedRingtonesMetadata());
  const [playingId, setPlayingId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const activeAudioRef = useRef(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  const addRingtone = async (meta, blob) => {
    const saved = await saveRingtoneToStorage(meta, blob);
    setSavedRingtones((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
    return saved;
  };

  const removeRingtone = async (id) => {
    if (playingId === id && activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
      setPlayingId(null);
      setAudioProgress(0);
    }
    const updated = await deleteRingtoneFromStorage(id);
    setSavedRingtones(updated);
  };

  const togglePlayRingtone = async (ringtone) => {
    if (playingId === ringtone.id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      setPlayingId(null);
      setAudioProgress(0);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    setPlayingId(ringtone.id);
    setAudioProgress(0);

    const blob = await getRingtoneAudioBlob(ringtone.id, ringtone.dataUrl);
    if (!blob) {
      console.error('Audio blob could not be loaded for ringtone', ringtone.id);
      setPlayingId(null);
      return;
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress(audio.currentTime / audio.duration);
      }
    };

    audio.onended = () => {
      setPlayingId(null);
      setAudioProgress(0);
      URL.revokeObjectURL(audioUrl);
      activeAudioRef.current = null;
    };

    audio.onerror = (e) => {
      console.error('Error playing saved ringtone:', e);
      setPlayingId(null);
      setAudioProgress(0);
      URL.revokeObjectURL(audioUrl);
      activeAudioRef.current = null;
    };

    try {
      await audio.play();
    } catch (e) {
      console.warn('Playback error or blocked by browser:', e);
      setPlayingId(null);
    }
  };

  const downloadRingtone = async (ringtone) => {
    const blob = await getRingtoneAudioBlob(ringtone.id, ringtone.dataUrl);
    if (!blob) {
      alert('Unable to load audio file for download.');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = ringtone.format ? ringtone.format.toLowerCase() : 'mp3';
    const filename = `${ringtone.name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'ringtone'}.${ext}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return {
    savedRingtones,
    playingId,
    audioProgress,
    addRingtone,
    removeRingtone,
    togglePlayRingtone,
    downloadRingtone,
  };
}
