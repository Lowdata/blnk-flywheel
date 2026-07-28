'use client';

import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { createRef, forwardRef, ForwardRefRenderFunction, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { angleToRadian, clonePosition, cloneRotation, cloneScale, getPosition, getRotation, getScale } from '../utils';
import Ball from './Ball';

interface IState {
    position: any;
    rotation: any;
    scale: any;
}

interface IStateMap {
    [key: string]: IState;
}

const stateMap: IStateMap = {};

const Scene: ForwardRefRenderFunction<
    any,
    {
        setIsLoading: (isLoading: boolean) => void;
        setProgress: (progress: number) => void;
    }
> = ({ setIsLoading, setProgress, }, ref) => {
    // removed useImperativeHandle from here

    const floor = useGLTF("/floor.glb");
    const clawMachine = useGLTF("/clawMachine.glb");
    const clawRest = useGLTF("/clawRest.glb");
    const clawRest1 = useGLTF("/clawRest1.glb");
    const clawRest2 = useGLTF("/clawRest2.glb");
    const clawRest3 = useGLTF("/clawRest3.glb");
    const claw1 = useGLTF("/claw1.glb");
    const claw2 = useGLTF("/claw2.glb");
    const claw3 = useGLTF("/claw3.glb");
    const prizeCapsule = useGLTF("/assets/pre.glb");
    const colors = useMemo(() => ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#D53F8C'], []);

    const [showScene, setShowScene] = useState<any>();
    const [isPicking, setIsPicking] = useState(false);
    const orbitControlsRef = useRef<any>(null);
    const clawRestRef = useRef<any>(null);
    const clawRest1Ref = useRef<any>(null);
    const clawRest2Ref = useRef<any>(null);
    const clawRest3Ref = useRef<any>(null);
    const claw1Ref = useRef<any>(null);
    const claw2Ref = useRef<any>(null);
    const claw3Ref = useRef<any>(null);
    const animationQueueRef = useRef<any[]>([]);
    const selectedIndexRef = useRef<number | null>(null);
    const caughtBallIndexRef = useRef<number | null>(null);
    const revealTimerRef = useRef<number>(0);
    const openAmountRef = useRef<number>(0);  // 0=closed, 1=fully open (quarter-sine eased)
    const savedCameraRef = useRef<{ x: number; y: number; z: number } | null>(null);
    const [isCameraResetting, setIsCameraResetting] = useState(false);
    const [revealState, setRevealState] = useState<{
        active: boolean;
        ballIndex: number;
        outcome: string;
        step: 'centering' | 'ready' | 'opening' | 'opened';
        onReady?: () => void;
        onComplete?: () => void;
    } | null>(null);
    const ballRefs = useRef(Array.from({ length: 54 }, () => createRef<any>()));

    const joystickRef = useRef<any>({ x: 0, z: 0 });
    const onJoystick = (x: number, z: number) => {
        joystickRef.current.x = x;
        joystickRef.current.z = z;
    }

    const outcomeRef = useRef<string | null>(null);

    const catchBall = useCallback(() => {
        const x1 = clawRest1Ref.current.position.x;
        const z1 = clawRestRef.current.position.z;
        const distances = ballRefs.current.map((ballRef, index) => {
            const translation = ballRef.current?.translation();
            if (!translation) return { distance: Infinity, index, translation };
            const x2 = translation.x;
            const y2 = translation.y;
            const z2 = translation.z;
            return {
                distance: Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - 2) * (y2 - 2) + (z2 - z1) * (z2 - z1)),
                index,
                translation,
            };
        });

        distances.sort((d1, d2) => d1.distance - d2.distance);
        selectedIndexRef.current = distances[0].index;
        caughtBallIndexRef.current = distances[0].index;

        if (selectedIndexRef.current != null) {
            const selectedBall = ballRefs.current[selectedIndexRef.current].current;
            selectedBall.setGravityScale(0);
        }
    }, []);

    const releaseBall = useCallback(() => {
        if (selectedIndexRef.current != null) {
            const selectedBall = ballRefs.current[selectedIndexRef.current].current;
            selectedBall.setGravityScale(1);
            // On a LOSS give the ball a small sideways impulse so it bounces away from
            // the winning drop chute rather than falling straight down it
            if (outcomeRef.current === 'LOSS') {
                selectedBall.setLinvel({ x: 0.3, y: -0.5, z: -0.3 }, true);
                caughtBallIndexRef.current = null;
            }
            selectedIndexRef.current = null;
        }
    }, []);


    const spreadClawAnimation = useMemo(() => {
        return [
            { ref: claw1Ref, name: 'claw1', rotation: [0, 0, 0], start: 0, duration: 0.3 },
            { ref: claw2Ref, name: 'claw2', rotation: [0, 0, 0], start: 0, duration: 0.3 },
            { ref: claw3Ref, name: 'claw3', rotation: [0, 0, 0], start: 0, duration: 0.3, cb: () => setIsPicking(false) },
        ];
    }, []);

    const releaseAnimationSet = useMemo(() => {
        return [
            { ref: clawRest1Ref, name: 'clawRest1', position: [-0.75, 0, 0], start: 0, duration: 1.5 },
            { ref: clawRestRef, name: 'clawRest', position: [0, 0, 0.5], start: 0, duration: 1.5 },
            { ref: claw1Ref, name: 'claw1', rotation: [0, 0, 0], start: 1.7, duration: 0.3 },
            { ref: claw2Ref, name: 'claw2', rotation: [0, 0, 0], start: 1.7, duration: 0.3 },
            { ref: claw3Ref, name: 'claw3', rotation: [0, 0, 0], start: 1.7, duration: 0.3, cb: releaseBall },
            { ref: clawRest1Ref, name: 'clawRest1', position: [0, 0, 0], start: 2.2, duration: 1.5 },
            { ref: clawRestRef, name: 'clawRest', position: [0, 0, 0], start: 2.2, duration: 1.5, cb: () => setIsPicking(false) },
        ]
    }, [releaseBall]);

    const playNextAnimation = useCallback(() => {
        setTimeout(() => {
            if (selectedIndexRef.current != null) {
                const selectedBall = ballRefs.current[selectedIndexRef.current].current;
                selectedBall.setLinvel({ x: 0, y: 0, z: 0 });
                animationQueueRef.current.push({ animationSet: releaseAnimationSet, startTime: 0, isPlaying: false });
            } else {
                animationQueueRef.current.push({ animationSet: spreadClawAnimation, startTime: 0, isPlaying: false });
            }
        }, 200);
    }, [releaseAnimationSet, spreadClawAnimation]);

    const catchAnimationSet = useMemo(() => {
        return [
            { ref: clawRest2Ref, name: 'clawRest2', scale: [1, 8, 1], start: 0, duration: 1.5 },
            { ref: clawRest3Ref, name: 'clawRest3', position: [0, -1.2, 0], start: 0, duration: 1.5, cb: catchBall },
            { ref: claw1Ref, name: 'claw1', rotation: [0.35, 0, 0], start: 1.7, duration: 0.3 },
            { ref: claw2Ref, name: 'claw2', rotation: [0.35, 0, 0], start: 1.7, duration: 0.3 },
            { ref: claw3Ref, name: 'claw3', rotation: [0.35, 0, 0], start: 1.7, duration: 0.3 },
            { ref: clawRest2Ref, name: 'clawRest2', scale: [1, 1, 1], start: 2.2, duration: 1.5 },
            { ref: clawRest3Ref, name: 'clawRest3', position: [0, 0, 0], start: 2.2, duration: 1.5, cb: playNextAnimation },
        ];
    }, [catchBall, playNextAnimation]);

    const onPick = (outcome?: string) => {
        if (isPicking) return;
        outcomeRef.current = outcome || null;
        setIsPicking(true);
        animationQueueRef.current.push({ animationSet: catchAnimationSet, startTime: 0, isPlaying: false });
    }

    const initGame = useCallback(async () => {
        setShowScene(true);
        setProgress(100);
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, [setIsLoading, setProgress]);

    useEffect(() => {
        initGame();
        
        const applyGrayscale = (object: any) => {
            object.traverse((child: any) => {
                if (child.isMesh && child.material && child.material.color) {
                    const hsl = { h: 0, s: 0, l: 0 };
                    child.material.color.getHSL(hsl);
                    child.material.color.setHSL(hsl.h, 0, hsl.l);
                }
            });
        };

        applyGrayscale(floor.scene);
        applyGrayscale(clawMachine.scene);
        applyGrayscale(clawRest.scene);
        applyGrayscale(clawRest1.scene);
        applyGrayscale(clawRest2.scene);
        applyGrayscale(clawRest3.scene);
        applyGrayscale(claw1.scene);
        applyGrayscale(claw2.scene);
        applyGrayscale(claw3.scene);
    }, [initGame, floor, clawMachine, clawRest, clawRest1, clawRest2, clawRest3, claw1, claw2, claw3]);

    useFrame((state, delta) => {
        const clock = state.clock;

        // Camera return-to-home after reveal is closed
        if (isCameraResetting) {
            const home = { x: 0, y: 2.1, z: 2.2 };
            state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, home.x, 5, delta);
            state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, home.y, 5, delta);
            state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, home.z, 5, delta);
            state.camera.lookAt(0, 2.1, 0);
            const dist = Math.hypot(
                state.camera.position.x - home.x,
                state.camera.position.y - home.y,
                state.camera.position.z - home.z
            );
            if (dist < 0.02) {
                state.camera.position.set(home.x, home.y, home.z);
                setIsCameraResetting(false);
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.set(0, 2.1, 0);
                    orbitControlsRef.current.reset();
                }
            }
        }

        if (clawRestRef.current && clawRest1Ref.current) {
            let z = clawRestRef.current.position.z + joystickRef.current.z * 0.0001;
            let x = clawRest1Ref.current.position.x + joystickRef.current.x * 0.0001;
            z = Math.max(-0.75, Math.min(0.45, z));
            x = Math.max(-0.82, Math.min(0.8, x));
            clawRestRef.current.position.z = z;
            clawRest1Ref.current.position.x = x;
        }

        if (selectedIndexRef.current != null) {
            const x = clawRest1Ref.current.position.x;
            const y = clawRest3Ref.current.position.y;
            const z = clawRestRef.current.position.z;
            const ball = ballRefs.current[selectedIndexRef.current].current;
            ball.setTranslation(new THREE.Vector3(x, y + 3.05, z));
        }

        animationQueueRef.current = animationQueueRef.current.filter((item) => item.animationSet.length > 0);
        animationQueueRef.current = animationQueueRef.current.map((item) => {
            let startTime = item.startTime;
            if (!item.isPlaying) {
                startTime = clock.elapsedTime;
            }
            const elapsedTime = clock.elapsedTime - startTime;
            let animationSet = item.animationSet;
            animationSet = animationSet.filter((animation: any) => {
                const valid = elapsedTime < animation.start + animation.duration;
                if (!valid) {
                    animation.cb?.();
                }
                if (!valid && stateMap[animation.name]) {
                    delete stateMap[animation.name];
                }
                return valid;
            });
            animationSet.map((animation: any) => {
                if (elapsedTime > animation.start) {
                    const object = animation.ref.current;
                    let state = stateMap[animation.name];
                    if (!state) {
                        state = {
                            position: clonePosition(object.position),
                            rotation: cloneRotation(object.rotation),
                            scale: cloneScale(object.scale),
                        };
                        stateMap[animation.name] = state;
                    }

                    const p = (elapsedTime - animation.start) / (animation.duration);

                    if (animation.position) {
                        const { x, y, z } = getPosition(state.position, animation.position, p);
                        object.position.x = x;
                        object.position.y = y;
                        object.position.z = z;
                    }

                    if (animation.rotation) {
                        const { x, y, z } = getRotation(state.rotation, animation.rotation, p);
                        object.rotation.x = x;
                        object.rotation.y = y;
                        object.rotation.z = z;
                    }

                    if (animation.scale) {
                        const { x, y, z } = getScale(state.scale, animation.scale, p);
                        object.scale.x = x;
                        object.scale.y = y;
                        object.scale.z = z;
                    }
                }
            });
            return { ...item, animationSet, startTime, isPlaying: true };
        });

        if (revealState && revealState.active) {
            const ball = ballRefs.current[revealState.ballIndex]?.current;
            if (ball) {
                if (revealState.step === 'centering') {
                    const pos = ball.translation();
                    if (pos) {
                        const newX = THREE.MathUtils.damp(pos.x, 0, 4, delta);
                        const newY = THREE.MathUtils.damp(pos.y, 1.6, 4, delta);
                        const newZ = THREE.MathUtils.damp(pos.z, 1.2, 4, delta);
                        ball.setTranslation({ x: newX, y: newY, z: newZ }, true);

                        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
                        ball.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);

                        const dist = Math.hypot(newX, newY - 1.6, newZ - 1.2);
                        if (dist < 0.05) {
                            setRevealState(prev => {
                                if (!prev) return null;
                                prev.onReady?.();
                                return { ...prev, step: 'ready' };
                            });
                        }
                    }
                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 3, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.7, 3, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 2.0, 3, delta);
                    state.camera.lookAt(0, 1.6, 1.2);
                } else if (revealState.step === 'ready') {
                    const bobY = 1.6 + Math.sin(clock.elapsedTime * 2) * 0.05;
                    ball.setTranslation({ x: 0, y: bobY, z: 1.2 }, true);

                    // slow spin while waiting for click
                    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), clock.elapsedTime * 0.4);
                    ball.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);

                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 3, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.7, 3, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 2.0, 3, delta);
                    state.camera.lookAt(0, 1.6, 1.2);
                } else if (revealState.step === 'opening' || revealState.step === 'opened') {
                    const bobY = 1.6 + Math.sin(clock.elapsedTime * 1.5) * 0.03;
                    ball.setTranslation({ x: 0, y: bobY, z: 1.2 }, true);

                    // --- Quarter-sine lid opening (matches test/script.js animation fundamentals) ---
                    // openAmount: 0=closed, 1=open, damped at 5.5 speed
                    openAmountRef.current = THREE.MathUtils.damp(
                        openAmountRef.current,
                        revealState.step === 'opening' || revealState.step === 'opened' ? 1 : 0,
                        5.5,
                        delta
                    );
                    const oa = openAmountRef.current;
                    // Quarter-sine easing gives an organic ease-in-out on the lift
                    const lift = Math.sin(oa * Math.PI * 0.5);

                    const topMesh = ball.getTopMesh();
                    if (topMesh) {
                        const topClosedY = ball.getTopClosedY();
                        const liftDist = ball.getLiftDist();
                        topMesh.position.y = topClosedY + lift * liftDist;
                        // Subtle mechanical tilt as lid opens (matches test reference)
                        topMesh.rotation.z = ball.getTopClosedRotZ() + lift * 0.08;
                        topMesh.rotation.x = ball.getTopClosedRotX() + lift * 0.05;
                    }

                    // Reward orb: rises proportionally with openAmount, WIN only
                    const isWin = revealState.outcome !== 'LOSS';
                    const rewardMesh = ball.getRewardMesh();
                    if (rewardMesh && isWin) {
                        const mat = rewardMesh.material as THREE.MeshStandardMaterial;
                        if (mat) mat.opacity = THREE.MathUtils.lerp(0, 1, oa);
                        // Rise from inside (-liftDist*0.5) upward as lid opens
                        const liftDist = ball.getLiftDist();
                        rewardMesh.position.y = THREE.MathUtils.lerp(0, liftDist * 0.9, oa);
                        rewardMesh.rotation.y += delta * 1.5;
                        ball.setRewardEmissive('#ffffff', Math.min(3, oa * 3));
                    }

                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 4, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.75, 4, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 1.85, 4, delta);
                    state.camera.lookAt(0, bobY + 0.1, 1.2);

                    if (revealState.step === 'opening') {
                        revealTimerRef.current += delta;
                        // Fire onComplete once lid is 90% open AND timer has run >= 10s
                        if (revealTimerRef.current >= 10.0 && oa > 0.9) {
                            revealState.onComplete?.();
                            setRevealState(prev => prev ? { ...prev, step: 'opened' } : null);
                        }
                    }
                }
            }
        }
    });

    const startReveal = useCallback((outcome: string, onReady?: () => void, onComplete?: () => void) => {
        const idx = caughtBallIndexRef.current != null ? caughtBallIndexRef.current : 0;
        const selectedBall = ballRefs.current[idx]?.current;
        if (selectedBall && selectedBall.setBodyType) {
            selectedBall.setBodyType(2, true);
        }
        revealTimerRef.current = 0;
        setRevealState({
            active: true,
            ballIndex: idx,
            outcome,
            step: 'centering',
            onReady,
            onComplete
        });
    }, []);

    const clickCapsule = useCallback(() => {
        if (revealState && revealState.step === 'ready') {
            revealTimerRef.current = 0;
            setRevealState(prev => prev ? { ...prev, step: 'opening' } : null);
        }
    }, [revealState]);

    const closeReveal = useCallback(() => {
        if (revealState) {
            const selectedBall = ballRefs.current[revealState.ballIndex]?.current;
            if (selectedBall) {
                const topMesh = selectedBall.getTopMesh();
                if (topMesh) {
                    // Reset lid back to its original closed position
                    topMesh.position.y = selectedBall.getTopClosedY();
                    topMesh.rotation.z = selectedBall.getTopClosedRotZ();
                    topMesh.rotation.x = selectedBall.getTopClosedRotX();
                }
                const rewardMesh = selectedBall.getRewardMesh();
                if (rewardMesh) {
                    rewardMesh.position.y = 0;
                    if (rewardMesh.material) (rewardMesh.material as any).opacity = 0;
                    selectedBall.setRewardEmissive('#ffffff', 0);
                }
                if (selectedBall.setBodyType) selectedBall.setBodyType(0, true);
                if (selectedBall.setTranslation) selectedBall.setTranslation({ x: 99, y: -10, z: 99 }, true);
            }
        }
        openAmountRef.current = 0; // Reset for next reveal
        setRevealState(null);
        caughtBallIndexRef.current = null;
        setIsCameraResetting(true);
    }, [revealState]);

    useImperativeHandle(ref, () => ({
        onPick,
        onJoystick,
        startReveal,
        clickCapsule,
        closeReveal,
        getRevealStep: () => revealState?.step
    }), [onPick, onJoystick, startReveal, clickCapsule, closeReveal, revealState]);

    return (
        <>
            <Environment
                files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
            />
            <ambientLight intensity={2} />
            <pointLight position={[-2, 5, 8]} intensity={50} castShadow />
            <primitive object={floor.scene} receiveShadow position={[0, -0.25, 0]} />
            <group ref={clawRestRef}>
                <group position={[0, 3.28, 0]}>
                    <primitive object={clawRest.scene} />
                    <group ref={clawRest1Ref} >
                        <primitive object={clawRest1.scene} />
                        <primitive ref={clawRest2Ref} object={clawRest2.scene} position={[0, 0.36, 0]} />
                        <group ref={clawRest3Ref}>
                            <primitive object={clawRest3.scene} />
                            <group rotation={[0, -2.0944, 0]}>
                                <primitive ref={claw1Ref} object={claw3.scene} position={[0, 0, 0.113]} />
                            </group>
                            <group>
                                <primitive ref={claw2Ref} object={claw1.scene} position={[0, 0, 0.113]} />
                            </group>
                            <group rotation={[0, 2.0944, 0]}>
                                <primitive ref={claw3Ref} object={claw2.scene} position={[0, 0, 0.113]} />
                            </group>
                        </group>
                    </group>
                </group>
            </group>
            <Physics>
                {showScene && Array.from({ length: 54 }).map((_, index) => {
                    const x = 0.25 + Math.floor((index % 9) / 3) * 0.3;
                    const y = 2 + Math.floor(index / 9) * 0.3;
                    const z = -0.5 + (index % 3) * 0.3;
                    return <Ball key={index} ref={ballRefs.current[index]} obj={prizeCapsule.scene} position={[x, y, z]} tintColor={colors[index % 5]} />
                })}
                <RigidBody ccd type="fixed" colliders="trimesh">
                    <primitive object={clawMachine.scene} castShadow />
                </RigidBody>
            </Physics >
            <OrbitControls
                ref={orbitControlsRef}
                minAzimuthAngle={angleToRadian(-20)}
                maxAzimuthAngle={angleToRadian(20)}
                minPolarAngle={angleToRadian(70)}
                maxPolarAngle={angleToRadian(88)}
                minDistance={1.2}
                maxDistance={2.8}
                target={[0.0, 2.1, 0.0]}
                enablePan={false}
                enabled={!revealState?.active && !isCameraResetting}
            />
        </>
    )
}

export default forwardRef(Scene);
