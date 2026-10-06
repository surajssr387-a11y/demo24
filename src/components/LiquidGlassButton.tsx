import React, { useRef, useState, useCallback } from 'react';

interface LiquidGlassButtonProps {
  children?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  padding?: string;
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  label = 'CATEGORIES',
  onClick,
  className = '',
  icon,
  iconPosition = 'right',
  padding = 'px-9 py-4',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number; px: number; py: number }>({
    x: 0,
    y: 0,
    px: 50,
    py: 50,
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalized [-1, 1] from center
    const normX = ((x / rect.width) - 0.5) * 2;
    const normY = ((y / rect.height) - 0.5) * 2;
    
    // Percentage [0, 100] for gradients
    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setPointer({
      x: normX,
      y: normY,
      px,
      py,
    });
  }, []);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    handlePointerMove(e);
  }, [handlePointerMove]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    setPointer({ x: 0, y: 0, px: 50, py: 50 });
  }, []);

  // Compute optical dynamic tilt & translation values
  const rotateX = isHovered ? -pointer.y * 7 : 0;
  const rotateY = isHovered ? pointer.x * 9 : 0;
  const scale = isPressed ? 0.96 : isHovered ? 1.025 : 1;
  const reflectionTranslateX = isHovered ? (pointer.x * 22) : 0;
  const causticTranslateX = isHovered ? (pointer.x * 35) : 0;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      className={`group relative inline-flex items-center justify-center select-none cursor-pointer border-0 bg-transparent text-white focus:outline-none transition-transform duration-200 ease-out ${className}`}
      style={{
        perspective: '900px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* 3D Optical Face Container */}
      <span
        className="relative inline-flex items-center justify-center gap-2.5 rounded-full font-extrabold tracking-wider transition-all duration-200 ease-out"
        style={{
          transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
          transformStyle: 'preserve-3d',
          padding: '0',
        }}
      >
        {/* Outer Shadow Depth (Ambient & Drop Shadows) */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none transition-shadow duration-300"
          style={{
            boxShadow: isHovered
              ? '0 2px 4px rgba(0,0,0,0.3), 0 10px 24px -4px rgba(0,0,0,0.5), 0 24px 44px -10px rgba(0,0,0,0.6)'
              : '0 1px 2px rgba(0,0,0,0.25), 0 6px 14px -3px rgba(0,0,0,0.4), 0 16px 28px -8px rgba(0,0,0,0.45)',
          }}
        />

        {/* Optical Glass Surface (Refractive Backing & Blur) */}
        <span
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{
            background: isHovered
              ? 'linear-gradient(150deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0.22) 100%)'
              : 'linear-gradient(150deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.15) 100%)',
            backdropFilter: 'blur(18px) saturate(1.25) contrast(1.08)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.25) contrast(1.08)',
            boxShadow:
              'inset 0 1px 1.5px rgba(255,255,255,0.9), inset 0 -1.5px 1.5px rgba(255,255,255,0.5), inset 1.5px 0 1px rgba(255,255,255,0.6), inset -1px 0 1px rgba(0,0,0,0.25)',
          }}
        >
          {/* Glass Shoulder Shadow (Lens Thickness Effect) */}
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                'inset 0 10px 14px -8px rgba(0,0,0,0.5), inset 0 -10px 10px -8px rgba(255,255,255,0.9), inset 6px 0 8px -7px rgba(0,0,0,0.45), inset -6px 0 8px -7px rgba(0,0,0,0.3)',
            }}
          />

          {/* Sweeping Diagonal Specular Glass Reflection Sheen */}
          <span
            className="absolute inset-[-45%_-50%] pointer-events-none transition-transform duration-150 ease-out"
            style={{
              transform: `translate3d(${reflectionTranslateX}px, 0, 0)`,
              background:
                'linear-gradient(112deg, rgba(255,255,255,0) 24%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.42) 42%, rgba(255,255,255,0.78) 46%, rgba(255,255,255,0.22) 53%, rgba(255,255,255,0) 62%)',
              opacity: isHovered ? 0.95 : 0.65,
              willChange: 'transform, opacity',
            }}
          />

          {/* Interactive Mouse-Tracking Pointer Spot Light */}
          {isHovered && (
            <span
              className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle 90px at ${pointer.px}% ${pointer.py}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0) 75%)`,
                opacity: 0.85,
              }}
            />
          )}

          {/* Caustic Glow Arc at the Bottom Edge */}
          <span
            className="absolute bottom-[1.5px] left-[10%] w-[48%] h-[2.5px] rounded-full pointer-events-none transition-transform duration-150 ease-out"
            style={{
              transform: `translate3d(${causticTranslateX}px, 0, 0)`,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0) 100%)',
              filter: 'blur(0.4px)',
              opacity: isHovered ? 1 : 0.8,
            }}
          />

          {/* Bottom Rim Highlight Line */}
          <span
            className="absolute bottom-[1px] left-[14%] right-[14%] h-[1px] rounded-full pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 18%, rgba(255,255,255,0.85) 52%, rgba(255,255,255,0.12) 84%, rgba(255,255,255,0) 100%)',
              opacity: 0.85,
            }}
          />
        </span>

        {/* Polished Glass Inner Rim Border */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '1.25px solid rgba(255,255,255,0.55)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Content Layer (Text & Icon with Subtle Optical Text Shadow) */}
        <span
          className={`relative z-10 flex items-center justify-center gap-2.5 ${padding}`}
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
          }}
        >
          {iconPosition === 'left' && icon && (
            <span className="flex items-center shrink-0 transition-transform duration-200 group-hover:scale-105">
              {icon}
            </span>
          )}

          <span className="tracking-wider uppercase text-sm md:text-base font-black">
            {children || label}
          </span>

          {iconPosition === 'right' && icon && (
            <span className="flex items-center shrink-0 transition-transform duration-200 group-hover:translate-y-0.5">
              {icon}
            </span>
          )}
        </span>
      </span>
    </button>
  );
};
