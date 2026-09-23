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
  ArrowRight,
  TrendingUp,
  Compass,
  Lightbulb,
  HeartHandshake,
  Download,
  BookOpen,
  Calendar,
  Layers,
  Leaf,
  GraduationCap,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';
import { SchoolLogo } from './SchoolLogo';

interface ClassDiagnosisProps {
  currentGrade: string;
  currentLetter: string;
  classData: ClassData;
  globalSkills: Skill[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  onSelectStudent?: (studentName: string) => void;
}

type DiagnosisViewMode = 'heatmap' | 'students' | 'barema' | 'timeline' | 'intervention';

export function ClassDiagnosis({
  currentGrade,
  currentLetter,
  classData,
  globalSkills,
  selectedUnit,
  onSelectUnit,
  onSelectStudent
}: ClassDiagnosisProps) {
  // Navigation tabs in Diagnosis
  const [subTab, setSubTab] = useState<DiagnosisViewMode>('heatmap');
  
  // Heatmap filters
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'reforco' | 'desenvolvimento' | 'consolidada'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  // Students Table view state
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentPerformanceFilter, setStudentPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'aee'>('all');

  // Barema state
  const [baremaMode, setBaremaMode] = useState<'filled' | 'blank'>('filled');
  const [selectedBaremaSkills, setSelectedBaremaSkills] = useState<string[]>([]);
  const [baremaSubjectFilter, setBaremaSubjectFilter] = useState<string>('all');
  const [isPrintBaremaOpen, setIsPrintBaremaOpen] = useState(false);

  // Timeline / Individual Evolution state
  const [timelineStudent, setTimelineStudent] = useState<string>('');
  const [isPrintTimelineOpen, setIsPrintTimelineOpen] = useState(false);

  // Intervention Plan state
  const [selectedInterventionSkills, setSelectedInterventionSkills] = useState<string[]>([]);
  const [isPrintInterventionOpen, setIsPrintInterventionOpen] = useState(false);

  // Active students
  const activeStudents = useMemo(() => {
    return (classData.students || []).filter(s => classData[s]?.active !== false).sort();
  }, [classData]);

  // Set default timeline student
  React.useEffect(() => {
    if (!timelineStudent && activeStudents.length > 0) {
      setTimelineStudent(activeStudents[0]);
    }
  }, [activeStudents, timelineStudent]);

  // Skills filtered by grade
  const gradeSkills = useMemo(() => {
    return globalSkills.filter(s => String(s.grade) === String(currentGrade));
  }, [globalSkills, currentGrade]);

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

  // Initialize Barema and Intervention skills
  React.useEffect(() => {
    if (selectedBaremaSkills.length === 0 && gradeSkills.length > 0) {
      setSelectedBaremaSkills(gradeSkills.slice(0, 10).map(s => s.id));
    }
    const alertIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
    if (alertIds.length > 0 && selectedInterventionSkills.length === 0) {
      setSelectedInterventionSkills(alertIds);
    }
  }, [gradeSkills, skillsAnalysis, selectedBaremaSkills.length, selectedInterventionSkills.length]);

  // Filtered skills for Heatmap
  const filteredAnalysis = useMemo(() => {
    return skillsAnalysis.filter(item => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) {
        return false;
      }
      if (masteryFilter !== 'all' && item.status !== masteryFilter) {
        return false;
      }
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

  // Student summary metrics for "Quadro Geral dos Alunos"
  const studentsSummaryList = useMemo(() => {
    const totalGrade = gradeSkills.length || 1;

    return activeStudents.map(studentName => {
      const studentUnitData = classData[studentName]?.[selectedUnit];
      const masteredList = studentUnitData?.skills || [];
      const masteredCount = masteredList.length;
      const rate = Math.round((masteredCount / totalGrade) * 100);
      const isAee = Boolean(classData[studentName]?.isAee);
      const aeeType = classData[studentName]?.aeeType || '';
      const hasObservation = Boolean(studentUnitData?.observation?.trim());

      let level: 'high' | 'medium' | 'low' = 'low';
      if (rate >= 70) level = 'high';
      else if (rate >= 40) level = 'medium';

      return {
        name: studentName,
        masteredCount,
        pendingCount: Math.max(0, totalGrade - masteredCount),
        rate,
        level,
        isAee,
        aeeType,
        hasObservation
      };
    });
  }, [activeStudents, classData, selectedUnit, gradeSkills]);

  // Filtered students for "Quadro Geral dos Alunos"
  const filteredStudentsSummary = useMemo(() => {
    return studentsSummaryList.filter(item => {
      if (studentSearchQuery.trim()) {
        const query = studentSearchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query)) return false;
      }
      if (studentPerformanceFilter === 'high' && item.level !== 'high') return false;
      if (studentPerformanceFilter === 'medium' && item.level !== 'medium') return false;
      if (studentPerformanceFilter === 'low' && item.level !== 'low') return false;
      if (studentPerformanceFilter === 'aee' && !item.isAee) return false;
      return true;
    });
  }, [studentsSummaryList, studentSearchQuery, studentPerformanceFilter]);

  // Barema selected skills objects
  const baremaSelectedObjects = useMemo(() => {
    return selectedBaremaSkills
      .map(id => globalSkills.find(s => s.id === id))
      .filter((s): s is Skill => Boolean(s));
  }, [selectedBaremaSkills, globalSkills]);

  // Timeline Data for Selected Student
  const studentTimelineData = useMemo(() => {
    if (!timelineStudent || !classData[timelineStudent]) return [];

    let accumulatedSkills = new Set<string>();

    return units.map((u) => {
      const unitData = classData[timelineStudent]?.[u];
      const unitSkills = unitData?.skills || [];
      
      const newInUnit = unitSkills.filter((s: string) => !accumulatedSkills.has(s));
      unitSkills.forEach((s: string) => accumulatedSkills.add(s));

      const count = unitSkills.length;
      const totalGrade = gradeSkills.length || 1;
      const percentage = Math.round((count / totalGrade) * 100);

      return {
        unit: u,
        count,
        percentage,
        newCount: newInUnit.length,
        hasNotes: Boolean(unitData?.observation?.trim()),
        unitSkills
      };
    });
  }, [timelineStudent, classData, gradeSkills]);

  // Timeline student learning jump
  const timelineJump = useMemo(() => {
    if (!studentTimelineData.length) return { initial: 0, current: 0, diff: 0, pctJump: 0 };
    const initial = studentTimelineData[0]?.count || 0;
    const current = studentTimelineData[studentTimelineData.length - 1]?.count || 0;
    const diff = current - initial;
    const total = gradeSkills.length || 1;
    const pctJump = Math.round((diff / total) * 100);
    return { initial, current, diff, pctJump };
  }, [studentTimelineData, gradeSkills]);

  // Intervention Plan Items
  const interventionItems = useMemo(() => {
    return selectedInterventionSkills.map(id => {
      const skill = globalSkills.find(s => s.id === id);
      const analysis = skillsAnalysis.find(s => s.id === id);
      const pending = analysis?.pendingStudents || [];
      const rate = analysis?.rate || 0;

      let methodology = 'Rotação por estações com desafios práticos em duplas e tutoria entre pares.';
      let activity = 'Elaboração de painel ilustrado e jogos de correspondência em sala de aula.';
      let resources = 'Fichas ilustradas, cartões de pareamento e material lúdico.';

      if (skill?.subject === 'portugues') {
        methodology = 'Ateliê de Leitura e Escrita com cantinhos de alfabetização e mediação fônica.';
        activity = 'Trilha de palavras e rimas, banco de letras móveis e leitura compartilhada guiada.';
        resources = 'Alfabeto móvel, cartazes com cantigas, fichas de palavras e acervo ilustrado.';
      } else if (skill?.subject === 'matematica') {
        methodology = 'Matemática Concreta: exploração investigativa antes da formalização no caderno.';
        activity = 'Resolução de problemas do cotidiano utilizando tampinhas, ábaco e material dourado.';
        resources = 'Material Dourado, cédulas didáticas, reta numérica no piso e jogos de cálculo.';
      } else if (skill?.subject === 'ciencias') {
        methodology = 'Investigação Científica e observação da natureza e árvores do pátio escolar.';
        activity = 'Registro fotográfico/desenho de experimentos e comparação de hipóteses em roda.';
        resources = 'Lupas, amostras naturais de folhas e sementes, fichas sensoriais.';
      }

      return {
        id,
        skill,
        rate,
        pending,
        methodology,
        activity,
        resources
      };
    });
  }, [selectedInterventionSkills, globalSkills, skillsAnalysis]);

  // View Menu Items Configuration
  const menuItems = [
    {
      id: 'heatmap' as DiagnosisViewMode,
      label: 'Mapa de Calor BNCC',
      shortLabel: 'Mapa de Calor',
      badge: `${metrics.avgMastery}% consolidado`,
      icon: <BarChart3 className="w-4 h-4 text-sky-600" />,
      color: 'border-sky-500 text-sky-700 bg-sky-50/60',
      description: 'Taxa global de domínio e habilidades em alerta da turma'
    },
    {
      id: 'students' as DiagnosisViewMode,
      label: 'Quadro Geral dos Alunos',
      shortLabel: 'Quadro da Turma',
      badge: `${activeStudents.length} estudantes`,
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      color: 'border-emerald-500 text-emerald-700 bg-emerald-50/60',
      description: 'Tabela comparativa do desempenho individual e AEE'
    },
    {
      id: 'barema' as DiagnosisViewMode,
      label: 'Matriz & Barema Avaliativo',
      shortLabel: 'Barema Avaliativo',
      badge: `${selectedBaremaSkills.length} selecionadas`,
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-500 text-blue-700 bg-blue-50/60',
      description: 'Matriz para registro em sala e impressão oficial'
    },
    {
      id: 'timeline' as DiagnosisViewMode,
      label: 'Evolução Longitudinal',
      shortLabel: 'Evolução do Aluno',
      badge: timelineStudent ? timelineStudent.split(' ')[0] : 'Individual',
      icon: <TrendingUp className="w-4 h-4 text-teal-600" />,
      color: 'border-teal-500 text-teal-700 bg-teal-50/60',
      description: 'Curva de crescimento e salto de aprendizagem pelas 4 unidades'
    },
    {
      id: 'intervention' as DiagnosisViewMode,
      label: 'Plano de Intervenção',
      shortLabel: 'Intervenção',
      badge: `${metrics.reforcoColetivo} em alerta`,
      badgeAlert: metrics.reforcoColetivo > 0,
      icon: <Compass className="w-4 h-4 text-rose-600" />,
      color: 'border-rose-500 text-rose-700 bg-rose-50/60',
      description: 'Estratégias pedagógicas ativas para recuperação paralela'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70">
      {/* Top Banner / Identity Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <SchoolLogo size="md" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight font-serif">
                Diagnóstico Pedagógico da Turma
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase border border-emerald-200">
                {currentGrade}º ANO &quot;{currentLetter}&quot;
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Escola Municipal Raymundo Lemos Santana • Gestão das Aprendizagens &amp; Intervenção
            </p>
          </div>
        </div>

        {/* Global Quick Info & Unit Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2">Unidade:</span>
            {units.map(u => {
              const isSelected = selectedUnit === u;
              return (
                <button
                  key={u}
                  onClick={() => onSelectUnit(u)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                    isSelected
                      ? 'bg-escola-azul text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <strong>{activeStudents.length}</strong> alunos
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
              <strong>{activeStudents.filter(s => classData[s]?.isAee).length}</strong> AEE/PEI
            </span>
          </div>
        </div>
      </div>

      {/* ROBUST & BEAUTIFUL VIEW SELECTION MENU BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Menu Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full">
            {menuItems.map(item => {
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubTab(item.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
                    isActive
                      ? `${item.color} shadow-sm border-2 ring-2 ring-emerald-500/10`
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="text-xs font-black uppercase tracking-tight truncate">
                        {item.shortLabel}
                      </span>
                    </div>
                    {item.badgeAlert ? (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-500 text-white shrink-0 animate-pulse">
                        {item.badge}
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                        isActive ? 'bg-white/80 text-slate-700' : 'bg-slate-200/80 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-700">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ===================== VIEW 1: MAPA DE CALOR BNCC ===================== */}
        {subTab === 'heatmap' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Metric Highlight Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Taxa Média de Domínio
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
                    Dominadas pela maioria da turma
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
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-600">
                      {metrics.reforcoColetivo}
                    </span>
                    {metrics.reforcoColetivo > 0 && (
                      <button
                        onClick={() => setSubTab('intervention')}
                        className="text-[9px] bg-rose-600 text-white px-2.5 py-1 rounded-lg font-black uppercase hover:bg-rose-700 transition-colors shadow-2xs"
                      >
                        Ver Ações ➔
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-rose-500 mt-1">
                    Exigem intervenção imediata
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar código da habilidade BNCC ou palavra-chave..."
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
                      className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
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
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
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
                              <div className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs">
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
                                    {item.pendingStudents.map(studentName => {
                                      const isAee = classData[studentName]?.isAee;
                                      return (
                                        <button
                                          key={studentName}
                                          onClick={() => onSelectStudent && onSelectStudent(studentName)}
                                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                                          title="Clique para ir ao perfil do aluno"
                                        >
                                          <span>•</span> {studentName}
                                          {isAee && <span className="text-[8px] bg-purple-200 text-purple-800 px-1 rounded">AEE</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Alunos que consolidaram */}
                              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
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
                              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-3 text-amber-900 text-[11px]">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <strong>Sugestão Pedagógica para a Turma:</strong> Esta habilidade está com taxa de domínio inferior a 50%. Recomenda-se realizar retomada coletiva com metodologias ativas e tutoria entre pares.
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (!selectedInterventionSkills.includes(item.id)) {
                                      setSelectedInterventionSkills(prev => [...prev, item.id]);
                                    }
                                    setSubTab('intervention');
                                  }}
                                  className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] shadow-2xs"
                                >
                                  Ver no Plano ➔
                                </button>
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

        {/* ===================== VIEW 2: QUADRO GERAL DOS ALUNOS ===================== */}
        {subTab === 'students' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Filter Controls for Student Overview */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Quadro Geral de Desempenho dos Alunos ({selectedUnit})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visão 360° da turma: acompanhamento de consolidação individual de habilidades e status AEE.
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    placeholder="Buscar aluno por nome..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 uppercase"
                  />
                  {studentSearchQuery && (
                    <button 
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented filter pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filtrar Estudantes:
                </span>
                <button
                  onClick={() => setStudentPerformanceFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    studentPerformanceFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({studentsSummaryList.length})
                </button>
                <button
                  onClick={() => setStudentPerformanceFilter('high')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    studentPerformanceFilter === 'high'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Alto Domínio (≥ 70%) ({studentsSummaryList.filter(s => s.level === 'high').length})
                </button>
                <button
                  onClick={() => setStudentPerformanceFilter('medium')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    studentPerformanceFilter === 'medium'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  🟡 Médio (40-69%) ({studentsSummaryList.filter(s => s.level === 'medium').length})
                </button>
                <button
                  onClick={() => setStudentPerformanceFilter('low')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    studentPerformanceFilter === 'low'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  🔴 Atenção (&lt; 40%) ({studentsSummaryList.filter(s => s.level === 'low').length})
                </button>
                <button
                  onClick={() => setStudentPerformanceFilter('aee')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    studentPerformanceFilter === 'aee'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  AEE / PEI ({studentsSummaryList.filter(s => s.isAee).length})
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3.5 px-4">Estudante</th>
                      <th className="py-3.5 px-4 text-center">Status AEE</th>
                      <th className="py-3.5 px-4 text-center">Habilidades Dominadas</th>
                      <th className="py-3.5 px-4 text-center">Taxa de Domínio</th>
                      <th className="py-3.5 px-4 text-center">Parecer Descritivo</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {filteredStudentsSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhum estudante atende aos critérios de busca selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsSummary.map((item, idx) => (
                        <tr key={item.name} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono flex items-center justify-center font-black">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-black text-slate-800 uppercase block">
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {item.isAee ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase border border-purple-200">
                                <HeartHandshake className="w-3 h-3 text-purple-600" />
                                {item.aeeType || 'AEE / PEI'}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="text-slate-800 text-sm font-black">
                              {item.masteredCount}
                            </span>
                            <span className="text-slate-400 text-[10px] font-normal">
                              {' '}/ {gradeSkills.length}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center min-w-[150px]">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`text-xs font-black tabular-nums ${
                                item.level === 'high' ? 'text-emerald-700' : item.level === 'medium' ? 'text-amber-700' : 'text-rose-700'
                              }`}>
                                {item.rate}%
                              </span>
                              <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.level === 'high' ? 'bg-emerald-500' : item.level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${item.rate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {item.hasObservation ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                                ✓ Registrado
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                Pendente
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setTimelineStudent(item.name);
                                  setSubTab('timeline');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[10px] font-black uppercase transition-colors"
                                title="Ver linha do tempo e evolução deste aluno"
                              >
                                Evolução
                              </button>
                              <button
                                onClick={() => onSelectStudent && onSelectStudent(item.name)}
                                className="px-2.5 py-1 rounded-lg bg-escola-azul text-white hover:bg-blue-600 text-[10px] font-black uppercase transition-colors shadow-2xs"
                                title="Editar parecer e habilidades do aluno"
                              >
                                Parecer ➔
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: GERADOR DE BAREMA ===================== */}
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
                          ? 'bg-white text-slate-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Preenchido
                    </button>
                    <button
                      onClick={() => setBaremaMode('blank')}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                        baremaMode === 'blank'
                          ? 'bg-white text-slate-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Em Branco (Para Sala)
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPrintBaremaOpen(true)}
                    disabled={selectedBaremaSkills.length === 0}
                    className="px-4 py-2 bg-escola-azul text-white text-xs font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-escola-azul text-xs font-black border border-blue-200">
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
                      onClick={() => {
                        const targetSkills = gradeSkills.filter(s => baremaSubjectFilter === 'all' || s.subject === baremaSubjectFilter);
                        setSelectedBaremaSkills(prev => Array.from(new Set([...prev, ...targetSkills.map(s => s.id)])));
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Selecionar Todas
                    </button>
                    <button
                      onClick={() => {
                        const targetIds = new Set(gradeSkills.filter(s => baremaSubjectFilter === 'all' || s.subject === baremaSubjectFilter).map(s => s.id));
                        setSelectedBaremaSkills(prev => prev.filter(id => !targetIds.has(id)));
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={() => {
                        const alertIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
                        setSelectedBaremaSkills(alertIds);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase transition-colors"
                    >
                      Carregar Reforço
                    </button>
                  </div>
                </div>

                {/* Chips of selectable skills */}
                <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {gradeSkills
                    .filter(s => baremaSubjectFilter === 'all' || s.subject === baremaSubjectFilter)
                    .map(s => {
                      const isSelected = selectedBaremaSkills.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedBaremaSkills(prev => 
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2 ${
                            isSelected
                              ? 'bg-white border-escola-azul ring-1 ring-escola-azul/30 shadow-2xs'
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

            {/* Live Barema Preview Grid */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Pré-visualização da Matriz da Turma
                </h4>
                <span className="text-[11px] font-bold text-slate-400">
                  {activeStudents.length} estudantes x {selectedBaremaSkills.length} habilidades
                </span>
              </div>

              {selectedBaremaSkills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Selecione pelo menos uma habilidade acima para montar o barema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <th className="py-2.5 px-3 text-left font-black uppercase text-[10px] min-w-[180px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                          Estudante
                        </th>
                        {baremaSelectedObjects.map(s => (
                          <th key={s.id} className="py-2 px-2 text-center font-mono font-black text-[9px] uppercase min-w-[70px] border-r border-slate-200" title={s.report}>
                            {s.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeStudents.map((studentName) => {
                        const studentUnitSkills = classData[studentName]?.[selectedUnit]?.skills || [];
                        const isAee = classData[studentName]?.isAee;

                        return (
                          <tr key={studentName} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-bold text-slate-800 uppercase sticky left-0 bg-white z-10 border-r border-slate-200 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="truncate">{studentName}</span>
                                {isAee && (
                                  <span className="text-[8px] bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-black ml-1">
                                    AEE
                                  </span>
                                )}
                              </div>
                            </td>
                            {baremaSelectedObjects.map(s => {
                              const isMastered = studentUnitSkills.includes(s.id);
                              return (
                                <td key={s.id} className="py-1.5 px-2 text-center border-r border-slate-100">
                                  {baremaMode === 'blank' ? (
                                    <div className="w-4 h-4 border border-slate-300 rounded mx-auto" />
                                  ) : isMastered ? (
                                    <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs leading-5">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-block w-2 h-2 rounded-full bg-slate-200 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: LINHA DO TEMPO & EVOLUÇÃO ===================== */}
        {subTab === 'timeline' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Student Picker Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Linha do Tempo &amp; Trajetória Longitudinal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhamento do salto de aprendizagem entre as unidades letivas
                  </p>
                </div>
              </div>

              {/* Student Picker */}
              <div className="flex items-center gap-2">
                <select
                  value={timelineStudent}
                  onChange={(e) => setTimelineStudent(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-teal-500 max-w-xs"
                >
                  {activeStudents.map(studentName => (
                    <option key={studentName} value={studentName}>
                      {studentName} {classData[studentName]?.isAee ? '(AEE/PEI)' : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsPrintTimelineOpen(true)}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha</span>
                </button>
              </div>
            </div>

            {/* Student Salto de Aprendizagem Summary Hero */}
            <div className="bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase backdrop-blur-xs">
                      Perfil do Estudante
                    </span>
                    {classData[timelineStudent]?.isAee && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-400 text-purple-950 text-[10px] font-black uppercase">
                        AEE / Adaptação Curricular
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight font-serif">
                    {timelineStudent}
                  </h2>
                  <p className="text-xs text-teal-100 font-medium mt-1">
                    {currentGrade}º Ano &quot;{currentLetter}&quot; • Escola Municipal Raymundo Lemos Santana
                  </p>
                </div>

                {/* Metrics Pill */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <div>
                    <span className="text-[10px] text-teal-200 uppercase font-black block">
                      Habilidades Inicial
                    </span>
                    <span className="text-xl font-black">{timelineJump.initial}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-200" />
                  <div>
                    <span className="text-[10px] text-teal-200 uppercase font-black block">
                      Atual / Consolidada
                    </span>
                    <span className="text-xl font-black">{timelineJump.current}</span>
                  </div>
                  <div className="pl-4 border-l border-white/20">
                    <span className="text-[10px] text-teal-200 uppercase font-black block">
                      Salto Pedagógico
                    </span>
                    <span className="text-xl font-black text-lime-300">
                      +{timelineJump.diff} ({timelineJump.pctJump}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart: Progression Curve */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Curva de Consolidação de Habilidades por Unidade
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Total cumulativo e percentual de domínio do currículo da série
                  </p>
                </div>
                <span className="text-xs font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Meta da Série: {gradeSkills.length} Habilidades
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="unit" stroke="#64748b" fontSize={11} fontWeight={700} />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight={700} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} habilidades`, 'Consolidadas']}
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#0d9488" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline Stepper Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {studentTimelineData.map((step, idx) => (
                <div 
                  key={step.unit}
                  className={`p-4 rounded-2xl border transition-all ${
                    step.count > 0 
                      ? 'bg-white border-slate-200 shadow-2xs' 
                      : 'bg-slate-50/80 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Unidade {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {step.percentage}%
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase mb-1">
                    {step.unit}
                  </h4>
                  <div className="text-2xl font-black text-slate-800 mb-2">
                    {step.count} <span className="text-xs font-normal text-slate-400">habilidades</span>
                  </div>
                  {step.newCount > 0 && (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md inline-block">
                      +{step.newCount} novas adquiridas
                    </span>
                  )}
                  {step.hasNotes && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block ml-1">
                      Parecer registrado
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW 5: PLANO DE INTERVENÇÃO ===================== */}
        {subTab === 'intervention' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Generator Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    Plano de Intervenção Pedagógica (Recuperação Paralela)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ações metodológicas ativas voltadas para habilidades em alerta (&lt; 50% de consolidação na {selectedUnit})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const alertIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
                    setSelectedInterventionSkills(alertIds);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition-colors"
                >
                  Recarregar Alertas
                </button>
                <button
                  onClick={() => setIsPrintInterventionOpen(true)}
                  disabled={interventionItems.length === 0}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Plano</span>
                </button>
              </div>
            </div>

            {/* List of Intervention Actions */}
            {interventionItems.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2">🎉</span>
                <h4 className="text-sm font-black uppercase text-slate-700">
                  Nenhuma habilidade em alerta crítico nesta unidade!
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Todas as habilidades avaliadas na <strong>{selectedUnit}</strong> atingiram taxa de domínio igual ou superior a 50%.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {interventionItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-rose-200 shadow-xs overflow-hidden"
                  >
                    <div className="p-5 border-b border-slate-100 bg-rose-50/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-xs font-black uppercase text-rose-900">
                          {item.id}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {subjects.find(s => s.id === item.skill?.subject)?.label || item.skill?.subject}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          Domínio: {item.rate}% da turma
                        </span>
                      </div>

                      <div className="text-xs font-bold text-rose-700">
                        {item.pending.length} estudantes no grupo focal
                      </div>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                      <div>
                        <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                          Descrição da Habilidade BNCC:
                        </strong>
                        <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {item.skill?.report}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-escola-azul flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" /> Metodologia Ativa Recomendada
                          </span>
                          <p className="text-slate-700 font-medium">
                            {item.methodology}
                          </p>
                        </div>

                        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" /> Proposta Prática em Sala de Aula
                          </span>
                          <p className="text-slate-700 font-medium">
                            {item.activity}
                          </p>
                        </div>
                      </div>

                      {/* Students requiring intervention */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                          Estudantes que participarão da intervenção:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.pending.map(s => {
                            const isAee = classData[s]?.isAee;
                            return (
                              <span
                                key={s}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase flex items-center gap-1"
                              >
                                <span>•</span> {s}
                                {isAee && (
                                  <span className="text-[8px] bg-purple-200 text-purple-900 px-1 rounded">
                                    AEE
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================== MODAL IMPRESSÃO: BAREMA PEDAGÓGICO ===================== */}
      {isPrintBaremaOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-escola-azul" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão Oficial do Barema
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-escola-azul hover:bg-blue-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPrintBaremaOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div id="printable-barema" className="bg-white p-8 max-w-4xl w-full shadow-lg border border-slate-200 rounded-lg text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
                {/* School Header with Logo */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5 text-center flex flex-col items-center">
                  <SchoolLogo size="lg" showText={false} className="mb-2" />
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-900 font-serif">
                    ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    ENSINO FUNDAMENTAL I - EJA
                  </h2>
                  <h3 className="text-xs font-black uppercase tracking-widest text-escola-azul mt-1">
                    BAREMA PEDAGÓGICO DE AVALIAÇÃO CONTÍNUA • ANO LETIVO 2026
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-[10px] font-bold text-left w-full">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Turma:</span>
                      <span>{currentGrade}º ANO &quot;{currentLetter}&quot;</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Unidade:</span>
                      <span>{selectedUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Total de Habilidades:</span>
                      <span>{baremaSelectedObjects.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Total de Alunos:</span>
                      <span>{activeStudents.length}</span>
                    </div>
                  </div>
                </div>

                {/* Habilidades Legend */}
                <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-300 text-[9px]">
                  <span className="font-bold block uppercase mb-1">Legenda das Habilidades Avaliadas:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {baremaSelectedObjects.map(s => (
                      <div key={s.id} className="leading-tight">
                        <strong>[{s.id}]:</strong> {s.report}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Barema Table */}
                <table className="w-full text-[9px] border-collapse border border-slate-400 mb-8">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-400">
                      <th className="border border-slate-400 py-1.5 px-2 text-left w-48">Estudante</th>
                      {baremaSelectedObjects.map(s => (
                        <th key={s.id} className="border border-slate-400 py-1.5 px-1 text-center font-mono">
                          {s.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeStudents.map((studentName) => {
                      const studentUnitSkills = classData[studentName]?.[selectedUnit]?.skills || [];
                      const isAee = classData[studentName]?.isAee;

                      return (
                        <tr key={studentName} className="border-b border-slate-300">
                          <td className="border border-slate-300 py-1.5 px-2 font-bold uppercase truncate max-w-[200px]">
                            {studentName} {isAee ? '(AEE)' : ''}
                          </td>
                          {baremaSelectedObjects.map(s => {
                            const isMastered = studentUnitSkills.includes(s.id);
                            return (
                              <td key={s.id} className="border border-slate-300 py-1 px-1 text-center font-bold">
                                {baremaMode === 'blank' ? '' : isMastered ? 'SIM' : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[10px]">
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

      {/* ===================== MODAL IMPRESSÃO: EVOLUÇÃO LONGITUDINAL ===================== */}
      {isPrintTimelineOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão da Ficha de Evolução do Aluno
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPrintTimelineOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div id="printable-barema" className="bg-white p-8 max-w-3xl w-full shadow-lg border border-slate-200 rounded-lg text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5 text-center flex flex-col items-center">
                  <SchoolLogo size="lg" showText={false} className="mb-2" />
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-900 font-serif">
                    ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    ENSINO FUNDAMENTAL I - EJA
                  </h2>
                  <h3 className="text-xs font-black uppercase tracking-widest text-teal-800 mt-1">
                    RELATÓRIO DE EVOLUÇÃO LONGITUDINAL DA APRENDIZAGEM
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 text-[11px] font-bold text-left w-full">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Estudante:</span>
                      <span className="text-sm">{timelineStudent} {classData[timelineStudent]?.isAee ? '(AEE / PEI)' : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Turma / Ano Letivo:</span>
                      <span>{currentGrade}º ANO &quot;{currentLetter}&quot; • 2026</span>
                    </div>
                  </div>
                </div>

                {/* Progress summary block */}
                <div className="border border-teal-300 bg-teal-50/40 p-4 rounded-xl mb-6 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-teal-900 block">
                      Ponto de Partida (Diagnóstica)
                    </span>
                    <strong className="text-sm">{timelineJump.initial} habilidades</strong>
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-700" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-teal-900 block">
                      Total Consolidado Atual
                    </span>
                    <strong className="text-sm">{timelineJump.current} habilidades</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-teal-900 block">
                      Salto Global de Aprendizagem
                    </span>
                    <strong className="text-sm text-teal-800">+{timelineJump.diff} ({timelineJump.pctJump}%)</strong>
                  </div>
                </div>

                {/* Step Table */}
                <table className="w-full text-[10px] border-collapse border border-slate-400 mb-6">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-400">
                      <th className="border border-slate-400 py-1.5 px-3 text-left">Unidade Letiva</th>
                      <th className="border border-slate-400 py-1.5 px-3 text-center">Habilidades Consolidadas</th>
                      <th className="border border-slate-400 py-1.5 px-3 text-center">% do Currículo</th>
                      <th className="border border-slate-400 py-1.5 px-3 text-center">Novas Aquisições</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentTimelineData.map((step) => (
                      <tr key={step.unit} className="border-b border-slate-300">
                        <td className="border border-slate-300 py-2 px-3 font-bold uppercase">{step.unit}</td>
                        <td className="border border-slate-300 py-2 px-3 text-center font-bold">{step.count}</td>
                        <td className="border border-slate-300 py-2 px-3 text-center font-bold">{step.percentage}%</td>
                        <td className="border border-slate-300 py-2 px-3 text-center text-teal-700 font-bold">
                          {step.newCount > 0 ? `+${step.newCount}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-12 mt-8 text-center text-[10px]">
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Professor(a) Regente
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Coordenação Pedagógica
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Responsável pelo Aluno
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL IMPRESSÃO: PLANO DE INTERVENÇÃO ===================== */}
      {isPrintInterventionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-700" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão do Plano de Intervenção Pedagógica
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setIsPrintInterventionOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div id="printable-barema" className="bg-white p-8 max-w-3xl w-full shadow-lg border border-slate-200 rounded-lg text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5 text-center flex flex-col items-center">
                  <SchoolLogo size="lg" showText={false} className="mb-2" />
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-900 font-serif">
                    ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    ENSINO FUNDAMENTAL I - EJA
                  </h2>
                  <h3 className="text-xs font-black uppercase tracking-widest text-rose-800 mt-1">
                    PLANO DE INTERVENÇÃO PEDAGÓGICA &amp; RECUPERAÇÃO PARALELA
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-[10px] font-bold text-left w-full">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Turma:</span>
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
                      <span className="text-slate-500 block text-[9px] uppercase">Data:</span>
                      <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-8">
                  {interventionItems.map((item, idx) => (
                    <div key={item.id} className="border border-slate-400 p-3 rounded text-[10px] space-y-2">
                      <div className="flex justify-between font-bold border-b border-slate-300 pb-1">
                        <span>Habilidade {idx + 1}: {item.id}</span>
                        <span>Domínio: {item.rate}% da Turma</span>
                      </div>
                      <p className="leading-tight">
                        <strong>Objetivo:</strong> {item.skill?.report}
                      </p>
                      <p className="leading-tight">
                        <strong>Metodologia Ativa Proposta:</strong> {item.methodology}
                      </p>
                      <p className="leading-tight">
                        <strong>Atividade Prática em Sala:</strong> {item.activity}
                      </p>
                      <p className="leading-tight">
                        <strong>Estudantes Participantes:</strong> {item.pending.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[10px]">
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
