import { useEffect, useRef } from 'react';

type Layer = {
  id: string;
  src: string;
  className: string;
  scrollSpeed: number;
  mouseSpeed?: number;
  pulse?: boolean;
  float?: boolean;
  floatClass?: string;
};

const LAYERS: Layer[] = [
  {
    id: 'waves',
    src: '/svg/waves.svg',
    className: 'left-0 top-[6%] w-[100vw] opacity-[0.32]',
    scrollSpeed: 0.16,
    mouseSpeed: 0.018,
    pulse: true,
    float: true,
    floatClass: 'bg-svg-float--slow',
  },
  {
    id: 'ligth',
    src: '/svg/ligth.svg',
    className: 'left-[4%] top-[18%] w-[min(52vw,640px)] opacity-55',
    scrollSpeed: 0.28,
    mouseSpeed: 0.03,
    pulse: true,
    float: true,
    floatClass: 'bg-svg-float--delay-1',
  },
  {
    id: 'top-block',
    src: '/svg/top-block.svg',
    className: '-right-[8%] -top-[6%] w-[min(55vw,700px)] opacity-25',
    scrollSpeed: 0.1,
    mouseSpeed: 0.012,
  },
  {
    id: 'bottom-block',
    src: '/svg/bottom-block.svg',
    className: '-right-[10%] bottom-[8%] w-[min(50vw,640px)] opacity-20',
    scrollSpeed: 0.14,
    mouseSpeed: 0.015,
  },
  {
    id: 'top-bar',
    src: '/svg/top-bar.svg',
    className: 'right-[4%] top-[12%] hidden w-32 opacity-40 md:block',
    scrollSpeed: 0.22,
    mouseSpeed: 0.02,
    float: true,
    floatClass: 'bg-svg-float--delay-2',
  },
  {
    id: 'bottom-bar',
    src: '/svg/bottom-bar.svg',
    className: 'bottom-[18%] right-[6%] hidden w-28 opacity-35 md:block',
    scrollSpeed: 0.2,
    mouseSpeed: 0.018,
    float: true,
    floatClass: 'bg-svg-float--delay-3 bg-svg-float--slow',
  },
];

const GLOW_ORBS = [
  { className: '-top-48 left-[8%] h-[520px] w-[520px]', scrollSpeed: 0.06 },
  { className: 'top-[38%] -right-24 h-[560px] w-[560px] opacity-70', scrollSpeed: 0.09 },
  { className: '-bottom-32 -left-24 h-[480px] w-[480px] opacity-60', scrollSpeed: 0.05 },
];

export function ParallaxBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax-layer]'));
    const orbs = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax-orb]'));

    function applyTransforms() {
      const scrollY = scrollRef.current;
      const { x: mouseX, y: mouseY } = mouseRef.current;

      for (const layer of layers) {
        const scrollSpeed = Number(layer.dataset.scrollSpeed ?? 0);
        const mouseSpeed = Number(layer.dataset.mouseSpeed ?? 0);
        const y = scrollY * scrollSpeed + mouseY * mouseSpeed;
        const x = mouseX * mouseSpeed * 0.65;
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }

      for (const orb of orbs) {
        const scrollSpeed = Number(orb.dataset.scrollSpeed ?? 0);
        const y = scrollY * scrollSpeed;
        orb.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      }
    }

    function scheduleUpdate() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyTransforms();
      });
    }

    function onScroll() {
      scrollRef.current = window.scrollY;
      scheduleUpdate();
    }

    function onPointerMove(e: PointerEvent) {
      if (prefersReduced) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseRef.current = { x: nx * 24, y: ny * 18 };
      scheduleUpdate();
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    document.addEventListener('astro:page-load', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('astro:page-load', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {GLOW_ORBS.map((orb, i) => (
        <div
          key={i}
          data-parallax-orb
          data-scroll-speed={orb.scrollSpeed}
          className={`bg-acid-glow-circle absolute rounded-full blur-[100px] will-change-transform ${orb.className}`}
        />
      ))}

      {LAYERS.map((layer) => (
        <div
          key={layer.id}
          className={`bg-svg-layer-wrap will-change-transform ${layer.float ? `bg-svg-float ${layer.floatClass ?? ''}` : ''} ${layer.className}`}
        >
          <img
            data-parallax-layer
            data-scroll-speed={layer.scrollSpeed}
            data-mouse-speed={layer.mouseSpeed ?? 0}
            src={layer.src}
            alt=""
            className={`bg-svg-layer will-change-transform ${layer.pulse ? 'bg-svg-pulse' : ''}`}
            loading={layer.id === 'waves' || layer.id === 'ligth' ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-transparent to-bg/80" />
    </div>
  );
}
