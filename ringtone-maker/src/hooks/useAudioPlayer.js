import { useState, useEffect, useRef, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { autoPickLoudestSection } from '../utils/audioUtils';

export function useAudioPlayer({ containerRef, currentSong }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [zoom, setZoomState] = useState(0);

  // Region selection state (max 30s)
  const [region, setRegionState] = useState({ start: 0, end: 20, duration: 20 });
  const [isLooping, setIsLooping] = useState(false);
  const [isPreviewingRegion, setIsPreviewingRegion] = useState(false);

  // Fade effects options
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [fadeInDuration, setFadeInDuration] = useState(1.0);
  const [fadeOutDuration, setFadeOutDuration] = useState(1.5);

  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const activeRegionRef = useRef(null);
  const isPreviewingRef = useRef(false);
  const isLoopingRef = useRef(false);
  const regionRef = useRef({ start: 0, end: 20 });

  // Sync refs in useEffect
  useEffect(() => {
    isPreviewingRef.current = isPreviewingRegion;
    isLoopingRef.current = isLooping;
    regionRef.current = region;
  }, [isPreviewingRegion, isLooping, region]);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create regions plugin
    const wsRegions = RegionsPlugin.create();
    regionsPluginRef.current = wsRegions;

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5',
      progressColor: '#06b6d4',
      cursorColor: '#f43f5e',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 3,
      height: 140,
      normalize: true,
      plugins: [wsRegions],
    });

    wavesurferRef.current = ws;

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => {
      setIsPlaying(false);
      setIsPreviewingRegion(false);
    });

    ws.on('timeupdate', (time) => {
      setCurrentTime(time);

      // Handle region preview cutoff and looping
      if (isPreviewingRef.current && activeRegionRef.current) {
        const { start, end } = activeRegionRef.current;
        if (time >= end || time < start - 0.2) {
          if (isLoopingRef.current) {
            ws.setTime(start);
            ws.play();
          } else {
            ws.pause();
            ws.setTime(start);
            setIsPreviewingRegion(false);
          }
        }
      }
    });

    ws.on('ready', () => {
      setIsLoadingSong(false);
      const totalDur = ws.getDuration();
      setDuration(totalDur);

      try {
        const decoded = ws.getDecodedData();
        setAudioBuffer(decoded);
      } catch (e) {
        console.warn('Could not get decoded data:', e);
      }

      // Add default ringtone region (max 30s)
      wsRegions.clearRegions();
      const initialStart = totalDur > 10 ? 5 : 0;
      const initialLength = Math.min(25, Math.max(1, totalDur - initialStart));
      const initialEnd = Math.min(totalDur, initialStart + initialLength);

      const newRegion = wsRegions.addRegion({
        id: 'ringtone-cut',
        start: initialStart,
        end: initialEnd,
        maxLength: 30,
        minLength: 1,
        drag: true,
        resize: true,
        color: 'rgba(139, 92, 246, 0.3)',
      });

      activeRegionRef.current = newRegion;
      const dur = Math.round((initialEnd - initialStart) * 10) / 10;
      setRegionState({ start: initialStart, end: initialEnd, duration: dur });
    });

    // Listen to region updates
    wsRegions.on('region-update', (reg) => {
      // Enforce max 30s limit
      let start = Math.max(0, reg.start);
      let end = reg.end;
      if (end - start > 30) {
        if (reg.updatingSide === 'start') {
          start = Math.max(0, end - 30);
          reg.setOptions({ start });
        } else {
          end = start + 30;
          reg.setOptions({ end });
        }
      }
      activeRegionRef.current = reg;
      const length = Math.round((end - start) * 10) / 10;
      setRegionState({
        start: Math.round(start * 10) / 10,
        end: Math.round(end * 10) / 10,
        duration: length,
      });
    });

    wsRegions.on('region-updated', (reg) => {
      activeRegionRef.current = reg;
      const length = Math.round((reg.end - reg.start) * 10) / 10;
      setRegionState({
        start: Math.round(reg.start * 10) / 10,
        end: Math.round(reg.end * 10) / 10,
        duration: length,
      });
    });

    ws.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setIsLoadingSong(false);
      setAudioError(err.message || 'Error loading audio file');
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      activeRegionRef.current = null;
    };
  }, [containerRef]);

  // Load song when currentSong changes
  useEffect(() => {
    if (!wavesurferRef.current || !currentSong) return;

    setIsLoadingSong(true);
    setAudioError(null);
    setIsPlaying(false);
    setIsPreviewingRegion(false);
    setCurrentTime(0);

    try {
      if (currentSong.file) {
        wavesurferRef.current.loadBlob(currentSong.file);
      } else if (currentSong.url) {
        wavesurferRef.current.load(currentSong.url);
      }
    } catch (e) {
      console.error('Failed to load song:', e);
      setIsLoadingSong(false);
      setAudioError('Failed to load audio source.');
    }
  }, [currentSong]);

  // Controls
  const playPause = useCallback(() => {
    if (!wavesurferRef.current) return;
    if (isPlaying) {
      wavesurferRef.current.pause();
      setIsPreviewingRegion(false);
    } else {
      setIsPreviewingRegion(false);
      wavesurferRef.current.play();
    }
  }, [isPlaying]);

  const previewRingtone = useCallback(() => {
    if (!wavesurferRef.current || !activeRegionRef.current) return;

    if (isPlaying && isPreviewingRegion) {
      wavesurferRef.current.pause();
      setIsPreviewingRegion(false);
      return;
    }

    const { start } = activeRegionRef.current;
    setIsPreviewingRegion(true);
    wavesurferRef.current.setTime(start);
    wavesurferRef.current.play();
  }, [isPlaying, isPreviewingRegion]);

  const stop = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.pause();
    wavesurferRef.current.setTime(0);
    setIsPreviewingRegion(false);
  }, []);

  const seekTo = useCallback((seconds) => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setTime(seconds);
  }, []);

  const setVolume = useCallback((val) => {
    setVolumeState(val);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(val);
      if (val > 0) setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!wavesurferRef.current) return;
    if (isMuted) {
      wavesurferRef.current.setVolume(volume || 0.8);
      setIsMuted(false);
    } else {
      wavesurferRef.current.setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const setZoom = useCallback((zoomVal) => {
    setZoomState(zoomVal);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoomVal);
    }
  }, []);

  // Update region programmatically
  const updateRegion = useCallback((newStart, newEnd) => {
    if (!wavesurferRef.current || !activeRegionRef.current) return;
    const dur = wavesurferRef.current.getDuration() || 60;

    let s = Math.max(0, Math.min(newStart, dur));
    let e = Math.max(s + 1, Math.min(newEnd, dur));

    // Cap duration to 30s
    if (e - s > 30) {
      e = s + 30;
    }

    activeRegionRef.current.setOptions({
      start: s,
      end: e,
    });

    const length = Math.round((e - s) * 10) / 10;
    setRegionState({
      start: Math.round(s * 10) / 10,
      end: Math.round(e * 10) / 10,
      duration: length,
    });
  }, []);

  // Auto-pick the loudest / most energetic 20-30 seconds
  const autoPick = useCallback(() => {
    if (!audioBuffer) {
      console.warn('Audio buffer not yet decoded');
      return null;
    }

    const result = autoPickLoudestSection(audioBuffer, 25, 30);
    updateRegion(result.start, result.end);

    // Seek to start of detected energetic section
    seekTo(result.start);

    return result;
  }, [audioBuffer, updateRegion, seekTo]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoadingSong,
    audioError,
    audioBuffer,
    region,
    isLooping,
    isPreviewingRegion,
    zoom,
    fadeIn,
    fadeOut,
    fadeInDuration,
    fadeOutDuration,
    setFadeIn,
    setFadeOut,
    setFadeInDuration,
    setFadeOutDuration,
    playPause,
    previewRingtone,
    stop,
    seekTo,
    setVolume,
    toggleMute,
    toggleLoop,
    setZoom,
    updateRegion,
    autoPick,
  };
}
