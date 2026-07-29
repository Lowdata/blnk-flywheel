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

interface PresentationCapsule {
    group: THREE.Group;
    top: THREE.Object3D | null;
    topClosedY: number;
    topClosedRotX: number;
    topClosedRotZ: number;
    liftDistance: number;
    rewardGroup: THREE.Group;
    crystal: THREE.Mesh;
    rewardLight: THREE.PointLight;
    sparkles: THREE.Points;
    sparkleMaterial: THREE.PointsMaterial;
    scaleRatio: number;
}

const stateMap: IStateMap = {};

// The standalone test scene views its capsule from ~6 units away. BLNK's game
// camera is much closer, so a 2.6-unit test capsule puts the camera inside it.
const REVEAL_CAPSULE_DIAMETER = 0.42;
const REWARD_CRYSTAL_RADIUS = REVEAL_CAPSULE_DIAMETER * 0.16;

const Scene: ForwardRefRenderFunction<
    any,
    {
        setIsLoading: (isLoading: boolean) => void;
        setProgress: (progress: number) => void;
    }
> = ({ setIsLoading, setProgress, }, ref) => {
    // removed useImperativeHandle from here

    const clawMachine = useGLTF("/clawMachine.glb");
    const clawRest = useGLTF("/clawRest.glb");
    const clawRest1 = useGLTF("/clawRest1.glb");
    const clawRest2 = useGLTF("/clawRest2.glb");
    const clawRest3 = useGLTF("/clawRest3.glb");
    const claw1 = useGLTF("/claw1.glb");
    const claw2 = useGLTF("/claw2.glb");
    const claw3 = useGLTF("/claw3.glb");
    const prizeCapsule = useGLTF("/assets/pre.glb");

    // This is intentionally separate from the Rapier prize pile.  It mirrors the
    // proven /test capsule setup in its own local coordinate space, so physics
    // scaling cannot suppress the lid movement during the reveal.
    const presentationCapsule = useMemo<PresentationCapsule>(() => {
        const group = new THREE.Group();
        const model = prizeCapsule.scene.clone(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        // Keep centering and scaling on a parent group.  Applying the scale to
        // `model` itself leaves its large GLB-space position offset unscaled,
        // which was placing the reveal capsule outside the camera view.
        const normalizedModel = new THREE.Group();
        model.position.sub(center);
        normalizedModel.scale.setScalar(maxDimension > 0 ? REVEAL_CAPSULE_DIAMETER / maxDimension : 1);
        normalizedModel.add(model);

        let top = model.getObjectByName('top') as THREE.Object3D | undefined;
        let bottom = model.getObjectByName('bottom') as THREE.Object3D | undefined;
        if (!top || !bottom) {
            console.warn('[Scene] Could not find exact "top" and "bottom" names. Attempting automatic mesh separation...');
            const meshes: THREE.Object3D[] = [];
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) meshes.push(child);
            });
            if (meshes.length >= 2) {
                bottom = meshes[0];
                top = meshes[1];
            } else {
                console.error('[Scene] CRITICAL: pre.glb must contain distinct meshes for "top" and "bottom"');
            }
        }


        // The presentation capsule should be read clearly over the machine;
        // unlike physics prizes, it is deliberately a foreground reveal object.
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.renderOrder = 100;
                // GLTF clones share materials by default; isolate reveal-only
                // depth settings so the physics pile keeps normal occlusion.
                mesh.material = Array.isArray(mesh.material)
                    ? mesh.material.map((material) => material.clone())
                    : mesh.material.clone();
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((material) => {
                    material.depthTest = true;
                    material.depthWrite = true;
                    material.transparent = false;
                    material.opacity = 1;
                    material.needsUpdate = true;
                });
            }
        });

        const setPresentationHalfColor = (object: THREE.Object3D | null | undefined, color: string) => {
            object?.traverse((child) => {
                if (!(child as THREE.Mesh).isMesh) return;
                const mesh = child as THREE.Mesh;
                // Replace source GLB materials to remove their transparency,
                // texture colour, and alpha-map behaviour completely.
                mesh.material = new THREE.MeshStandardMaterial({
                    color,
                    emissive: '#000000',
                    metalness: 0.25,
                    roughness: 0.32,
                    transparent: false,
                    opacity: 1,
                    depthTest: true,
                    depthWrite: true,
                });
            });
        };
        setPresentationHalfColor(top, '#111111');
        setPresentationHalfColor(bottom, '#F0F0F0');
        group.add(normalizedModel);
        group.visible = false;

        const scaleRatio = REVEAL_CAPSULE_DIAMETER / 2.6;
        const rewardGroup = new THREE.Group();
        rewardGroup.position.y = -0.3 * scaleRatio;
        const crystal = new THREE.Mesh(
            // Make a flat cylinder (radiusTop, radiusBottom, height, radialSegments)
            new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32),
            new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.9,
                roughness: 0.1,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.5,
            })
        );
        crystal.castShadow = true;
        crystal.renderOrder = 120;
        (crystal.material as THREE.MeshStandardMaterial).depthTest = true;
        (crystal.material as THREE.MeshStandardMaterial).depthWrite = true;
        rewardGroup.add(crystal);

        const rewardLight = new THREE.PointLight(0xf59e0b, 0, 1.2);
        rewardGroup.add(rewardLight);

        const sparkleCount = 35;
        const sparklePositions = new Float32Array(sparkleCount * 3);
        for (let index = 0; index < sparklePositions.length; index += 3) {
            sparklePositions[index] = (Math.random() - 0.5) * REVEAL_CAPSULE_DIAMETER * 0.5;
            sparklePositions[index + 1] = (Math.random() - 0.5) * REVEAL_CAPSULE_DIAMETER * 0.5;
            sparklePositions[index + 2] = (Math.random() - 0.5) * REVEAL_CAPSULE_DIAMETER * 0.5;
        }
        const sparkleGeometry = new THREE.BufferGeometry();
        sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
        const sparkleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.012,
            transparent: true,
            opacity: 0,
        });
        const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
        rewardGroup.add(sparkles);
        group.add(rewardGroup);

        return {
            group,
            top: top ?? null,
            topClosedY: top?.position.y ?? 0,
            topClosedRotX: top?.rotation.x ?? 0,
            topClosedRotZ: top?.rotation.z ?? 0,
            liftDistance: size.y * 0.38,
            rewardGroup,
            crystal,
            rewardLight,
            sparkles,
            sparkleMaterial,
            scaleRatio,
        };
    }, [prizeCapsule.scene]);

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
    const onDeliveryCompleteRef = useRef<(() => void) | null>(null);
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
            {
                ref: clawRestRef, name: 'clawRest', position: [0, 0, 0], start: 2.2, duration: 1.5,
                cb: () => {
                    setIsPicking(false);
                    const onDeliveryComplete = onDeliveryCompleteRef.current;
                    onDeliveryCompleteRef.current = null;
                    onDeliveryComplete?.();
                },
            },
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

    const onPick = (outcome?: string, onDeliveryComplete?: () => void) => {
        if (isPicking) return;
        outcomeRef.current = outcome || null;
        onDeliveryCompleteRef.current = onDeliveryComplete ?? null;
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
                    if (!child.material.userData.originalColor) {
                        child.material.userData.originalColor = child.material.color.clone();
                    }
                    const hsl = { h: 0, s: 0, l: 0 };
                    child.material.color.getHSL(hsl);
                    child.material.color.setHSL(hsl.h, 0, hsl.l);
                }
            });
        };

        applyGrayscale(clawMachine.scene);
        applyGrayscale(clawRest.scene);
        applyGrayscale(clawRest1.scene);
        applyGrayscale(clawRest2.scene);
        applyGrayscale(clawRest3.scene);
        applyGrayscale(claw1.scene);
        applyGrayscale(claw2.scene);
        applyGrayscale(claw3.scene);
    }, [initGame, clawMachine, clawRest, clawRest1, clawRest2, clawRest3, claw1, claw2, claw3]);

    useFrame((state, delta) => {
        const clock = state.clock;

        // Camera return-to-home after reveal is closed
        if (isCameraResetting) {
            const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
            const home = { x: 0, y: 2.1, z: isMobileScreen ? 2.85 : 2.2 };
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
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.target.set(0, 2.1, 0);
                    orbitControlsRef.current.update();
                }
                setIsCameraResetting(false);
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
            const reveal = presentationCapsule;

            // --- Always damp openAmount and position lid every frame (matches test/script.js) ---
            openAmountRef.current = THREE.MathUtils.damp(
                openAmountRef.current,
                revealState.step === 'opening' || revealState.step === 'opened' ? 1 : 0,
                5.5,
                delta
            );
            const oa = openAmountRef.current;
            const lift = Math.sin(oa * Math.PI * 0.5);

            if (reveal.top) {
                reveal.top.position.y = reveal.topClosedY + lift * reveal.liftDistance;
                reveal.top.rotation.z = reveal.topClosedRotZ + lift * 0.08;
                reveal.top.rotation.x = reveal.topClosedRotX + lift * 0.05;
            }

            if (revealState.step === 'centering') {
                    const newX = THREE.MathUtils.damp(reveal.group.position.x, 0, 4, delta);
                    const newY = THREE.MathUtils.damp(reveal.group.position.y, 1.6, 4, delta);
                    const newZ = THREE.MathUtils.damp(reveal.group.position.z, 1.4, 4, delta);
                    reveal.group.position.set(newX, newY, newZ);
                    reveal.group.rotation.y = THREE.MathUtils.damp(reveal.group.rotation.y, 0, 4, delta);

                    const dist = Math.hypot(newX, newY - 1.6, newZ - 1.4);
                    if (dist < 0.05) {
                        setRevealState(prev => {
                            if (!prev) return null;
                            prev.onReady?.();
                            return { ...prev, step: 'ready' };
                        });
                    }
                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 3, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.7, 3, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 2.15, 3, delta);
                    state.camera.lookAt(0, 1.6, 1.4);
                } else if (revealState.step === 'ready') {
                    const bobY = 1.6 + Math.sin(clock.elapsedTime * 2) * 0.05;
                    reveal.group.position.set(0, bobY, 1.4);

                    // slow spin while waiting for click
                    reveal.group.rotation.y = clock.elapsedTime * 0.4;

                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 3, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.7, 3, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 2.15, 3, delta);
                    state.camera.lookAt(0, 1.6, 1.4);
                } else if (revealState.step === 'opening' || revealState.step === 'opened') {
                    const bobY = 1.6 + Math.sin(clock.elapsedTime * 1.5) * 0.03;
                    reveal.group.position.set(0, bobY, 1.4);

                    // Same reward hierarchy as /test, scaled down to match the presentation capsule size
                    const isWin = revealState.outcome !== 'LOSS';
                    reveal.rewardGroup.visible = isWin;
                    reveal.rewardGroup.position.y = THREE.MathUtils.lerp(-0.3 * reveal.scaleRatio, 0.35 * reveal.scaleRatio, oa);
                    reveal.crystal.rotation.y += delta * 1.5;
                    reveal.crystal.rotation.x += delta * 0.8;
                    reveal.crystal.scale.setScalar(THREE.MathUtils.lerp(0.2 * reveal.scaleRatio, 1.15 * reveal.scaleRatio, oa));
                    reveal.rewardLight.intensity = THREE.MathUtils.lerp(0, 4.5, oa);
                    reveal.sparkleMaterial.opacity = THREE.MathUtils.lerp(0, 0.9, oa);
                    reveal.sparkles.rotation.y -= delta * 0.5;

                    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 4, delta);
                    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.75, 4, delta);
                    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, 2.0, 4, delta);
                    state.camera.lookAt(0, bobY + 0.1, 1.4);

                    if (revealState.step === 'opening') {
                        revealTimerRef.current += delta;
                        // Present the result shortly after the lid reaches its fully-open state.
                        if (revealTimerRef.current >= 1.15 && oa > 0.9) {
                            revealState.onComplete?.();
                            setRevealState(prev => prev ? { ...prev, step: 'opened' } : null);
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
            selectedBall.setTranslation({ x: 99, y: -10, z: 99 }, true);
        }
        presentationCapsule.group.visible = true;
        presentationCapsule.group.position.set(0, 0.85, 0.45);
        presentationCapsule.group.rotation.set(0, 0, 0);
        presentationCapsule.rewardGroup.visible = outcome !== 'LOSS';
        presentationCapsule.rewardGroup.position.y = -0.3 * presentationCapsule.scaleRatio;
        presentationCapsule.crystal.scale.setScalar(0.2 * presentationCapsule.scaleRatio);
        presentationCapsule.rewardLight.intensity = 0;
        presentationCapsule.sparkleMaterial.opacity = 0;
        revealTimerRef.current = 0;
        openAmountRef.current = 0;
        setRevealState({
            active: true,
            ballIndex: idx,
            outcome,
            step: 'centering',
            onReady,
            onComplete
        });
    }, [presentationCapsule]);

    const clickCapsule = useCallback(() => {
        revealTimerRef.current = 0;
        setRevealState(previous => {
            if (previous?.step === 'ready') {
                return { ...previous, step: 'opening' };
            }
            return previous;
        });
    }, []);

    const closeReveal = useCallback(() => {
        if (revealState) {
            const selectedBall = ballRefs.current[revealState.ballIndex]?.current;
            if (selectedBall) {
                if (selectedBall.setBodyType) selectedBall.setBodyType(0, true);
                if (selectedBall.setTranslation) selectedBall.setTranslation({ x: 99, y: -10, z: 99 }, true);
            }
        }
        if (presentationCapsule.top) {
            presentationCapsule.top.position.y = presentationCapsule.topClosedY;
            presentationCapsule.top.rotation.x = presentationCapsule.topClosedRotX;
            presentationCapsule.top.rotation.z = presentationCapsule.topClosedRotZ;
        }
        presentationCapsule.group.visible = false;
        presentationCapsule.rewardLight.intensity = 0;
        presentationCapsule.sparkleMaterial.opacity = 0;
        openAmountRef.current = 0; // Reset for next reveal
        setRevealState(null);
        caughtBallIndexRef.current = null;
        setIsCameraResetting(true);
    }, [presentationCapsule, revealState]);

    const setWinColorMode = useCallback((colored: boolean) => {
        const applyMode = (object: any) => {
            object.traverse((child: any) => {
                if (child.isMesh && child.material && child.material.color && child.material.userData.originalColor) {
                    if (colored) {
                        child.material.color.copy(child.material.userData.originalColor);
                    } else {
                        const hsl = { h: 0, s: 0, l: 0 };
                        child.material.color.getHSL(hsl);
                        child.material.color.setHSL(hsl.h, 0, hsl.l);
                    }
                    child.material.needsUpdate = true;
                }
            });
        };
        applyMode(clawMachine.scene);
        applyMode(clawRest.scene);
        applyMode(clawRest1.scene);
        applyMode(clawRest2.scene);
        applyMode(clawRest3.scene);
        applyMode(claw1.scene);
        applyMode(claw2.scene);
        applyMode(claw3.scene);
    }, [clawMachine, clawRest, clawRest1, clawRest2, clawRest3, claw1, claw2, claw3]);

    useImperativeHandle(ref, () => ({
        onPick,
        onJoystick,
        startReveal,
        clickCapsule,
        closeReveal,
        getRevealStep: () => revealState?.step,
        setWinColorMode
    }), [onPick, onJoystick, startReveal, clickCapsule, closeReveal, revealState, setWinColorMode]);

    return (
        <>
            <Environment
                files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
            />
            <ambientLight intensity={2} />
            <color attach="background" args={['#16161a']} />
            <fog attach="fog" args={['#16161a', 4, 12]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#1a1a1e" roughness={0.9} metalness={0.1} />
            </mesh>
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
            <primitive object={presentationCapsule.group} />
            <Physics>
                {showScene && Array.from({ length: 54 }).map((_, index) => {
                    const x = 0.25 + Math.floor((index % 9) / 3) * 0.3;
                    const y = 2 + Math.floor(index / 9) * 0.3;
                    const z = -0.5 + (index % 3) * 0.3;
                    return <Ball key={index} ref={ballRefs.current[index]} obj={prizeCapsule.scene} position={[x, y, z]} />
                })}
                <RigidBody ccd type="fixed" colliders="trimesh">
                    <primitive object={clawMachine.scene} castShadow />
                </RigidBody>
            </Physics >
            <OrbitControls
                ref={orbitControlsRef}
                enableRotate={false}
                enablePan={false}
                enableZoom={false}
                minDistance={1.2}
                maxDistance={2.8}
                target={[0.0, 2.1, 0.0]}
                enabled={!revealState?.active && !isCameraResetting}
            />
        </>
    )
}

export default forwardRef(Scene);
