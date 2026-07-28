'use client';

import { BallCollider, RigidBody } from '@react-three/rapier';
import { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface Props {
    obj: any;
    position?: any;
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
    // Reveal animation helpers — derived from bounding box at load time
    getTopClosedY: () => number;
    getTopClosedRotX: () => number;
    getTopClosedRotZ: () => number;
    getLiftDist: () => number;
}

function applyOpaqueCapsuleMaterial(object: THREE.Object3D, color: string) {
    object.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        // Replace the GLB material entirely: its original textures include
        // colour and alpha data, which otherwise override simple color edits.
        mesh.material = new THREE.MeshStandardMaterial({
            color,
            emissive: '#000000',
            metalness: 0.25,
            roughness: 0.32,
            transparent: false,
            opacity: 1,
            depthWrite: true,
        });
    });
}

const Ball: ForwardRefRenderFunction<any, Props> = ({ obj, position }, ref) => {
    const rigidBodyRef = useRef<any>(null);
    const topRef = useRef<THREE.Object3D | null>(null);
    const bottomRef = useRef<THREE.Object3D | null>(null);
    const rewardRef = useRef<THREE.Mesh | null>(null);

    // Stored in refs so they are stable across renders and usable in useImperativeHandle
    const topClosedYRef = useRef(0);
    const topClosedRotXRef = useRef(0);
    const topClosedRotZRef = useRef(0);
    const liftDistRef = useRef(200); // safe fallback in model units

    const clonedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        let top = clone.getObjectByName('top') as THREE.Object3D | undefined;
        let bottom = clone.getObjectByName('bottom') as THREE.Object3D | undefined;

        if (!top || !bottom) {
            console.warn("[Ball] Could not find exact 'top' and 'bottom' names. Attempting automatic mesh separation...");
            const meshes: THREE.Object3D[] = [];
            clone.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) meshes.push(child);
            });
            if (meshes.length >= 2) {
                bottom = meshes[0];
                top = meshes[1];
            } else {
                console.error("[Ball] CRITICAL: pre.glb must contain distinct meshes for 'top' and 'bottom'");
            }
        }

        topRef.current = top || null;
        bottomRef.current = bottom || null;

        // Match test/script.js: compute bounding box, center model pivot at local (0,0,0)
        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        clone.position.sub(center);

        // In local model coordinates (scaled down by group 0.003), lift 45% of total height
        liftDistRef.current = size.y * 0.45;

        if (top) {
            // Store initial lid position/rotation in local model space
            topClosedYRef.current = top.position.y;
            topClosedRotXRef.current = top.rotation.x;
            topClosedRotZRef.current = top.rotation.z;
        }

        // Every prize stays in the monochrome world: black lid, white base.
        if (top) applyOpaqueCapsuleMaterial(top, '#111111');
        if (bottom) applyOpaqueCapsuleMaterial(bottom, '#F0F0F0');
        return clone;
    }, [obj]);

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
            if (rewardRef.current?.material) {
                const mat = rewardRef.current.material as THREE.MeshStandardMaterial;
                mat.emissive.set(color);
                mat.emissiveIntensity = intensity;
            }
        },
        // Reveal animation helpers
        getTopClosedY: () => topClosedYRef.current,
        getTopClosedRotX: () => topClosedRotXRef.current,
        getTopClosedRotZ: () => topClosedRotZRef.current,
        getLiftDist: () => liftDistRef.current,
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
                    {/* Glowing reward orb — opacity 0 until WIN reveal */}
                    <mesh ref={rewardRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[20, 20, 4, 32]} />
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive="#ffffff"
                            emissiveIntensity={0}
                            roughness={0.1}
                            metalness={0.6}
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
