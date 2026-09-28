# Fighter animation expansion

## What shipped

Each fighter retains all nine original animation mappings and receives a supplementary 32-pose atlas: 13 unique anticipation/strike pairs plus landing compression, landing rebound, dash, airborne tuck, launch and tumble. That is **128 new key poses across four fighters**, used by **52 attack presentations**. The director selects **40 named presentation states per fighter** (27 movement/reaction states plus 13 attacks). These are not 40 fully hand-drawn frame sequences: this is a hybrid of new AI-generated key poses, original cycles, timed pose holds and restrained procedural motion.

A state, an input action, a key pose and a complete animation clip are different units. Left/right versions mirror the same directional action. Neutral/up ground input and aerial recovery retain the existing control vocabulary.

## Research and design decisions

| Reference | What the source establishes | Application here |
| --- | --- | --- |
| [Brawlhalla: Tezca developer patch](https://www.brawlhalla.com/news/new-legend-weapon-tezca-enters-the-ring-with-his-battle-boots-patch-7-02) | Six Legend signature attacks; Battle Boots light attacks can vary with directional input. | Distinguish move identity from cosmetic animation count; readable windup, active strike and recovery for each input family. |
| [Brawlhalla balance notes](https://www.brawlhalla.com/news/battle-pass-season-7-valhallaquest-patch-7-03) | Recovery time, force and stun are deliberate balance dimensions. | Animation follows declared startup/active/recovery; it never bypasses combat timing. |
| [Dead Cells: developer art deep dive](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-) | Motion Twin rendered low-resolution sprites from 3D animation. Key poses/timing came first; interpolation was selective around fast strikes. | Hold readable anticipation and impact poses, snap across the strike, soften follow-through. More uniformly spaced frames are not automatically better. We did not implement a 3D pipeline. |
| [Blasphemous: The Game Kitchen developer AMA](https://www.reddit.com/r/NintendoSwitch/comments/d2af0j/hey_were_the_game_kitchen_the_team_behind/) | Its developers describe drawing frame by frame, with filmed sword movement as reference rather than skeletal animation or rotoscoping. | Committed weapon silhouettes and character-specific heft; Regent settles and tumbles more slowly than Vexa. Our new art is generated, not Blasphemous-style hand-drawn production. |
| [Hollow Knight: official game description](https://www.hollowknight.com/) | Traditional hand-drawn 2D animation, not pixel art. | Our visual inference: economical, readable silhouettes and distinct movement/reaction states, not its raster resolution or assets. |
| [Shovel Knight: Specter Knight mobility design](https://old.yachtclubgames.com/2017/07/specter-knight-mobility-design/) | Developer discussion of chainable traversal, readable attack-box coverage and deliberate apex hang time. | Separate rise/apex/fall poses, align visual reach cues with collision geometry, keep input responsive. Existing physics remain authoritative; no auto-target movement added. |
| [Yacht Club: body-swap design](https://www.yachtclubgames.com/blog/designing-body-swap/) | Silhouette and size must respect gameplay hitboxes. | Normalize scale and feet/body pivots; decorative weapon pixels do not redefine hurtboxes. |
| [Slynyrd: attack animation](https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation) | Anticipation, quick smears, follow-through and recovery have different timing roles. | Brief trails only on active attacks, dodge or launch; no damaging-looking smear during windup. |
| [Slynyrd: side-view movement](https://www.slynyrd.com/blog/2026/1/26/side-view-run-n-gun) and [motion cycles](https://www.slynyrd.com/blog/2020/1/23/pixelblog-25-motion-cycles) | Key poses, secondary body motion and distinct movement phases support expressive pixel characters. | Distance-driven run cadence, acceleration/brake/turn poses, apex cue, landing compression/rebound and modest lean. |

No authoritative complete Brawlhalla per-character animation-clip total was found. Six signatures is a documented subset, not its entire animation library. We do not invent a benchmark count or imply our 40 states reproduce every Brawlhalla animation.

## Motion system

- Anticipation/impact pairs for all 13 actions, with per-move frame timing; no added input delay.
- Original idle/run/jump/fall/hurt/death cycles remain available. Run cadence uses distance traveled, reducing foot sliding.
- Micro-states: run start, brake, turn, crouch, ascent, air jump, apex, descent, fast fall, landing/rebound, heavy landing, wall contact/jump, dash, spot/air dodge, pickup/throw, respawn and defeat.
- Mild squash/stretch, lean, overshoot and settling distinguish archetypes. Original scarf/cape/robe cycles plus new poses supply secondary shape changes; this is not independent cloth simulation.
- Hard hits use a sideways/arched launch pose, then center-pivot tumble with direction-aware rotation. Regent spins slower; Vexa faster. Hitstop freezes the contact pose. When hitstun ends, a short recover pose restores upright readability.
- Active strikes/launches use at most three fading sprite echoes per fighter. Pool size is fixed, including four-player matches. Existing sparks, attack arcs, smoke and hitstop remain.
- Reduced-motion disables spin, echoes, squash and translation accents; essential poses remain and lean is capped. Dodge white feedback follows actual invulnerability.
- Combat geometry stays independent of decorative pixels. The compact body capsule is unchanged during squash/tumble; rotation is not an extra dodge. Swept segments, attack arcs and projectile effects communicate actual attack reach.
- Offscreen portrait pivots account for both foot-anchored and body-centered poses.

## Directional attack identities

All rows have their own anticipation/strike pair per fighter. Current numbers are in game/move-tuning.ts; the in-game guide lists move names.

| Input | Kairo Venn | Regent-9 | Vexa Thorn | Omen Null |
| --- | --- | --- | --- | --- |
| Ground neutral light | Quick jab | Hilt check | Haft snap | Spark pulse |
| Ground side light | Step-in palm lunge | Wide Royal sweep | Fast Dash thrust | Traveling Staff bolt |
| Ground down light | Low Ankle sweep | Low blade scoop | Sliding sweep | Delayed Floor sigil |
| Ground neutral heavy | Skybreaker uppercut | Execution arc overhead | Pole-vault rise | Rising Rift crystal |
| Ground side heavy | Scarf breaker lunge | Armored Iron decree | Leaping Vault cleave | Charged piercing Rift beam |
| Ground down heavy | Two-sided Orbit breaker | Broad Throne quake | Low cyclone launcher | Delayed Event horizon mine |
| Air neutral light | Orbit kick | Wide, slower Royal orbit | Quick Pole orbit | Satellite pulse |
| Air side light | Flying punch lunge | Long Greatsword arc | Narrow Needle flight poke | Forward burst projectile |
| Air down light | Heel dive | Vertical Blade plunge | Diagonal Downward hook | Falling shard projectile |
| Recovery | Rising corkscrew | Rising sword | Pole vault | Dimensional rise |
| Ground pound | Meteor fist | Heavy blade drop | Plunging axe | Void column |
| Chain second | Cross punch | Backhand cleave | Pursuit thrust | Rift lance |
| Chain finisher | Rift uppercut | Crown sentence | Thorn hook | Null expulsion |

Aerial sets now have distinct startup, active time, recovery, range and knockback. Kairo bridges gaps, Regent commits to stronger wide swings, Vexa uses short quick pokes, and Omen sends horizontal bolts/downward shards. These are original values, not extracted commercial game data. Balance remains iterative.

## Asset provenance and reproduction

Original mappings and portraits derive from LuizMelo CC0 packs; original licenses remain beside them. New motion.png files are AI-generated derivative key-pose extensions, **not additional artwork supplied or endorsed by LuizMelo**, and are not mislabeled as downloaded CC0 packs. No Dead Cells, Blasphemous, Hollow Knight, Shovel Knight or Brawlhalla assets were copied.

The imagegen skill was used with Codex's built-in image generation tool. Each generation referenced the relevant original idle.png and attack1.png. Four source images were 1254 x 1254, arranged in four columns/eight rows. scripts/import-motion-art.mjs mechanically identifies gutters, crops transparent padding and packs poses with nearest-neighbor scaling against the original idle body height. No external image CLI was used. Original sheets are unchanged.

Shipped assets (relative to public/assets/fighters):

- kairo/motion.png and kairo/motion.json
- regent/motion.png and regent/motion.json
- vexa/motion.png and vexa/motion.json
- omen/motion.png and omen/motion.json

Each atlas is 2048 x 1024: eight columns/four rows of 256 x 256 frames, feet pivot (128,208), no smoothing. Frames 0-25 are 13 windup/strike pairs in table order; 26 landing, 27 rebound, 28 dash, 29 air tuck, 30 launch, 31 tumble. Runtime memory is about 32 MiB uncompressed for all four new RGBA atlases, plus existing assets.

Validation checks dimensions, mapping, 32 nonempty distinct frames per fighter, consistent pivots, packed-cell padding and compressed size. Tests cover both facings, exact phases, hitstop, tumble, reduced motion, snapshot intent and fixed trail pools. Browser fixtures audit actual Phaser textures/phases in Chromium and WebKit. These checks do not prove perfect per-pixel weapon alignment: generated poses have some silhouette/style variation, and exhaustive visual cleanup/physical-phone testing remain worthwhile. This is key-pose expansion with procedural transitions, not hundreds of newly hand-drawn frames.

## Exact generation prompts

### Kairo

```text
Use case: identity-preserve. Create a NEW supplementary pixel-art spritesheet for the SAME fighter shown in references 1 (idle strip) and 2 (attack strip), not a redesign. Preserve black hair, bare arms, olive pants, dark boots, long pale lavender scarf/weapon accent, original slim proportions and exact muted palette. Side-view platform fighter facing RIGHT. Genuine transparent background. No text, labels, borders, floor shadows, panels or scenery.
Layout is absolutely essential: square canvas, exactly FOUR columns and EIGHT rows = 32 isolated full-body sprites. Equal rectangular cells, ample transparent padding, never overlap neighboring cells. Uniform character scale throughout, standing body height ~75 percent of cell height; pelvis centered horizontally in each cell, feet baseline at 90 percent cell height except aerial poses. Crisp low-resolution clusters, like the supplied 40-pixel-tall original, nearest-neighbor pixel art, no smooth illustration or anti-aliasing. Do not enlarge head, add armor or change costume.
Read each row left to right:
Row 1: jab windup; straight jab impact; forward palm windup leaning back; fully extended lunging palm impact.
Row 2: crouched low sweep windup; extended low sweep kick impact; uppercut coiled windup; explosive raised-fist uppercut impact.
Row 3: heavy side strike windup with scarf behind; heavy forward strike fully extended; grounded spin windup twisting away; wide spinning kick impact.
Row 4: tucked aerial spin windup; horizontal aerial spinning kick; airborne forward punch windup; fully stretched flying punch impact.
Row 5: airborne downward heel windup knees tucked; downward heel strike impact; rising recovery coiled knees; corkscrew rising pose with fist overhead.
Row 6: airborne ground-pound windup fist raised; meteor fist pointed downward knees tucked; cross-punch windup; long cross-punch impact.
Row 7: combo-finisher uppercut windup deep crouch; combo-finisher uppercut impact with arched torso; crouched landing compressed knees; landing rebound knees opening.
Row 8: low evasive dash lean; compact tucked air dodge; sideways flying hit reaction with arched back and trailing limbs; curled tumbling hit reaction knees drawn in.
No attack arcs or giant energy effects baked in; limb and scarf poses must carry the motion. Exactly 32 sprites, four per row, eight rows. Reference sprites are character/design anchors; generate the new poses.
```

### Regent

```text
Use case: identity-preserve. Create a NEW supplementary low-resolution pixel-art spritesheet for the exact SAME fighter in reference 1 (idle strip) and reference 2 (attack strip). Preserve original costume, palette, proportions and weapon. All poses face RIGHT. Genuine transparent background, no text, labels, borders, floor shadows, scenery or painted background. Exactly FOUR columns and EIGHT rows = 32 isolated full-body sprites in equal cells on a square canvas. Consistent body size in every cell; standing figure ~70 percent of cell height. Leave transparent padding so no sprite crosses cell edges. Crisp chunky pixel clusters matching the supplied low-resolution sprites, NOT high resolution concept art or chibi. No colored outlines, no blue/red fringe pixels, no attack VFX baked in. Each pair is anticipation then attack extension. Read left to right and top to bottom. Character: slim armored crowned monarch, black/red tunic and armor, gold crown, long blue cape, silver/dark longsword; exactly retain the reference, not a bulky new design.
Row1: hilt jab windup; hilt jab impact; horizontal sword sweep windup; horizontal sword sweep impact.
Row2: crouched low sword scoop windup; low scoop extension; sword over shoulder preparing upward cleave; raised overhead blade upward cleave.
Row3: armored shoulder lunge windup; shoulder forward and sword extended lunge; sword raised for ground slam; crouched sword driven down into ground.
Row4: aerial tucked spin windup; aerial wide sword spin; forward aerial greatsword windup; fully extended aerial sword slash.
Row5: sword tucked above head in air; downward blade plunge; upward recovery knees tucked sword low; rising sword held straight overhead.
Row6: heavy meteor drop sword raised above; downward sword drop pose; backhand sword windup; backhand sword extended.
Row7: execution finishing strike windup; long execution cleave extension; compressed crouched landing cape up; rebound landing cape settling.
Row8: low evasive dash lean; compact airborne evasive tuck; sideways airborne hit reaction with back arched and cape trailing; curled tumbling hit reaction.
```

### Vexa

```text
Use case: identity-preserve. Create a NEW supplementary low-resolution pixel-art spritesheet for the exact SAME fighter in reference 1 (idle strip) and reference 2 (attack strip). Preserve original costume, palette, proportions and weapon. All poses face RIGHT. Genuine transparent background, no text, labels, borders, floor shadows, scenery or painted background. Exactly FOUR columns and EIGHT rows = 32 isolated full-body sprites in equal cells on a square canvas. Consistent body size in every cell; standing figure ~70 percent of cell height. Leave transparent padding so no sprite crosses cell edges. Crisp chunky pixel clusters matching the supplied low-resolution sprites, NOT high resolution concept art or chibi. No colored outlines, no blue/red fringe pixels, no attack VFX baked in. Each pair is anticipation then attack extension. Read left to right and top to bottom. Character: slim olive-hooded masked huntress, dark olive and brown clothes, leather boots, long wooden poleaxe with a small white blade; retain exactly the original reference colors and proportions.
Row1: close haft jab windup; short haft jab extension; long pole thrust windup; long lunging horizontal poleaxe thrust.
Row2: low sliding sweep windup; deep low sliding pole sweep; planted pole crouched vault anticipation; overhead vaulting upward cleave.
Row3: coiled side-vault attack preparation; sideward airborne vault cleave fully extended; crouched low spin windup; wide low spinning poleaxe.
Row4: airborne pole held close spin windup; aerial pole spin extended; aerial forward poke retracted; aerial forward poleaxe thrust extended.
Row5: downward hook windup knees tucked; hooked poleaxe strike diagonally downward; knees compressed pole below for recovery; upward pole vault stretched tall.
Row6: plunging axe overhead preparation; downward axe plunge; pursuit thrust retracted; pursuit thrust with extended forward lean.
Row7: finishing hook windup; upward sweeping hook extension; deep crouched landing; landing rebound.
Row8: low evasive dash lean; tucked airborne dodge with pole close; sideways flying hit reaction limbs and pole trailing; compact tumbling hit reaction.
```

### Omen

```text
Use case: identity-preserve. Create a NEW supplementary low-resolution pixel-art spritesheet for the exact SAME fighter in reference 1 (idle strip) and reference 2 (attack strip). Preserve original costume, palette, proportions and weapon. All poses face RIGHT. Genuine transparent background, no text, labels, borders, floor shadows, scenery or painted background. Exactly FOUR columns and EIGHT rows = 32 isolated full-body sprites in equal cells on a square canvas. Consistent body size in every cell; standing figure ~70 percent of cell height. Leave transparent padding so no sprite crosses cell edges. Crisp chunky pixel clusters matching the supplied low-resolution sprites, NOT high resolution concept art or chibi. No colored outlines, no blue/red fringe pixels, no attack VFX baked in. Each pair is anticipation then attack extension. Read left to right and top to bottom. Character: exact hooded dark indigo/purple and gold robed wizard, gold trim, shadowed face, floating staff with amethyst-purple flame orb; retain the reference proportions, colors and staff, no new armor.
Row1: close orb burst hands drawing in; palm pushed outward for close orb burst; staff bolt drawn back; staff bolt casting horizontally.
Row2: floor sigil drawing gesture windup; crouched palm directed at floor; crystal anti-air raising staff preparation; arm and staff raised to cast upward.
Row3: charged beam staff and arm drawn back; horizontal beam casting arms extended; rift mine cupped hands preparation; both hands pressing low to place mine.
Row4: airborne orbiting orb preparation arms close; airborne orbit pose arms spread; forward aerial burst windup; staff pointing horizontally in aerial burst.
Row5: downward shard staff raised; airborne staff pointing diagonally down; compact folded teleport windup; stretched upward teleport reappearance.
Row6: void column ground pound robes lifted preparation; downward staff and both hands thrust; rift lance drawing arm back; rift lance thrust arm extended.
Row7: final expulsion gathered energy anticipation; wide open arms expulsion impact; compressed crouched landing robes bunched; landing robes settling.
Row8: forward evasive float lean; compact airborne dodge with robe folded; sideways flying hit reaction robes trailing; curled tumbling hit reaction.
```

