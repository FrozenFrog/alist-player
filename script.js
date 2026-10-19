import WaveSurfer from 'wavesurfer.js'
import './style.css'
import playIcon from './assets/icons/play.svg'
import pauseIcon from './assets/icons/pause.svg'
import volumeIconSrc from './assets/icons/volume.svg'
import muteIcon from './assets/icons/mute.svg'

const playButton = document.querySelector('#playButton')
const playButtonIcon = document.querySelector('#playButtonIcon')
const rewindButton = document.querySelector('#rewindButton')
const forwardButton = document.querySelector('#forwardButton')
const waveform = document.querySelector('#waveform')
const fileNameTitle = document.querySelector('#trackinfo')
const volumeIcon = document.querySelector('#volumeIcon')
const volumeSlider = document.querySelector('#volumeSlider')
const currentTime = document.querySelector('#currentTime')
const totalDuration = document.querySelector('#totalDuration')

const VOLUME_STORAGE_KEY = 'audio-player-volume'

// Waveform geometry (CSS pixels, scaled by the device pixel ratio when drawing)
const WAVE_HEIGHT = 80
const BAR_WIDTH = 2
const BAR_GAP = 2
// SoundCloud style: upper bars take 70% of the height, the "reflection" below takes 25%
const TOP_RATIO = 0.7
const BOTTOM_RATIO = 0.25
const TOP_BOTTOM_GAP = 1

const getPixelRatio = () => Math.max(1, window.devicePixelRatio || 1)

// Two-tone gradients with a hard stop in the gap between the upper bars and the reflection.
// Wavesurfer paints the progress layer by masking the waveform with `progressColor`,
// so the gradients must be built in canvas pixel coordinates.
const createGradients = () => {
  const height = Math.round(WAVE_HEIGHT * getPixelRatio())
  const split = (height * TOP_RATIO + TOP_BOTTOM_GAP * getPixelRatio() / 2) / height
  const ctx = document.createElement('canvas').getContext('2d')

  const waveColor = ctx.createLinearGradient(0, 0, 0, height)
  waveColor.addColorStop(split, 'rgb(116, 116, 116)')
  waveColor.addColorStop(split, 'rgb(183, 183, 183)')

  const progressColor = ctx.createLinearGradient(0, 0, 0, height)
  progressColor.addColorStop(split, 'rgb(255, 98, 50)')
  progressColor.addColorStop(split, 'rgb(255, 192, 160)')

  return { waveColor, progressColor }
}

// Peak of the whole track, so every canvas chunk is normalized against the same value
let peakSource = null
let globalPeak = 1
const getGlobalPeak = () => {
  const buffer = wavesurfer.getDecodedData()
  if (buffer && buffer !== peakSource) {
    peakSource = buffer
    let max = 0
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < data.length; i++) {
        const value = Math.abs(data[i])
        if (value > max) max = value
      }
    }
    globalPeak = max || 1
  }
  return globalPeak
}

// Draw SoundCloud-style bars: an upper bar plus a shorter reflection below it
const renderBars = (channels, ctx) => {
  const { width, height } = ctx.canvas
  const pixelRatio = getPixelRatio()
  const bar = BAR_WIDTH * pixelRatio
  const step = bar + BAR_GAP * pixelRatio
  const gap = TOP_BOTTOM_GAP * pixelRatio
  const length = channels[0].length
  const absmax = getGlobalPeak()
  const baseline = height * TOP_RATIO

  for (let x = 0; x < width; x += step) {
    // Loudest sample of any channel within this bar's slice of the audio
    const from = Math.floor((x / width) * length)
    const to = Math.max(from + 1, Math.floor(((x + step) / width) * length))
    let peak = 0
    for (const channel of channels) {
      for (let i = from; i < to && i < length; i++) {
        const value = Math.abs(channel[i])
        if (value > peak) peak = value
      }
    }

    const h = Math.round((peak / absmax) * height)
    if (h === 0) continue

    const top = h * TOP_RATIO
    ctx.fillRect(x, baseline - top, bar, top)
    ctx.fillRect(x, baseline + gap, bar, h * BOTTOM_RATIO)
  }
}

const initializeWavesurfer = () => {
  return WaveSurfer.create({
    container: waveform,
    height: WAVE_HEIGHT,
    cursorWidth: 0,
    dragToSeek: true,
    renderFunction: renderBars,
    ...createGradients()
  })
}

const getFileName = url => {
  let encodedFileName = url.substring(url.lastIndexOf('/') + 1)
  const queryIndex = encodedFileName.indexOf('?')
  if (queryIndex !== -1) {
    encodedFileName = encodedFileName.substring(0, queryIndex)
  }
  try {
    return decodeURIComponent(encodedFileName)
  } catch (e) {
    console.error('Failed to decode file name:', e)
    return encodedFileName
  }
}

const formatTimecode = seconds => {
  return new Date(seconds * 1000).toISOString().substring(11, 19)
}

const togglePlay = () => {
  wavesurfer.playPause()
}

const setPlayIcon = isPlaying => {
  playButtonIcon.src = isPlaying ? pauseIcon : playIcon
}

const handleVolumeChange = e => {
  // NB: Wavesurfer only accepts volume values between 0 - 1
  const volume = e.target.value / 100
  wavesurfer.setVolume(volume)
  // Save the value to local storage so it persists between page reloads
  localStorage.setItem(VOLUME_STORAGE_KEY, volume)
}

const setVolumeFromLocalStorage = () => {
  // Retrieves the volume from local storage, or falls back to default value of 50
  const stored = localStorage.getItem(VOLUME_STORAGE_KEY)
  volumeSlider.value = stored === null ? 50 : stored * 100
}

const forward10seconds = () => {
  wavesurfer.skip(10)
}

const rewind10seconds = () => {
  wavesurfer.skip(-10)
}

const toggleMute = () => {
  const isMuted = !wavesurfer.getMuted()
  wavesurfer.setMuted(isMuted)
  volumeIcon.src = isMuted ? muteIcon : volumeIconSrc
  volumeSlider.disabled = isMuted
}

// Rebuild the gradients when the pixel ratio changes (e.g. browser zoom, moving to another screen)
let lastPixelRatio = getPixelRatio()
const handleResize = () => {
  if (getPixelRatio() === lastPixelRatio) return
  lastPixelRatio = getPixelRatio()
  wavesurfer.setOptions(createGradients())
}

// Create a new instance and load the audio passed via ?url=
const wavesurfer = initializeWavesurfer()
const audioUrl = new URLSearchParams(document.location.search).get('url')

setVolumeFromLocalStorage()
wavesurfer.setVolume(volumeSlider.value / 100)

if (audioUrl) {
  fileNameTitle.textContent = getFileName(audioUrl)
  wavesurfer.load(audioUrl).catch(() => {})
} else {
  fileNameTitle.textContent = 'No audio URL provided (use ?url=...)'
}

// Javascript Event listeners
playButton.addEventListener('click', togglePlay)
volumeIcon.addEventListener('click', toggleMute)
rewindButton.addEventListener('click', rewind10seconds)
forwardButton.addEventListener('click', forward10seconds)
volumeSlider.addEventListener('input', handleVolumeChange)
window.addEventListener('resize', handleResize)

// Wavesurfer event listeners
wavesurfer.on('ready', duration => {
  totalDuration.textContent = formatTimecode(duration)
})
// Sets the timecode current timestamp as audio plays or is seeked
wavesurfer.on('timeupdate', time => {
  currentTime.textContent = formatTimecode(time)
})
wavesurfer.on('play', () => setPlayIcon(true))
wavesurfer.on('pause', () => setPlayIcon(false))
// Resets the play button icon after audio ends
wavesurfer.on('finish', () => setPlayIcon(false))
wavesurfer.on('error', error => {
  console.error('Wavesurfer error:', error)
  fileNameTitle.textContent = `${getFileName(audioUrl || '')} — failed to load audio`
})
