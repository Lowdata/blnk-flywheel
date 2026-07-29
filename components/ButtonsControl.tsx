'use client';

import { FC } from 'react';

const ButtonsControl: FC<{
    onStart: () => void;
    onPick: () => void;
    disabled?: boolean;
}> = ({ onPick, disabled }) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: '30px',
            right: '30px',
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
                ACTION
            </span>

            {/* 3D Circular Arcade Button Housing Bezel */}
            <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3f3f46 0%, #18181b 70%, #09090b 100%)',
                border: '3px solid #52525b',
                boxShadow: `
                    0 10px 25px rgba(0,0,0,0.85),
                    inset 0 4px 8px rgba(255,255,255,0.12),
                    inset 0 -6px 12px rgba(0,0,0,0.9),
                    0 0 0 2px #18181b
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {/* 3D Sculpted Round Red Arcade Push Button */}
                <button
                    onClick={onPick}
                    disabled={disabled}
                    style={{
                        position: 'relative',
                        width: '92px',
                        height: '92px',
                        borderRadius: '50%',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        fontFamily: 'var(--font-pixel)',
                        fontWeight: 800,
                        fontSize: '11px',
                        letterSpacing: '0.15em',
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        textTransform: 'uppercase',
                        background: disabled
                            ? 'radial-gradient(circle at 35% 30%, #52525b 0%, #3f3f46 60%, #27272a 100%)'
                            : 'radial-gradient(circle at 35% 30%, #ef4444 0%, #dc2626 50%, #991b1b 85%, #7f1d1d 100%)',
                        border: '2px solid rgba(255,255,255,0.15)',
                        boxShadow: disabled
                            ? '0 2px 4px rgba(0,0,0,0.6)'
                            : `
                                0 8px 0 #450a0a,
                                0 12px 20px rgba(0,0,0,0.7),
                                inset 0 3px 6px rgba(255,255,255,0.4),
                                inset 0 -4px 8px rgba(0,0,0,0.6)
                            `,
                        transform: 'translateY(0px)',
                        transition: 'transform 70ms ease, box-shadow 70ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onMouseDown={e => {
                        if (disabled) return;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(6px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                            0 2px 0 #450a0a,
                            0 4px 10px rgba(0,0,0,0.8),
                            inset 0 2px 4px rgba(255,255,255,0.2),
                            inset 0 -2px 6px rgba(0,0,0,0.8)
                        `;
                    }}
                    onMouseUp={e => {
                        if (disabled) return;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                            0 8px 0 #450a0a,
                            0 12px 20px rgba(0,0,0,0.7),
                            inset 0 3px 6px rgba(255,255,255,0.4),
                            inset 0 -4px 8px rgba(0,0,0,0.6)
                        `;
                    }}
                    onTouchStart={e => {
                        if (disabled) return;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(6px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                            0 2px 0 #450a0a,
                            0 4px 10px rgba(0,0,0,0.8),
                            inset 0 2px 4px rgba(255,255,255,0.2),
                            inset 0 -2px 6px rgba(0,0,0,0.8)
                        `;
                    }}
                    onTouchEnd={e => {
                        if (disabled) return;
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                            0 8px 0 #450a0a,
                            0 12px 20px rgba(0,0,0,0.7),
                            inset 0 3px 6px rgba(255,255,255,0.4),
                            inset 0 -4px 8px rgba(0,0,0,0.6)
                        `;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = disabled
                            ? '0 2px 4px rgba(0,0,0,0.6)'
                            : `
                                0 8px 0 #450a0a,
                                0 12px 20px rgba(0,0,0,0.7),
                                inset 0 3px 6px rgba(255,255,255,0.4),
                                inset 0 -4px 8px rgba(0,0,0,0.6)
                            `;
                    }}
                >
                    {/* Top circular specular highlight */}
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '16px',
                        width: '24px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.4)',
                        filter: 'blur(1px)',
                        transform: 'rotate(-25deg)',
                        pointerEvents: 'none',
                    }} />
                    DROP
                </button>
            </div>
        </div>
    );
};

export default ButtonsControl;
