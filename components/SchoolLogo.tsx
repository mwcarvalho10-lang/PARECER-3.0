'use client';

import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function SchoolLogo({ className = '', size = 'md', showText = true }: SchoolLogoProps) {
  // Dimensions based on size
  const dimensions = {
    sm: { w: 36, h: 36, textSize: 'text-[9px]' },
    md: { w: 48, h: 48, textSize: 'text-xs' },
    lg: { w: 72, h: 72, textSize: 'text-sm' },
    xl: { w: 110, h: 110, textSize: 'text-base' }
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Emblem representing the exact school logo */}
      <svg
        width={dimensions.w}
        height={dimensions.h}
        viewBox="0 0 200 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84cc16" />
            <stop offset="50%" stopColor="#4d7c0f" />
            <stop offset="100%" stopColor="#365314" />
          </linearGradient>
          <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <path
            id="textArc"
            d="M 22 105 A 80 75 0 1 1 178 105"
            fill="none"
          />
        </defs>

        {/* Circular green border arch */}
        <path
          d="M 28 116 A 74 70 0 1 1 172 116"
          stroke="#65a30d"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Arched School Name */}
        <text fill="#004b93" fontSize="12" fontWeight="900" letterSpacing="0.8">
          <textPath href="#textArc" startOffset="50%" textAnchor="middle">
            ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
          </textPath>
        </text>

        {/* Open Book Pages (Blue Azure) */}
        <g id="openBook">
          {/* Left Page */}
          <path
            d="M 100 135 C 75 125 45 126 22 138 L 26 148 C 50 138 78 138 100 148 Z"
            fill="url(#bookGrad)"
            stroke="#0284c7"
            strokeWidth="1.5"
          />
          {/* Right Page */}
          <path
            d="M 100 135 C 125 125 155 126 178 138 L 174 148 C 150 138 122 138 100 148 Z"
            fill="url(#bookGrad)"
            stroke="#0284c7"
            strokeWidth="1.5"
          />
          {/* Page fold & bottom green accent */}
          <path
            d="M 26 148 C 50 142 80 143 100 151 C 120 143 150 142 174 148 L 178 152 C 150 145 122 146 100 155 C 78 146 50 145 22 152 Z"
            fill="#65a30d"
          />
        </g>

        {/* Tree Roots extending into the book */}
        <g stroke="url(#trunkGrad)" strokeWidth="3" strokeLinecap="round">
          <path d="M 100 120 Q 94 128 80 132" />
          <path d="M 100 120 Q 106 128 120 132" />
          <path d="M 97 122 Q 90 126 70 133" />
          <path d="M 103 122 Q 110 126 130 133" />
        </g>

        {/* Tree Trunk & Branches */}
        <path
          d="M 93 120 C 93 105 88 95 82 90 C 88 90 94 92 98 96 C 96 85 92 80 85 75 C 93 78 98 83 100 88 C 102 83 107 78 115 75 C 108 80 104 85 102 96 C 106 92 112 90 118 90 C 112 95 107 105 107 120 Z"
          fill="url(#trunkGrad)"
        />

        {/* Tree Foliage Clusters (Canopy) */}
        <g fill="url(#leafGrad)">
          {/* Main central clusters */}
          <circle cx="100" cy="58" r="24" />
          <circle cx="82" cy="64" r="20" />
          <circle cx="118" cy="64" r="20" />
          <circle cx="68" cy="74" r="18" />
          <circle cx="132" cy="74" r="18" />
          <circle cx="56" cy="86" r="15" />
          <circle cx="144" cy="86" r="15" />
          <circle cx="100" cy="44" r="16" />
          <circle cx="85" cy="48" r="15" />
          <circle cx="115" cy="48" r="15" />
          <circle cx="74" cy="82" r="16" />
          <circle cx="126" cy="82" r="16" />
          <circle cx="92" cy="76" r="17" />
          <circle cx="108" cy="76" r="17" />
        </g>

        {/* Subtle leaf highlights */}
        <g fill="#bef264" opacity="0.6">
          <circle cx="95" cy="42" r="5" />
          <circle cx="112" cy="45" r="4.5" />
          <circle cx="78" cy="58" r="6" />
          <circle cx="122" cy="58" r="6" />
          <circle cx="62" cy="78" r="5" />
          <circle cx="138" cy="78" r="5" />
          <circle cx="92" cy="68" r="6" />
          <circle cx="108" cy="68" r="6" />
        </g>

        {/* Subtitle bottom banner */}
        <text
          x="100"
          y="166"
          textAnchor="middle"
          fill="#0a2540"
          fontSize="9.5"
          fontWeight="900"
          letterSpacing="1.2"
        >
          ENSINO FUNDAMENTAL I - EJA
        </text>
      </svg>

      {/* Optional Side Label */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-serif font-black text-slate-900 tracking-tight text-sm uppercase">
            E. M. Raymundo Lemos Santana
          </span>
          <span className="text-[10px] font-bold text-escola-azul tracking-wider uppercase">
            Ensino Fundamental I • EJA
          </span>
        </div>
      )}
    </div>
  );
}
