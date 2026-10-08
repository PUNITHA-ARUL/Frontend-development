import { useRef, useState } from 'react'
import { Music2 } from 'lucide-react'
import { MyRingtones } from './components/MyRingtones'
import { PlayerControls } from './components/PlayerControls'
import { RingtoneExporter } from './components/RingtoneExporter'
import { SongList } from './components/SongList'
import { WaveformEditor } from './components/WaveformEditor'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useRingtoneExport } from './hooks/useRingtoneExport'
import { useSavedRingtones } from './hooks/useSavedRingtones'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [currentSongIndex, setCurrentSongIndex] = useState(-1)
  const containerRef = useRef(null)
  const currentSong = songs[currentSongIndex] ?? null
  const audio = useAudioPlayer({ containerRef, currentSong })
  const { cutAndExport } = useRingtoneExport()
  const saved = useSavedRingtones()

  const selectSong = (index) => {
    if (index >= 0 && index < songs.length) setCurrentSongIndex(index)
  }

  const uploadSongs = (files) => {
    const uploadedSongs = files.map((file) => {
      const url = URL.createObjectURL(file)
      const audioElement = new Audio(url)
      const song = {
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        artist: 'Uploaded Audio',
        file,
        url,
        duration: 0,
      }

      audioElement.addEventListener('loadedmetadata', () => {
        setSongs((current) => current.map((item) =>
          item.id === song.id ? { ...item, duration: audioElement.duration } : item
        ))
      }, { once: true })

      return song
    })

    setSongs((current) => {
      if (currentSongIndex < 0 && uploadedSongs.length) {
        setCurrentSongIndex(current.length)
      }
      return [...current, ...uploadedSongs]
    })
  }

  const deleteSong = (index) => {
    const song = songs[index]
    if (song?.url) URL.revokeObjectURL(song.url)
    setSongs((current) => current.filter((_, songIndex) => songIndex !== index))

    if (index === currentSongIndex) {
      setCurrentSongIndex(songs.length > 1 ? Math.max(0, index - 1) : -1)
    } else if (index < currentSongIndex) {
      setCurrentSongIndex((current) => current - 1)
    }
  }

  const moveSong = (direction) => {
    if (songs.length < 2) return
    setCurrentSongIndex((current) => (current + direction + songs.length) % songs.length)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="Ringcraft home">
          <span className="brand-mark"><Music2 size={19} /></span>
          <span>ringcraft</span>
        </a>
        <span className="header-note">AUDIO WORKSHOP <i /> READY</span>
      </header>

      <div className="workspace" id="top">
        <section className="editor-column" aria-label="Ringtone editor">
          <div className="page-heading">
            <div>
              <p className="eyebrow">PERSONAL AUDIO STUDIO</p>
              <h1>Shape your next ringtone.</h1>
            </div>
            <span className="format-note">MP3 / WAV</span>
          </div>

          <WaveformEditor
            containerRef={containerRef}
            currentSong={currentSong}
            region={audio.region}
            duration={audio.duration}
            isLoading={audio.isLoadingSong}
            error={audio.audioError}
            zoom={audio.zoom}
            onZoomChange={audio.setZoom}
            onAutoPick={audio.autoPick}
            onUpdateRegion={audio.updateRegion}
          />

          <PlayerControls
            isPlaying={audio.isPlaying}
            currentTime={audio.currentTime}
            duration={audio.duration}
            volume={audio.volume}
            isMuted={audio.isMuted}
            isPreviewingRegion={audio.isPreviewingRegion}
            isLooping={audio.isLooping}
            fadeIn={audio.fadeIn}
            fadeOut={audio.fadeOut}
            fadeInDuration={audio.fadeInDuration}
            fadeOutDuration={audio.fadeOutDuration}
            onPlayPause={audio.playPause}
            onPreviewRingtone={audio.previewRingtone}
            onPrevSong={() => moveSong(-1)}
            onNextSong={() => moveSong(1)}
            onVolumeChange={audio.setVolume}
            onToggleMute={audio.toggleMute}
            onToggleLoop={audio.toggleLoop}
            onToggleFadeIn={audio.setFadeIn}
            onToggleFadeOut={audio.setFadeOut}
            onFadeInDurationChange={audio.setFadeInDuration}
            onFadeOutDurationChange={audio.setFadeOutDuration}
          />

          <RingtoneExporter
            audioBuffer={audio.audioBuffer}
            currentSong={currentSong}
            region={audio.region}
            fadeIn={audio.fadeIn}
            fadeOut={audio.fadeOut}
            fadeInDuration={audio.fadeInDuration}
            fadeOutDuration={audio.fadeOutDuration}
            onExport={cutAndExport}
            onSaveToMyRingtones={saved.addRingtone}
          />
        </section>

        <aside className="library-column" aria-label="Audio library">
          <SongList
            songs={songs}
            currentSongIndex={currentSongIndex}
            onSelectSong={selectSong}
            onUploadSongs={uploadSongs}
            onDeleteSong={deleteSong}
          />
          <MyRingtones
            ringtones={saved.savedRingtones}
            playingId={saved.playingId}
            audioProgress={saved.audioProgress}
            onTogglePlay={saved.togglePlayRingtone}
            onDownload={saved.downloadRingtone}
            onDelete={saved.removeRingtone}
          />
        </aside>
      </div>
    </main>
  )
}

export default App
