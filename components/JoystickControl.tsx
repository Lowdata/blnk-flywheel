'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

const JoystickControl: FC<{
    onJoystick: (x: number, z: number) => void;
    disabled?: boolean;
}> = ({ onJoystick, disabled }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

    const RADIUS = 45; // max knob travel in px

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
    }, [onJoystick, RADIUS]);

    const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        updatePos(clientX, clientY);
    }, [disabled, updatePos]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
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
        const preventTouchScroll = (e: TouchEvent) => {
            if (e.cancelable) e.preventDefault();
        };
        const el = baseRef.current;
        if (el) {
            el.addEventListener('touchstart', preventTouchScroll, { passive: false });
            el.addEventListener('touchmove', preventTouchScroll, { passive: false });
        }
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        return () => {
            if (el) {
                el.removeEventListener('touchstart', preventTouchScroll);
                el.removeEventListener('touchmove', preventTouchScroll);
            }
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [handleMove, handleEnd]);

    return (
        <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '30px',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
        }}>
            <span style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '9px',
                letterSpacing: '0.2em',
                color: '#22c55e',
                textShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
                textTransform: 'uppercase',
            }}>
                JOYSTICK
            </span>

            {/* 3D Sculpted Circular Arcade Joystick Base */}
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
                    WebkitUserSelect: 'none',
                    touchAction: 'none',
                    background: 'radial-gradient(circle at 35% 35%, #2a2a2e 0%, #111113 70%, #080809 100%)',
                    border: '4px solid #3f3f46',
                    boxShadow: `
                        0 10px 25px rgba(0,0,0,0.85),
                        inset 0 4px 8px rgba(255,255,255,0.1),
                        inset 0 -6px 12px rgba(0,0,0,0.9),
                        0 0 0 2px #18181b
                    `,
                }}
            >
                {/* Internal beveled ring */}
                <div style={{
                    position: 'absolute',
                    inset: '18px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #09090b 0%, #18181b 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                }} />

                {/* Crosshair guide indicators */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: '1px', height: '65%', background: 'rgba(34,197,94,0.15)' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ height: '1px', width: '65%', background: 'rgba(34,197,94,0.15)' }} />
                </div>

                {/* Arrow indicators */}
                {[
                    { symbol: '▲', style: { top: 8, left: '50%', transform: 'translateX(-50%)' } },
                    { symbol: '▼', style: { bottom: 8, left: '50%', transform: 'translateX(-50%)' } },
                    { symbol: '◀', style: { left: 8, top: '50%', transform: 'translateY(-50%)' } },
                    { symbol: '▶', style: { right: 8, top: '50%', transform: 'translateY(-50%)' } },
                ].map(({ symbol, style }) => (
                    <span key={symbol} style={{
                        position: 'absolute',
                        ...style,
                        fontSize: '9px',
                        color: 'rgba(34,197,94,0.4)',
                        textShadow: '0 0 5px rgba(34,197,94,0.3)',
                        pointerEvents: 'none',
                    }}>{symbol}</span>
                ))}

                {/* 3D Metallic Stick Shaft */}
                <div style={{
                    position: 'absolute',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    left: 'calc(50% - 7px)',
                    top: 'calc(50% - 7px)',
                    transform: `translate(${knobPos.x * 0.4}px, ${knobPos.y * 0.4}px)`,
                    background: 'linear-gradient(135deg, #a1a1aa 0%, #52525b 50%, #27272a 100%)',
                    pointerEvents: 'none',
                }} />

                {/* 3D Sculpted Spherical Joystick Knob */}
                <div style={{
                    position: 'absolute',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    left: 'calc(50% - 28px)',
                    top: 'calc(50% - 28px)',
                    transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    background: 'radial-gradient(circle at 35% 30%, #ef4444 0%, #dc2626 50%, #7f1d1d 90%, #450a0a 100%)',
                    boxShadow: isDragging
                        ? `0 4px 10px rgba(0,0,0,0.8), inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.7)`
                        : `0 8px 20px rgba(0,0,0,0.9), inset 0 4px 8px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(0,0,0,0.8)`,
                    cursor: disabled ? 'not-allowed' : 'grab',
                }}>
                    {/* Top specular highlight reflection */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '12px',
                        width: '16px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.45)',
                        filter: 'blur(1px)',
                        transform: 'rotate(-25deg)',
                    }} />
                </div>
            </div>
        </div>
    );
};

export default JoystickControl;
