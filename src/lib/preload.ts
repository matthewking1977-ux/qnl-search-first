import images from './images.json';
/** <link rel=preload> descriptor for the hero poster (AVIF). */
export function heroPreload() {
  const img = (images as any)['hero-poster'];
  return { srcset: img.widths.map((w: number) => `/images/hero-poster-${w}.avif ${w}w`).join(', '), sizes: '100vw', type: 'image/avif' };
}
