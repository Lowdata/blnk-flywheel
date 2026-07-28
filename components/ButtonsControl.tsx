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
            bottom: '28px',
            right: '28px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: disabled ? 0.3 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
        }}>
            {/* DROP button — 3D arcade style */}
            <button
                onClick={disabled ? undefined : onPick}
                disabled={disabled}
                style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '13px',
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    textTransform: 'uppercase' as const,
                    // 3D arcade button look — subtle red for DROP in monochrome world
                    background: 'radial-gradient(circle at 40% 32%, #666 0%, #333 55%, #111 100%)',
                    boxShadow: `
                        0 6px 0 #000,
                        0 8px 16px rgba(0,0,0,0.7),
                        inset 0 1px 0 rgba(255,255,255,0.15),
                        0 0 0 1px rgba(255,255,255,0.08)
                    `,
                    transform: 'translateY(0px)',
                    transition: 'transform 80ms ease, box-shadow 80ms ease',
                    userSelect: 'none',
                }}
                onMouseDown={e => {
                    if (disabled) return;
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(5px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                        0 1px 0 #000,
                        0 3px 8px rgba(0,0,0,0.7),
                        inset 0 1px 0 rgba(255,255,255,0.05),
                        0 0 0 1px rgba(255,255,255,0.05)
                    `;
                }}
                onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                        0 6px 0 #000,
                        0 8px 16px rgba(0,0,0,0.7),
                        inset 0 1px 0 rgba(255,255,255,0.15),
                        0 0 0 1px rgba(255,255,255,0.08)
                    `;
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `
                        0 6px 0 #000,
                        0 8px 16px rgba(0,0,0,0.7),
                        inset 0 1px 0 rgba(255,255,255,0.15),
                        0 0 0 1px rgba(255,255,255,0.08)
                    `;
                }}
            >
                DROP
            </button>
            <div style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
            }}>
                DROP CLAW
            </div>
        </div>
    );
};

export default ButtonsControl;
