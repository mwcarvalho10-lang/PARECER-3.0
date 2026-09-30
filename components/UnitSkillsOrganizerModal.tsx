'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  BookOpen,
  HelpCircle,
  Filter,
  CheckSquare,
  Square,
  ArrowUpDown,
  RotateCcw
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
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Grade skills sorted consistently by subject order then ID
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
    setTimeout(() => setShowSavedToast(false), 2200);
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
    setShowQuickMenu(false);
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(filteredSkills.map(s => s.id));
    const next = selectedIds.filter(id => !visibleIds.has(id));
    handleSave(next);
    setShowQuickMenu(false);
  };

  const handleClearUnit = () => {
    if (confirm(`Remover todas as habilidades planejadas para a etapa "${activeUnit}"?`)) {
      handleSave([]);
      setShowQuickMenu(false);
    }
  };

  const handleApplyDefaultDistribution = () => {
    if (confirm(`Deseja aplicar a sugestão de distribuição pedagógica oficial BNCC para todas as unidades do ${currentGrade}º Ano?\n\nIsso organizará as habilidades de forma equilibrada ao longo do ano letivo.`)) {
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
      setTimeout(() => setShowSavedToast(false), 2500);
      setShowQuickMenu(false);
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

  // Overall & by-subject statistics for active unit
  const totalGrade = gradeSkills.length;
  const selectedCount = selectedIds.length;
  const percent = totalGrade > 0 ? Math.round((selectedCount / totalGrade) * 100) : 0;

  const bySubject = useMemo(() => {
    return subjects.map(sub => {
      const subTotal = gradeSkills.filter(s => s.subject === sub.id).length;
      const subSelected = gradeSkills.filter(s => s.subject === sub.id && selectedIds.includes(s.id)).length;
      return {
        ...sub,
        total: subTotal,
        selected: subSelected
      };
    });
  }, [gradeSkills, selectedIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/50 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Main Island Chassis */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl h-[92vh] max-h-[900px] bg-slate-50/95 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_96px_-12px_rgba(15,23,42,0.35)] border border-white/60 flex flex-col overflow-hidden relative"
      >
        
        {/* ========================================================= */}
        {/* 1. TOP FLOATING ISLAND: Brand + Dynamic Unit Capsule + Quick Actions */}
        {/* ========================================================= */}
        <header className="p-4 sm:p-5 pb-2 shrink-0">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 p-2.5 sm:p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Left: Branding & Classroom Info */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight font-serif uppercase truncate">
                    Organizador Bimestral
                  </h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-900 text-white tracking-wider uppercase shrink-0">
                    {currentGrade}º ANO &quot;{currentLetter}&quot;
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{selectedCount} habilidades na {activeUnit}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Selecione as habilidades que serão o foco pedagógico de cada bimestre.
                </p>
              </div>
            </div>

            {/* Center: Dynamic Island Unit Navigator */}
            <div className="flex items-center justify-center">
              <div className="bg-slate-100/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/70 flex items-center gap-1 shadow-inner max-w-full overflow-x-auto">
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
                      className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 select-none shrink-0 ${
                        isCurrent
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 -translate-y-0.5'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      <span>{u}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                        isCurrent ? 'bg-emerald-400 text-slate-900 font-black' : 'bg-slate-200/80 text-slate-500'
                      }`}>
                        {unitCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Quick Tools & Close Island */}
            <div className="flex items-center gap-2 justify-end px-1">
              <button
                onClick={handleApplyDefaultDistribution}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95"
                title="Distribuir sugestão BNCC equilibrada pelas 4 unidades"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sugerir BNCC</span>
                <span className="sm:hidden">Sugerir</span>
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95"
                title="Fechar organizador (Esc)"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. FLOATING CONTROL ISLAND: Search, Subject Pills, Status & Tools */}
        {/* ========================================================= */}
        <div className="px-4 sm:px-5 pb-2 shrink-0">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            
            {/* Search Pill */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar código ou descrição..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-escola-azul focus:ring-2 focus:ring-escola-azul/20 transition-all placeholder:normal-case placeholder:font-normal"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 w-4 h-4 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Subject Selector Capsule */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas ({gradeSkills.length})
              </button>
              {subjects.map(s => {
                const subStat = bySubject.find(x => x.id === s.id);
                const isSelected = selectedSubject === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-escola-azul text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: subjectPalettes[s.id]?.[0] || '#0ea5e9' }} 
                    />
                    <span>{s.label}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      {subStat?.selected || 0}/{subStat?.total || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Pill Toggle & Batch Tools */}
            <div className="flex items-center gap-2 justify-between md:justify-end shrink-0">
              <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/70">
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
                  ✓ Planejadas ({selectedIds.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unselected')}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    statusFilter === 'unselected' ? 'bg-slate-800 text-white shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pendentes
                </button>
              </div>

              {/* Discrete Batch Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                  title="Ações em massa"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span className="hidden sm:inline">Ações</span>
                </button>

                {showQuickMenu && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-[11px] font-bold animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={handleSelectAllVisible}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Marcar visíveis ({filteredSkills.length})</span>
                    </button>
                    <button
                      onClick={handleDeselectAllVisible}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Desmarcar visíveis</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={handleClearUnit}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Limpar etapa atual</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Sync Indicator Ribbon (Subtle) */}
        <div className="px-5 py-1 flex items-center justify-between text-[10px] text-slate-400 font-bold shrink-0">
          <label className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAllLetters}
              onChange={e => setApplyToAllLetters(e.target.checked)}
              className="w-3 h-3 rounded text-escola-azul focus:ring-escola-azul accent-escola-azul"
            />
            <Copy className="w-3 h-3 text-slate-400" />
            <span>Sincronizar planejamento com todas as turmas do {currentGrade}º ano</span>
          </label>

          {showSavedToast && (
            <span className="text-emerald-700 font-black inline-flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Alterações salvas com sucesso
            </span>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. FLOATING CARDS CANVAS */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-2 space-y-2.5 bg-slate-50/60">
          {filteredSkills.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center bg-white/80 rounded-3xl border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-xs font-black uppercase text-slate-700">Nenhuma habilidade encontrada</h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Tente ajustar a pesquisa ou alterar o filtro de matéria ou status acima.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedSubject('all'); setStatusFilter('all'); }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pb-20">
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
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-400 ring-2 ring-emerald-500/15 shadow-sm'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{
                      borderLeftColor: skill.color || '#0ea5e9',
                      borderLeftWidth: '4px'
                    }}
                  >
                    {/* Card Top: Code + Subject Badge + Cross-unit Badge + Toggle */}
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
                          <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200" title={`Também trabalhada em: ${otherUnits.join(', ')}`}>
                            📌 {otherUnits.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Floating Checkbox Pip */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </motion.div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center" />
                        )}
                      </div>
                    </div>

                    {/* Skill Pedagogical Description */}
                    <p className={`text-[11px] sm:text-[12px] leading-relaxed transition-colors ${
                      isSelected ? 'text-slate-900 font-semibold' : 'text-slate-600 font-medium'
                    }`}>
                      {skill.report}
                    </p>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[9px]">
                      <span className="text-slate-400 font-medium truncate max-w-[200px]">
                        {skill.category || `${skill.grade}º Ano • BNCC`}
                      </span>
                      <span className={`font-bold transition-colors ${
                        isSelected ? 'text-emerald-700 font-black' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {isSelected ? '✓ Planejada no Bimestre' : '+ Adicionar ao Bimestre'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM FLOATING ISLAND DOCK: Progress + Primary CTA */}
        {/* ========================================================= */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2 px-5 sm:px-6 flex items-center justify-between gap-4 max-w-2xl w-full">
            
            {/* Live Progress Pill */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[11px] shrink-0">
                {percent}%
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 tracking-tight truncate">
                  {selectedCount} de {totalGrade} habilidades planejadas na {activeUnit}
                </p>
                <div className="w-32 sm:w-44 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Confirm & Close Button */}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase rounded-full transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Concluir</span>
            </button>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
