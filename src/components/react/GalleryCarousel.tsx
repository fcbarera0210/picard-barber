import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { GalleryLightbox, type GalleryPhoto } from './GalleryLightbox';

const AUTOPLAY_MS = 4000;

type GalleryCarouselProps = {
  photos: GalleryPhoto[];
};

export function GalleryCarousel({ photos }: GalleryCarouselProps) {
  const isMobile = useIsMobile();
  const slidesPerView = isMobile ? 2 : 4;
  const maxIndex = Math.max(0, photos.length - slidesPerView);

  const [index, setIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const touchRef = useRef(false);

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }, [maxIndex]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || photos.length <= slidesPerView) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, photos.length, slidesPerView, goNext]);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [index, maxIndex]);

  if (photos.length === 0) return null;

  const slideWidthPercent = 100 / slidesPerView;

  return (
    <>
      <div
        className="gallery-carousel group relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          if (!touchRef.current) setPaused(false);
        }}
        onTouchStart={() => {
          touchRef.current = true;
          setPaused(true);
        }}
        onTouchEnd={() => {
          touchRef.current = false;
          setTimeout(() => setPaused(false), AUTOPLAY_MS);
        }}
      >
        <div className="gallery-carousel-viewport overflow-hidden rounded-lg">
          <div
            className="gallery-carousel-track flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${index * slideWidthPercent}%)`,
            }}
          >
            {photos.map((photo, photoIndex) => (
              <button
                key={photo.id}
                type="button"
                className="gallery-carousel-slide shrink-0 p-1.5"
                style={{ width: `${slideWidthPercent}%` }}
                onClick={() => setLightboxIndex(photoIndex)}
              >
                <div className="aspect-[4/3] overflow-hidden rounded border border-white/10 bg-surface-light transition hover:border-accent/40">
                  <img
                    src={photo.url}
                    alt={`Galería ${photoIndex + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {photos.length > slidesPerView && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="gallery-carousel-arrow gallery-carousel-arrow-prev"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="gallery-carousel-arrow gallery-carousel-arrow-next"
              aria-label="Siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </>
  );
}
