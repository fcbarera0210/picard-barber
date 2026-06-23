import { useEffect, useRef, type ReactNode } from 'react';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);

    // Si ya está en viewport al montar (p. ej. recarga con scroll), revelar de inmediato
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight - 40 && rect.bottom > 0;
      if (inView) {
        el.classList.add('is-visible');
        observer.unobserve(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-section ${className}`}>
      {children}
    </div>
  );
}
