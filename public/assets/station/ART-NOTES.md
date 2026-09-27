# Rift Array station art

Created for RIFT//BREAKERS on 2026-09-27 using the built-in OpenAI image-generation tool and the imagegen skill. The user's two images were visual inspiration, not copied into the game. These are generated project assets, not third-party CC0 downloads; no third-party artist attribution is claimed.

## Runtime assets

- `background.png`: two moons and distant orbital station skyline, 640×640.
- `platform.png`: transparent battle deck, alpha-bound trimmed to its walking edge.
- `shuttle.png`: transparent launch shuttle, 32px wide.

Nearest-neighbor packing is in `scripts/import-station-art.mjs`. Source generation outputs are preserved outside the repository by the image tool. Platforms retain their original simulation geometry. Scenery has no collision, damage, RNG, or AI effects. Background animation pauses with the match and respects reduced-motion preferences.

## Exact generation prompts

### background

Use case: stylized-concept. Asset type: finished pixel-art background for a 2D platform fighting game, NOT a screenshot or mockup. Generate a square background landscape of a far-future orbital spaceport floating in deep space. Two cratered moons, one large pale mint moon upper left and a smaller dusky lavender moon upper right, subtle stars, dark navy and muted teal sky. On the far left and far right, distant industrial launch towers and mushroom-like orbital docks on long thin pylons, tiny cyan windows, restrained magenta warning lights. Inspired by industrial scaffold silhouettes and retro sci-fi lunar spaceports. Keep the central 60 percent spacious, dark, and low contrast for fighters and separate platforms composited later; no foreground platform, no foreground objects. Bottom third has receding station silhouettes and sparse illuminated infrastructure, not a ground surface. Sharp deliberately chunky 16-bit pixel art with clean clustered square pixels and dithered shading, consistent approximately 480px native-art resolution. Limited navy, desaturated teal, cyan, muted moon cream, restrained magenta. No smooth painting, blur, text, labels, characters, UI, watermarks, logos, or baked-in ships/comets. Full bleed to every edge.

### platform

Use case: stylized-concept. Asset type: isolated usable pixel-art game platform sprite on genuinely transparent background. One wide sci-fi space station battle platform, side elevation for a 2D platform fighter. Platform width to height approximately 7:1, centered, fully visible, no extra objects. A perfectly straight horizontal flat top edge across the entire deck, no railings or towers or props protruding above it. The full-width upper 50 percent of the platform is a continuous rectangular solid gunmetal deck fascia; below it sparse short angular support brackets, cables, ducts, and two cyan reactor lights. Dark navy plated metal with teal armor panels, magenta small status accents and yellow-white docking stripes, thin bright cyan rim at the walking edge. Crisp 16-bit pixel art at approximately 340 by 48 native pixels enlarged nearest-neighbor, readable large pixel clusters, handmade game sprite appearance. Generous transparent padding outside silhouette; no baked background, floor, characters, text, labels, shadows outside silhouette, extra separate objects, fog, or logo. Front-on side view, not isometric, top surface must remain exactly horizontal and unbroken.

### ship

Use case: stylized-concept. Asset type: isolated small background spacecraft game sprite, genuinely transparent background. One tiny sleek original sci-fi launch shuttle pointed vertically upward, viewed from its side in a 2D game. Narrow ivory/gunmetal fuselage, dark teal cockpit, two small swept fins, magenta stripe, cyan engine nozzle at bottom, no drawn exhaust because exhaust will be animated separately. Centered, fully visible. Crisp deliberately chunky 16-bit pixel art, approximately 16 by 32 native pixels enlarged nearest-neighbor, strong readable silhouette for very small background rendering. No text, markings, logo, multiple views, sheet grid, stars, planets, floor, background or shadow.
