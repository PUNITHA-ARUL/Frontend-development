import React, { useState, useEffect } from 'react';
import {
  Scissors,
  CheckCircle2,
  FileAudio,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

export function RingtoneExporter({
  audioBuffer,
  currentSong,
  region,
  fadeIn,
  fadeOut,
  fadeInDuration,
  fadeOutDuration,
  onExport,
  onSaveToMyRingtones,
}) {
  const [ringtoneName, setRingtoneName] = useState(
    currentSong?.name ? `${currentSong.name} (Ringtone)` : 'My Ringtone'
  );
  const [format, setFormat] = useState('MP3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Update default name when song changes
  useEffect(() => {
    if (currentSong?.name) {
      setRingtoneName(`${currentSong.name} (Ringtone)`);
    } else {
      setRingtoneName('My Ringtone');
    }
    setExportSuccess(null);
    setErrorMessage(null);
  }, [currentSong]);

  const handleCreateRingtone = async () => {
    if (!audioBuffer) {
      setErrorMessage('Audio is still loading. Please wait a moment.');
      return;
    }

    if (region.duration <= 0) {
      setErrorMessage('Please select a valid region to cut.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setExportSuccess(null);

    try {
      // 1. Process audio cut and encode
      const result = await onExport({
        audioBuffer,
        startSec: region.start,
        endSec: region.end,
        name: ringtoneName.trim() || 'Custom Ringtone',
        format,
        fadeIn,
        fadeOut,
        fadeInDuration,
        fadeOutDuration,
      });

      // 2. Save metadata + audio to storage
      const ringtoneId = `rt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const savedMeta = {
        id: ringtoneId,
        name: result.name,
        originalSong: currentSong?.name || 'Unknown',
        duration: result.duration,
        format: result.format,
        fadeIn,
        fadeOut,
        createdAt: new Date().toISOString(),
      };

      await onSaveToMyRingtones(savedMeta, result.blob);

      // 3. Trigger immediate download to user's device
      const downloadUrl = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const fileExt = result.format.toLowerCase();
      a.download = `${result.name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'ringtone'}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

      setExportSuccess({
        name: result.name,
        duration: result.duration,
        format: result.format,
      });

      setTimeout(() => {
        setExportSuccess(null);
      }, 6000);
    } catch (err) {
      console.error('Failed to create ringtone:', err);
      setErrorMessage(err.message || 'Error cutting audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="ringtone-exporter-card">
      <div className="exporter-header">
        <div className="flex items-center gap-2.5">
          <div className="icon-badge-exporter">
            <Scissors className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h3>Cut & Export Ringtone</h3>
            <p className="text-xs text-muted">
              Web Audio slice: {formatTime(region.start)} to {formatTime(region.end)} ({region.duration.toFixed(1)}s)
            </p>
          </div>
        </div>
      </div>

      <div className="exporter-form-grid">
        {/* Ringtone Name Input */}
        <div className="form-field-group">
          <label className="field-label">Ringtone Title</label>
          <input
            type="text"
            className="input-text-dark"
            value={ringtoneName}
            onChange={(e) => setRingtoneName(e.target.value)}
            placeholder="e.g. Neon Sunset Ringtone"
            maxLength={60}
          />
        </div>

        {/* Format Selector */}
        <div className="form-field-group">
          <label className="field-label">Audio Format</label>
          <div className="format-toggle-group">
            <button
              type="button"
              className={`btn-format-toggle ${format === 'MP3' ? 'active' : ''}`}
              onClick={() => setFormat('MP3')}
            >
              <FileAudio className="w-4 h-4 mr-1.5" />
              <span>MP3 (192 kbps)</span>
            </button>
            <button
              type="button"
              className={`btn-format-toggle ${format === 'WAV' ? 'active' : ''}`}
              onClick={() => setFormat('WAV')}
            >
              <FileAudio className="w-4 h-4 mr-1.5" />
              <span>WAV (Lossless PCM)</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="form-field-action">
          <button
            type="button"
            className="btn-create-ringtone"
            onClick={handleCreateRingtone}
            disabled={isProcessing || !audioBuffer}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Cutting & Encoding...</span>
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5 mr-2" />
                <span>Create & Download Ringtone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="exporter-alert-error">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {exportSuccess && (
        <div className="exporter-alert-success">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
          <div>
            <strong>Ringtone created successfully!</strong>
            <p className="text-xs">
              "{exportSuccess.name}" ({exportSuccess.duration}s {exportSuccess.format}) downloaded and saved to My Ringtones.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
