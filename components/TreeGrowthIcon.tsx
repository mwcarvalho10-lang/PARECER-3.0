'use client';

import React from 'react';

interface TreeGrowthIconProps {
  grade?: number | string;
  stage?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  withContainer?: boolean;
}

export function TreeGrowthIcon({
  grade,
  stage,
  size = 'md',
  className = '',
  withContainer = false,
}: TreeGrowthIconProps) {
  // Resolve stage: if grade is provided, map to 1-5, otherwise use stage
  const effectiveStage = stage || (grade ? Math.min(Math.max(parseInt(String(grade), 10) || 1, 1), 5) : 1);

  const dimensions = {
    xs: { px: 18, container: 'w-6 h-6 p-0.5' },
    sm: { px: 24, container: 'w-8 h-8 p-1' },
    md: { px: 36, container: 'w-11 h-11 p-1.5' },
    lg: { px: 48, container: 'w-14 h-14 p-2' },
    xl: { px: 64, container: 'w-18 h-18 p-2.5' },
    '2xl': { px: 84, container: 'w-24 h-24 p-3' },
  }[size];

  const renderSvg = () => {
    switch (effectiveStage) {
      case 1:
        // Stage 1 (1º Ano): Semente Rompendo & Primeiro Broto Verde
        return (
          <svg
            width={dimensions.px}
            height={dimensions.px}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xs"
            aria-label="1º Ano: A Semente e o Primeiro Broto"
          >
            <defs>
              <linearGradient id="sproutSeedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="sproutLeafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bef264" />
                <stop offset="60%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#4d7c0f" />
              </linearGradient>
              <linearGradient id="soilGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#92400e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Fertile soil mound */}
            <path
              d="M 10 52 C 22 47 42 47 54 52 C 46 56 18 56 10 52 Z"
              fill="url(#soilGrad1)"
            />

            {/* Small root descending */}
            <path
              d="M 32 48 Q 30 54 28 58"
              stroke="#a16207"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 32 49 Q 35 55 37 57"
              stroke="#a16207"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Seed coat opening */}
            <ellipse
              cx="32"
              cy="46"
              rx="6.5"
              ry="4.5"
              fill="url(#sproutSeedGrad)"
            />
            <path
              d="M 28 46 Q 32 44 36 46"
              stroke="#fef08a"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Tender sprout stem */}
            <path
              d="M 32 44 Q 31 34 32 24"
              stroke="#65a30d"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Left cotyledon leaf */}
            <path
              d="M 32 25 C 22 23 18 15 25 13 C 31 11 32 20 32 25 Z"
              fill="url(#sproutLeafGrad1)"
            />
            {/* Right cotyledon leaf */}
            <path
              d="M 32 23 C 41 20 46 12 39 11 C 33 10 32 18 32 23 Z"
              fill="url(#sproutLeafGrad1)"
            />

            {/* Dew droplet on leaf tip */}
            <circle cx="23" cy="14" r="2.2" fill="#38bdf8" />
            <circle cx="22.5" cy="13.5" r="0.8" fill="#ffffff" />
          </svg>
        );

      case 2:
        // Stage 2 (2º Ano): Mudinha em Enraizamento & Primeiras Folhas Verdadeiras
        return (
          <svg
            width={dimensions.px}
            height={dimensions.px}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xs"
            aria-label="2º Ano: A Muda em Enraizamento"
          >
            <defs>
              <linearGradient id="stemGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="30%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            {/* Root network in soil */}
            <path
              d="M 12 52 C 24 49 40 49 52 52"
              stroke="#ca8a04"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 32 50 Q 26 56 22 60"
              stroke="#854d0e"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 32 50 Q 36 57 40 59"
              stroke="#854d0e"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 32 52 L 32 61"
              stroke="#854d0e"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Young firm stem */}
            <path
              d="M 32 50 Q 31 36 32 18"
              stroke="url(#stemGrad2)"
              strokeWidth="3.8"
              strokeLinecap="round"
            />

            {/* Lower left leaf */}
            <path
              d="M 31 38 C 19 39 14 30 22 26 C 29 23 31 33 31 38 Z"
              fill="url(#leafGrad2)"
            />
            {/* Lower right leaf */}
            <path
              d="M 33 34 C 45 35 50 26 42 22 C 35 19 33 29 33 34 Z"
              fill="url(#leafGrad2)"
            />

            {/* Upper left leaf */}
            <path
              d="M 32 24 C 20 22 17 12 26 11 C 32 10 32 19 32 24 Z"
              fill="url(#leafGrad2)"
            />
            {/* Upper right leaf */}
            <path
              d="M 32 20 C 44 18 47 8 38 7 C 31 7 32 16 32 20 Z"
              fill="url(#leafGrad2)"
            />

            {/* Top young bud */}
            <circle cx="32" cy="14" r="3" fill="#a3e635" />
          </svg>
        );

      case 3:
        // Stage 3 (3º Ano): Jovem Caule & Ramificação (Arbusto Forte)
        return (
          <svg
            width={dimensions.px}
            height={dimensions.px}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xs"
            aria-label="3º Ano: O Jovem Caule e Ramificação"
          >
            <defs>
              <linearGradient id="branchGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="leafGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="30%" stopColor="#0284c7" />
                <stop offset="70%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
            </defs>

            {/* Roots base */}
            <path
              d="M 23 54 Q 28 50 32 48 Q 36 50 41 54"
              stroke="#78350f"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 32 48 L 32 58"
              stroke="#78350f"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Strong young trunk */}
            <path
              d="M 30 48 L 31 32 L 33 32 L 34 48 Z"
              fill="url(#branchGrad3)"
            />

            {/* Lateral branches */}
            <path
              d="M 31 34 Q 22 28 17 25"
              stroke="#92400e"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M 33 32 Q 42 27 48 24"
              stroke="#92400e"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M 32 30 L 32 18"
              stroke="#92400e"
              strokeWidth="2.6"
              strokeLinecap="round"
            />

            {/* Left foliage cluster */}
            <circle cx="16" cy="22" r="9" fill="url(#leafGrad3)" />
            <circle cx="22" cy="18" r="7" fill="url(#leafGrad3)" />

            {/* Right foliage cluster */}
            <circle cx="48" cy="21" r="9" fill="url(#leafGrad3)" />
            <circle cx="42" cy="17" r="7.5" fill="url(#leafGrad3)" />

            {/* Central crown cluster */}
            <circle cx="32" cy="14" r="10" fill="url(#leafGrad3)" />
            <circle cx="32" cy="9" r="6" fill="#38bdf8" opacity="0.8" />
          </svg>
        );

      case 4:
        // Stage 4 (4º Ano): Árvore Frondosa com Copa Viva & Floração
        return (
          <svg
            width={dimensions.px}
            height={dimensions.px}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xs"
            aria-label="4º Ano: A Árvore Frondosa"
          >
            <defs>
              <linearGradient id="trunkGrad4" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="canopyGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#005bb7" />
                <stop offset="80%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            {/* Root anchor */}
            <path
              d="M 22 55 Q 28 50 32 46 Q 36 50 42 55"
              stroke="#78350f"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Robust trunk with branching */}
            <path
              d="M 28 48 C 29 40 27 34 22 28 L 26 27 C 30 32 32 35 32 32 C 32 35 34 32 38 27 L 42 28 C 37 34 35 40 36 48 Z"
              fill="url(#trunkGrad4)"
            />

            {/* Broad frondose canopy */}
            <g fill="url(#canopyGrad4)">
              <circle cx="32" cy="22" r="14" />
              <circle cx="21" cy="26" r="10" />
              <circle cx="43" cy="26" r="10" />
              <circle cx="15" cy="33" r="8" />
              <circle cx="49" cy="33" r="8" />
              <circle cx="32" cy="13" r="9" />
              <circle cx="24" cy="17" r="8" />
              <circle cx="40" cy="17" r="8" />
            </g>

            {/* Blossom spots (flowers of learning) */}
            <circle cx="22" cy="24" r="2.2" fill="#fef08a" />
            <circle cx="42" cy="25" r="2.2" fill="#fef08a" />
            <circle cx="32" cy="16" r="2.5" fill="#fef08a" />
            <circle cx="16" cy="31" r="1.8" fill="#fbcfe8" />
            <circle cx="48" cy="31" r="1.8" fill="#fbcfe8" />
          </svg>
        );

      case 5:
      default:
        // Stage 5 (5º Ano): Árvore Frutífera Centenária sobre o Livro Aberto (Brasão Pleno)
        return (
          <svg
            width={dimensions.px}
            height={dimensions.px}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xs"
            aria-label="5º Ano: A Árvore Frutífera e Maturidade"
          >
            <defs>
              <linearGradient id="bookGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#005bb7" />
                <stop offset="100%" stopColor="#004b93" />
              </linearGradient>
              <linearGradient id="canopyGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="45%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <linearGradient id="trunkGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Open Book Pages at the base (direct school hallmark) */}
            <path
              d="M 32 54 C 24 51 15 51 8 55 L 9 58 C 16 54 25 54 32 57 Z"
              fill="url(#bookGrad5)"
            />
            <path
              d="M 32 54 C 40 51 49 51 56 55 L 55 58 C 48 54 39 54 32 57 Z"
              fill="url(#bookGrad5)"
            />
            <path
              d="M 9 58 C 16 56 25 56 32 59 C 39 56 48 56 55 58 L 56 59.5 C 48 57 39 57.5 32 61 C 25 57.5 16 57 8 59.5 Z"
              fill="#65a30d"
            />

            {/* Tree roots anchoring into the book */}
            <path
              d="M 32 48 Q 28 51 22 53"
              stroke="#78350f"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 32 48 Q 36 51 42 53"
              stroke="#78350f"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Grand mature trunk */}
            <path
              d="M 29 48 C 29 42 27 38 23 32 C 26 33 29 34 31 36 C 30 31 28 27 25 24 C 29 26 31 28 32 30 C 33 28 35 26 39 24 C 36 27 34 31 33 36 C 35 34 38 33 41 32 C 37 38 35 42 35 48 Z"
              fill="url(#trunkGrad5)"
            />

            {/* Majestic dense canopy */}
            <g fill="url(#canopyGrad5)">
              <circle cx="32" cy="22" r="14" />
              <circle cx="20" cy="24" r="10" />
              <circle cx="44" cy="24" r="10" />
              <circle cx="13" cy="30" r="8" />
              <circle cx="51" cy="30" r="8" />
              <circle cx="32" cy="12" r="10" />
              <circle cx="23" cy="15" r="8.5" />
              <circle cx="41" cy="15" r="8.5" />
              <circle cx="27" cy="28" r="8" />
              <circle cx="37" cy="28" r="8" />
            </g>

            {/* Golden fruits of knowledge */}
            <circle cx="20" cy="23" r="2.6" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="43" cy="22" r="2.6" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="32" cy="17" r="2.8" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="15" cy="30" r="2.3" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="49" cy="30" r="2.3" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="28" cy="28" r="2.4" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />
            <circle cx="36" cy="28" r="2.4" fill="#d97706" stroke="#fef3c7" strokeWidth="0.8" />

            {/* Top crown aura */}
            <circle cx="32" cy="7" r="2.5" fill="#facc15" opacity="0.9" />
          </svg>
        );
    }
  };

  if (withContainer) {
    const bgStyles = {
      1: 'bg-lime-50/80 border-lime-200/90 text-lime-700 shadow-lime-900/5',
      2: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-700 shadow-emerald-900/5',
      3: 'bg-sky-50/80 border-sky-200/90 text-sky-700 shadow-sky-900/5',
      4: 'bg-blue-50/80 border-blue-200/90 text-blue-700 shadow-blue-900/5',
      5: 'bg-amber-50/80 border-amber-200/90 text-amber-800 shadow-amber-900/5',
    }[effectiveStage as 1 | 2 | 3 | 4 | 5] || 'bg-slate-50 border-slate-200';

    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl border shadow-xs transition-transform group-hover:scale-105 shrink-0 ${dimensions.container} ${bgStyles} ${className}`}
      >
        {renderSvg()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      {renderSvg()}
    </div>
  );
}
