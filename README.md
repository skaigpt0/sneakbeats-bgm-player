# Sneakbeats — BGM Player

A Minecraft **Bedrock Edition** addon that lets you play all **91 vanilla music tracks** anytime, anywhere — controlled entirely by sneak gestures.

No items. No menus. Zero gameplay impact.

## Controls

| Gesture | Action |
|---|---|
| **Sneak ×2** (quick double-tap) | Play / Skip to next track |
| **Sneak ×3** | Stop music |
| **Sneak + Jump** | Jump 10 tracks ahead |

Works with keyboard, controller, and touch.
While playing, the current track title and artist are shown on screen — e.g. `♪ Sweden — C418 [7/91]`.

## Download

**[Download on CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/sneakbeats-bgm-player)** 
Or grab the `.mcaddon` from [Releases](../../releases).

## How it works

- Contains **no audio files** — it registers the music files already shipped inside vanilla Minecraft and plays them through the game's music channel, replacing the ambient music queue.
- Runs on **stable Script APIs** (no experimental toggles).
- `bgm_player_bp` — behavior pack (sneak gesture detection, playback control, HUD)
- `bgm_player_rp` — resource pack (per-track sound definitions for all 91 tracks)

## License

All rights reserved. Source is public for transparency and learning.
**Redistribution or re-uploading of this addon is not permitted.**
Official download: CurseForge (link above).

All music belongs to Mojang and the original composers (C418, Lena Raine, Kumi Tanioka, Aaron Cherof, Samuel Åberg, Amos Roddy, Hyper Potions, fingerspit).
