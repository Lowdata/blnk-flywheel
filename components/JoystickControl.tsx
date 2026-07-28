'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

const JoystickControl: FC<{
    onJoystick: (x: number, z: number) => void;
    disabled?: boolean;
}> = ({ onJoystick, disabled }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

    const RADIUS = 55; // max knob travel in px

    const updatePos = useCallback((clientX: number, clientY: number) => {
        if (!baseRef.current) return;
        const rect = baseRef.current.getBoundingClientRect();
        let x = clientX - rect.left - rect.width / 2;
        let y = clientY - rect.top - rect.height / 2;
        const d = Math.hypot(x, y);
        if (d > RADIUS) {
            x *= RADIUS / d;
            y *= RADIUS / d;
        }
        setKnobPos({ x, y });
        onJoystick(x, y);
    }, [onJoystick]);

    const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        updatePos(clientX, clientY);
    }, [disabled, updatePos]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        updatePos(clientX, clientY);
    }, [isDragging, updatePos]);

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystick(0, 0);
    }, [onJoystick]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: true });
        window.addEventListener('touchend', handleEnd);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [handleMove, handleEnd]);

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '28px',
                left: '28px',
                zIndex: 10,
                opacity: disabled ? 0.3 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                transition: 'opacity 0.3s ease',
            }}
        >
            {/* Label */}
            <div style={{
                textAlign: 'center',
                marginBottom: '8px',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
            }}>
                MOVE
            </div>

            {/* Outer base — 3D depth ring */}
            <div
                ref={baseRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    userSelect: 'none',
                    // 3D depth: concave well effect
                    background: 'radial-gradient(circle at 40% 35%, #2a2a2a 0%, #111 55%, #0a0a0a 100%)',
                    boxShadow: `
                        inset 0 4px 12px rgba(0,0,0,0.9),
                        inset 0 1px 3px rgba(0,0,0,0.7),
                        0 2px 0 rgba(255,255,255,0.04),
                        0 8px 32px rgba(0,0,0,0.8),
                        0 0 0 1px rgba(255,255,255,0.06)
                    `,
                }}
            >
                {/* Crosshair guides */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '1px', height: '70%', background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ height: '1px', width: '70%', background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Arrow indicators */}
                {[
                    { symbol: '▲', style: { top: 6, left: '50%', transform: 'translateX(-50%)' } },
                    { symbol: '▼', style: { bottom: 6, left: '50%', transform: 'translateX(-50%)' } },
                    { symbol: '◀', style: { left: 6, top: '50%', transform: 'translateY(-50%)' } },
                    { symbol: '▶', style: { right: 6, top: '50%', transform: 'translateY(-50%)' } },
                ].map(({ symbol, style }) => (
                    <span key={symbol} style={{
                        position: 'absolute',
                        ...style,
                        fontSize: '8px',
                        color: 'rgba(255,255,255,0.2)',
                        pointerEvents: 'none',
                    }}>{symbol}</span>
                ))}

                {/* Knob — metallic sphere */}
                <div style={{
                    position: 'absolute',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    left: 'calc(50% - 26px)',
                    top: 'calc(50% - 26px)',
                    transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    // Metallic sphere illusion via radial gradient
                    background: 'radial-gradient(circle at 38% 32%, #888 0%, #444 40%, #1a1a1a 75%, #111 100%)',
                    boxShadow: isDragging
                        ? `0 2px 8px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.15), inset 0 1px 2px rgba(255,255,255,0.2)`
                        : `0 4px 16px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 3px rgba(255,255,255,0.15)`,
                    cursor: disabled ? 'not-allowed' : 'grab',
                }} />
            </div>
        </div>
    );
};

export default JoystickControl;