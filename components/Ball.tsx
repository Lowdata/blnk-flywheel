'use client';

import { BallCollider, RigidBody } from '@react-three/rapier';
import { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
    obj: any;
    position?: any;
    tintColor?: string;
}

export interface BallHandle {
    translation: () => { x: number; y: number; z: number } | null;
    linvel: () => { x: number; y: number; z: number } | null;
    angvel: () => { x: number; y: number; z: number } | null;
    setGravityScale: (scale: number) => void;
    setBodyType: (type: number, wakeUp?: boolean) => void;
    setTranslation: (pos: { x: number; y: number; z: number }, wakeUp?: boolean) => void;
    setRotation: (rot: { x: number; y: number; z: number; w: number }, wakeUp?: boolean) => void;
    setLinvel: (vel: { x: number; y: number; z: number }, wakeUp?: boolean) => void;
    setAngvel: (vel: { x: number; y: number; z: number }, wakeUp?: boolean) => void;
    resetForces: (wakeUp?: boolean) => void;
    resetTorques: (wakeUp?: boolean) => void;
    getTopMesh: () => THREE.Object3D | null;
    getBottomMesh: () => THREE.Object3D | null;
    getRewardMesh: () => THREE.Mesh | null;
    setRewardEmissive: (color: string, intensity: number) => void;
}

const Ball: ForwardRefRenderFunction<any, Props> = ({ obj, position, tintColor }, ref) => {
    const rigidBodyRef = useRef<any>(null);
    const topRef = useRef<THREE.Object3D | null>(null);
    const bottomRef = useRef<THREE.Object3D | null>(null);
    const rewardRef = useRef<THREE.Mesh | null>(null);

    const clonedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        const top = clone.getObjectByName("top");
        const bottom = clone.getObjectByName("bottom");
        
        if (!top || !bottom) {
            console.error("[Ball] CRITICAL: 'top' or 'bottom' node missing in pre.glb — reveal will be broken.");
        }
        
        topRef.current = top || null;
        bottomRef.current = bottom || null;

        if (tintColor && top && (top as THREE.Mesh).isMesh) {
            const topMesh = top as THREE.Mesh;
            topMesh.material = (topMesh.material as THREE.Material).clone();
            (topMesh.material as THREE.MeshStandardMaterial).color.set(tintColor);
        }
        return clone;
    }, [obj, tintColor]);

    useImperativeHandle(ref, () => ({
        translation: () => rigidBodyRef.current?.translation() || null,
        linvel: () => rigidBodyRef.current?.linvel() || null,
        angvel: () => rigidBodyRef.current?.angvel() || null,
        setGravityScale: (scale: number) => rigidBodyRef.current?.setGravityScale(scale, true),
        setBodyType: (type: number, wakeUp?: boolean) => rigidBodyRef.current?.setBodyType(type, wakeUp ?? true),
        setTranslation: (pos: { x: number; y: number; z: number }, wakeUp?: boolean) => rigidBodyRef.current?.setTranslation(pos, wakeUp ?? true),
        setRotation: (rot: { x: number; y: number; z: number; w: number }, wakeUp?: boolean) => rigidBodyRef.current?.setRotation(rot, wakeUp ?? true),
        setLinvel: (vel: { x: number; y: number; z: number }, wakeUp?: boolean) => rigidBodyRef.current?.setLinvel(vel, wakeUp ?? true),
        setAngvel: (vel: { x: number; y: number; z: number }, wakeUp?: boolean) => rigidBodyRef.current?.setAngvel(vel, wakeUp ?? true),
        resetForces: (wakeUp?: boolean) => rigidBodyRef.current?.resetForces(wakeUp ?? true),
        resetTorques: (wakeUp?: boolean) => rigidBodyRef.current?.resetTorques(wakeUp ?? true),
        getTopMesh: () => topRef.current,
        getBottomMesh: () => bottomRef.current,
        getRewardMesh: () => rewardRef.current,
        setRewardEmissive: (color: string, intensity: number) => {
            if (rewardRef.current && rewardRef.current.material) {
                const mat = rewardRef.current.material as THREE.MeshStandardMaterial;
                mat.emissive.set(color);
                mat.emissiveIntensity = intensity;
            }
        }
    }), []);

    const [showObj, setShowObj] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowObj(true), 250);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RigidBody ref={rigidBodyRef} position={position}>
            <BallCollider args={[0.155]} />
            {showObj && clonedObj && (
                <group scale={0.003}>
                    <primitive object={clonedObj} />
                    {/* Glowing reward token inside capsule, initially hidden / zero opacity until reveal */}
                    <mesh ref={rewardRef} position={[0, 0, 0]} scale={[1, 1, 1]}>
                        <octahedronGeometry args={[25, 0]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#00ffff"
                            emissiveIntensity={0}
                            roughness={0.2}
                            metalness={0.8}
                            transparent
                            opacity={0}
                        />
                    </mesh>
                </group>
            )}
        </RigidBody>
    );
};

export default forwardRef(Ball);
