# RIFT//BREAKERS
A local browser platform fighter built with TypeScript, React/Vinext and Phaser.

**Play:** https://wussuplee.github.io/rift-breakers/

Four CC0 pixel fighters, one floating arena, and a CMYK interdimensional handheld interface. Mobile portrait uses a square arena above a multitouch D-pad and action buttons; desktop uses keyboard controls. No account, tracking, backend, or multiplayer server.

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

## Roster
| Fighter | Archetype | Art |
| --- | --- | --- |
| Kairo Venn | Balanced all-rounder | Martial Hero 3 |
| Regent-9 | Armored heavyweight | Medieval King Pack 2 |
| Vexa Thorn | Fast polearm rushdown | Huntress |
| Omen Null | Projectile/trap zoner | Evil Wizard 2 |

Character art is by LuizMelo, CC0. Sound and planetary art by Kenney, CC0. Source URLs and unmodified license records are in [the asset register](public/assets/SOURCES.md). Original sprite colors are preserved; attack animations are retimed across directional families, not falsely presented as 44 bespoke sprite sequences.

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

## Architecture
- `game/data.ts`: typed fighter, move, stage, item, input and match data.
- `game/simulation.ts`: seeded 60 Hz combat simulation, collision, AI, match scoring.
- `game/input.ts`: keyboard and multitouch; transitions retained between fixed steps.
- `game/scene.ts`: interpolated Phaser presentation, sprite mapping, effects and camera.
- `game/audio.ts`: CC0 samples plus original synthesized music/effect fallback.
- `app/page.tsx`: character/rules/stage setup, handheld controls, pause, settings, credits and results.
- `tests/`: combat, geometry, recovery, scoring and deterministic fixtures.

## Scope and verification
This is a playable first release, not a claim of tournament-level balance or flawless physical-device compatibility. It supports one human plus 1–3 CPUs, stock/timed/teams, three difficulty levels, three items, and rematches.

Automated coverage includes the 44 moves facing both ways, startup/one-hit enforcement, capsule sweeps, input buffering, jumps/coyote/drop-through, dodge/recovery, DI limits, damage, team filtering, sudden death, items and seeded AI soaks. Browser automation covers desktop setup/combat/pause/results/rematch and portrait multitouch across HUD rerenders.

Physical iPhone/Android touch feel, Safari/Firefox on real devices, accessibility with assistive technology, exhaustive visual frame-by-frame hitbox QA, long-session memory profiling, and competitive balance remain release-testing work. Attack arcs are gameplay geometry, not per-pixel collisions; some move names describe intended fighting identity rather than unique multi-hit combos. Animation-state transforms and reused attack families are intentional first-release simplifications.

The project was scaffolded with the Sites portable Vinext starter; publishing uses GitHub Pages as requested. Unused starter components do not add a backend to the game.
