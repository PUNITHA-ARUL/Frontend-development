import React, { useRef, useState } from 'react';
import { Upload, Music, Trash2, Disc, Sparkles } from 'lucide-react';
import { formatTime } from '../utils/audioUtils';

export function SongList({
  songs,
  currentSongIndex,
  onSelectSong,
  onUploadSongs,
  onDeleteSong,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = (files) => {
    setUploadError(null);
    const audioFiles = files.filter((f) => {
      const type = f.type.toLowerCase();
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
      return (
        type.startsWith('audio/') ||
        ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.webm'].includes(ext)
      );
    });

    if (audioFiles.length === 0) {
      setUploadError('Unsupported file format. Please upload MP3, WAV, M4A, or AAC audio.');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    onUploadSongs(audioFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  return (
    <aside className="song-library-card">
      <div className="library-header">
        <div className="header-title-row">
          <div className="icon-badge">
            <Music className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3>Song Library</h3>
            <span className="text-xs text-muted">
              {songs.length} {songs.length === 1 ? 'track' : 'tracks'} ready
            </span>
          </div>
        </div>

        <button
          className="btn-upload"
          onClick={() => fileInputRef.current?.click()}
          title="Upload audio files"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          <span>Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {uploadError && (
        <div className="library-error-banner">
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Target Area */}
      <div
        className={`dropzone-box ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-5 h-5 dropzone-icon" />
        <span className="dropzone-text">Drop MP3, WAV, or M4A here</span>
      </div>

      {/* Song List Items */}
      <div className="playlist-scroll">
        {songs.map((song, index) => {
          const isActive = index === currentSongIndex;
          return (
            <div
              key={song.id || index}
              className={`song-item ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectSong(index)}
            >
              <div className="song-left-col">
                <div className={`song-disc-indicator ${isActive ? 'spin' : ''}`}>
                  {isActive ? (
                    <Disc className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Disc className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="song-info">
                  <div className="song-title" title={song.name}>
                    {song.name}
                  </div>
                  <div className="song-artist">
                    {song.artist || 'Uploaded Audio'}
                    {song.isSample && (
                      <span className="sample-badge">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Sample
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="song-right-col" onClick={(e) => e.stopPropagation()}>
                <span className="song-duration">
                  {formatTime(song.duration, false)}
                </span>

                {!song.isSample && (
                  <button
                    className="btn-delete-song"
                    title="Remove from library"
                    onClick={() => onDeleteSong(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
