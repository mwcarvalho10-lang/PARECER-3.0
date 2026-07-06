import React, { useEffect } from 'react';
import { X, Delete } from 'lucide-react';

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

export function PinModal({ isOpen, targetGrade, targetLetter, isAdmin, currentPin, isError, onPinChange, onCancel }: PinModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support letters if it's admin pin (adm2026 is 7 chars)
      // Otherwise, only numbers up to 5 chars
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className={`bg-white rounded-3xl p-8 shadow-2xl w-full max-w-[340px] border border-slate-100 transition-all ${isError ? 'animate-shake ring-2 ring-red-500' : ''}`}>
        <div className="text-center mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {isAdmin ? 'Acesso Administrativo' : 'Acesso do Professor'}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
            {isAdmin ? 'Digite a senha do sistema' : (
              <>Turma <span className="text-escola-azul">{targetGrade}º {targetLetter}</span></>
            )}
          </p>
        </div>
        <div className="flex justify-center gap-2 mb-8">
          {dotsArray.map((i) => (
            <div key={i} className={`w-3 h-3 rounded-full border transition-all ${i < currentPin.length ? (isError ? 'bg-red-500 border-red-500 scale-125' : 'bg-escola-azul border-escola-azul scale-125') : 'border-slate-300'}`} />
          ))}
        </div>
        {!isAdmin && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => handlePress(num.toString())} className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 text-lg font-bold">
                {num}
              </button>
            ))}
            <button onClick={onCancel} className="h-14 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center">
              <X />
            </button>
            <button onClick={() => handlePress('0')} className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 text-lg font-bold">
              0
            </button>
            <button onClick={handleBackspace} className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400">
              <Delete />
            </button>
          </div>
        )}
        {isAdmin && (
          <div className="text-center">
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase">Use o teclado para digitar.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={onCancel} className="h-12 w-full rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center font-bold uppercase text-xs">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
