'use client';

import React from 'react';

export default function SmileyStampBadge({ size = 110 }: { size?: number }) {
  // Generate perforated hole positions along the 4 edges of a 200x200 viewBox
  const numTeeth = 7;
  const edgeHoles: { cx: number; cy: number }[] = [];
  for (let i = 0; i <= numTeeth; i++) {
    const pos = 16 + (i / numTeeth) * 168;
    edgeHoles.push({ cx: pos, cy: 6 });       // Top
    edgeHoles.push({ cx: pos, cy: 194 });     // Bottom
    edgeHoles.push({ cx: 6, cy: pos });       // Left
    edgeHoles.push({ cx: 194, cy: pos });     // Right
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        filter: 'drop-shadow(0 8px 20px rgba(0, 255, 102, 0.45))',
        animation: 'stampFloat 3s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes stampFloat {
          0% { transform: translateY(0px) rotate(-2deg) scale(1); }
          100% { transform: translateY(-6px) rotate(2deg) scale(1.05); }
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
          {/* Perforation mask to create authentic stamp teeth edges */}
          <mask id="stamp-perforation">
            <rect width="200" height="200" fill="white" />
            {edgeHoles.map((hole, index) => (
              <circle key={index} cx={hole.cx} cy={hole.cy} r="6.5" fill="black" />
            ))}
          </mask>
        </defs>

        {/* Outer Stamp Base with Perforated Edges */}
        <rect
          x="6"
          y="6"
          width="188"
          height="188"
          rx="6"
          fill="#00ff66"
          stroke="#000000"
          strokeWidth="5"
          mask="url(#stamp-perforation)"
        />

        {/* Inner Blotter Yellow Square */}
        <rect
          x="24"
          y="24"
          width="152"
          height="152"
          fill="#ffde00"
          stroke="#000000"
          strokeWidth="3.5"
          mask="url(#stamp-perforation)"
        />

        {/* Psychedelic Blotter Dashed Grid Lines */}
        <g stroke="rgba(236, 72, 153, 0.4)" strokeWidth="1.2" strokeDasharray="6,6" mask="url(#stamp-perforation)">
          <line x1="24" y1="62" x2="176" y2="62" />
          <line x1="24" y1="100" x2="176" y2="100" />
          <line x1="24" y1="138" x2="176" y2="138" />
          <line x1="62" y1="24" x2="62" y2="176" />
          <line x1="100" y1="24" x2="100" y2="176" />
          <line x1="138" y1="24" x2="138" y2="176" />
        </g>

        {/* Psychedelic Smiley Face (Center at 100, 100) */}
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="#ffd700"
          stroke="#000000"
          strokeWidth="5"
          mask="url(#stamp-perforation)"
        />

        {/* Left Spiral Eye */}
        <g transform="translate(76, 84)">
          <circle r="16" fill="#00e676" stroke="#000000" strokeWidth="2.5" />
          <circle r="11" fill="none" stroke="#000000" strokeWidth="2" />
          <circle r="6" fill="none" stroke="#000000" strokeWidth="2" />
          <circle r="2" fill="#000000" />
        </g>

        {/* Right Spiral Eye */}
        <g transform="translate(124, 84)">
          <circle r="16" fill="#00e676" stroke="#000000" strokeWidth="2.5" />
          <circle r="11" fill="none" stroke="#000000" strokeWidth="2" />
          <circle r="6" fill="none" stroke="#000000" strokeWidth="2" />
          <circle r="2" fill="#000000" />
        </g>

        {/* Happy Smile Arc */}
        <path
          d="M 68 104 C 80 136, 120 136, 132 104"
          stroke="#000000"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheeky Red Tongue Sticking Out to the Right */}
        <path
          d="M 112 123 C 122 142, 146 142, 146 128 C 146 118, 136 114, 126 118 Z"
          fill="#ff0033"
          stroke="#000000"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Tongue Highlight */}
        <circle cx="134" cy="126" r="3" fill="rgba(255,255,255,0.6)" />
      </svg>
    </div>
  );
}
