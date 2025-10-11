const playButton = document.querySelector('#playButton')
const playButtonIcon = document.querySelector('#playButtonIcon')
const waveform = document.querySelector('#waveform')
const fileNameTitle = document.querySelector('#trackinfo')
const volumeIcon = document.querySelector('#volumeIcon')
const volumeSlider = document.querySelector('#volumeSlider')
const currentTime = document.querySelector('#currentTime')
const totalDuration = document.querySelector('#totalDuration')

const ctx = document.createElement('canvas').getContext('2d')
const linGrad = ctx.createLinearGradient(0, 0, 0, 140)
linGrad.addColorStop(0.5, 'rgba(116, 116, 116, 1.000)')
linGrad.addColorStop(0.5, 'rgba(183, 183, 183, 1.000)')

const wlinGrad = ctx.createLinearGradient(0, 0, 0, 140)
wlinGrad.addColorStop(0.5, 'rgba(255,98,50, 1.000)')
wlinGrad.addColorStop(0.5, 'rgba(255,192,160, 1.000)')

const initializeWavesurfer = () => {
  return WaveSurfer.create({
    container: waveform,
    backend: 'MediaElement',
    height: 80,
    normalize: true,
    responsive: true,
    cursorColor: 'transparent',
    scrollParent: false,
    barGap: 2,
    barWidth: 2,
    cursorWidth: 3,
    progressColor: wlinGrad,
    waveColor: linGrad
  })
}

const togglePlay = async () => {
  await wavesurfer.playPause()
  const isPlaying = wavesurfer.isPlaying()
  if (isPlaying) playButtonIcon.src = './assets/icons/pause.svg'
  else playButtonIcon.src = './assets/icons/play.svg'
}

const handleVolumeChange = e => {
  // Set volume as input value divided by 100
  // NB: Wavesurfer only excepts volume value between 0 - 1
  const volume = e.target.value / 100
  wavesurfer.setVolume(volume)
  // Save the value to local storage so it persists between page reloads
  localStorage.setItem('audio-player-volume', volume)
}

const setVolumeFromLocalStorage = () => {
  // Retrieves the volume from local storage, or falls back to default value of 50
  volumeSlider.value = localStorage.getItem('audio-player-volume') * 100 || 50
}

const formatTimecode = seconds => {
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}

const toggleMute = () => {
  wavesurfer.toggleMute()
  const isMuted = wavesurfer.getMute()
  if (isMuted) {
    volumeIcon.src = './assets/icons/mute.svg'
    volumeSlider.disabled = true
  } else {
    volumeSlider.disabled = false
    volumeIcon.src = './assets/icons/volume.svg'
  }
}

// Create a new instance and load the wavesurfer
const wavesurfer = initializeWavesurfer()
const params = new URLSearchParams(document.location.search);
const audioUrl = params.get("url");
const lastSlashIndex = audioUrl.lastIndexOf('/');

let encodedFileName = audioUrl.substring(lastSlashIndex + 1);
const queryIndex = encodedFileName.indexOf('?');
  if (queryIndex !== -1) {
  encodedFileName = encodedFileName.substring(0, queryIndex);
}
let fileName;
try {
  const decodedFileName = decodeURIComponent(encodedFileName);
  fileName = decodedFileName;
} catch (e) {
  console.error("Lỗi giải mã URL:", e);
  fileName = encodedFileName;
}

// Override the renderer to draw wave
wavesurfer.drawer.drawWave = (peaks, channelIndex, start, end) => {
  return wavesurfer.drawer.prepareDraw(
    peaks,
    channelIndex,
    start,
    end,
    ({ absmax, hasMinVals, height, offsetY, halfH, peaks, channelIndex }) => {
      if (!hasMinVals) {
        const reflectedPeaks = []
        const len = peaks.length
        let i = 0
        for (i; i < len; i++) {
          reflectedPeaks[2 * i] = peaks[i]
          reflectedPeaks[2 * i + 1] = 0 // -peaks[i]
        }
        peaks = reflectedPeaks
      }

      // if drawWave was called within ws.empty we don't pass a start and
      // end and simply want a flat line
      if (start !== undefined) {
        // wavesurfer.drawer.drawLine(peaks, absmax, halfH, offsetY, start, end, channelIndex)
        wavesurfer.drawer.drawLine(peaks, absmax, halfH = wavesurfer.params.height, offsetY, start, end, channelIndex)
      }

      // always draw a median line
      wavesurfer.drawer.fillRect(
        0,
        halfH + offsetY - this.halfPixel,
        this.width,
        this.halfPixel,
        this.barRadius,
        channelIndex
      )
    }
  )
}

// Override the renderer to draw bars
wavesurfer.drawer.drawBars = (peaks, channelIndex, start, end) => {
  return wavesurfer.drawer.prepareDraw(
    peaks,
    channelIndex,
    start,
    end,
    ({ absmax, hasMinVals, height, offsetY, halfH, peaks, channelIndex }) => {
      // if drawBars was called within ws.empty we don't pass a start and
      // don't want anything to happen
      if (start === undefined) return
      // Skip every other value if there are negatives.

      const peakIndexScale = hasMinVals ? 2 : 1
      const length = peaks.length / peakIndexScale
      const bar = wavesurfer.params.barWidth * wavesurfer.params.pixelRatio
      const gap =
        wavesurfer.params.barGap === null
          ? Math.max(wavesurfer.params.pixelRatio, ~~(bar / 2))
          : Math.max(
            wavesurfer.params.pixelRatio,
            wavesurfer.params.barGap * wavesurfer.params.pixelRatio
          )
      const step = bar + gap

      const scale = length / wavesurfer.drawer.width
      const first = start
      const last = end

      let i
      const topRatio = 0.7
      const bottomRatio = 0.25
      const topBottomGap = 1


      for (i = first; i < last; i += step) {
        const peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0
        const h = Math.abs(Math.round(peak / absmax * height))

        // Upper bar
        const fx = i + wavesurfer.drawer.halfPixel
        let fy = (height * topRatio) + offsetY - (h * topRatio)
        const fwidth = bar + wavesurfer.drawer.halfPixel
        let fheight = h * topRatio

        wavesurfer.drawer.fillRect(fx, fy, fwidth, fheight, this.barRadius, channelIndex)

        // Recalculate for lower bar
        fy = (height * topRatio) + offsetY + topBottomGap
        fheight = h * bottomRatio

        wavesurfer.drawer.fillRect(fx, fy, fwidth, fheight, this.barRadius, channelIndex)
      }
    })
}

wavesurfer.load(audioUrl)
fileNameTitle.textContent = fileName;


// Javascript Event listeners
window.addEventListener('load', setVolumeFromLocalStorage)
playButton.addEventListener('click', togglePlay)
volumeIcon.addEventListener('click', toggleMute)
volumeSlider.addEventListener('input', handleVolumeChange)

// Wavesurfer event listeners
wavesurfer.on('ready', () => {
  // Set wavesurfer volume
  wavesurfer.setVolume(volumeSlider.value / 100)
  // Set audio track total duration
  const duration = wavesurfer.getDuration()
  totalDuration.innerHTML = formatTimecode(duration)
})
// Sets the timecode current timestamp as audio plays
wavesurfer.on('audioprocess', () => {
  const time = wavesurfer.getCurrentTime()
  currentTime.innerHTML = formatTimecode(time)
})
// Resets the play button icon after audio ends
wavesurfer.on('finish', () => {
  playButtonIcon.src = './assets/icons/play.svg'
})