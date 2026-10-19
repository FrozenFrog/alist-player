# SoundCloud-style Player for Alist

## Overview

This is a custom-designed, SoundCloud-style audio player integrated for use with **Alist** / **OpenList**. It features bespoke audio controls and utilizes the **[Wavesurfer.js](https://wavesurfer.xyz/)** (v8) library to beautifully render the audio waveform.


<img width="963" height="832" alt="Screenshot 2025-10-11 at 11 32 21" src="https://github.com/user-attachments/assets/2523d645-4737-4bc3-96ee-112566f7d42d" />


## Installation Guide

To set up this player, navigate to **Alist Settings** -> **Preview** and append the following configuration block:

```json
"wav,mp3,m4a": {
    "Wavesurfer.js": "https://<your-github-page>.github.io/alist-player/index.html?url=$e_url"
}
```
> The audio server must allow CORS requests from your GitHub Pages domain, since the waveform is built by fetching and decoding the audio file.

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

Open `http://localhost:5173/?url=<audio-url>` to try a track.

## Deploying to GitHub Pages

Every push to `main` builds the site and deploys it via `.github/workflows/deploy.yml`.
In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions** (one-time setup).
Dependabot (`.github/dependabot.yml`) opens weekly PRs when a new wavesurfer.js version is released.

## Credits and Acknowledgements

This project would not have been possible without the contributions and inspiration from:

* **HassanCorrigan**
* **emulienfou** ([Gist](https://gist.github.com/emulienfou/ddfea6f416379253f91f67448a96f826))
