'use client';

import React, { useEffect } from 'react';
import { X, Delete, Lock, ShieldCheck } from 'lucide-react';
import { TreeGrowthIcon } from './TreeGrowthIcon';
import { getTreeGrowthStage } from '@/lib/treeGrowth';

interface PinModalProps {
  isOpen: boolean;
  targetGrade: number | null;
  targetLetter: string | null;
  isAdmin?: boolean;
  currentPin: string;
  isError: boolean;
  onPinChange: (pin: string) => void;
  onCancel: () => void;
}

export function PinModal({ 
  isOpen, 
  targetGrade, 
  targetLetter, 
  isAdmin, 
  currentPin, 
  isError, 
  onPinChange, 
  onCancel 
}: PinModalProps) {
  const stage = targetGrade ? getTreeGrowthStage(targetGrade) : null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAdmin) {
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          if (currentPin.length < 10) {
            onPinChange(currentPin + e.key);
          }
        }
      } else {
        if (e.key >= '0' && e.key <= '9') {
          if (currentPin.length < 5) {
            onPinChange(currentPin + e.key);
          }
        }
      }

      if (e.key === 'Backspace') {
        onPinChange(currentPin.slice(0, -1));
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPin, onPinChange, onCancel, isAdmin]);

  if (!isOpen) return null;

  const handlePress = (num: string) => {
    if (isAdmin) {
      if (currentPin.length < 10) onPinChange(currentPin + num);
    } else {
      if (currentPin.length < 5) onPinChange(currentPin + num);
    }
  };

  const handleBackspace = () => {
    onPinChange(currentPin.slice(0, -1));
  };

  const maxLen = isAdmin ? 7 : 5;
  const dotsArray = Array.from({ length: maxLen }, (_, i) => i);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div 
        className={`bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-[340px] border border-slate-200 transition-all ${
          isError ? 'animate-shake ring-2 ring-rose-500' : ''
        }`}
      >
        <div className="text-center mb-6">
          {isAdmin ? (
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              {targetGrade && (
                <TreeGrowthIcon grade={targetGrade} size="lg" withContainer={true} />
              )}
            </div>
          )}

          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {isAdmin ? 'Acesso Administrativo' : 'Acesso à Turma'}
          </h3>

          <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase">
            {isAdmin ? (
              'Digite a senha mestra (adm2026)'
            ) : (
              <>
                <span className="text-slate-900 font-black">{targetGrade}º ANO &quot;{targetLetter}&quot;</span>
                {stage && (
                  <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">
                    {stage.shortName}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-2.5 mb-6">
          {dotsArray.map((i) => (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                i < currentPin.length 
                  ? (isError ? 'bg-rose-500 border-rose-500 scale-110' : 'bg-escola-azul border-escola-azul scale-110') 
                  : 'border-slate-300 bg-slate-50'
              }`} 
            />
          ))}
        </div>

        {!isAdmin && (
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handlePress(num.toString())} 
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-base font-black text-slate-800 transition-all border border-slate-200/80 shadow-2xs font-mono"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={onCancel} 
              className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-2xs border border-rose-200/80"
              title="Cancelar"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handlePress('0')} 
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-base font-black text-slate-800 transition-all border border-slate-200/80 shadow-2xs font-mono"
            >
              0
            </button>
            <button 
              onClick={handleBackspace} 
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shadow-2xs border border-slate-200/80"
              title="Apagar dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="text-center space-y-3">
            <p className="text-[11px] text-slate-500 font-bold uppercase">
              Digite a senha no seu teclado físico
            </p>
            <button 
              onClick={onCancel} 
              className="h-10 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black uppercase text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
