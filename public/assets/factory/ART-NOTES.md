# Neon Foundry art

Original background generated with the built-in image-generation tool (not CLI) on 2026-09-27. No third-party reference images were used. Platform sprite reuses the original generated orbital-station deck, with map-specific amber/cyan collision-top lights. Animated presses, conveyor lights and welding sparks are cosmetic code-native layers; they never affect collision.

## Exact generation prompt

Create one original square pixel-art BACKGROUND for Neon Foundry, a science-fiction factory platform fighting arena. Background only, no playable platforms, characters, words, UI or logos. Crisp 16-bit game pixel clusters, restrained dithering, flat side elevation, no perspective gameplay floor. Huge dark navy industrial interior, layered gunmetal machinery and teal pipes concentrated at left/right edges, suspended gantry cranes and segmented pistons at upper corners, small amber furnace windows at lower corners, subtle magenta/cyan status lights. Through a high central observation window see a pale green moon and tiny distant stars. Central 65 percent must remain dark, simple and low contrast for combat readability. Open central and lower-middle space, no bright foreground obstacles or apparent walkable ledges. Rich professional detailed pixel environment with moody teal/charcoal and warm amber accents, same cohesive pixel-art sci-fi style as an orbital space station. Square 1024x1024 composition.

## Import

`node scripts/import-factory-art.mjs <original-generated-PNG>` packs `background.png` to 640×640 with nearest-neighbor sampling. Original source remains in the generated-image output directory. No original station assets are overwritten.
