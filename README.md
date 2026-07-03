# Vlog

A minimalist mobile app for quick vlogging. Record short clips into named sessions, import from your camera roll, lightly edit, and export — without a heavy editing workflow.

## Features

- **Vlog sessions** — Create named folders (e.g. "Vlog 1", "Tokyo trip")
- **Quick capture** — Record clips up to 10 seconds (tap to stop early)
- **Auto gallery** — Each clip is saved into the session automatically
- **Camera roll import** — Add photos and videos from your library
- **Basic editing** — Trim video, add text overlays, delete clips
- **Preview** — Play through your session in order
- **Export** — Save clips to a camera roll album and/or share the project folder
- **Persistent projects** — Sessions and media are stored on device

## Get started

```bash
cd vlog-app
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator (macOS only).

## How to use

1. Tap **New** to create a vlog session and name it
2. **Record** short clips or **Import** from your camera roll
3. Tap a clip to trim or add text overlays (optional)
4. **Preview** the full session, then **Export**

Long-press a session on the home screen to delete it.

## Tech stack

- [Expo](https://expo.dev) + React Native
- expo-camera, expo-image-picker, expo-media-library
- AsyncStorage + FileSystem for local project storage

## Project structure

```
app/                  Screens (Expo Router)
components/           UI, camera, clip previews
context/              Session state
lib/                  Types, storage, export
constants/theme.ts    Minimal design tokens
```

## Notes

- Projects are saved locally under the app documents directory
- Export creates a gallery album with your session name
- Text overlays appear in preview; burned-in rendering on export can be added with FFmpeg in a dev build
