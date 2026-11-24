import images from './images.json';
/** The poster is pre-softened, so phones can take a smaller file (480/640w) without visible loss. */
export const HERO_SIZES = '(max-width: 48rem) 60vw, 100vw';
/** <link rel=preload> descriptor for the hero poster (AVIF). */
export function heroPreload() {
  const img = (images as any)['hero-poster'];
  return { srcset: img.widths.map((w: number) => `/images/hero-poster-${w}.avif ${w}w`).join(', '), sizes: HERO_SIZES, type: 'image/avif' };
}
