import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Burst {
  id: number;
  x: number;
  y: number;
}

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  
  const posRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef({ x: -100, y: -100 });
  const animFrameRef = useRef<number | null>(null);
  const burstIdRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check hover status
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button, a, select, input, textarea, [role="button"], [role="switch"], [role="tab"], [role="option"], [role="combobox"], .cursor-pointer, option, [data-interactive]') ||
          window.getComputedStyle(target).cursor === 'pointer'
        );
        setIsHovered(isInteractive);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicked(true);
      const id = burstIdRef.current++;
      setBursts(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== id));
      }, 500);
    };
    
    const handleMouseUp = () => setIsClicked(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth trail loop
    const updateTrail = () => {
      const dx = posRef.current.x - trailRef.current.x;
      const dy = posRef.current.y - trailRef.current.y;
      
      trailRef.current.x += dx * 0.35;
      trailRef.current.y += dy * 0.35;
      
      setTrailPos({ x: trailRef.current.x, y: trailRef.current.y });
      animFrameRef.current = requestAnimationFrame(updateTrail);
    };

    animFrameRef.current = requestAnimationFrame(updateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      {/* Lagging trailing blood dot */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        animate={{
          x: trailPos.x - (isHovered ? 14 : 6),
          y: trailPos.y - (isHovered ? 14 : 6),
          width: isHovered ? 28 : 12,
          height: isHovered ? 28 : 12,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
        style={{
          backgroundColor: isHovered ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.4)',
          boxShadow: isHovered ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 0 8px rgba(220, 38, 38, 0.5)',
          border: isHovered ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
        }}
      />

      {/* Main Gritty Reticle Cursor */}
      <motion.div
        className="absolute pointer-events-none flex items-center justify-center"
        animate={{
          x: pos.x - 24,
          y: pos.y - 24,
          scale: isClicked ? 0.85 : isHovered ? 1.15 : 1,
          rotate: isHovered ? 45 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
        style={{ width: 48, height: 48 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]"
        >
          {/* Outer Segmented Ring */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke={isHovered ? "#ef4444" : "#991b1b"}
            strokeWidth="1.5"
            strokeDasharray={isHovered ? "4 6" : "8 4 2 4"}
            className={`transition-all duration-300 ${isHovered ? 'animate-[spin_4s_linear_infinite]' : ''}`}
            style={{ transformOrigin: "24px 24px" }}
          />

          {/* Inner Corner Brackets / Target Locks */}
          <path d="M 14 10 L 10 10 L 10 14" stroke={isHovered ? "#f87171" : "#dc2626"} strokeWidth="1.5" strokeLinecap="square" />
          <path d="M 34 10 L 38 10 L 38 14" stroke={isHovered ? "#f87171" : "#dc2626"} strokeWidth="1.5" strokeLinecap="square" />
          <path d="M 14 38 L 10 38 L 10 34" stroke={isHovered ? "#f87171" : "#dc2626"} strokeWidth="1.5" strokeLinecap="square" />
          <path d="M 34 38 L 38 38 L 38 34" stroke={isHovered ? "#f87171" : "#dc2626"} strokeWidth="1.5" strokeLinecap="square" />

          {/* Gritty Crosshair Lines */}
          <line x1="24" y1="4" x2="24" y2="12" stroke={isHovered ? "#f87171" : "#b91c1c"} strokeWidth="1.5" />
          <line x1="24" y1="36" x2="24" y2="44" stroke={isHovered ? "#f87171" : "#b91c1c"} strokeWidth="1.5" />
          <line x1="4" y1="24" x2="12" y2="24" stroke={isHovered ? "#f87171" : "#b91c1c"} strokeWidth="1.5" />
          <line x1="36" y1="24" x2="44" y2="24" stroke={isHovered ? "#f87171" : "#b91c1c"} strokeWidth="1.5" />

          {/* Center Red Dot / Blood Drop */}
          <circle
            cx="24"
            cy="24"
            r={isClicked ? "5" : isHovered ? "4" : "2.5"}
            fill={isHovered ? "#ef4444" : "#dc2626"}
            className="transition-all duration-200"
          />

          {/* Blood Splatter Accents */}
          {!isHovered && (
            <>
              <circle cx="17" cy="14" r="1" fill="#7f1d1d" opacity="0.9" />
              <circle cx="32" cy="30" r="1.5" fill="#991b1b" opacity="0.95" />
              <circle cx="30" cy="16" r="0.8" fill="#7f1d1d" opacity="0.8" />
              <circle cx="14" cy="32" r="1.2" fill="#b91c1c" opacity="0.9" />
            </>
          )}
        </svg>
      </motion.div>

      {/* Click burst ripple - uses Framer Motion for a clean one-off effect */}
      <AnimatePresence>
        {bursts.map(burst => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 0.8, scale: 0.2, borderWidth: "4px" }}
            animate={{ opacity: 0, scale: 2.5, borderWidth: "1px" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            style={{
              left: burst.x - 24,
              top: burst.y - 24,
              width: 48,
              height: 48,
              borderStyle: "solid"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
