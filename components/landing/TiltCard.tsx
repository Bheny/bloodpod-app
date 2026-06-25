"use client";

import { type ReactNode, useRef } from "react";
import { m, useMotionValue, useSpring, useTransform } from "framer-motion";

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 150, damping: 18 });
  const springY = useSpring(y, { stiffness: 150, damping: 18 });

  const rotateX = useTransform(springY, [0, 1], [10, -10]);
  const rotateY = useTransform(springX, [0, 1], [-10, 10]);
  const glowX = useTransform(springX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(springY, [0, 1], ["0%", "100%"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <m.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`group ${className ?? ""}`}
    >
      <m.div
        className="pointer-events-none absolute inset-0 z-10 rounded-card opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />
      {children}
    </m.div>
  );
}
