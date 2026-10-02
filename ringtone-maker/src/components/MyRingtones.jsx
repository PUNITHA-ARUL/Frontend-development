import React from 'react';
import {
  BookmarkCheck,
  Play,
  Pause,
  Download,
  Trash2,
  Music2,
} from 'lucide-react';

export function MyRingtones({
  ringtones,
  playingId,
  audioProgress,
  onTogglePlay,
  onDownload,
  onDelete,
}) {
  return (
    <section className="my-ringtones-card">
      <div className="my-ringtones-header">
        <div className="flex items-center gap-2">
          <div className="icon-badge">
            <BookmarkCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3>My Ringtones</h3>
            <span className="text-xs text-muted">
              {ringtones.length} saved {ringtones.length === 1 ? 'ringtone' : 'ringtones'} in browser storage
            </span>
          </div>
        </div>
      </div>

      {ringtones.length === 0 ? (
        <div className="empty-ringtones-box">
          <Music2 className="w-10 h-10 text-zinc-600 mb-3" />
          <h4>No ringtones created yet</h4>
          <p className="text-xs text-muted max-w-sm">
            Select any section in the waveform above, click "Create & Download Ringtone", and your custom ringtones will appear here.
          </p>
        </div>
      ) : (
        <div className="ringtones-grid">
          {ringtones.map((rt) => {
            const isPlaying = playingId === rt.id;
            const formattedDate = rt.createdAt
              ? new Date(rt.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently saved';

            return (
              <div key={rt.id} className={`ringtone-item-card ${isPlaying ? 'playing' : ''}`}>
                <div className="rt-card-top">
                  <button
                    className={`btn-rt-play ${isPlaying ? 'active' : ''}`}
                    onClick={() => onTogglePlay(rt)}
                    title={isPlaying ? 'Pause preview' : 'Play ringtone preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5 text-white" />
                    )}
                  </button>

                  <div className="rt-info">
                    <h4 className="rt-title" title={rt.name}>
                      {rt.name}
                    </h4>
                    <div className="rt-meta">
                      <span className="rt-format-tag">{rt.format || 'MP3'}</span>
                      <span className="dot-sep">•</span>
                      <span>{rt.duration ? `${rt.duration}s` : '30s'}</span>
                      <span className="dot-sep">•</span>
                      <span className="rt-original-song" title={`Source: ${rt.originalSong}`}>
                        {rt.originalSong}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Playing Progress Bar */}
                {isPlaying && (
                  <div className="rt-progress-bar-container">
                    <div
                      className="rt-progress-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, audioProgress * 100))}%` }}
                    />
                  </div>
                )}

                <div className="rt-card-bottom">
                  <span className="rt-date-stamp">{formattedDate}</span>

                  <div className="rt-action-buttons">
                    <button
                      className="btn-rt-action download"
                      onClick={() => onDownload(rt)}
                      title="Download audio file"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span>Download</span>
                    </button>
                    <button
                      className="btn-rt-action delete"
                      onClick={() => onDelete(rt.id)}
                      title="Delete saved ringtone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
