'use client';

import React from 'react';

export default function PillBadge({ size = 110 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        filter: 'drop-shadow(0 14px 28px rgba(16, 185, 129, 0.38)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.12))',
        animation: 'pillFloat 3s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes pillFloat {
          0% { transform: translateY(0px) rotate(-3deg) scale(1); }
          100% { transform: translateY(-7px) rotate(3deg) scale(1.05); }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer sticker bevel gradient (light 3D base) */}
          <linearGradient id="pill-outer-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fafcfd" />
            <stop offset="85%" stopColor="#edf2f9" />
            <stop offset="100%" stopColor="#dee6f2" />
          </linearGradient>

          {/* Main green cylindrical 3D gradient for left half */}
          <linearGradient id="pill-green-3d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#68fab1" />
            <stop offset="15%" stopColor="#1cd673" />
            <stop offset="45%" stopColor="#05bd60" />
            <stop offset="80%" stopColor="#017b3d" />
            <stop offset="100%" stopColor="#00572b" />
          </linearGradient>

          {/* Radial inner glow for left green half to give spherical curvature */}
          <radialGradient id="pill-green-glow" cx="30%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.25)" />
          </radialGradient>

          {/* Main white ceramic 3D gradient for right half */}
          <linearGradient id="pill-white-3d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#f4f7fc" />
            <stop offset="60%" stopColor="#dce4f0" />
            <stop offset="85%" stopColor="#b6c5d8" />
            <stop offset="100%" stopColor="#96a8be" />
          </linearGradient>

          {/* Radial ceramic sheen for right white half */}
          <radialGradient id="pill-white-glow" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="55%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="100%" stopColor="rgba(100, 120, 150, 0.22)" />
          </radialGradient>

          {/* Glossy top acrylic surface reflection */}
          <linearGradient id="pill-acrylic-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0.25)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>

          {/* Bottom ambient occlusion shadow */}
          <linearGradient id="pill-bottom-ao" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.38)" />
          </linearGradient>

          {/* Inner bevel stroke gradient */}
          <linearGradient id="pill-inner-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.25)" />
          </linearGradient>

          {/* Clip path for the inner capsule shape */}
          <clipPath id="pill-clip">
            <rect x="20" y="66" width="160" height="68" rx="34" />
          </clipPath>
        </defs>

        <g transform="rotate(-25 100 100)">
          {/* 1. Outer White 3D Beveled Sticker Base */}
          <rect
            x="10"
            y="56"
            width="180"
            height="88"
            rx="44"
            fill="url(#pill-outer-base)"
            stroke="rgba(255, 255, 255, 0.95)"
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.16))',
            }}
          />

          {/* 2. Inner Pill Capsule Halves (clipped to rounded capsule) */}
          <g clipPath="url(#pill-clip)">
            {/* Left Green Half with 3D Cylindrical Shading + Radial Glow */}
            <rect x="20" y="66" width="80" height="68" fill="url(#pill-green-3d)" />
            <rect x="20" y="66" width="80" height="68" fill="url(#pill-green-glow)" />

            {/* Right White Half with Ceramic Shading + Radial Glow */}
            <rect x="100" y="66" width="80" height="68" fill="url(#pill-white-3d)" />
            <rect x="100" y="66" width="80" height="68" fill="url(#pill-white-glow)" />

            {/* 3. Realistic 3D Recessed Center Seam / Groove */}
            <line
              x1="99.5"
              y1="66"
              x2="99.5"
              y2="134"
              stroke="rgba(0, 0, 0, 0.25)"
              strokeWidth="1.5"
            />
            <line
              x1="101"
              y1="66"
              x2="101"
              y2="134"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="1.5"
            />

            {/* 4. Glossy Acrylic Top Reflection Arc */}
            <path
              d="M 30 71 L 170 71 C 175 71, 178 75, 178 81 L 178 88 C 178 96, 173 101, 168 101 L 32 101 C 27 101, 22 96, 22 88 L 22 81 C 22 75, 25 71, 30 71 Z"
              fill="url(#pill-acrylic-shine)"
            />

            {/* 5. Crisp White Specular Highlighting Streak along very top edge */}
            <rect
              x="36"
              y="70"
              width="128"
              height="6"
              rx="3"
              fill="rgba(255, 255, 255, 0.88)"
            />

            {/* 6. Soft Ambient Occlusion Shading along bottom edge */}
            <rect
              x="20"
              y="118"
              width="160"
              height="16"
              fill="url(#pill-bottom-ao)"
            />
          </g>

          {/* 7. Inner Beveled Rim for crisp 3D depth */}
          <rect
            x="20"
            y="66"
            width="160"
            height="68"
            rx="34"
            fill="none"
            stroke="url(#pill-inner-bevel)"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}
