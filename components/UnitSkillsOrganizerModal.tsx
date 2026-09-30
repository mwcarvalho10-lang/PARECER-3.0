'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Sparkles, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  SlidersHorizontal,
  Target,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skill, ClassData, AppData } from '@/lib/types';
import { units, subjects, subjectPalettes } from '@/lib/constants';
import { 
  getPlannedSkillsForUnit, 
  getDefaultPlannedSkills, 
  getAllUnitsForSkill, 
  savePlannedSkillsInAppData 
} from '@/lib/curriculumUtils';

interface UnitSkillsOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrade: string;
  currentLetter: string;
  initialUnit: string;
  classData: ClassData;
  appData: AppData;
  globalSkills: Skill[];
  onUpdateAppData: (newAppData: AppData) => void;
  onSelectUnit?: (unit: string) => void;
}

export function UnitSkillsOrganizerModal({
  isOpen,
  onClose,
  currentGrade,
  currentLetter,
  initialUnit,
  classData,
  appData,
  globalSkills,
  onUpdateAppData,
  onSelectUnit
}: UnitSkillsOrganizerModalProps) {
  const [selectedUnitState, setSelectedUnitState] = useState<string | null>(null);
  const activeUnit = selectedUnitState ?? (initialUnit || units[0]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'selected' | 'unselected'>('all');
  const [applyToAllLetters, setApplyToAllLetters] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Grade skills sorted consistently
  const gradeSkills = useMemo(() => {
    return globalSkills
      .filter(s => String(s.grade) === String(currentGrade))
      .sort((a, b) => {
        const order = ['portugues', 'matematica', 'ciencias', 'historia'];
        const diff = order.indexOf(a.subject) - order.indexOf(b.subject);
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });
  }, [globalSkills, currentGrade]);

  // Current planned skills for the active unit
  const selectedIds = useMemo(() => {
    return getPlannedSkillsForUnit(classData, currentGrade, activeUnit, globalSkills);
  }, [classData, currentGrade, activeUnit, globalSkills]);

  // Save changes handler
  const handleSave = (newIds: string[], targetUnit = activeUnit, syncAll = applyToAllLetters) => {
    const updated = savePlannedSkillsInAppData(
      appData,
      currentGrade,
      currentLetter,
      targetUnit,
      newIds,
      syncAll
    );
    onUpdateAppData(updated);

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleToggleSkill = (skillId: string) => {
    const next = selectedIds.includes(skillId)
      ? selectedIds.filter(id => id !== skillId)
      : [...selectedIds, skillId];
    handleSave(next);
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredSkills.map(s => s.id);
    const next = Array.from(new Set([...selectedIds, ...visibleIds]));
    handleSave(next);
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(filteredSkills.map(s => s.id));
    const next = selectedIds.filter(id => !visibleIds.has(id));
    handleSave(next);
  };

  const handleClearUnit = () => {
    if (confirm(`Remover todas as habilidades planejadas para a etapa "${activeUnit}"?`)) {
      handleSave([]);
    }
  };

  const handleApplyDefaultDistribution = () => {
    if (confirm(`Deseja sugerir a distribuição pedagógica oficial BNCC para todas as unidades do ${currentGrade}º Ano?`)) {
      const defaults = getDefaultPlannedSkills(currentGrade, globalSkills);
      let updated = { ...appData };
      units.forEach(u => {
        updated = savePlannedSkillsInAppData(
          updated,
          currentGrade,
          currentLetter,
          u,
          defaults[u] || [],
          applyToAllLetters
        );
      });
      onUpdateAppData(updated);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }
  };

  // Filter skills
  const filteredSkills = gradeSkills.filter(skill => {
    if (selectedSubject !== 'all' && skill.subject !== selectedSubject) {
      return false;
    }

    const isSelected = selectedIds.includes(skill.id);
    if (statusFilter === 'selected' && !isSelected) return false;
    if (statusFilter === 'unselected' && isSelected) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = skill.id.toLowerCase().includes(q);
      const matchReport = skill.report.toLowerCase().includes(q);
      const matchCat = (skill.category || '').toLowerCase().includes(q);
      if (!matchId && !matchReport && !matchCat) return false;
    }

    return true;
  });

  // Subject statistics for active unit
  const totalGrade = gradeSkills.length;
  const selectedCount = selectedIds.length;
  const percent = totalGrade > 0 ? Math.round((selectedCount / totalGrade) * 100) : 0;

  const bySubject = subjects.map(sub => {
    const subTotal = gradeSkills.filter(s => s.subject === sub.id).length;
    const subSelected = gradeSkills.filter(s => s.subject === sub.id && selectedIds.includes(s.id)).length;
    return {
      ...sub,
      total: subTotal,
      selected: subSelected
    };
  });

  const stats = { totalGrade, selectedCount, percent, bySubject };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Main Floating Island Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl h-[88vh] bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_30px_90px_rgba(15,23,42,0.25)] border border-slate-200/90 flex flex-col overflow-hidden relative"
      >
        
        {/* Top Floating Island Header */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Classroom Pill */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight font-serif uppercase">
                    Organizador Bimestral de Habilidades
                  </h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white tracking-wider uppercase">
                    {currentGrade}º ANO &quot;{currentLetter}&quot;
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Planeje quais habilidades serão trabalhadas em cada unidade letiva.
                </p>
              </div>
            </div>

            {/* Floating Unit Navigation Capsule (Dynamic Island Style) */}
            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <div className="bg-slate-100/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-inner">
                {units.map(u => {
                  const isCurrent = activeUnit === u;
                  const unitCount = getPlannedSkillsForUnit(classData, currentGrade, u, globalSkills).length;
                  return (
                    <button
                      key={u}
                      onClick={() => {
                        setSelectedUnitState(u);
                        if (onSelectUnit) onSelectUnit(u);
                      }}
                      className={`relative px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 select-none ${
                        isCurrent
                          ? 'bg-escola-azul text-white shadow-md shadow-blue-600/25 -translate-y-0.5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span>{u}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                        isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                      }`}>
                        {unitCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0"
                title="Fechar organizador"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Floating Metrics & Action Ribbon */}
        <div className="px-6 py-2 shrink-0">
          <div className="bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
            
            {/* Live Progress Indicator */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {stats.selectedCount}
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  de {stats.totalGrade} habilidades planejadas na <strong>{activeUnit}</strong> ({stats.percent}%)
                </span>
              </div>

              <div className="w-28 bg-slate-200/70 h-2 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${stats.percent}%` }}
                />
              </div>

              {/* Mini Subject Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pl-2 border-l border-slate-200/70">
                {stats.bySubject.map(sub => (
                  <span
                    key={sub.id}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1 shadow-2xs"
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: subjectPalettes[sub.id]?.[0] || '#94a3b8' }} 
                    />
                    <span>{sub.label}:</span>
                    <strong className="text-slate-900">{sub.selected}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions & Sync Options */}
            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={applyToAllLetters}
                  onChange={e => setApplyToAllLetters(e.target.checked)}
                  className="w-3 h-3 rounded text-escola-azul focus:ring-escola-azul accent-escola-azul"
                />
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Aplicar a todas turmas ({currentGrade}º)</span>
              </label>

              <button
                onClick={handleApplyDefaultDistribution}
                className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition-all flex items-center gap-1 shadow-2xs hover:scale-105 active:scale-95"
                title="Distribuir sugestão BNCC equilibrada pelas 4 unidades"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Sugerir BNCC</span>
              </button>
            </div>

          </div>
        </div>

        {/* Floating Filter Island (Search + Subject Pills + View Switcher) */}
        <div className="px-6 py-2.5 shrink-0">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-xs">
            
            {/* Pill Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar código ou palavra-chave..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-escola-azul focus:ring-1 focus:ring-escola-azul/20 transition-all placeholder:normal-case"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Subject Selector Capsule */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas
              </button>
              {subjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                    selectedSubject === s.id
                      ? 'bg-escola-azul text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Status Segmented Pill */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todas ({filteredSkills.length})
              </button>
              <button
                onClick={() => setStatusFilter('selected')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  statusFilter === 'selected' ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Planejadas ({selectedIds.length})
              </button>
              <button
                onClick={() => setStatusFilter('unselected')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  statusFilter === 'unselected' ? 'bg-slate-800 text-white shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Não Planejadas
              </button>
            </div>

          </div>
        </div>

        {/* Minimalist Batch Links */}
        <div className="px-6 py-1 flex items-center justify-between text-[10px] text-slate-400 font-bold shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllVisible}
              className="text-slate-600 hover:text-escola-azul transition-colors uppercase font-bold"
            >
              ✓ Marcar visíveis ({filteredSkills.length})
            </button>
            <span>•</span>
            <button
              onClick={handleDeselectAllVisible}
              className="text-slate-600 hover:text-slate-900 transition-colors uppercase font-bold"
            >
              ✕ Desmarcar visíveis
            </button>
            <span>•</span>
            <button
              onClick={handleClearUnit}
              className="text-rose-500 hover:text-rose-700 transition-colors uppercase font-bold flex items-center gap-1"
            >
              <Trash2 className="w-2.5 h-2.5" /> Limpar etapa
            </button>
          </div>

          {showSavedToast && (
            <span className="text-emerald-700 font-black inline-flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sincronizado
            </span>
          )}
        </div>

        {/* Floating Cards Grid Area */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5 bg-slate-50/50">
          {filteredSkills.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-white/70 rounded-3xl border border-dashed border-slate-300">
              <span className="text-3xl mb-2">🎯</span>
              <h4 className="text-xs font-black uppercase text-slate-700">Nenhuma habilidade encontrada</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Ajuste os filtros de pesquisa, matéria ou status para visualizar outras habilidades.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredSkills.map(skill => {
                const isSelected = selectedIds.includes(skill.id);
                const otherUnits = getAllUnitsForSkill(classData, currentGrade, skill.id, globalSkills)
                  .filter(u => u !== activeUnit);

                return (
                  <motion.div
                    key={skill.id}
                    layout
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between gap-2 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-400 ring-2 ring-emerald-500/15 shadow-sm'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{
                      borderLeftColor: skill.color || '#0ea5e9',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0 shadow-xs" 
                          style={{ backgroundColor: skill.color || '#0ea5e9' }} 
                        />
                        <span className={`text-[11px] font-black font-mono tracking-wider ${
                          isSelected ? 'text-emerald-800' : 'text-slate-800'
                        }`}>
                          {skill.id}
                        </span>

                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {subjects.find(s => s.id === skill.subject)?.label || skill.subject}
                        </span>

                        {otherUnits.length > 0 && (
                          <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200">
                            Em: {otherUnits.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Floating Check Capsule */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 hover:border-slate-400 transition-colors flex items-center justify-center" />
                        )}
                      </div>
                    </div>

                    <p className={`text-[11px] leading-relaxed transition-colors line-clamp-3 ${
                      isSelected ? 'text-slate-900 font-semibold' : 'text-slate-600 font-medium'
                    }`}>
                      {skill.report}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[9px]">
                      <span className="text-slate-400 font-medium truncate max-w-[200px]">
                        {skill.category || `${skill.grade}º Ano • BNCC`}
                      </span>
                      <span className={`font-bold transition-colors ${
                        isSelected ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {isSelected ? '✓ Planejada nesta etapa' : '+ Incluir no bimestre'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Floating Island Action Dock */}
        <div className="p-4 px-6 bg-white/90 backdrop-blur-md border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Habilidades selecionadas: <strong className="text-slate-900 font-black">{stats.selectedCount}</strong> na {activeUnit}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" /> Concluir e Voltar
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
