import { useMemo } from "react";

// Deterministic PRNG so SSR and client render identical star fields (no hydration mismatch).
function seeded(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CosmicBackground() {
  const stars = useMemo(() => {
    const rand = seeded(20260731);
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      top: +(rand() * 100).toFixed(3),
      left: +(rand() * 100).toFixed(3),
      size: +(rand() * 2 + 1).toFixed(3),
      delay: +(rand() * 3).toFixed(3),
    }));
  }, []);


  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-oracle/30 blur-[120px] animate-float-slow" />
      <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-gold/20 blur-[120px] animate-float-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-accent/25 blur-[100px] animate-float-slow" style={{ animationDelay: "4s" }} />
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-gold animate-shimmer-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
