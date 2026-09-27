# RIFT//BREAKERS — recorded audio guide

## Mix direction

Movement is intentionally restrained. Jumping uses soft recorded cloth, not a rising arcade chirp. Attack swings are quieter than confirmed punch impacts. Quiet hurt grunts alternate recorded takes. Crowd gasps begin at launch force 14; force 17 adds a launch accent. Knockouts replace a gasp with a short cheer. Crowd reactions are global and limited to roughly one every 5.5–6.5 seconds, not every hit.

The SFX master defaults to 55%. Voice and crowd submixes default to 65% of SFX. Music defaults to 16%, with a further 0.30 gain to accommodate the original beat’s hot mastering. All sounds pass through a shared compressor (−10 dB threshold, 12:1 ratio, 3 ms attack, 150 ms release) and 0.75 output gain. Footsteps/jumps are over 14 dB quieter in cue gain than contact. Music ducks to 46% briefly on heavy contact, launches and crowd reactions. Sample voices are capped at 12 effects, 3 grunts and 1 crowd recording. Quiet movement cannot evict a higher-priority impact.

## Complete cue list

Gain is before the SFX master and voice/crowd submix. Variants rotate; no synthesized fallback or generated voice is used. Every one of the 44 moves uses its actual activation event, with the move ID carried to network guests.

| Cue | Action | Sample file(s) | Gain | Bus | Minimum interval |
| --- | --- | --- | --- | --- | --- |
| step | Running footsteps | step0.mp3, step1.mp3, step2.mp3, step3.mp3 | 0.16 | sfx | 170 ms |
| jump | Jump / air jump / wall jump | cloth1.mp3, cloth2.mp3 | 0.17 | sfx | 100 ms |
| land | Soft landing | land.mp3 | 0.24 | sfx | 130 ms |
| hardLand | Heavy landing | land.mp3, heavy0.mp3 | 0.36 | sfx | 180 ms |
| dodge | Spot / air dodge | cloth3.mp3 | 0.3 | sfx | 150 ms |
| dash | Ground dash | cloth2.mp3 | 0.22 | sfx | 150 ms |
| drop | Drop through / fast fall | cloth1.mp3 | 0.1 | sfx | 300 ms |
| swing | Martial light swing | cloth3.mp3 | 0.34 | sfx | 85 ms |
| heavySwing | Martial heavy swing | slice2.mp3 | 0.4 | sfx | 100 ms |
| blade | Sword / poleaxe swing | slice1.mp3, slice2.mp3 | 0.4 | sfx | 85 ms |
| magic | Staff bolt / orb / shard | magic1.mp3, magic2.mp3 | 0.34 | sfx | 100 ms |
| beam | Rift beam / crystal / mine | beam.mp3 | 0.42 | sfx | 180 ms |
| recovery | Rising recovery | slice2.mp3 | 0.36 | sfx | 180 ms |
| teleport | Teleport recovery | respawn.mp3 | 0.38 | sfx | 250 ms |
| charge | Heavy charge onset | charge.mp3 | 0.2 | sfx | 500 ms |
| hit | Light hit contact | punch0.mp3, punch1.mp3, punch2.mp3 | 0.85 | sfx | 45 ms |
| heavyHit | Heavy hit contact | heavy0.mp3, heavy1.mp3, heavy2.mp3 | 1 | sfx | 65 ms |
| launch | Strong launch accent | metal.mp3 | 0.65 | sfx | 160 ms |
| ko | Knockout portal | portal.mp3 | 0.85 | sfx | 200 ms |
| respawn | Respawn portal | respawn.mp3 | 0.32 | sfx | 200 ms |
| pickup | Item pickup / catch | handle.mp3 | 0.27 | sfx | 150 ms |
| throw | Item throw | slice1.mp3 | 0.33 | sfx | 150 ms |
| repair | Repair Byte consumed | repair.mp3 | 0.32 | sfx | 300 ms |
| explosion | Rift Bomb explosion | explosion.mp3 | 0.85 | sfx | 160 ms |
| count | Countdown tick | count.mp3 | 0.32 | sfx | 500 ms |
| start | Brawl begins | confirm.mp3 | 0.48 | sfx | 700 ms |
| sudden | Sudden death | beam.mp3 | 0.55 | sfx | 1000 ms |
| victory | Match complete | confirm.mp3 | 0.48 | sfx | 1000 ms |
| ui | Menu selection | click.mp3 | 0.32 | sfx | 60 ms |
| kairoVoice | Kairo quiet hurt grunt | grunt4.mp3, grunt5.mp3 | 0.28 | voices | 650 ms |
| regentVoice | Regent quiet hurt grunt | grunt3.mp3, grunt5.mp3 | 0.27 | voices | 650 ms |
| vexaVoice | Vexa quiet hurt grunt | vexa1.mp3, vexa2.mp3, vexa3.mp3 | 0.26 | voices | 650 ms |
| omenVoice | Omen quiet hurt grunt | grunt1.mp3, grunt4.mp3 | 0.25 | voices | 650 ms |
| gasp | Crowd gasp — strong hit | gasp.mp3 | 0.42 | crowd | 5500 ms |
| cheer | Crowd cheer — knockout / finish | cheer.mp3 | 0.48 | crowd | 6500 ms |

Recovery replaces the ordinary swing cue; Omen uses a teleport recording. Regent and Vexa use blade recordings; Kairo uses cloth/light and blade/heavy swooshes; Omen uses recorded sci-fi shots. A hit triggers the victim’s voice, not the attacker’s. Grunts have a shared 650 ms per-fighter cooldown. Item throws are distinguished from pickup/catch events; healing and explosions have separate cues. Footsteps follow distance traveled while grounded, not an always-running timer. Fast fall and platform drop get a quiet cloth cue. Gravity-cancel attacks use the dodge plus the appropriate grounded attack; no extra unrelated sound is added. Misses do not play contact or crowd audio. Eliminated, frozen and airborne fighters do not generate footsteps.

## Source credits / license record

The following effects are existing CC0 recordings. Source pages were checked 2026-09-27. Attribution is retained voluntarily. No Nintendo, Brawlhalla, MultiVersus, announcer imitation, or AI-generated audio is included. Freesound assets use the publicly provided high-quality preview encodings under the recording’s CC0 license.

- **rpg — Kenney**: [CC0-1.0](https://kenney.nl/assets/rpg-audio).
- **impact — Kenney**: [CC0-1.0](https://kenney.nl/assets/impact-sounds).
- **sci — Kenney**: [CC0-1.0](https://kenney.nl/assets/sci-fi-sounds).
- **ui — Kenney**: [CC0-1.0](https://kenney.nl/assets/interface-sounds).
- **digital — Kenney**: [CC0-1.0](https://kenney.nl/assets/digital-audio).
- **male — HaelDB and contributing voice performers**: [CC0-1.0 (selected from dual license)](https://opengameart.org/content/male-gruntyelling-sounds).
- **female — AuraVoice / Nocturnal_Vanguard**: [CC0-1.0](https://opengameart.org/content/female-hurt-grunts-groans).
- **gasp — Dvideoguy**: [CC0-1.0](https://freesound.org/people/Dvideoguy/sounds/207779/). [Downloaded recording](https://cdn.freesound.org/previews/207/207779_2046066-hq.mp3).
- **cheer — jessepash**: [CC0-1.0](https://freesound.org/people/jessepash/sounds/139972/). [Downloaded recording](https://cdn.freesound.org/previews/139/139972_968325-hq.mp3).

CC0 legal text: https://creativecommons.org/publicdomain/zero/1.0/legalcode . Kenney pack license files are preserved in ../licenses/. The male pack offers CC0 as an alternative license; this project selects CC0. AuraVoice is the credited performer in the original recording metadata.

## Midnight Loop music — separate rights record

The exact 153.62-second MP3 from [Midnight Loop’s pinned source](https://github.com/WussupLee/midnight-loop-highway-racer/blob/2770837bdc1f792e461315ec2f4dba689a750086/public/audio/midnight-loop-background.mp3) is copied byte-for-byte. SHA-256: de4bb78f3f7e290e6953de75c2536c063f3ee110e4cdcdb3028a3991deedc1eb. The project owner requested reuse and reports that it is a royalty-free beat; title, artist and license documentation are pending. This file is **not claimed to be CC0**. Add the supplied credit and license terms when the owner finds them. Do not treat this register as a grant of rights to redistribute the music independently.

Music loops during the fight, pauses/resumes at the current position, resets on a new match, and stops on leaving the arena or hiding the tab. Menu music is silent unless explicitly auditioned in Settings. A single audio engine is shared across matches, so rematch cannot stack background tracks. Browser gesture unlock happens before asynchronous decoding. Sound failure never prevents playing, and never substitutes an oscillator.

## Asset level measurements

All sound-effect derivatives are trimmed, have tiny edge fades, and are converted to 44.1 kHz mono MP3 for Safari/Chrome compatibility. Normalization targets −20 dBFS RMS where the −6 dBFS peak ceiling allows; sharp transients deliberately retain their natural crest factor. MP3 re-decoded peaks are validated below −4.5 dBFS. Music is unchanged: its decoded peak is +3.39 dBFS and RMS −9.07 dBFS, which is why runtime attenuation is essential.

| Recording | Duration | Decoded peak | Decoded RMS |
| --- | --- | --- | --- |
| step0 | 0.243 s | -6.09 dBFS | -26.68 dBFS |
| step1 | 0.282 s | -6.45 dBFS | -25.96 dBFS |
| step2 | 0.242 s | -6.53 dBFS | -27.91 dBFS |
| step3 | 0.269 s | -6.46 dBFS | -27.16 dBFS |
| cloth1 | 0.377 s | -6.47 dBFS | -27.16 dBFS |
| cloth2 | 0.370 s | -6.50 dBFS | -25.23 dBFS |
| cloth3 | 0.395 s | -6.41 dBFS | -24.62 dBFS |
| slice1 | 0.436 s | -6.43 dBFS | -24.10 dBFS |
| slice2 | 0.516 s | -6.71 dBFS | -26.05 dBFS |
| handle | 0.239 s | -6.40 dBFS | -28.42 dBFS |
| punch0 | 0.335 s | -6.44 dBFS | -21.42 dBFS |
| heavy0 | 0.565 s | -6.45 dBFS | -22.86 dBFS |
| punch1 | 0.318 s | -6.45 dBFS | -21.14 dBFS |
| heavy1 | 0.481 s | -6.42 dBFS | -22.28 dBFS |
| punch2 | 0.406 s | -6.45 dBFS | -23.06 dBFS |
| heavy2 | 0.434 s | -6.44 dBFS | -21.84 dBFS |
| land | 0.115 s | -7.18 dBFS | -20.45 dBFS |
| metal | 0.534 s | -8.21 dBFS | -31.36 dBFS |
| magic1 | 0.236 s | -7.81 dBFS | -22.42 dBFS |
| magic2 | 0.244 s | -7.19 dBFS | -25.87 dBFS |
| beam | 0.721 s | -6.74 dBFS | -22.25 dBFS |
| portal | 0.804 s | -10.56 dBFS | -20.45 dBFS |
| respawn | 0.532 s | -6.99 dBFS | -23.42 dBFS |
| explosion | 0.777 s | -8.38 dBFS | -20.55 dBFS |
| charge | 0.500 s | -12.60 dBFS | -20.45 dBFS |
| repair | 0.716 s | -7.86 dBFS | -20.73 dBFS |
| click | 0.007 s | -9.71 dBFS | -21.66 dBFS |
| confirm | 0.539 s | -6.97 dBFS | -20.71 dBFS |
| count | 0.188 s | -7.93 dBFS | -25.37 dBFS |
| grunt1 | 0.426 s | -10.43 dBFS | -20.44 dBFS |
| grunt3 | 0.500 s | -6.59 dBFS | -20.44 dBFS |
| grunt4 | 0.251 s | -7.11 dBFS | -20.44 dBFS |
| grunt5 | 0.361 s | -6.51 dBFS | -21.64 dBFS |
| vexa1 | 0.751 s | -6.42 dBFS | -21.10 dBFS |
| vexa2 | 0.655 s | -6.53 dBFS | -21.37 dBFS |
| vexa3 | 0.459 s | -7.11 dBFS | -20.45 dBFS |
| gasp | 1.486 s | -6.33 dBFS | -21.30 dBFS |
| cheer | 4.500 s | -6.44 dBFS | -21.51 dBFS |

The [machine-readable manifest](manifest.json) contains original source filenames, source hashes, exact trim positions, gain changes and derivative hashes. scripts/prepare-audio.mjs reproduces conversions using FFmpeg; scripts/fetch-audio-sources.mjs fetches the newly added sources. Existing Kenney packs are from the original asset import. No audio generation occurs.

## Verification / listening limits

Automated checks cover hashes, source records, measured levels, cue coverage for all 44 moves, cooldowns, mute/submix behavior, network metadata, browser decoding, gesture unlock, pause/resume, rematch, and a four-fighter full-volume mix stress test. These do not replace listening on physical phone speakers or headphones. Settings → Sound Check exposes every runtime cue and the fight music for final listening and personal balance adjustments.

