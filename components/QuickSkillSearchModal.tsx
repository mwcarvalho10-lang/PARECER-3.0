'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, Plus, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Skill, StudentData } from '@/lib/types';
import { subjects } from '@/lib/constants';

interface QuickSkillSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSkills: Skill[];
  currentGrade: string;
  selectedStudent: string;
  selectedUnit: string;
  currentStudentData?: StudentData;
  onToggleSkill: (skillId: string) => void;
}

export function QuickSkillSearchModal({
  isOpen,
  onClose,
  globalSkills,
  currentGrade,
  selectedStudent,
  selectedUnit,
  currentStudentData,
  onToggleSkill
}: QuickSkillSearchModalProps) {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Skills filtered by grade and query
  const gradeSkills = useMemo(() => {
    return globalSkills.filter(s => String(s.grade) === String(currentGrade));
  }, [globalSkills, currentGrade]);

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gradeSkills.filter(s => {
      if (subjectFilter !== 'all' && s.subject !== subjectFilter) {
        return false;
      }
      if (!q) return true;
      const matchId = s.id.toLowerCase().includes(q);
      const matchReport = s.report.toLowerCase().includes(q);
      const matchCat = s.category?.toLowerCase().includes(q);
      return matchId || matchReport || matchCat;
    });
  }, [gradeSkills, query, subjectFilter]);

  if (!isOpen) return null;

  const currentSkillsSet = new Set(currentStudentData?.skills || []);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header / Search input */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-escola-azul shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquise por código BNCC ou palavra-chave (ex: leitura, adição, fonemas)..."
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
          />
          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 rounded">
              ESC
            </kbd>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar by Subject */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${
                subjectFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({gradeSkills.length})
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSubjectFilter(s.id)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  subjectFilter === s.id
                    ? 'bg-escola-azul text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="text-[10px] font-bold text-slate-400 shrink-0">
            Marcando para: <span className="text-escola-azul font-black uppercase">{selectedStudent || 'Nenhum'}</span> ({selectedUnit})
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/60">
          {filteredSkills.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs font-bold uppercase">Nenhuma habilidade correspondente.</p>
              <p className="text-[11px] text-slate-400 mt-1">Tente pesquisar outro termo ou selecione outra disciplina.</p>
            </div>
          ) : (
            filteredSkills.map(skill => {
              const isMarked = currentSkillsSet.has(skill.id);
              const subjectInfo = subjects.find(sub => sub.id === skill.subject);

              return (
                <div
                  key={skill.id}
                  onClick={() => onToggleSkill(skill.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
                    isMarked
                      ? 'bg-emerald-50/90 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: skill.color || '#0ea5e9' }}
                      />
                      <span className={`font-mono text-xs font-black uppercase ${isMarked ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {skill.id}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {subjectInfo?.label || skill.subject}
                      </span>
                      {skill.category && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          • {skill.category}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${isMarked ? 'text-emerald-950 font-semibold' : 'text-slate-600'}`}>
                      {skill.report}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSkill(skill.id);
                    }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 shadow-xs ${
                      isMarked
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-slate-100 hover:bg-escola-azul hover:text-white text-slate-700'
                    }`}
                  >
                    {isMarked ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Marcada</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Marcar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Mostrando <strong>{filteredSkills.length}</strong> habilidades disponíveis para o <strong>{currentGrade}º Ano</strong>
          </span>
          <span className="text-[10px] text-slate-400">
            Dica: Use <strong>Ctrl + K</strong> a qualquer momento para abrir esta busca.
          </span>
        </div>
      </div>
    </div>
  );
}
