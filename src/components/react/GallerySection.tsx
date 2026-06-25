import { GalleryCarousel } from './GalleryCarousel';
import { ScrollReveal } from './ScrollReveal';
import type { GalleryPhoto } from './GalleryLightbox';

type GallerySectionProps = {
  photos: GalleryPhoto[];
};

export function GallerySection({ photos }: GallerySectionProps) {
  if (photos.length === 0) return null;

  return (
    <ScrollReveal>
      <section id="galeria" className="mt-20">
        <div className="mb-8 border-b border-white/5 pb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">// Galería</p>
          <h2 className="font-heading mt-1 text-3xl font-bold uppercase italic md:text-4xl">
            <span className="text-gradient-cyber">Mi</span>
            <span className="text-white"> trabajo</span>
          </h2>
        </div>

        <GalleryCarousel photos={photos} />
      </section>
    </ScrollReveal>
  );
}
