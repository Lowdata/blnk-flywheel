'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Modal, ModalContent, ModalOverlay, Text, useToast } from '@chakra-ui/react';
import { Canvas } from '@react-three/fiber';
import ButtonsControl from '@/components/ButtonsControl';
import JoystickControl from '@/components/JoystickControl';
import ProgressBar from '@/components/ProgressBar';
import Scene from '@/components/Scene';
import { useRouter } from 'next/navigation';

/* ─── Game Phase State Machine ──────────────────────────────────────────────
   intro        → Big "PLAY GAME" button. Controls hidden.
   spending     → API call in-flight + coin arc animation.
   playing      → Joystick + DROP enabled. User positions claw.
   grabbing     → Claw animation running. Controls disabled.
   revealing    → Ball centers, player clicks it open, then sees the outcome.
   ──────────────────────────────────────────────────────────────────────── */
type Phase = 'intro' | 'spending' | 'playing' | 'grabbing' | 'revealing';

/* ─── Outcome Modal Types ────────────────────────────────────────────────── */
type OutcomeCard = { outcome: string; isWin: boolean } | null;

/* ─── Coin Arc ───────────────────────────────────────────────────────────── */
function CoinArc({ visible }: { visible: boolean }) {
    return (
        <div
            aria-hidden
            style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                pointerEvents: 'none',
                opacity: visible ? 1 : 0,
                animation: visible ? 'coinArc 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' : 'none',
            }}
        >
            <div style={{
                position: 'relative',
                width: '30px',
                height: '30px',
                transform: 'rotateX(58deg)',
                transformStyle: 'preserve-3d',
            }}>
                {/* The offset lower disk creates a visible coin edge, rather than a sphere. */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    top: '5px',
                    borderRadius: '50%',
                    background: '#76520B',
                    border: '2px solid #4A3100',
                    boxShadow: '0 3px 4px rgba(0,0,0,0.5)',
                }} />
                <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid #FFF1A6',
                background: 'radial-gradient(circle at 32% 24%, #FFF7B3 0 7%, #F4C542 28%, #C98B12 66%, #875400 100%)',
                boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.7), inset 0 -3px 3px rgba(72,42,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B4300',
                fontWeight: 900,
                fontSize: '11px',
                fontFamily: 'monospace',
                textShadow: '0 1px rgba(255,255,255,0.45)',
            }}>
                ◈
            </div>
            </div>
        </div>
    );
}

export default function GamePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<Phase>('intro');
    const [revealStep, setRevealStep] = useState<string | null>(null);
    const [outcomeCard, setOutcomeCard] = useState<OutcomeCard>(null);
    const [user, setUser] = useState<any>(null);
    const [coinArcVisible, setCoinArcVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    const ref = useRef<any>(null);
    const toast = useToast();
    const router = useRouter();
    const pendingOutcomeRef = useRef<string | null>(null);

    useEffect(() => {
        setMounted(true);
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json().then(d => setUser(d.user));
                toast({ title: 'Please connect wallet', status: 'warning', position: 'top' });
                router.push('/');
            })
            .catch(() => {
                toast({ title: 'Network error', status: 'error', position: 'top' });
                router.push('/');
            });
    }, [router, toast]);

    /* ── PLAY button handler ───────────────────────────────────────────────
       1. API call fires immediately on PLAY click (deduct 3 coins, get outcome)
       2. Coin arc animation plays during the ~300ms network round-trip
       3. After animation: joystick + DROP unlock
    ─────────────────────────────────────────────────────────────────────── */
    const handlePlay = useCallback(async () => {
        if (phase !== 'intro' || !user) return;
        if ((user?.coins ?? 0) < 3) {
            toast({
                title: 'Not enough coins',
                description: 'You need 3 coins to play.',
                status: 'warning',
                position: 'top',
            });
            return;
        }
        setPhase('spending');
        setCoinArcVisible(true);

        try {
            const res = await fetch('/api/game/play', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                toast({ title: data.message || 'Error', status: 'error', position: 'top' });
                setPhase('intro');
                setCoinArcVisible(false);
                return;
            }

            // Store the outcome for when the claw drop completes
            pendingOutcomeRef.current = data.outcome;
            setUser((prev: any) => ({ ...prev, coins: data.coinsLeft }));

            // Let coin arc animation complete (700ms), then unlock controls
            setTimeout(() => {
                setCoinArcVisible(false);
                setPhase('playing');
            }, 750);
        } catch {
            toast({ title: 'Network error', status: 'error', position: 'top' });
            setPhase('intro');
            setCoinArcVisible(false);
        }
    }, [phase, user, toast]);

    /* ── DROP handler — starts claw animation, then reveals outcome ───────── */
    const handleDrop = useCallback(() => {
        if (phase !== 'playing') return;
        setPhase('grabbing');
        const outcome = pendingOutcomeRef.current ?? 'LOSS';

        // Scene notifies us when the capsule has reached the delivery chute.
        // This keeps the reveal synchronized with the actual 3D animation.
        ref.current?.onPick(outcome, () => {
            setPhase('revealing');
            ref.current?.startReveal(
                outcome,
                () => setRevealStep('ready'),
                () => {
                    setRevealStep('opened');
                    setOutcomeCard({ outcome, isWin: outcome !== 'LOSS' });
                }
            );
        });
    }, [phase]);

    const handleClickCapsule = useCallback(() => {
        if (phase !== 'revealing' || revealStep !== 'ready') return;
        setRevealStep('opening');
        ref.current?.clickCapsule();
    }, [phase, revealStep]);

    /* ── Close modal + reset scene ─────────────────────────────────────── */
    const handleClose = useCallback(() => {
        setOutcomeCard(null);
        setRevealStep(null);
        pendingOutcomeRef.current = null;
        setPhase('intro');
        ref.current?.closeReveal();
    }, []);

    /* ── Share on X ──────────────────────────────────────────────────────── */
    const shareOnX = useCallback(() => {
        const outcome = outcomeCard?.outcome ?? '';
        const text = encodeURIComponent(
            outcome === 'GTD'
                ? `just pulled GUARANTEED on @blnk_xyz 🎰 colour unlocked. grey world is done. free to play: blnk.xyz`
                : `pulled FCFS on @blnk_xyz — racing the clock ⏳ colourful capsules. grey world. get in. free to play: blnk.xyz`
        );
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }, [outcomeCard]);

    if (!mounted) {
        return null;
    }

    const controlsDisabled = phase !== 'playing';

    return (
        <>
            {/* Coin arc keyframe */}
            <style>{`
                @keyframes coinArc {
                    0%   { transform: translate(calc(50vw - 17px), calc(100vh - 52px)) rotateY(0deg) rotateX(12deg) scale(1.2); opacity: 1; }
                    44%  { transform: translate(calc(46vw), calc(50vh)) rotateY(540deg) rotateX(58deg) scale(1.7); opacity: 1; }
                    78%  { transform: translate(calc(50vw - 17px), calc(65vh)) rotateY(900deg) rotateX(76deg) scale(1.05); opacity: 1; }
                    100% { transform: translate(calc(50vw - 17px), calc(67vh)) rotateY(1080deg) rotateX(82deg) scale(0.58); opacity: 0; }
                }
                @keyframes pulseRing {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50%       { opacity: 1;   transform: scale(1.06); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>

            <Box position="relative" w="100vw" h="100vh" overflow="hidden" bg="#0A0A0A">

                {/* Subtle deep vignette — monochrome only */}
                <Box
                    position="absolute" inset={0} zIndex={1} pointerEvents="none"
                    bgGradient="radial(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)"
                />

                {/* Coin arc sprite */}
                <CoinArc visible={coinArcVisible} />

                {/* ── 3D Canvas ─────────────────────────────────────────── */}
                <Canvas shadows camera={{ position: [0, 2.1, 2.2], fov: 55 }}>
                    <Scene ref={ref} setIsLoading={setIsLoading} setProgress={setProgress} />
                </Canvas>

                {/* ── Loading overlay ────────────────────────────────────── */}
                <Modal isOpen={isLoading} onClose={() => {}}>
                    <ModalOverlay bg="black" />
                    <ModalContent my={0} py="120px" h="full" display="flex" justifyContent="end" alignItems="center" bg="none" shadow="none">
                        <ProgressBar progress={progress} />
                    </ModalContent>
                </Modal>

                {/* ── HUD: top bar ──────────────────────────────────────── */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    pointerEvents: 'none',
                }}>
                    {/* Home button */}
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            pointerEvents: 'auto',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px',
                            color: 'rgba(255,255,255,0.7)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            transition: 'background 0.2s, color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        ← DASHBOARD
                    </button>

                    {/* BLNK brand */}
                    <div style={{
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '16px',
                        letterSpacing: '0.35em',
                        color: 'rgba(255,255,255,0.9)',
                        textTransform: 'uppercase',
                        pointerEvents: 'none',
                    }}>
                        BLNK
                    </div>

                    {/* Coin balance */}
                    <div style={{
                        pointerEvents: 'auto',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        backdropFilter: 'blur(8px)',
                    }}>
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: 'rgba(255,255,255,0.8)',
                        }}>
                            ◈ {user?.coins ?? 0} COINS
                        </span>
                    </div>
                </div>

                {/* ── INTRO phase: big PLAY GAME button ─────────────────── */}
                {phase === 'intro' && !isLoading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: '120px',
                        pointerEvents: 'none',
                        animation: 'fadeUp 0.6s ease both',
                    }}>
                        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={handlePlay}
                                style={{
                                    padding: '0',
                                    width: '200px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.22em',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    boxShadow: `
                                        0 8px 0 rgba(0,0,0,0.8),
                                        0 12px 30px rgba(0,0,0,0.6),
                                        inset 0 1px 0 rgba(255,255,255,0.12)
                                    `,
                                    transition: 'transform 80ms, box-shadow 80ms',
                                    animation: 'pulseRing 2.4s ease-in-out infinite',
                                }}
                                onMouseDown={e => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(6px)';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 0 rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)';
                                }}
                                onMouseUp={e => {
                                    (e.currentTarget as HTMLButtonElement).style.transform = '';
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
                                }}
                            >
                                ▶ PLAY GAME
                            </button>
                            <div style={{
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: 'rgba(255,255,255,0.3)',
                                letterSpacing: '0.15em',
                            }}>
                                COSTS 3 COINS
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SPENDING phase: "processing" text ─────────────────── */}
                {phase === 'spending' && (
                    <div style={{
                        position: 'absolute',
                        bottom: '120px',
                        width: '100%',
                        textAlign: 'center',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }}>
                        <span style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.2em',
                            animation: 'pulseRing 1s ease infinite',
                        }}>
                            LOADING CLAW…
                        </span>
                    </div>
                )}

                {/* ── PLAYING phase: joystick + drop button ─────────────── */}
                {(phase === 'playing' || phase === 'grabbing') && (
                    <>
                        <JoystickControl
                            onJoystick={(x, z) => ref.current?.onJoystick(x, z)}
                            disabled={phase === 'grabbing'}
                        />
                        <ButtonsControl
                            onStart={() => {}}
                            onPick={handleDrop}
                            disabled={phase === 'grabbing'}
                        />
                    </>
                )}

                {/* ── REVEALING: "click to open" prompt ─────────────────── */}
                {phase === 'revealing' && revealStep === 'ready' && (
                    <div style={{
                        position: 'absolute', top: '14%', width: '100%', textAlign: 'center',
                        zIndex: 20, pointerEvents: 'none', animation: 'pulseRing 1.8s ease-in-out infinite',
                    }}>
                        <span style={{
                            fontFamily: 'monospace', fontSize: '14px', fontWeight: 800,
                            color: 'rgba(255,255,255,0.9)', letterSpacing: '0.25em',
                            textShadow: '0 0 20px rgba(255,255,255,0.2)',
                        }}>
                            ✦ CLICK CAPSULE TO OPEN ✦
                        </span>
                    </div>
                )}

                {phase === 'revealing' && revealStep === 'ready' && (
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Open the reward capsule"
                        style={{ position: 'absolute', inset: 0, zIndex: 15, cursor: 'pointer' }}
                        onClick={handleClickCapsule}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') handleClickCapsule();
                        }}
                    />
                )}

                {/* ── Outcome modal ──────────────────────────────────────── */}
                {outcomeCard && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 30,
                        background: 'rgba(0,0,0,0.88)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        animation: 'fadeUp 0.4s ease both',
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '380px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            padding: '36px 28px',
                            textAlign: 'center',
                            boxShadow: '0 0 80px rgba(255,255,255,0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}>
                            {outcomeCard.isWin ? (
                                <>
                                    <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                        REWARD UNLOCKED
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {outcomeCard.outcome}
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                                        You have extracted a rare whitelist spot from the machine. Post on X to claim.
                                    </div>
                                    <button
                                        onClick={shareOnX}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            background: 'rgba(255,255,255,0.08)',
                                            color: '#fff', fontFamily: 'monospace', fontSize: '12px',
                                            fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            transition: 'background 0.2s',
                                        }}
                                    >
                                        POST ON X TO CLAIM
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: '12px',
                                            border: 'none', background: 'transparent',
                                            color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace',
                                            fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        ← RETURN TO MACHINE
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                                        THE CLAW HAS SPOKEN
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        EMPTY
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                                        The capsule was empty this time. Grey world wins this round.
                                        <br />Refer friends for more coins and try again.
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            background: 'rgba(255,255,255,0.06)',
                                            color: '#fff', fontFamily: 'monospace', fontSize: '12px',
                                            fontWeight: 800, letterSpacing: '0.18em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        TRY AGAIN
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Box>
        </>
    );
}
