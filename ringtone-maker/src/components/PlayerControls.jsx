import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Headphones,
  SlidersHorizontal,
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isPreviewingRegion,
  isLooping,
  fadeIn,
  fadeOut,
  fadeInDuration,
  fadeOutDuration,
  onPlayPause,
  onPreviewRingtone,
  onPrevSong,
  onNextSong,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleFadeIn,
  onToggleFadeOut,
  onFadeInDurationChange,
  onFadeOutDurationChange,
}) {
  return (
    <section className="player-controls-card">
      <div className="controls-main-row">
        {/* Left: Previous / Play / Next */}
        <div className="transport-cluster">
          <button
            className="btn-transport"
            onClick={onPrevSong}
            title="Previous song (ArrowLeft)"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            className={`btn-play-hero ${isPlaying && !isPreviewingRegion ? 'active' : ''}`}
            onClick={onPlayPause}
            title="Play / Pause whole song (Space)"
          >
            {isPlaying && !isPreviewingRegion ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            className="btn-transport"
            onClick={onNextSong}
            title="Next song (ArrowRight)"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Time Counter */}
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="time-sep">/</span>
            <span className="total-time">{formatTime(duration, false)}</span>
          </div>
        </div>

        {/* Center: Preview Ringtone & Loop */}
        <div className="ringtone-preview-cluster">
          <button
            className={`btn-preview-ringtone ${isPreviewingRegion ? 'is-previewing' : ''}`}
            onClick={onPreviewRingtone}
            title="Play only the selected ringtone segment"
          >
            <Headphones className="w-4 h-4 mr-2" />
            <span>{isPreviewingRegion ? 'Stop Preview' : 'Preview Ringtone'}</span>
          </button>

          <button
            className={`btn-toggle-loop ${isLooping ? 'is-active' : ''}`}
            onClick={onToggleLoop}
            title={isLooping ? 'Looping Preview: ON' : 'Looping Preview: OFF'}
          >
            <Repeat className="w-4 h-4" />
            <span className="loop-label">Loop</span>
          </button>
        </div>

        {/* Right: Volume & Mute */}
        <div className="volume-cluster">
          <button
            className="btn-mute"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-zinc-300" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>

      {/* Fade In / Fade Out Control Strip */}
      <div className="fade-strip">
        <div className="fade-strip-title">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>Ringtone Fade Effects:</span>
        </div>

        <div className="fade-options-row">
          <label className={`fade-checkbox-card ${fadeIn ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={fadeIn}
              onChange={(e) => onToggleFadeIn(e.target.checked)}
            />
            <span className="fade-name">Fade In</span>
            {fadeIn && (
              <select
                value={fadeInDuration}
                onChange={(e) => onFadeInDurationChange(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="fade-select"
              >
                <option value="0.5">0.5s</option>
                <option value="1.0">1.0s</option>
                <option value="1.5">1.5s</option>
                <option value="2.0">2.0s</option>
              </select>
            )}
          </label>

          <label className={`fade-checkbox-card ${fadeOut ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={fadeOut}
              onChange={(e) => onToggleFadeOut(e.target.checked)}
            />
            <span className="fade-name">Fade Out</span>
            {fadeOut && (
              <select
                value={fadeOutDuration}
                onChange={(e) => onFadeOutDurationChange(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="fade-select"
              >
                <option value="0.5">0.5s</option>
                <option value="1.0">1.0s</option>
                <option value="1.5">1.5s</option>
                <option value="2.0">2.0s</option>
                <option value="3.0">3.0s</option>
              </select>
            )}
          </label>

          <div className="keyboard-shortcuts-pill">
            <span className="shortcut-key">Space</span> Play/Pause
            <span className="shortcut-sep">•</span>
            <span className="shortcut-key">← / →</span> Next/Prev
          </div>
        </div>
      </div>
    </section>
  );
}
