'use client';

import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)'
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const reducedMotion = useReducedMotion();
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    const element = divRef.current;
    if (!element || isFocused || reducedMotion) return;
    const rect = element.getBoundingClientRect();
    // CSS variables avoid a React render for every pointer movement.
    element.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    element.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  const handleFocus = () => {
    setIsFocused(true);
    divRef.current?.style.setProperty('--spotlight-x', '50%');
    divRef.current?.style.setProperty('--spotlight-y', '50%');
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        aria-hidden="true"
        style={{
          opacity: reducedMotion ? 0 : opacity,
          background: `radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 80%)`
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
