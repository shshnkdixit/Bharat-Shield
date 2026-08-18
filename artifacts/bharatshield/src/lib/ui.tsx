import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ---------- Reveal on scroll ---------- */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = Tag as 'div';
  return (
    <Comp
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Comp>
  );
}

/* ---------- Sticky navbar scroll state ---------- */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/* ---------- Count-up number ---------- */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(target);
      return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ---------- Risk metadata ---------- */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;

export function riskMeta(level?: RiskLevel) {
  const key = (level || 'MEDIUM').toUpperCase();
  switch (key) {
    case 'LOW':
      return { key: 'low', color: 'var(--risk-low)', label: 'Low risk', headline: 'Looks routine', action: 'Stay lightly cautious' };
    case 'HIGH':
      return { key: 'high', color: 'var(--risk-high)', label: 'High risk', headline: 'Be careful', action: 'Verify before you act' };
    case 'CRITICAL':
      return { key: 'critical', color: 'var(--risk-critical)', label: 'Critical risk', headline: 'Stop and verify', action: 'Do not act or forward' };
    default:
      return { key: 'medium', color: 'var(--risk-medium)', label: 'Medium risk', headline: 'Worth a pause', action: 'Double-check the source' };
  }
}

/* ---------- Risk badge ---------- */
export function RiskBadge({ level }: { level?: RiskLevel }) {
  const meta = riskMeta(level);
  return <span className={`risk-badge risk-${meta.key}`}>{meta.label}</span>;
}

/* ---------- Animated donut / risk ring ---------- */
export function RiskRing({
  score,
  size = 132,
  stroke = 11,
  color,
  animate = true,
  caption = 'Risk score',
}: {
  score: number;
  size?: number;
  stroke?: number;
  color?: string;
  animate?: boolean;
  caption?: string;
}) {
  const value = useCountUp(animate ? score : score);
  const shown = animate ? value : score;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ;
  const ringColor = color ?? riskMeta(scoreToLevel(score)).color;
  const fontSize = Math.round(size * 0.27);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={animate ? offset : offset}
          style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
        />
      </svg>
      <div className="ring-center">
        <strong style={{ fontSize, color: ringColor }}>{shown}</strong>
        <small>{caption}</small>
      </div>
    </div>
  );
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}
