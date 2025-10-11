# SoundCloud-style Player for Alist

## Overview

This is a custom-designed, SoundCloud-style audio player integrated for use with **Alist**. It features bespoke audio controls and utilizes the **[Wavesurfer.js](http://wavesurfer-js.org/)** library to beautifully render the audio waveform.


<img width="963" height="832" alt="Screenshot 2025-10-11 at 11 32 21" src="https://github.com/user-attachments/assets/2523d645-4737-4bc3-96ee-112566f7d42d" />


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
