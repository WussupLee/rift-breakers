# Audio overhaul verification — 2026-09-27

- 154 unit/regression tests pass; TypeScript and animation/audio asset validation pass.
- All 44 fighter attacks map to recorded cues. All 38 effect files plus the exact Midnight Loop MP3 decode and load in Chromium with no failed audio requests.
- Chromium phone-layout test plays all 35 logical cues and verifies gesture unlock, settings audition, music preview, pause/resume, mute/unmute, results cleanup and engine reuse on rematch.
- Full-volume offline stress mix: 12 aligned heavy hits, three voices, crowd cheer and music; peak −2.094 dBFS, RMS −16.592 dBFS. This deliberately exceeds a normal four-fighter moment. No clipping in this fixture; not a guarantee for every conceivable mix or hardware output.
- Four independent Chromium clients using real PeerJS/WebRTC load music and samples and each receive one shared throw cue and a jump cue. Room ownership, touch input, host pause, results, CPU takeover, rematch and disconnection regression checks pass.
- Desktop/phone solo play flow, keyboard control, multitouch, results and rematch pass.
- Windows Playwright WebKit exposes neither AudioContext nor OfflineAudioContext. Silent gameplay and touch/layout behavior are checked there; Safari audio is NOT verified by that test. Firefox playback could not be checked because its installed test executable failed to launch.
- Physical iPhone/Android speaker and headphone listening has not been performed. Use Settings → Sound Check to audition the actual runtime mix; voice/crowd sliders are independent submixes below the SFX master.
- Local Windows static export completes, then the existing framework process reports an asynchronous-handle shutdown assertion. Exported files are validated and browser-tested; Linux GitHub Actions performs the clean release build.

The source and processing register is [SOUND-DESIGN.md](SOUND-DESIGN.md); exact hashes and per-file measurements are [manifest.json](manifest.json). Music credit/license documentation remains pending from the owner, who reports a royalty-free beat.
