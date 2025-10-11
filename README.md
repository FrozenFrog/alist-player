# SoundCloud-style Player for Alist

## Overview

This is a custom-designed, SoundCloud-style audio player integrated for use with **Alist**. It features bespoke audio controls and utilizes the **[Wavesurfer.js](http://wavesurfer-js.org/)** library to beautifully render the audio waveform.

## Installation Guide

To set up this player, navigate to **Alist Settings** -> **Preview** and append the following configuration block:

```json
"wav,mp3,m4a": {
    "Wavesurfer.js": "https://<your-github-page>.github.io/alist-player/index.html?url=$e_url"
}
```
## Credits and Acknowledgements

This project would not have been possible without the contributions and inspiration from:

* **HassanCorrigan**
* **emulienfou** ([Gist](https://gist.github.com/emulienfou/ddfea6f416379253f91f67448a96f826))
