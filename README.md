# RIFT//BREAKERS
A browser platform fighter with local CPU play and QR-invite multiplayer built with TypeScript, React/Vinext and Phaser.

**Play:** https://wussuplee.github.io/rift-breakers/

Four fighters based on CC0 pixel packs with supplementary generated poses, two arenas, and a CMYK interdimensional handheld interface. Mobile portrait uses a square arena above a multitouch D-pad and action buttons; desktop uses keyboard controls. No player account or app installation. Solo play is local; optional multiplayer uses PeerJS Cloud signaling and browser-to-browser WebRTC data channels.

## Play
- A/D or left/right: move. W, Space or up: jump.
- J: light. K: heavy. Direction changes attacks; down-heavy in air is ground pound.
- L: dash / spot dodge / directional air dodge. Aerial spot-dodge → attack: gravity cancel.
- H: pick up, use or throw an item. S: fast fall. Down+jump drops through the upper platform.
- Esc: pause. F3: developer hitbox overlay.
- Phone: enlarged D-pad, B light, A heavy, X jump, Y dodge on the right, Z item. START pauses. Menus and matches stay inside a responsive device frame; the selection platform previews each fighter's idle animation.
- Mobile play surface: native non-passive gesture guards and explicit descendant selection/callout suppression keep long holds and multitouch in the game. The visible viewport reserves control space; mobile setup uses Fighters / Match / Teams pages instead of scrolling. Pause fills the device frame. Help/settings dialogs remain separate readable panels; browser chrome and OS accessibility gestures remain browser/OS-controlled.
- Three jumps total, one rising recovery, directional influence, wall contact recovery and increasing damage-to-knockback.
- Settings persist on the device: audio, controls, touch size/opacity, shake, flashes and high-contrast labels.

### Training mode

Choose **TRAINING** beside LET'S PLAY on the fighter screen. Practice is local-only, uses the currently selected arena, and never ends from stocks or a timer. The normal movement, attacks, hitboxes, dodge cooldowns and recovery rules are unchanged.

- Open **OPTIONS** in the training toolbar to switch your fighter or the dummy among all four characters.
- Dummy behavior: Stand still, Keep jumping, Dodge when ready, or Fight back with Easy/Medium/Hard CPU difficulty.
- Set the dummy's starting damage to 0/50/100/150/200%. Damage then builds normally; a dummy KO restores the selected starting value.
- The reset-arrow button instantly restores positions/resources and clears attacks, projectiles, items and hit statistics. Changing a practice option also resets the session.
- The bottom readout shows landed player hits, total damage dealt and last-hit damage/move. These are session totals, not a claim of a true uninterrupted combo.
- OPTIONS includes a hitbox toggle and the move guide. The arena pauses while options are open. Pause → Return to fighters leaves practice and restores normal rules/CPU slots while retaining your chosen fighter.

Both fighters have unlimited respawns. Offstage KOs still happen so recovery and launch distance can be practiced. Hit damage still includes normal repetition decay. Training doesn't modify multiplayer or its protocol. Coverage: `tests/training.test.ts` and `scripts/training-qa.mjs`.

### Dodge protection

Y / L grants **16 protected simulation frames** to every fighter: standing, moving on the ground, or dodging in the air. This is about 0.27 seconds in Classic and 0.31 seconds in Relaxed/mobile. Moving-ground dodge is now an evasive dash, not the old unprotected dash. Protection starts immediately when a legal dodge activates and blocks melee, projectiles, thrown items and bomb blasts, including your own bomb.

A translucent white fighter, steady white halo and shrinking cyan arc show the actual protected window; optional white flashes respect the reduced-flashes setting. `EVADED` appears only when a hostile hitbox actually intersects during protection, once per dodge. Mobile Y displays READY / SAFE / cooldown seconds / BUSY. Ground cooldown remains 45 ticks; air cooldown remains 130 ticks (landing caps the remainder at 45). Holding dodge does not repeat it. Attack recovery and hitstun cannot be canceled into a dodge; late taps can use the existing input buffer. A gravity-cancel attack ends protection immediately, and lingering attacks can hit after protection expires. Dodging does not protect against falling outside the blast zones.

Multiplayer protocol 5 carries confirmed evades and animation intent; everyone should refresh before joining a room. Tests exercise all four fighters and dodge directions, every one of the 52 attacks facing both ways against each defender, thrown items/blasts, exact expiry, cooldowns and touch/visual feedback.

### Camera and recovery cues

The camera stays centered on the main platform and keeps its deck at a fixed screen height. It can widen by at most 16% during offstage action, but no longer follows a falling fighter into the abyss. Both landing surfaces stay in view. Gold endcaps show the exact walkable ledges.

Small **34-pixel circular previews** track offscreen fighters using their actual current sprite pose and facing, clipped to a circle. All rings are yellow for offscreen tracking or red near a real blast limit (within 150 world units, or earlier for imminent high-speed launches). A local fighter has a slightly thicker ring. There are no names, warning words, flashing or long tethers. Ordinary on-screen recovery no longer adds a marker; imminent danger can still show a red preview before the fighter leaves view. Faint red dashed lines show the actual elimination boundary without captions. Markers stay separated, pixel-sized during zoom, and disappear on respawn/elimination. Combat, recovery resources and network physics are unchanged.

`node scripts/camera-qa.mjs` checks Chromium/WebKit portrait, compact portrait, landscape and desktop layouts against the static build. Unit fixtures cover anchoring during zoom, all four blast limits, yellow/red-only colors, four-player marker separation and local-player ownership.

### Light chains and character-specific heavies

On the ground, tap **B → B → B** (keyboard **J → J → J**) for three different light strikes. Tap again as the current strike comes out; only one follow-up is queued. Neutral lights chain for everyone; side lights also chain for Kairo, Regent and Vexa, while Omen retains his ranged bolt. Down and aerial lights remain separate attacks.

| Fighter | Three-hit neutral light chain | Neutral / side / down heavy |
| --- | --- | --- |
| Kairo | Quick jab → Cross punch → Rift uppercut | Skybreaker rising uppercut / Scarf breaker lunge / Orbit breaker spin |
| Regent-9 | Hilt check → Backhand cleave → Crown sentence | Execution arc overhead / armored Iron decree / two-sided Throne quake |
| Vexa | Haft snap → Pursuit thrust → Thorn hook | Pole-vault rise / leaping Vault cleave / Low cyclone launcher |
| Omen | Spark pulse → Rift lance → Null expulsion | rising Rift crystal / chargeable piercing Rift beam / delayed Event horizon mine |

**B → B → A** (J → J → K) branches from the second strike into a directional heavy. Connected lights can cancel into a follow-up after their active frames plus 1–4 recovery ticks, depending on fighter. Misses pay full recovery before a queued attack starts. Every next attack still has its own startup and one-hit-per-target rule. Finishers cannot chain-cancel, holding Light does not repeat, and hitstun, leaving the ground or a KO clears queued follow-ups. Spacing, damage, DI and dodges can break a string; this is not a guaranteed hit-lock.

The CHAIN readout shows sequence position, not a claimed combo hit count, and confirms LIGHT / HEAVY QUEUED. CPU difficulty changes its choice/reaction frequency, not legal timing. Lunges and vaults now begin on activation, not during startup. Omen's projectile charge, original facing and move identity survive travel and network replication. Attack effects follow the authored reach; existing CC0 sprites and recorded audio are reused.

`tests/combos.test.ts` covers all fighter matchups, both facings and both feel profiles; touch and network scripts cover actual button taps and a guest chain replicated to all four clients. Everyone must refresh for protocol 5 before joining a room.

## Roster
| Fighter | Archetype | Art |
| --- | --- | --- |
| Kairo Venn | Balanced all-rounder | Martial Hero 3 |
| Regent-9 | Armored heavyweight | Medieval King Pack 2 |
| Vexa Thorn | Fast polearm rushdown | Huntress |
| Omen Null | Projectile/trap zoner | Evil Wizard 2 |

Original character packs are by LuizMelo, CC0. Sound and planetary art by Kenney, CC0. Source URLs and unmodified license records are in [the asset register](public/assets/SOURCES.md). Original files are preserved. Supplementary AI-generated key poses are separately credited.

### Expressive animation expansion

Each fighter has 32 new key poses: 13 distinct attack windup/strike pairs and six movement/reaction poses. The presentation director combines these with original cycles into 40 named states per fighter, including braking, turning, apex, landing rebound, dodge and directional launch/tumble. Hard-hit victims fly sideways and rotate around their body center, with per-character weight cues and bounded afterimages. Reduced-motion keeps essential poses without spins or squash. No animation transition delays legal input or bypasses attack timing.

All 52 attack presentations have distinct pose pairs. Aerial moves now differ in timing, reach and movement, including Omen's horizontal bolt and downward shard. This is a hybrid key-pose/procedural system, not 40 hand-drawn clips. See [research, coverage, limitations and exact generation prompts](public/assets/fighters/ANIMATION-NOTES.md). Tests: `tests/animation.test.ts`, `scripts/animation-qa.mjs`, plus asset validation. Multiplayer protocol **v5** requires every device to refresh before joining.

## Development
Node 24 and pnpm 11.25.0:
```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```
Development runs at http://localhost:5173. Static production output is `dist/client`. The GitHub Actions workflow tests, builds and publishes to Pages on pushes to main. Build with `GITHUB_ACTIONS=true` for the `/rift-breakers` base path.

Browser verification:
```sh
pnpm exec playwright install chromium
node scripts/browser-qa.mjs
node --import tsx scripts/ai-soak.ts
node scripts/gesture-qa.mjs
```
Set `QA_URL` to test a deployed URL. Append `?debug` to expose the simulation bridge used by browser tests. F3 works without that flag.

## Arenas

- **Rift Array**: original 680-unit battle deck with one centered floating platform.
- **Neon Foundry**: 880-unit battle deck (29% wider), three asymmetric floating gantries, expanded blast zones, and a dark pixel-art factory with moving presses, conveyor lights and welding sparks. Scenery is cosmetic; there are no machinery hazards. Reduced-motion preferences freeze the machinery.

Choose an arena in solo **CHOOSE ARENA**, or select **Arena** under multiplayer **rules**. The host's choice is shared by all players and retained for rematches; changing it resets guest readiness. Network protocol v5 prevents older clients with different move data or stage geometry from joining. Refresh all devices after updating.

Geometry is data-driven through `STAGES` / `Simulation.stage`: collision, respawns, drops, AI recovery, items, camera framing and offscreen warnings use the selected arena. `tests/stages.test.ts` covers every fighter/platform, boundary and camera fixtures, and deterministic four-fighter matches at all difficulties. `scripts/factory-qa.mjs` covers both browser engines and desktop/mobile layouts. See [factory art notes](public/assets/factory/ART-NOTES.md) for the built-in generation prompt and asset provenance.

## Architecture
- `game/data.ts`: typed fighter, move, stage, item, input and match data.
- `game/simulation.ts`: seeded 60 Hz combat simulation, collision, AI, match scoring.
- `game/input.ts`: keyboard and multitouch; transitions retained between fixed steps.
- `game/scene.ts`: interpolated Phaser presentation, sprite mapping, effects and camera.
- `game/audio.ts` / `game/audio-catalog.ts`: recorded-only mixer and 35 logical cues, quiet movement/voices, rate-limited crowds, music ducking and pause/resume. No synthesized fallback. See [the full sound guide](public/assets/audio/SOUND-DESIGN.md) for source credits, levels and the separate Midnight Loop music rights record. Settings → Sound Check auditions every cue.
- `app/page.tsx`: character/rules/stage setup, handheld controls, pause, settings, credits and results.
- `tests/`: combat, geometry, recovery, scoring and deterministic fixtures.

## Scope and verification
This is a playable first release, not a claim of tournament-level balance or flawless physical-device compatibility. It supports one human plus 1–3 CPUs, stock/timed/teams, three difficulty levels, three items, and rematches.

Automated coverage includes the 52 moves facing both ways, startup/one-hit enforcement, capsule sweeps, input buffering, jumps/coyote/drop-through, dodge/recovery, DI limits, damage, team filtering, sudden death, items and seeded AI soaks. Browser automation covers desktop setup/combat/pause/results/rematch and portrait multitouch across HUD rerenders.

Physical iPhone/Android touch feel, Safari/Firefox on real devices, accessibility with assistive technology, exhaustive visual frame-by-frame hitbox QA, long-session memory profiling, and competitive balance remain release-testing work. Attack arcs are gameplay geometry, not per-pixel collisions. New key poses have some stylistic variation; full hand-drawn in-between sequences and independent cloth animation are not claimed.

The project was scaffolded with the Sites portable Vinext starter; publishing uses GitHub Pages as requested. Unused starter components do not add a backend to the game.

## Multiplayer / QR invites
1. Choose **PLAY FRIENDS**, enter a display name and fighter, then **HOST A ROOM**.
2. Friends scan the room QR with their normal phone camera, or open the game and enter the 12-character code. The invite is generated locally and contains the game URL plus a room-code fragment.
3. Guests choose their names/fighters and **READY TO BRAWL**. The host can add/remove CPUs, choose their difficulty, assign teams, and adjust rules. Human joins replace CPU slots if present; four humans fills the room.
4. The host starts once everyone is ready. All devices load before the shared countdown starts. After results, the host opens **REMATCH LOBBY**.

The host runs the authoritative simulation and CPUs; guests send validated, sequenced inputs for their assigned fighter. State snapshots travel at up to 20 Hz with render interpolation. Client messages cannot set damage, stocks, winners or another player's inputs. Short taps are queued across simulation steps; stale held inputs expire after 350 ms. Disconnect detection takes up to 12 seconds. A disconnected guest becomes a CPU for the rest of the match; the host leaving ends the room. There is no host migration, mid-round joining, identity/account authentication, rollback or competitive anti-cheat. Room possession is invite access—share only with people you trust. Display names are local preferences and visible to peers; they are not verified identities.

Keep the host tab foregrounded and the phone awake. Opening host settings pauses everyone; a guest opening settings disables only their controls and the battle continues. Backgrounding or locking a host phone can suspend the browser and disconnect the room. Room pace is host-controlled (Relaxed by default); per-device Game feel settings still govern solo matches.

### Hosting and network limits
The game remains on GitHub Pages. PeerJS 1.5.5 (MIT) provides free public signaling; no paid service, account, billing resource, or private backend was provisioned. Data channels are encrypted by WebRTC, but peers can learn each other's network addresses. No microphone/camera permission is requested. QRCode 1.5.4 (MIT) generates QR images locally, without a QR-image service.

This deployment uses STUN and **has no TURN relay**. Same Wi-Fi is recommended. Different-network play works when direct WebRTC connectivity is possible, but some carrier NATs, enterprise Wi-Fi, VPNs and firewalls will fail. PeerJS Cloud is a third-party availability dependency. Reliable arbitrary-network support requires an authorized relay service (with short-lived credentials issued by a backend) or a hosted WebSocket game service; neither is silently represented as already deployed. Connection errors offer same-Wi-Fi/retry guidance rather than leaving an infinite spinner.

Primary service documentation: [PeerJS API](https://peerjs.com/client/api/peer), [free TURN discontinuation](https://github.com/orgs/peers/discussions/1172).

### Multiplayer verification
- `tests/multiplayer.test.ts`: protocol validation, invite codes, Unicode name bounds, input ownership/replays/staleness, snapshot reconstruction, room capacity, CPU replacement, readiness/loading, teams and disconnect takeover.
- `node scripts/multiplayer-qa.mjs`: actual PeerJS Cloud signaling and four real WebRTC browser clients, fifth-player rejection, cross-client movement, shared pause/results, CPU takeover, rematch and host disconnection. Uses public signaling, so internet access is required.
- Set `QA_GUEST_ENGINE=webkit` to use WebKit for one guest; `QA_URL` selects a local or deployed build. This is browser automation, not certification of physical phones, cross-carrier NAT traversal or production latency.
