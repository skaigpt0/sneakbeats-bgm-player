// ============================================================
//  BGM Player  —  Shift x2 = ON (or +1 track if already ON)
//                  Shift x3 = OFF
//                  Sneak+Jump = +10 tracks (while ON)
//  Plays vanilla soundtrack in album release order (91 tracks)
// ============================================================
import { world, system } from "@minecraft/server";
import { TRACKS } from "./tracks.js";

// ---- settings ----
const PRESS_WINDOW = 10; // ticks (0.5s) allowed between sneak taps
const FADE = 0.3;        // seconds, used for both "music stop" and "music play" fades
const OFF_FADE = 1;      // seconds, longer deliberate fade-out when turning BGM off
const AUDIO_COOLDOWN = Math.ceil(FADE * 2 * 20); // ticks needed for a stop+play fade pair to fully settle
const DISPLAY_DURATION = 200; // ticks (10s) the title/artist stays on screen after each change

// ---- state ----
let enabled = false;
let index = 0;
let remaining = 0;       // seconds left in current track
let presses = 0;
let lastPressTick = -999;
let audioDirty = false;  // true when `index` changed but the actual music command hasn't been sent yet
let audioReadyTick = 0;  // earliest tick we're allowed to send the next music command
let displayUntilTick = 0; // stop refreshing the title/artist text once currentTick passes this
const prevSneak = new Map();
const prevCombo = new Map();

// drop tracking state for players who disconnect, so these Maps don't grow unbounded
world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  prevSneak.delete(playerId);
  prevCombo.delete(playerId);
});

function dim() {
  return world.getDimension("overworld");
}

function runCmd(c) {
  try { dim().runCommand(c); } catch (e) {}
}

function showAll(text) {
  for (const p of world.getAllPlayers()) {
    try { p.onScreenDisplay.setActionBar(text); } catch (e) {}
  }
}

function nowPlayingText() {
  const t = TRACKS[index];
  return `\u00A7f${t.title} \u00A77\u2014 ${t.artist}  \u00A78[${index + 1}/${TRACKS.length}]`;
}

function play(i) {
  index = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
  remaining = TRACKS[index].sec;
  showAll(nowPlayingText());
  displayUntilTick = system.currentTick + DISPLAY_DURATION; // (re)start the 10s display window from this content change
  audioDirty = true; // actual "music" command is sent by sendAudioIfDue() once the previous fade has settled
}

// Sends the pending music change at most once per AUDIO_COOLDOWN ticks, always
// for whatever track is current at the time \u2014 rapid skips only update the
// display until the cooldown clears, so stop/play fades never overlap.
function sendAudioIfDue(t) {
  if (!enabled || !audioDirty || t < audioReadyTick) return;
  const track = TRACKS[index];
  runCmd(`music stop ${FADE}`);
  runCmd(`music play ${track.id} 1.0 ${FADE} play_once`);
  audioDirty = false;
  audioReadyTick = t + AUDIO_COOLDOWN;
}

function turnOn() {
  enabled = true;
  play(index);
}

function turnOff() {
  enabled = false;
  audioDirty = false;
  runCmd(`music stop ${OFF_FADE}`);
  showAll("\u00A77BGM OFF");
}

// ---- sneak gesture detection (every tick) ----
system.runInterval(() => {
  const t = system.currentTick;

  for (const p of world.getAllPlayers()) {
    const was = prevSneak.get(p.id) === true;
    if (p.isSneaking && !was) {
      // rising edge = one sneak tap
      presses = (t - lastPressTick <= PRESS_WINDOW) ? presses + 1 : 1;
      lastPressTick = t;
      if (presses >= 3) {          // triple sneak -> OFF
        presses = 0;
        turnOff();
      }
    }
    prevSneak.set(p.id, p.isSneaking);

    // sneak+jump held together -> +10 tracks (only while ON)
    const combo = p.isSneaking && p.isJumping;
    const wasCombo = prevCombo.get(p.id) === true;
    if (combo && !wasCombo && enabled) {
      play(index + 10);
    }
    prevCombo.set(p.id, combo);
  }

  // window closed with exactly 2 taps -> ON, or +1 track if already ON
  if (presses === 2 && t - lastPressTick > PRESS_WINDOW) {
    presses = 0;
    enabled ? play(index + 1) : turnOn();
  }
  if (presses === 1 && t - lastPressTick > PRESS_WINDOW) {
    presses = 0; // single tap = normal sneak, ignore
  }

  sendAudioIfDue(t);
}, 1);

// ---- playback timer + HUD (every second) ----
system.runInterval(() => {
  if (!enabled) return;
  remaining--;
  if (remaining <= 0) {
    play(index + 1);               // auto-advance to next track
    return;
  }
  if (system.currentTick < displayUntilTick) {
    showAll(nowPlayingText());     // keep refreshing until the 10s display window ends, then let it fade
  }
}, 20);