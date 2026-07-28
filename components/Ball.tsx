'use client';

import { BallCollider, RigidBody } from '@react-three/rapier';
import { forwardRef, ForwardRefRenderFunction, useEffect, useMemo, useState } from 'react';

interface Props {
    obj: any;
    position?: any;
    tintColor?: string;
}

const Ball: ForwardRefRenderFunction<any, Props> = ({ obj, position, tintColor }, ref) => {
    const clonedObj = useMemo(() => {
        if (!obj) return null;
        const clone = obj.clone(true);
        if (tintColor) {
            const top = clone.getObjectByName("top");
            if (top && top.isMesh) {
                top.material = top.material.clone();
                top.material.color.set(tintColor);
            }
        }
        return clone;
    }, [obj, tintColor]);

    const [showObj, setShowObj] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowObj(true), 250);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RigidBody ref={ref} position={position}>
            <BallCollider args={[0.155]} />
            {showObj && clonedObj && (
                <primitive object={clonedObj} scale={0.003} />
            )}
        </RigidBody>
    )
}

export default forwardRef(Ball);
