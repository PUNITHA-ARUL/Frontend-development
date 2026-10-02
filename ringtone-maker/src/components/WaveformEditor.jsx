import React, { useState } from 'react';
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

export function WaveformEditor({
  containerRef,
  currentSong,
  region,
  duration,
  isLoading,
  error,
  zoom,
  onZoomChange,
  onAutoPick,
  onUpdateRegion,
}) {
  const [autoPickNotice, setAutoPickNotice] = useState(null);

  const handleAutoPickClick = () => {
    const result = onAutoPick();
    if (result) {
      setAutoPickNotice(
        `✨ Auto-selected loudest section: ${formatTime(result.start)} - ${formatTime(result.end)} (${result.duration}s)`
      );
      setTimeout(() => setAutoPickNotice(null), 4000);
    }
  };

  const adjustStart = (delta) => {
    const newStart = Math.max(0, region.start + delta);
    onUpdateRegion(newStart, region.end);
  };

  const adjustEnd = (delta) => {
    const newEnd = Math.min(duration || 60, region.end + delta);
    onUpdateRegion(region.start, newEnd);
  };

  return (
    <section className="waveform-card">
      <div className="waveform-header">
        <div className="track-details">
          <div className="track-title-row">
            <span className="current-track-badge">Editing Track</span>
            <h2 className="current-track-title">{currentSong?.name || 'No song selected'}</h2>
          </div>
          <div className="track-meta-row">
            <span>{currentSong?.artist || 'Unknown Artist'}</span>
            <span className="dot-sep">•</span>
            <span>Total Duration: {formatTime(duration, false)}</span>
          </div>
        </div>

        {/* Auto-Pick Energetic Section Button */}
        <div className="waveform-actions-right">
          <button
            className="btn-auto-pick"
            onClick={handleAutoPickClick}
            disabled={isLoading || !duration}
            title="Auto-detect and pick the loudest 25s section (chorus / drop)"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
            <span>Auto-Pick Chorus</span>
          </button>
        </div>
      </div>

      {autoPickNotice && (
        <div className="auto-pick-notice-banner">
          <span>{autoPickNotice}</span>
        </div>
      )}

      {/* Waveform Stage Area */}
      <div className="waveform-container-wrapper">
        {isLoading && (
          <div className="waveform-loading-overlay">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
            <p>Decoding audio waveform...</p>
          </div>
        )}

        {error && (
          <div className="waveform-error-overlay">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p>{error}</p>
          </div>
        )}

        <div ref={containerRef} className="wavesurfer-canvas-target" />
      </div>

      {/* Region Status & Fine-Tuning Bar */}
      <div className="region-hud-bar">
        <div className="hud-metric-group">
          <div className="hud-badge start-badge">
            <span className="hud-label">Start</span>
            <div className="hud-stepper">
              <button
                className="btn-hud-step"
                onClick={() => adjustStart(-0.5)}
                disabled={isLoading || region.start <= 0}
                title="Shift start back 0.5s"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="hud-value">{formatTime(region.start)}</span>
              <button
                className="btn-hud-step"
                onClick={() => adjustStart(0.5)}
                disabled={isLoading || region.start >= region.end - 1}
                title="Shift start forward 0.5s"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="hud-badge end-badge">
            <span className="hud-label">End</span>
            <div className="hud-stepper">
              <button
                className="btn-hud-step"
                onClick={() => adjustEnd(-0.5)}
                disabled={isLoading || region.end <= region.start + 1}
                title="Shift end back 0.5s"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="hud-value">{formatTime(region.end)}</span>
              <button
                className="btn-hud-step"
                onClick={() => adjustEnd(0.5)}
                disabled={isLoading || region.end >= duration}
                title="Shift end forward 0.5s"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className={`hud-badge duration-badge ${region.duration > 30 ? 'warn' : ''}`}>
            <span className="hud-label">Ringtone Length</span>
            <span className="hud-value highlight">{region.duration.toFixed(1)}s</span>
            <span className="hud-sublabel">(Max 30s)</span>
          </div>
        </div>

        {/* Waveform Zoom Controls */}
        <div className="waveform-zoom-controls">
          <button
            className="btn-zoom"
            onClick={() => onZoomChange(Math.max(0, zoom - 20))}
            disabled={zoom <= 0}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="0"
            max="150"
            step="10"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="zoom-slider"
            title="Zoom waveform"
          />
          <button
            className="btn-zoom"
            onClick={() => onZoomChange(Math.min(150, zoom + 20))}
            disabled={zoom >= 150}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
