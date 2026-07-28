'use client';

import { Box, Button, Text, VStack } from '@chakra-ui/react';
import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface PrizeCapsuleProps {
    outcome: string;
    onClose: () => void;
    onShare: () => void;
}

const CapsuleModel: FC<{
    outcome: string;
    isOpening: boolean;
    isClosing: boolean;
    onOpened: () => void;
    onClosed: () => void;
}> = ({ outcome, isOpening, isClosing, onOpened, onClosed }) => {
    const gltf = useGLTF('/assets/pre.glb');
    const groupRef = useRef<THREE.Group>(null);
    const topRef = useRef<THREE.Object3D | null>(null);
    const bottomRef = useRef<THREE.Object3D | null>(null);
    const prizeTokenRef = useRef<THREE.Mesh>(null);

    const [hovered, setHovered] = useState(false);
    const animationProgress = useRef(0);

    // Deep clone and resolve canonical object names (NEVER use indices)
    const clonedScene = useMemo(() => {
        if (!gltf.scene) return null;
        const clone = gltf.scene.clone(true);
        topRef.current = clone.getObjectByName('top') || null;
        bottomRef.current = clone.getObjectByName('bottom') || null;

        // Give the capsule lid a sleek golden/vibrant tint for the prize reveal
        if (topRef.current && (topRef.current as any).isMesh) {
            const mesh = topRef.current as THREE.Mesh;
            mesh.material = (mesh.material as THREE.Material).clone();
            (mesh.material as THREE.MeshStandardMaterial).color.set('#D69E2E'); // Vibrant Gold
            (mesh.material as THREE.MeshStandardMaterial).emissive.set('#975A16');
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
        }
        return clone;
    }, [gltf.scene]);

    useEffect(() => {
        document.body.style.cursor = hovered ? 'pointer' : 'auto';
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. Progress State Machine (No setInterval used; procedural continuous damping)
        if (isOpening && !isClosing) {
            animationProgress.current = THREE.MathUtils.damp(animationProgress.current, 1, 4, delta);
            if (animationProgress.current > 0.95) {
                onOpened();
            }
        } else if (isClosing) {
            animationProgress.current = THREE.MathUtils.damp(animationProgress.current, 0, 5, delta);
            if (animationProgress.current < 0.05) {
                onClosed();
            }
        }

        const p = animationProgress.current;

        // 2. Idle Floating & Bobbing (only active when not fully opening/closed)
        const idleFloatY = Math.sin(state.clock.elapsedTime * 2) * 0.06 * (1 - p);
        const idleRotY = state.clock.elapsedTime * 0.3 * (1 - p);

        // 3. Anticipation & Lid Lifting
        // Anticipation dip at p around 0.1 - 0.2
        const anticipationDip = Math.sin(p * Math.PI) * -0.15;
        groupRef.current.position.y = idleFloatY + anticipationDip;
        groupRef.current.rotation.y = idleRotY;

        // 4. Hover Scale & Emissive Glow Easing
        const targetScaleVal = (hovered && !isOpening ? 1.06 : 1.0) * 0.003; // Base scale 0.003 for 100-unit model
        groupRef.current.scale.lerp(new THREE.Vector3(targetScaleVal, targetScaleVal, targetScaleVal), delta * 10);

        if (topRef.current) {
            // Lift top along Y axis up to +35 units relative to bottom
            const targetTopY = p * 35;
            topRef.current.position.y = THREE.MathUtils.damp(topRef.current.position.y, targetTopY, 6, delta);
        }

        // 5. Camera Smooth Zoom
        const targetCamZ = 2.4 - p * 0.6; // Zooms closer from 2.4 down to 1.8
        state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetCamZ, 5, delta);

        // 6. Internal Prize Token Animation (floats up when capsule opens)
        if (prizeTokenRef.current) {
            prizeTokenRef.current.position.y = THREE.MathUtils.damp(prizeTokenRef.current.position.y, p * 0.4, 5, delta);
            prizeTokenRef.current.rotation.y += delta * 1.5;
            prizeTokenRef.current.scale.setScalar(p * 0.35);
        }
    });

    if (!clonedScene) return null;

    return (
        <group
            ref={groupRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <primitive object={clonedScene} />

            {/* Glowing internal reward token floating inside the opened capsule */}
            <mesh ref={prizeTokenRef} position={[0, 0, 0]}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color="#00FFFF" emissive="#0088FF" emissiveIntensity={2} wireframe={false} />
            </mesh>
        </group>
    );
};

const PrizeCapsule: FC<PrizeCapsuleProps> = ({ outcome, onClose, onShare }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [uiVisible, setUiVisible] = useState(false);

    const handleCapsuleClick = () => {
        if (!isOpening && !isClosing) {
            setIsOpening(true);
        }
    };

    const handleCloseClick = () => {
        setUiVisible(false);
        setIsClosing(true);
    };

    return (
        <Box
            position="absolute"
            inset={0}
            zIndex={50}
            bg="blackAlpha.800"
            backdropFilter="blur(12px)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={handleCapsuleClick}
        >
            {/* 3D Canvas Viewport for Interactive Capsule Reveal */}
            <Box position="absolute" inset={0} w="full" h="full">
                <Canvas camera={{ position: [0, 0, 2.4], fov: 50 }} shadows="soft">
                    <ambientLight intensity={1.5} />
                    <pointLight position={[2, 5, 5]} intensity={20} />
                    <pointLight position={[-2, -3, 2]} intensity={10} color="#6f00ff" />
                    <CapsuleModel
                        outcome={outcome}
                        isOpening={isOpening}
                        isClosing={isClosing}
                        onOpened={() => setUiVisible(true)}
                        onClosed={onClose}
                    />
                </Canvas>
            </Box>

            {/* Hint overlay before clicking */}
            {!isOpening && !uiVisible && (
                <Box position="absolute" bottom="15%" pointerEvents="none">
                    <Text fontSize="xl" fontWeight="extrabold" color="white" letterSpacing="wider" textShadow="0 2px 10px rgba(0,0,0,0.8)">
                        ✨ CLICK CAPSULE TO OPEN ✨
                    </Text>
                </Box>
            )}

            {/* Apple-like UI Reveal Overlay (only appears after lid lifts) */}
            {uiVisible && (
                <Box
                    position="absolute"
                    zIndex={60}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={8}
                    bg="whiteAlpha.900"
                    backdropFilter="blur(16px)"
                    rounded="2xl"
                    shadow="2xl"
                    border="2px solid rgba(255,255,255,0.4)"
                    maxW="md"
                    textAlign="center"
                    color="gray.900"
                    gap={6}
                    onClick={(e) => e.stopPropagation()} // Prevent clicking UI from triggering canvas events
                >
                    <Text fontSize="4xl" fontWeight="black" bgGradient="linear(to-r, purple.600, pink.500)" bgClip="text">
                        🎉 PRIZE UNLOCKED! 🎉
                    </Text>
                    
                    <Box
                        px={6}
                        py={4}
                        bgGradient="linear(to-br, gray.900, purple.900)"
                        rounded="xl"
                        shadow="inner"
                        border="2px solid"
                        borderColor="purple.400"
                        w="full"
                    >
                        <Text fontSize="3xl" fontWeight="black" color="cyan.300" letterSpacing="widest">
                            {outcome}
                        </Text>
                    </Box>

                    <Text fontSize="md" fontWeight="semibold" color="gray.600">
                        Share your victory on X (Twitter) to claim your reward and whitelist spot!
                    </Text>

                    <VStack w="full" gap={3}>
                        <Button
                            size="lg"
                            colorScheme="twitter"
                            w="full"
                            rounded="xl"
                            shadow="md"
                            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                            transition="all 0.2s"
                            onClick={onShare}
                        >
                            Share on X to Claim
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            colorScheme="gray"
                            w="full"
                            rounded="xl"
                            onClick={handleCloseClick}
                        >
                            Close & Return
                        </Button>
                    </VStack>
                </Box>
            )}
        </Box>
    );
};

export default PrizeCapsule;
