'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Modal, ModalContent, ModalOverlay, Text, useToast } from '@chakra-ui/react';
import { Canvas, useThree } from '@react-three/fiber';
import ButtonsControl from '@/components/ButtonsControl';
import JoystickControl from '@/components/JoystickControl';
import ProgressBar from '@/components/ProgressBar';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });
import { useRouter } from 'next/navigation';
import { soundManager } from '@/lib/sound';
import SoundButton from '@/components/SoundButton';
import * as THREE from 'three';
import { useDisconnect } from 'wagmi';
import SmileyStampBadge from '@/components/SmileyStampBadge';
import PillBadge from '@/components/PillBadge';

/* --- Game Phase State Machine ----------------------------------------------
   intro        → Big "PLAY GAME" button. Controls hidden.
   spending     → API call in-flight + coin arc animation.
   playing      → Joystick + DROP enabled. User positions claw.
   grabbing     → Claw animation running. Controls disabled.
   revealing    → Ball centers, player clicks it open, then sees the outcome.
   ------------------------------------------------------------------------ */
type Phase = 'intro' | 'spending' | 'playing' | 'grabbing' | 'revealing';

/* --- Outcome Modal Types -------------------------------------------------- */
type OutcomeCard = { outcome: string; isWin: boolean } | null;

function ResponsiveCamera({ isCameraResetting }: { isCameraResetting?: boolean }) {
    const { camera, size } = useThree();
    useEffect(() => {
        if (isCameraResetting) return;
        const isMobile = size.width < 768;
        const targetZ = isMobile ? 2.85 : 2.2;
        const targetFov = isMobile ? 58 : 55;
        if (Math.abs(camera.position.z - targetZ) > 0.05 || (camera as THREE.PerspectiveCamera).fov !== targetFov) {
            camera.position.z = targetZ;
            (camera as THREE.PerspectiveCamera).fov = targetFov;
            camera.updateProjectionMatrix();
        }
    }, [camera, size.width, isCameraResetting]);
    return null;
}

function WinColorOverlay() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden',
        }}>
            {/* Elegant low-intensity animated ambient aurora waves */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-15%',
                width: '80%',
                height: '80%',
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'auroraFloat1 8s infinite alternate ease-in-out',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-15%',
                right: '-10%',
                width: '80%',
                height: '80%',
                background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 50%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'auroraFloat2 10s infinite alternate ease-in-out',
            }} />

            {/* Subtle, delicate floating light dust motes */}
            {Array.from({ length: 10 }).map((_, i) => {
                const left = `${(i * 23 + 11) % 86 + 7}%`;
                const top = `${(i * 29 + 17) % 80 + 10}%`;
                const color = i % 2 === 0 ? '#10b981' : '#f59e0b';
                const size = (i % 2) + 2;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left,
                            top,
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            background: color,
                            boxShadow: `0 0 8px ${color}`,
                            opacity: 0.38,
                            animation: `winFloat ${3 + (i % 3)}s infinite alternate ease-in-out`,
                            animationDelay: `${i * 0.3}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}

/* --- Coin Arc ------------------------------------------------------------- */
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
                
                fontSize: '11px',
                fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif",
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
    const { disconnect } = useDisconnect();
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

    useEffect(() => {
        if (!mounted) return;
        const origOverflow = document.body.style.overflow;
        const origTouchAction = document.body.style.touchAction;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        return () => {
            document.body.style.overflow = origOverflow || '';
            document.body.style.touchAction = origTouchAction || '';
        };
    }, [mounted]);

    /* -- PLAY button handler -----------------------------------------------
       1. API call fires immediately on PLAY click (deduct 3 coins, get outcome)
       2. Coin arc animation plays during the ~300ms network round-trip
       3. After animation: joystick + DROP unlock
    ----------------------------------------------------------------------- */
    const handlePlay = useCallback(async () => {
        if (phase !== 'intro' || !user) return;
        if ((user?.coins ?? 0) < 3) {
            router.push('/');
            return;
        }
        soundManager.playClick();
        soundManager.playCoin();
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

    /* -- DROP handler — starts claw animation, then reveals outcome --------- */
    const handleDrop = useCallback(() => {
        if (phase !== 'playing') return;
        soundManager.playDrop();
        setPhase('grabbing');
        // The claw reaches the capsule at 1.5s and its three prongs clamp at 1.7s.
        setTimeout(() => soundManager.playGrab(), 1700);
        const outcome = pendingOutcomeRef.current ?? 'LOSS';

        // Scene notifies us when the capsule has reached the delivery chute.
        // This keeps the reveal synchronized with the actual 3D animation.
        ref.current?.onPick(outcome, () => {
            soundManager.playBallDrop();
            setPhase('revealing');
            ref.current?.startReveal(
                outcome,
                () => setRevealStep('ready'),
                () => {
                    setRevealStep('opened');
                    const isWin = outcome !== 'LOSS';
                    setOutcomeCard({ outcome, isWin });
                    if (!isWin) {
                        soundManager.playLoss();
                    } else {
                        soundManager.playWin(outcome === 'GTD' || outcome === 'GUARANTEED');
                        ref.current?.setWinColorMode?.(true);
                    }
                }
            );
        });
    }, [phase]);

    const handleClickCapsule = useCallback(() => {
        if (phase !== 'revealing' || revealStep !== 'ready') return;
        soundManager.playPop();
        setRevealStep('opening');
        ref.current?.clickCapsule();
    }, [phase, revealStep]);

    /* -- Close modal + reset scene --------------------------------------- */
    const handleClose = useCallback(() => {
        setOutcomeCard(null);
        setRevealStep(null);
        pendingOutcomeRef.current = null;
        setPhase('intro');
        ref.current?.closeReveal();
        ref.current?.setWinColorMode?.(false);
    }, []);

    /* -- Share on X -------------------------------------------------------- */
    const shareOnX = useCallback(() => {
        const outcome = outcomeCard?.outcome ?? '';
        const text = encodeURIComponent(
            outcome === 'GTD'
                ? `One crack. And the grey doesn't hold anymore. Colour doesn't ease in, it floods. I just won a Guaranteed Whitelist spot at the @BlnkINC Arcade! 🕹️👾`
                : `Not every pull hits. But the one that does breaks the grey wide open. I just won a FCFS Whitelist spot at the @BlnkINC Arcade! 🕹️👾`
        );
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }, [outcomeCard]);

    const shareLossOnX = useCallback(() => {
        const text = encodeURIComponent(
            `Not every pull hits. Most don't. But the one that does breaks the grey wide open. Pull, and find out. @BlnkINC`
        );
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }, []);

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

            <Box
                position="fixed"
                top="0"
                left="0"
                right="0"
                bottom="0"
                w="100%"
                h="100%"
                overflow="hidden"
                bg="#10170e"
                style={{
                    touchAction: 'none',
                    overscrollBehavior: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                }}
            >

                {/* Subtle deep vignette — monochrome only */}
                <Box
                    position="absolute" inset={0} zIndex={1} pointerEvents="none"
                    bgGradient="radial(ellipse at center, transparent 24%, rgba(4,10,3,0.82) 100%)"
                />

                {/* Coin arc sprite */}
                <CoinArc visible={coinArcVisible} />

                {/* -- 3D Canvas ------------------------------------------- */}
                <Canvas
                    shadows
                    dpr={[1, 1.5]}
                    performance={{ min: 0.5 }}
                    gl={{
                        powerPreference: 'high-performance',
                        antialias: true,
                        alpha: false,
                        stencil: false,
                        depth: true,
                    }}
                    camera={{ position: [0, 2.1, 2.2], fov: 55 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        touchAction: 'none',
                        outline: 'none',
                    }}
                >
                    <ResponsiveCamera isCameraResetting={phase === 'revealing'} />
                    <Scene ref={ref} setIsLoading={setIsLoading} setProgress={setProgress} />
                </Canvas>

                {/* -- Loading overlay -------------------------------------- */}
                <Modal isOpen={isLoading} onClose={() => {}}>
                    <ModalOverlay bg="black" />
                    <ModalContent my={0} py="120px" h="full" display="flex" justifyContent="end" alignItems="center" bg="none" shadow="none">
                        <ProgressBar progress={progress} />
                    </ModalContent>
                </Modal>

                {/* -- HUD: top bar ---------------------------------------- */}
                <div className="hud-container">
                    {/* Monochrome Game Vibe Dashboard Home button */}
                    <button
                        onClick={() => router.push('/')}
                        className="hud-btn-dashboard"
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#edc75b';
                            e.currentTarget.style.color = '#edc75b';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                    >
                        <span className="desktop-dash-text">← DASHBOARD</span>
                        <span className="mobile-dash-text">← DASH</span>
                    </button>

                    {/* BLNK brand */}
                    <div className="hud-brand">
                        BLNK
                    </div>

                    {/* Right Side: Sound Button + Monochrome Gold Coins Badge + Logout */}
                    <div className="hud-right">
                        <SoundButton />
                        <div className="hud-coins-badge">
                            <span className="hud-coins-text" style={{
                                fontWeight: "bold", fontFamily: "var(--font-inter), sans-serif",
                                fontSize: '10px',
                                
                                letterSpacing: '0.15em',
                                color: '#edc75b',
                                textShadow: '0 0 10px rgba(237, 199, 91, 0.4)',
                            }}>
                                ◈ {user?.coins ?? 0} COINS
                            </span>
                        </div>
                        <button
                            className="hud-logout-btn"
                            onClick={async () => {
                                soundManager.playClick();
                                try {
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.setItem('blnk_did_logout', 'true');
                                    }
                                    await fetch('/api/auth/logout', { method: 'POST' });
                                    disconnect();
                                } catch (e) {
                                    console.error('Logout error:', e);
                                } finally {
                                    router.push('/');
                                }
                            }}
                            title="Disconnect wallet"
                        >
                            ⏻
                        </button>
                    </div>
                </div>

                {/* -- INTRO phase: big PLAY GAME button ------------------- */}
                {phase === 'intro' && !isLoading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: '110px',
                        pointerEvents: 'none',
                        animation: 'fadeUp 0.6s ease both',
                    }}>
                        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <button
                                onClick={handlePlay}
                                style={{
                                    padding: '0',
                                    width: '230px',
                                    height: '60px',
                                    borderRadius: '9999px',
                                    border: '1px solid rgba(237, 199, 91, 0.45)',
                                    background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 12, 0.95) 100%)',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    
                                    fontWeight: "bold", fontFamily: "var(--font-inter), sans-serif",
                                    letterSpacing: '0.25em',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 0 30px rgba(237, 199, 91, 0.25), 0 10px 25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    animation: 'pulseRing 2.4s ease-in-out infinite',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#edc75b';
                                    e.currentTarget.style.color = '#edc75b';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 0 35px rgba(237, 199, 91, 0.45), 0 12px 30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(237, 199, 91, 0.45)';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = '0 0 30px rgba(237, 199, 91, 0.25), 0 10px 25px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)';
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = 'translateY(2px)';
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                }}
                            >
                                {(user?.coins ?? 0) < 3 ? '▶ GET MORE COINS' : '▶ PLAY GAME'}
                            </button>
                            <div style={{
                                background: 'rgba(10, 10, 14, 0.85)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '9999px',
                                padding: '6px 16px',
                                backdropFilter: 'blur(10px)',
                                fontSize: '9px',
                                fontWeight: "bold", fontFamily: "var(--font-inter), sans-serif",
                                color: '#edc75b',
                                letterSpacing: '0.2em',
                                textShadow: '0 0 10px rgba(237, 199, 91, 0.4)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                            }}>
                                COSTS 3 COINS
                            </div>
                        </div>
                    </div>
                )}

                {/* -- SPENDING phase: "processing" text ------------------- */}
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
                            fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif",
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.2em',
                            animation: 'pulseRing 1s ease infinite',
                        }}>
                            LOADING CLAW…
                        </span>
                    </div>
                )}

                {/* -- PLAYING phase: joystick + drop button --------------- */}
                {(phase === 'playing' || phase === 'grabbing') && (
                    <>
                        <JoystickControl
                            onJoystick={(x, z) => {
                                if (Math.abs(x) > 0.1 || Math.abs(z) > 0.1) {
                                    soundManager.playMove();
                                } else {
                                    soundManager.stopMove();
                                }
                                ref.current?.onJoystick(x, z);
                            }}
                            disabled={phase === 'grabbing'}
                        />
                        <ButtonsControl
                            onStart={() => {}}
                            onPick={handleDrop}
                            disabled={phase === 'grabbing'}
                        />
                    </>
                )}

                {/* -- REVEALING: "click to open" prompt ------------------- */}
                {phase === 'revealing' && revealStep === 'ready' && (
                    <div style={{
                        position: 'absolute', top: '14%', width: '100%', textAlign: 'center',
                        zIndex: 20, pointerEvents: 'none', animation: 'pulseRing 1.8s ease-in-out infinite',
                    }}>
                        <span style={{
                            fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '14px', 
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

                {/* -- Outcome modal ---------------------------------------- */}
                {outcomeCard && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 30,
                        background: 'rgba(8, 12, 10, 0.88)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        animation: 'fadeUp 0.4s ease both',
                    }}>
                        {outcomeCard.isWin && <WinColorOverlay />}
                        <div style={{
                            position: 'relative',
                            zIndex: 10,
                            width: '100%',
                            maxWidth: '380px',
                            background: 'linear-gradient(145deg, rgba(20, 24, 21, 0.96) 0%, rgba(10, 14, 11, 0.96) 100%)',
                            border: '1px solid rgba(74, 222, 128, 0.35)',
                            borderRadius: '24px',
                            padding: '40px 32px',
                            textAlign: 'center',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                            animation: outcomeCard.isWin ? 'cardPulseBorder 4s infinite ease-in-out' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '22px',
                        }}>
                            {outcomeCard.isWin ? (
                                <>
                                    {outcomeCard.outcome === 'GTD' || outcomeCard.outcome === 'GUARANTEED' ? (
                                        <SmileyStampBadge size={120} />
                                    ) : (
                                        <PillBadge size={120} />
                                    )}
                                    <div style={{
                                        fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '10px', letterSpacing: '0.3em',
                                        color: '#4ade80', textTransform: 'uppercase', 
                                        textShadow: '0 0 12px rgba(74, 222, 128, 0.5)',
                                    }}>
                                        ✦ REWARD UNLOCKED ✦
                                    </div>
                                    <div style={{
                                        fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '32px', 
                                        color: '#ffffff', letterSpacing: '0.08em', textTransform: 'uppercase',
                                        textShadow: '0 2px 15px rgba(74, 222, 128, 0.35)',
                                    }}>
                                        {outcomeCard.outcome}
                                    </div>
                                    <div style={{
                                        fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '13px', color: '#e5e7eb',
                                        lineHeight: 1.65, letterSpacing: '0.03em', 
                                    }}>
                                        You have extracted a rare whitelist spot from the machine.
                                        <br />Post on X to claim your reward.
                                    </div>
                                    <button
                                        onClick={shareOnX}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '14px',
                                            border: '1px solid rgba(74, 222, 128, 0.5)',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff', fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '13px',
                                             letterSpacing: '0.15em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        POST ON X TO CLAIM
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: '#d1d5db', fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif",
                                            fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer',
                                            textTransform: 'uppercase', 
                                        }}
                                    >
                                        ← RETURN TO MACHINE
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                                        THE CLAW HAS SPOKEN
                                    </div>
                                    <div style={{ fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '28px',  color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        EMPTY
                                    </div>
                                    <div style={{ fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, letterSpacing: '0.05em' }}>
                                        The capsule was empty this time. Grey world wins this round.
                                    </div>
                                    <button
                                        onClick={shareLossOnX}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: '#d1d5db', fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif",
                                            fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer',
                                            textTransform: 'uppercase', 
                                        }}
                                    >
                                        SHARE TO TWITTER
                                    </button>
                                    <button
                                        onClick={() => {
                                            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://blnk-flywheel.vercel.app';
                                            const refUrl = `${origin}/?ref=${user?.referralCode || ''}`;
                                            const tweetText = encodeURIComponent("I'm playing the @BlnkINC flywheel claw machine! 🕹️ Try your luck, grab exclusive drops, and join BLNK using my referral link:");
                                            const intentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(refUrl)}`;
                                            window.open(intentUrl, '_blank');
                                        }}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '12px',
                                            border: '1px solid rgba(236, 72, 153, 0.5)',
                                            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                                            color: '#fff', fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '12px',
                                             letterSpacing: '0.18em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        INVITE A FRIEND (+30 COINS)
                                    </button>
                                    <button
                                        onClick={() => {
                                            if ((user?.coins ?? 0) < 3) {
                                                router.push('/');
                                            } else {
                                                handleClose();
                                            }
                                        }}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            background: 'rgba(255,255,255,0.06)',
                                            color: '#fff', fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif", fontSize: '12px',
                                             letterSpacing: '0.18em', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {(user?.coins ?? 0) < 3 ? 'GET MORE COINS' : 'TRY AGAIN'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Box>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes winPulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.1); opacity: 1; }
                }
                @keyframes auroraFloat1 {
                    0% { transform: scale(1) translate(-5%, -5%); opacity: 0.12; }
                    50% { transform: scale(1.1) translate(5%, 10%); opacity: 0.18; }
                    100% { transform: scale(1.05) translate(10%, -5%); opacity: 0.15; }
                }
                @keyframes auroraFloat2 {
                    0% { transform: scale(1.05) translate(5%, 5%); opacity: 0.10; }
                    50% { transform: scale(1.15) translate(-10%, -5%); opacity: 0.16; }
                    100% { transform: scale(1) translate(-5%, 5%); opacity: 0.12; }
                }
                @keyframes cardPulseBorder {
                    0% { border-color: rgba(74, 222, 128, 0.3); box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.1); }
                    50% { border-color: rgba(74, 222, 128, 0.65); box-shadow: 0 30px 80px rgba(0,0,0,0.95), 0 0 55px rgba(16, 185, 129, 0.22); }
                    100% { border-color: rgba(74, 222, 128, 0.3); box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.1); }
                }
                @keyframes winFloat {
                    0% { transform: translateY(0px) scale(0.9); opacity: 0.25; }
                    100% { transform: translateY(-25px) scale(1.2); opacity: 0.45; }
                }
                .hud-container {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 18px 24px;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%);
                    pointer-events: none;
                }
                .hud-btn-dashboard {
                    pointer-events: auto;
                    background: rgba(15, 15, 18, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 9999px;
                    color: #ffffff;
                    font-family: var(--font-pixel);
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    padding: 10px 18px;
                    cursor: pointer;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }
                .hud-brand {
                    font-family: var(--font-pixel);
                    font-weight: 900;
                    font-size: 18px;
                    letter-spacing: 0.35em;
                    color: #edc75b;
                    text-shadow: 0 0 15px rgba(237, 199, 91, 0.5);
                    text-transform: uppercase;
                    pointer-events: none;
                    text-align: center;
                    flex-shrink: 0;
                    margin: 0 8px;
                }
                .hud-right {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .hud-coins-badge {
                    background: rgba(15, 15, 18, 0.85);
                    border: 1px solid rgba(237, 199, 91, 0.35);
                    border-radius: 9999px;
                    padding: 10px 18px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                }
                .hud-logout-btn {
                    pointer-events: auto;
                    background: rgba(15, 15, 18, 0.85);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    border-radius: 9999px;
                    color: #ef4444;
                    font-family: var(--font-pixel);
                    font-size: 12px;
                    padding: 8px 12px;
                    cursor: pointer;
                    backdrop-filter: blur(12px);
                    transition: all 0.15s ease;
                    display: flex;
                    align-items: center;
                }
                .hud-logout-btn:hover {
                    border-color: #ef4444;
                    background: rgba(127, 29, 29, 0.5);
                }
                .desktop-dash-text { display: inline; }
                .mobile-dash-text { display: none; }
                @media (max-width: 640px) {
                    .hud-container {
                        padding: 10px 8px !important;
                        gap: 4px;
                    }
                    .hud-btn-dashboard {
                        padding: 6px 8px !important;
                        font-size: 7px !important;
                        letter-spacing: 0.05em !important;
                        gap: 3px !important;
                    }
                    .hud-brand {
                        font-size: 12px !important;
                        letter-spacing: 0.12em !important;
                        margin: 0 2px !important;
                    }
                    .hud-right {
                        gap: 4px !important;
                    }
                    .hud-coins-badge {
                        padding: 6px 8px !important;
                    }
                    .hud-coins-text {
                        font-size: 7px !important;
                        letter-spacing: 0.05em !important;
                    }
                    .desktop-dash-text { display: none !important; }
                    .mobile-dash-text { display: inline !important; }
                    .hud-logout-btn {
                        font-size: 9px !important;
                        padding: 5px 8px !important;
                    }
                }
            ` }} />
        </>
    );
}
