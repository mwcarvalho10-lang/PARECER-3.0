'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Users, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Eye, 
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';

interface ClassDiagnosisProps {
  currentGrade: string;
  currentLetter: string;
  classData: ClassData;
  globalSkills: Skill[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  onSelectStudent?: (studentName: string) => void;
}

export function ClassDiagnosis({
  currentGrade,
  currentLetter,
  classData,
  globalSkills,
  selectedUnit,
  onSelectUnit,
  onSelectStudent
}: ClassDiagnosisProps) {
  const [subTab, setSubTab] = useState<'heatmap' | 'barema'>('heatmap');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'reforco' | 'desenvolvimento' | 'consolidada'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  // Barema state
  const [baremaMode, setBaremaMode] = useState<'filled' | 'blank'>('filled');
  const [selectedBaremaSkills, setSelectedBaremaSkills] = useState<string[]>([]);
  const [baremaSubjectFilter, setBaremaSubjectFilter] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Active students
  const activeStudents = useMemo(() => {
    return (classData.students || []).filter(s => classData[s]?.active !== false).sort();
  }, [classData]);

  // Skills filtered by grade
  const gradeSkills = useMemo(() => {
    return globalSkills.filter(s => String(s.grade) === String(currentGrade));
  }, [globalSkills, currentGrade]);

  // Initialize Barema selected skills if empty
  React.useEffect(() => {
    if (selectedBaremaSkills.length === 0 && gradeSkills.length > 0) {
      // Default to first 8-10 skills
      const initialSkills = gradeSkills.slice(0, 10).map(s => s.id);
      setSelectedBaremaSkills(initialSkills);
    }
  }, [gradeSkills, selectedBaremaSkills.length]);

  // Heatmap analytics calculation
  const skillsAnalysis = useMemo(() => {
    const totalActive = activeStudents.length;

    return gradeSkills.map(skill => {
      const masteredStudents = activeStudents.filter(studentName => {
        const studentUnitData = classData[studentName]?.[selectedUnit];
        return studentUnitData?.skills?.includes(skill.id);
      });

      const count = masteredStudents.length;
      const rate = totalActive > 0 ? (count / totalActive) * 100 : 0;

      let status: 'consolidada' | 'desenvolvimento' | 'reforco';
      if (rate >= 70) {
        status = 'consolidada';
      } else if (rate >= 50) {
        status = 'desenvolvimento';
      } else {
        status = 'reforco';
      }

      const pendingStudents = activeStudents.filter(s => !masteredStudents.includes(s));

      return {
        ...skill,
        masteredCount: count,
        totalStudents: totalActive,
        rate: Math.round(rate),
        status,
        masteredStudents,
        pendingStudents
      };
    });
  }, [gradeSkills, activeStudents, classData, selectedUnit]);

  // Filtered skills for Heatmap
  const filteredAnalysis = useMemo(() => {
    return skillsAnalysis.filter(item => {
      // Subject filter
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) {
        return false;
      }
      // Mastery status filter
      if (masteryFilter !== 'all' && item.status !== masteryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(query);
        const matchReport = item.report.toLowerCase().includes(query);
        const matchCat = item.category?.toLowerCase().includes(query);
        if (!matchId && !matchReport && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [skillsAnalysis, subjectFilter, masteryFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSkills = skillsAnalysis.length;
    const consolidadas = skillsAnalysis.filter(s => s.status === 'consolidada').length;
    const emDesenvolvimento = skillsAnalysis.filter(s => s.status === 'desenvolvimento').length;
    const reforcoColetivo = skillsAnalysis.filter(s => s.status === 'reforco').length;

    const totalRates = skillsAnalysis.reduce((acc, curr) => acc + curr.rate, 0);
    const avgMastery = totalSkills > 0 ? Math.round(totalRates / totalSkills) : 0;

    return {
      totalSkills,
      consolidadas,
      emDesenvolvimento,
      reforcoColetivo,
      avgMastery
    };
  }, [skillsAnalysis]);

  // Barema skills list for selection
  const baremaAvailableSkills = useMemo(() => {
    return gradeSkills.filter(s => {
      if (baremaSubjectFilter !== 'all' && s.subject !== baremaSubjectFilter) {
        return false;
      }
      return true;
    });
  }, [gradeSkills, baremaSubjectFilter]);

  const toggleBaremaSkill = (skillId: string) => {
    setSelectedBaremaSkills(prev => 
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const selectAllCurrentBarema = () => {
    const idsToAdd = baremaAvailableSkills.map(s => s.id);
    setSelectedBaremaSkills(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const clearCurrentBarema = () => {
    const idsToRemove = new Set(baremaAvailableSkills.map(s => s.id));
    setSelectedBaremaSkills(prev => prev.filter(id => !idsToRemove.has(id)));
  };

  const selectReforcoForBarema = () => {
    const reforcoIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
    setSelectedBaremaSkills(reforcoIds);
  };

  // Full Barema selected skills objects
  const baremaSelectedObjects = useMemo(() => {
    return selectedBaremaSkills
      .map(id => globalSkills.find(s => s.id === id))
      .filter((s): s is Skill => Boolean(s));
  }, [selectedBaremaSkills, globalSkills]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Top Bar for Diagnosis Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight font-serif">
              Diagnóstico Pedagógico da Turma
            </h2>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-escola-azul uppercase">
              {currentGrade}º ANO {currentLetter}
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            Acompanhamento coletivo de consolidação de habilidades e geração de baremas para sondagem
          </p>
        </div>

        {/* View Switcher: Mapa de Calor vs Barema */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setSubTab('heatmap')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                subTab === 'heatmap'
                  ? 'bg-white text-escola-azul shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Mapa de Calor</span>
            </button>
            <button
              onClick={() => setSubTab('barema')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                subTab === 'barema'
                  ? 'bg-white text-escola-azul shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Gerador de Barema</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Unit Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Unidade Letiva:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {units.map(u => {
                const isSelected = selectedUnit === u;
                return (
                  <button
                    key={u}
                    onClick={() => onSelectUnit(u)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                      isSelected
                        ? 'bg-escola-azul text-white shadow-sm ring-2 ring-blue-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{activeStudents.length}</strong> alunos ativos avaliados
            </span>
          </div>
        </div>

        {/* SUBTAB 1: MAPA DE CALOR */}
        {subTab === 'heatmap' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Média de Consolidação
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800">{metrics.avgMastery}%</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metrics.avgMastery}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    Consolidadas (≥ 70%)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">
                    {metrics.consolidadas}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Habilidades dominadas pela maioria
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">
                    Em Desenvolvimento
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-600">
                    {metrics.emDesenvolvimento}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    50% a 69% dos alunos dominam
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    Reforço Coletivo (&lt; 50%)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-rose-600">
                    {metrics.reforcoColetivo}
                  </div>
                  <p className="text-[10px] font-bold text-rose-500 mt-1">
                    Necessitam de intervenção coletiva
                  </p>
                </div>
              </div>
            </div>

            {/* Heatmap Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar código BNCC ou palavra-chave..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-escola-azul focus:bg-white transition-all uppercase placeholder:normal-case"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Subject filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setSubjectFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                      subjectFilter === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas as Matérias
                  </button>
                  {subjects.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSubjectFilter(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                        subjectFilter === sub.id
                          ? 'bg-escola-azul text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status pill filter */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Nível de Domínio:
                </span>
                <button
                  onClick={() => setMasteryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    masteryFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({skillsAnalysis.length})
                </button>
                <button
                  onClick={() => setMasteryFilter('reforco')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    masteryFilter === 'reforco'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  🔴 Reforço Coletivo ({metrics.reforcoColetivo})
                </button>
                <button
                  onClick={() => setMasteryFilter('desenvolvimento')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    masteryFilter === 'desenvolvimento'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  🟡 Em Desenvolvimento ({metrics.emDesenvolvimento})
                </button>
                <button
                  onClick={() => setMasteryFilter('consolidada')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    masteryFilter === 'consolidada'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  🟢 Consolidada ({metrics.consolidadas})
                </button>
              </div>
            </div>

            {/* Heatmap Cards Grid */}
            <div className="space-y-3">
              {filteredAnalysis.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-2">🔍</span>
                  <h4 className="text-sm font-black uppercase text-slate-700">
                    Nenhuma habilidade encontrada
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Tente ajustar os filtros de disciplina, nível de domínio ou o termo de busca.
                  </p>
                </div>
              ) : (
                filteredAnalysis.map((item) => {
                  const isExpanded = expandedSkillId === item.id;
                  
                  // Heat gradient & styles based on rate
                  let heatBg = 'bg-emerald-500';
                  let heatBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  let labelText = 'Consolidada';
                  if (item.status === 'desenvolvimento') {
                    heatBg = 'bg-amber-500';
                    heatBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                    labelText = 'Em Desenvolvimento';
                  } else if (item.status === 'reforco') {
                    heatBg = 'bg-rose-500';
                    heatBadge = 'bg-rose-100 text-rose-800 border-rose-300';
                    labelText = 'Reforço Coletivo';
                  }

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                        item.status === 'reforco' ? 'border-rose-200' : 'border-slate-200'
                      }`}
                    >
                      <div 
                        onClick={() => setExpandedSkillId(isExpanded ? null : item.id)}
                        className="p-4 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: item.color || '#0ea5e9' }}
                            />
                            <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-800">
                              {item.id}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {subjects.find(s => s.id === item.subject)?.label || item.subject}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${heatBadge}`}>
                              {labelText}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-sm font-black text-slate-800 tabular-nums">
                                {item.rate}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                {item.masteredCount} de {item.totalStudents} alunos
                              </span>
                            </div>
                            <button className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Progress heat-bar */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${heatBg}`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.report}
                        </p>
                      </div>

                      {/* Expandable details: Mastered vs Pending Students */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4 text-xs"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Alunos que precisam de reforço */}
                              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-black text-rose-600 uppercase flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Necessitam de Reforço ({item.pendingStudents.length})
                                  </span>
                                </div>
                                {item.pendingStudents.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">
                                    🎉 Todos os alunos da turma consolidaram esta habilidade!
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                                    {item.pendingStudents.map(studentName => (
                                      <button
                                        key={studentName}
                                        onClick={() => onSelectStudent && onSelectStudent(studentName)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                                        title="Clique para ir ao perfil do aluno"
                                      >
                                        <span>•</span> {studentName}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Alunos que consolidaram */}
                              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-black text-emerald-600 uppercase flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Habilidade Consolidada ({item.masteredStudents.length})
                                  </span>
                                </div>
                                {item.masteredStudents.length === 0 ? (
                                  <p className="text-slate-400 italic text-[11px]">
                                    Nenhum aluno atingiu esta habilidade ainda nesta unidade.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                                    {item.masteredStudents.map(studentName => (
                                      <span
                                        key={studentName}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase"
                                      >
                                        ✓ {studentName}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Pedagogical intervention advice */}
                            {item.status === 'reforco' && (
                              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-900 text-[11px]">
                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong>Sugestão Pedagógica para a Turma:</strong> Esta habilidade está com taxa de domínio inferior a 50%. Recomenda-se realizar uma retomada coletiva com metodologias ativas, jogos pedagógicos em pequenos grupos ou atividades de reforço paralelas antes do encerramento da unidade.
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: GERADOR DE BAREMA */}
        {subTab === 'barema' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Control Panel for Barema */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-escola-azul" />
                    Matriz de Habilidades (Barema Avaliativo)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecione as habilidades prioritárias que a turma deve alcançar na <strong>{selectedUnit}</strong> e gere o barema completo para impressão.
                  </p>
                </div>

                {/* Actions: Print & Mode */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      onClick={() => setBaremaMode('filled')}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                        baremaMode === 'filled'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Preenchido
                    </button>
                    <button
                      onClick={() => setBaremaMode('blank')}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                        baremaMode === 'blank'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Em Branco (Para Sala)
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={selectedBaremaSkills.length === 0}
                    className="px-4 py-2 bg-escola-azul text-white text-xs font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Barema</span>
                  </button>
                </div>
              </div>

              {/* Skill Selection Box */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase">
                      Habilidades Selecionadas:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-escola-azul text-xs font-black">
                      {selectedBaremaSkills.length} de {gradeSkills.length}
                    </span>
                  </div>

                  {/* Filter by subject and bulk toggles */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      value={baremaSubjectFilter}
                      onChange={e => setBaremaSubjectFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none uppercase"
                    >
                      <option value="all">Todas as Matérias</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={selectAllCurrentBarema}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Selecionar Todas
                    </button>
                    <button
                      onClick={clearCurrentBarema}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={selectReforcoForBarema}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Carregar Reforço
                    </button>
                  </div>
                </div>

                {/* Chips of selectable skills */}
                <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {baremaAvailableSkills.map(s => {
                    const isSelected = selectedBaremaSkills.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleBaremaSkill(s.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2 ${
                          isSelected
                            ? 'bg-white border-escola-azul ring-1 ring-escola-azul/30 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white text-slate-500'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-escola-azul shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className={`block font-black font-mono uppercase text-[11px] ${isSelected ? 'text-escola-azul' : 'text-slate-600'}`}>
                            {s.id}
                          </span>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {s.report}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Barema Table Preview */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Prévia do Barema ({baremaMode === 'filled' ? 'Preenchido' : 'Em Branco'})
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-bold">
                  {activeStudents.length} Estudantes × {selectedBaremaSkills.length} Habilidades
                </div>
              </div>

              {selectedBaremaSkills.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-sm font-bold uppercase">Selecione pelo menos uma habilidade acima para gerar o barema.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black border-b border-slate-200">
                        <th className="py-3 px-4 w-10 text-center border-r border-slate-200">Nº</th>
                        <th className="py-3 px-4 min-w-[200px] border-r border-slate-200">Estudante</th>
                        {baremaSelectedObjects.map((s, idx) => (
                          <th 
                            key={s.id} 
                            className="py-3 px-2 text-center border-r border-slate-200 min-w-[70px]"
                            title={s.report}
                          >
                            <span className="block font-mono text-[10px]">{s.id}</span>
                            <span className="text-[8px] text-slate-400 font-normal">H{idx + 1}</span>
                          </th>
                        ))}
                        {baremaMode === 'filled' && (
                          <>
                            <th className="py-3 px-3 text-center border-r border-slate-200 bg-blue-50/60 text-escola-azul min-w-[70px]">
                              Total
                            </th>
                            <th className="py-3 px-3 text-center bg-blue-50/60 text-escola-azul min-w-[65px]">
                              %
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {activeStudents.map((studentName, sIdx) => {
                        const studentUnitData = classData[studentName]?.[selectedUnit];
                        const masteredSkills = studentUnitData?.skills || [];
                        
                        let studentMasteredCount = 0;

                        return (
                          <tr key={studentName} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-100 text-[11px] font-mono">
                              {String(sIdx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-800 uppercase border-r border-slate-100 truncate max-w-[220px]">
                              {studentName}
                            </td>

                            {baremaSelectedObjects.map(s => {
                              const isMastered = masteredSkills.includes(s.id);
                              if (isMastered) studentMasteredCount++;

                              return (
                                <td 
                                  key={s.id} 
                                  className="py-2.5 px-2 text-center border-r border-slate-100"
                                >
                                  {baremaMode === 'filled' ? (
                                    isMastered ? (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300 font-black text-xs">
                                        ○
                                      </span>
                                    )
                                  ) : (
                                    <div className="w-4 h-4 mx-auto border-2 border-slate-300 rounded" />
                                  )}
                                </td>
                              );
                            })}

                            {baremaMode === 'filled' && (
                              <>
                                <td className="py-2.5 px-3 text-center border-r border-slate-100 font-black text-slate-800 bg-slate-50/50">
                                  {studentMasteredCount} / {baremaSelectedObjects.length}
                                </td>
                                <td className="py-2.5 px-3 text-center font-black text-escola-azul bg-slate-50/50">
                                  {Math.round((studentMasteredCount / (baremaSelectedObjects.length || 1)) * 100)}%
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    {baremaMode === 'filled' && (
                      <tfoot>
                        <tr className="bg-slate-100 font-black text-slate-800 border-t-2 border-slate-300 text-[10px] uppercase">
                          <td colSpan={2} className="py-3 px-4 text-right border-r border-slate-200">
                            Total Alunos que Atingiram:
                          </td>
                          {baremaSelectedObjects.map(s => {
                            const totalMastered = activeStudents.filter(name => 
                              classData[name]?.[selectedUnit]?.skills?.includes(s.id)
                            ).length;
                            const pct = Math.round((totalMastered / (activeStudents.length || 1)) * 100);

                            return (
                              <td key={s.id} className="py-3 px-2 text-center border-r border-slate-200">
                                <span className="block text-xs font-mono">{totalMastered}</span>
                                <span className="text-[9px] text-slate-500 font-bold">{pct}%</span>
                              </td>
                            );
                          })}
                          <td colSpan={2} className="py-3 px-3 text-center bg-blue-100/60 text-escola-azul">
                            Média da Turma
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* Legend Section */}
            {baremaSelectedObjects.length > 0 && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                  Legenda das Habilidades do Barema:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {baremaSelectedObjects.map((s, idx) => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-escola-azul font-mono font-black text-[11px] shrink-0">
                        H{idx + 1}: {s.id}
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {s.report}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRINT PREVIEW MODAL / DIALOG */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-escola-azul" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão do Barema Pedagógico
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 bg-escola-azul hover:bg-blue-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Printable Document Sheet View */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div id="printable-barema" className="bg-white p-8 max-w-4xl w-full shadow-lg border border-slate-200 rounded-lg text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
                {/* Official School Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5 text-center">
                  <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 font-serif">
                    ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
                  </h1>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-1">
                    BAREMA PEDAGÓGICO DE ACOMPANHAMENTO DE HABILIDADES
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-[11px] font-bold text-left">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Ano / Turma:</span>
                      <span>{currentGrade}º ANO &quot;{currentLetter}&quot;</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Unidade:</span>
                      <span>{selectedUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Ano Letivo:</span>
                      <span>2026</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Emissão:</span>
                      <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-[10px] border-collapse border border-slate-400 mb-6">
                  <thead>
                    <tr className="bg-slate-100 font-black border-b border-slate-400 text-slate-800">
                      <th className="border border-slate-400 py-1.5 px-2 text-center w-8">Nº</th>
                      <th className="border border-slate-400 py-1.5 px-3 text-left">Nome do Estudante</th>
                      {baremaSelectedObjects.map((s, idx) => (
                        <th key={s.id} className="border border-slate-400 py-1.5 px-1 text-center font-mono">
                          H{idx + 1}
                        </th>
                      ))}
                      {baremaMode === 'filled' && (
                        <>
                          <th className="border border-slate-400 py-1.5 px-1 text-center w-12">Total</th>
                          <th className="border border-slate-400 py-1.5 px-1 text-center w-12">%</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeStudents.map((studentName, sIdx) => {
                      const studentUnitData = classData[studentName]?.[selectedUnit];
                      const masteredSkills = studentUnitData?.skills || [];
                      let count = 0;

                      return (
                        <tr key={studentName} className="border-b border-slate-300">
                          <td className="border border-slate-300 py-1 px-1 text-center font-mono text-[9px]">
                            {String(sIdx + 1).padStart(2, '0')}
                          </td>
                          <td className="border border-slate-300 py-1 px-2 uppercase font-semibold truncate max-w-[200px]">
                            {studentName}
                          </td>
                          {baremaSelectedObjects.map(s => {
                            const isMastered = masteredSkills.includes(s.id);
                            if (isMastered) count++;

                            return (
                              <td key={s.id} className="border border-slate-300 py-1 px-1 text-center font-bold">
                                {baremaMode === 'filled' ? (
                                  isMastered ? '✓' : '—'
                                ) : (
                                  '[  ]'
                                )}
                              </td>
                            );
                          })}
                          {baremaMode === 'filled' && (
                            <>
                              <td className="border border-slate-300 py-1 px-1 text-center font-bold">
                                {count}
                              </td>
                              <td className="border border-slate-300 py-1 px-1 text-center font-bold">
                                {Math.round((count / (baremaSelectedObjects.length || 1)) * 100)}%
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  {baremaMode === 'filled' && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-[9px]">
                        <td colSpan={2} className="border border-slate-400 py-1.5 px-2 text-right">
                          Total da Turma:
                        </td>
                        {baremaSelectedObjects.map(s => {
                          const total = activeStudents.filter(name => 
                            classData[name]?.[selectedUnit]?.skills?.includes(s.id)
                          ).length;
                          return (
                            <td key={s.id} className="border border-slate-400 py-1.5 px-1 text-center font-mono font-bold">
                              {total}
                            </td>
                          );
                        })}
                        <td colSpan={2} className="border border-slate-400 py-1.5 px-1 text-center">
                          —
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Legend in print */}
                <div className="border border-slate-300 p-3 rounded text-[9px] mb-8 bg-slate-50/50">
                  <strong className="block uppercase tracking-wider mb-1 text-slate-800">
                    Discriminação das Habilidades Avaliadas:
                  </strong>
                  <div className="grid grid-cols-2 gap-2">
                    {baremaSelectedObjects.map((s, idx) => (
                      <div key={s.id} className="leading-snug">
                        <strong>H{idx + 1} ({s.id}):</strong> {s.report}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 mt-4 text-center text-[10px]">
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Professor(a) Regente
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Coordenação Pedagógica
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
