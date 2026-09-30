'use client';

import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal, 
  ArrowRight, 
  BookOpen, 
  HeartHandshake,
  Check,
  Clock,
  Sparkles,
  Award,
  UserCheck,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects, subjectPalettes } from '@/lib/constants';
import { SchoolLogo } from './SchoolLogo';
import { UnitSkillsOrganizerModal } from './UnitSkillsOrganizerModal';
import { ClassCouncilModal } from './ClassCouncilModal';
import { getPlannedSkillsForUnit } from '@/lib/curriculumUtils';

interface ClassDiagnosisProps {
  currentGrade: string;
  currentLetter: string;
  classData: ClassData;
  appData?: AppData;
  globalSkills: Skill[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  onSelectStudent?: (studentName: string) => void;
  onUpdateAppData?: (newAppData: AppData) => void;
}

export function ClassDiagnosis({
  currentGrade,
  currentLetter,
  classData,
  appData,
  globalSkills,
  selectedUnit,
  onSelectUnit,
  onSelectStudent,
  onUpdateAppData
}: ClassDiagnosisProps) {
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);
  const [isCouncilOpen, setIsCouncilOpen] = useState(false);
  const [showPeerMentoring, setShowPeerMentoring] = useState(true);
  const [skillFilter, setSkillFilter] = useState<'all' | 'alert' | 'developing' | 'mastered'>('alert');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'attention' | 'pending_report' | 'aee'>('all');

  // 1. Active students list
  const activeStudents = useMemo(() => {
    return (classData.students || []).filter(s => classData[s]?.active !== false).sort();
  }, [classData]);

  // 2. Grade skills
  const gradeSkills = useMemo(() => {
    return globalSkills
      .filter(s => String(s.grade) === String(currentGrade))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [globalSkills, currentGrade]);

  // 3. Planned skills for this unit
  const plannedSkillIds = useMemo(() => {
    return getPlannedSkillsForUnit(classData, currentGrade, selectedUnit, globalSkills);
  }, [classData, currentGrade, selectedUnit, globalSkills]);

  // Skills in focus: planned for the unit, or all grade skills if none planned
  const skillsInScope = useMemo(() => {
    if (plannedSkillIds.length > 0) {
      return gradeSkills.filter(s => plannedSkillIds.includes(s.id));
    }
    return gradeSkills;
  }, [gradeSkills, plannedSkillIds]);

  // 4. Skills Analytics
  const skillsAnalysis = useMemo(() => {
    const total = activeStudents.length || 1;

    return skillsInScope.map(skill => {
      const masteredStudents = activeStudents.filter(studentName => {
        const studentUnitData = classData[studentName]?.[selectedUnit];
        return studentUnitData?.skills?.includes(skill.id);
      });

      const count = masteredStudents.length;
      const rate = Math.round((count / total) * 100);
      const pendingStudents = activeStudents.filter(s => !masteredStudents.includes(s));

      let status: 'mastered' | 'developing' | 'alert';
      if (rate >= 70) {
        status = 'mastered';
      } else if (rate >= 50) {
        status = 'developing';
      } else {
        status = 'alert';
      }

      return {
        ...skill,
        masteredCount: count,
        totalStudents: activeStudents.length,
        rate,
        status,
        masteredStudents,
        pendingStudents
      };
    }).sort((a, b) => {
      // Prioritize lowest mastery first to highlight critical learning gaps
      return a.rate - b.rate;
    });
  }, [skillsInScope, activeStudents, classData, selectedUnit]);

  // 5. Students Analytics
  const studentsAnalysis = useMemo(() => {
    const totalSkillsCount = skillsInScope.length || 1;

    return activeStudents.map(studentName => {
      const studentUnitData = classData[studentName]?.[selectedUnit];
      const masteredList = studentUnitData?.skills || [];
      const masteredInScope = (masteredList as string[]).filter((id: string) => skillsInScope.some(s => s.id === id));
      const count = masteredInScope.length;
      const rate = Math.round((count / totalSkillsCount) * 100);
      const isAee = Boolean(classData[studentName]?.isAee);
      const aeeType = classData[studentName]?.aeeType || '';
      const hasObservation = Boolean(studentUnitData?.observation?.trim() && studentUnitData.observation.length > 10);

      let status: 'advanced' | 'developing' | 'attention';
      if (rate >= 70) status = 'advanced';
      else if (rate >= 50) status = 'developing';
      else status = 'attention';

      return {
        name: studentName,
        masteredCount: count,
        totalSkills: totalSkillsCount,
        rate,
        status,
        isAee,
        aeeType,
        hasObservation
      };
    }).sort((a, b) => {
      // Students needing attention at the top
      if (a.rate !== b.rate) return a.rate - b.rate;
      return a.name.localeCompare(b.name);
    });
  }, [activeStudents, classData, selectedUnit, skillsInScope]);

  // 6. Macro KPIs
  const totalStudentsCount = activeStudents.length;
  const avgClassRate = skillsAnalysis.length > 0
    ? Math.round(skillsAnalysis.reduce((acc, s) => acc + s.rate, 0) / skillsAnalysis.length)
    : 0;

  const alertSkillsCount = skillsAnalysis.filter(s => s.status === 'alert').length;
  const developingSkillsCount = skillsAnalysis.filter(s => s.status === 'developing').length;
  const masteredSkillsCount = skillsAnalysis.filter(s => s.status === 'mastered').length;

  const studentsInAttention = studentsAnalysis.filter(s => s.status === 'attention').length;
  const completedReportsCount = studentsAnalysis.filter(s => s.hasObservation).length;

  // 7. Subject breakdown
  const subjectBreakdown = useMemo(() => {
    return subjects.map(sub => {
      const subSkills = skillsAnalysis.filter(s => s.subject === sub.id);
      const avg = subSkills.length > 0
        ? Math.round(subSkills.reduce((acc, s) => acc + s.rate, 0) / subSkills.length)
        : 0;
      return {
        ...sub,
        count: subSkills.length,
        avgRate: avg
      };
    });
  }, [skillsAnalysis]);

  // 8. Filtered Skills
  const filteredSkills = useMemo(() => {
    return skillsAnalysis.filter(skill => {
      if (skillFilter === 'alert' && skill.status !== 'alert') return false;
      if (skillFilter === 'developing' && skill.status !== 'developing') return false;
      if (skillFilter === 'mastered' && skill.status !== 'mastered') return false;
      if (selectedSubjectFilter !== 'all' && skill.subject !== selectedSubjectFilter) return false;
      return true;
    });
  }, [skillsAnalysis, skillFilter, selectedSubjectFilter]);

  // 9. Filtered Students
  const filteredStudents = useMemo(() => {
    return studentsAnalysis.filter(s => {
      if (studentStatusFilter === 'attention' && s.status !== 'attention') return false;
      if (studentStatusFilter === 'pending_report' && s.hasObservation) return false;
      if (studentStatusFilter === 'aee' && !s.isAee) return false;
      if (studentSearch.trim()) {
        return s.name.toLowerCase().includes(studentSearch.toLowerCase());
      }
      return true;
    });
  }, [studentsAnalysis, studentStatusFilter, studentSearch]);

  // 10. Peer Mentoring Duos (Monitoria entre Pares)
  const peerMentoringDuos = useMemo(() => {
    // Focus on skills with alert or developing status
    const targetSkills = skillsAnalysis.filter(s => s.status === 'alert' || s.status === 'developing');
    const duos: {
      skillId: string;
      skillReport: string;
      subject: string;
      mentor: string;
      peer: string;
    }[] = [];

    const usedPeers = new Set<string>();
    const usedMentorsCount: Record<string, number> = {};

    targetSkills.forEach(skill => {
      if (duos.length >= 6) return;

      const availablePeer = skill.pendingStudents.find(p => !usedPeers.has(p));
      const availableMentor = skill.masteredStudents.find(m => (usedMentorsCount[m] || 0) < 2);

      if (availablePeer && availableMentor) {
        usedPeers.add(availablePeer);
        usedMentorsCount[availableMentor] = (usedMentorsCount[availableMentor] || 0) + 1;

        duos.push({
          skillId: skill.id,
          skillReport: skill.report,
          subject: skill.subject,
          mentor: availableMentor,
          peer: availablePeer
        });
      }
    });

    return duos;
  }, [skillsAnalysis]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-stone-50/60 p-5 sm:p-6 space-y-6">
      
      {/* 1. Header do Diagnóstico (Conciso e Funcional) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 p-5 shadow-[0_8px_30px_rgba(40,30,20,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-escola-azul to-emerald-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900 tracking-tight">
                Diagnóstico Pedagógico da Turma
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {currentGrade}º ANO &quot;{currentLetter}&quot;
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Leitura em tempo real do domínio curricular e das necessidades de aprendizagem
            </p>
          </div>
        </div>

        {/* Seletor de Unidade Letiva e Ações */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <div className="bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 flex items-center gap-1 shadow-inner">
            {units.map(u => {
              const isSelected = selectedUnit === u;
              return (
                <button
                  key={u}
                  onClick={() => onSelectUnit(u)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    isSelected
                      ? 'bg-escola-azul text-white shadow-sm -translate-y-[1px]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
                  }`}
                >
                  {u}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsCouncilOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Gerar e imprimir a ata e barema oficial do conselho de classe em formato paisagem"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ata do Conselho</span>
          </button>

          <button
            onClick={() => setIsOrganizerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-bold uppercase shadow-2xs transition-all hover:scale-105 active:scale-95"
            title="Escolher quais habilidades serão trabalhadas nesta unidade"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Organizar Metas ({plannedSkillIds.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Termômetro da Turma - 4 Métricas Essenciais e Diretas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Domínio Médio */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Domínio da Turma
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-serif text-stone-900">{avgClassRate}%</span>
              <span className="text-xs text-stone-500 font-medium">média geral</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${avgClassRate}%` }} 
              />
            </div>
            <p className="text-[10px] text-stone-400 font-medium mt-2">
              {skillsInScope.length} habilidades avaliadas na {selectedUnit}
            </p>
          </div>
        </div>

        {/* Card 2: Habilidades em Alerta */}
        <div className="bg-white rounded-3xl border border-rose-200/70 p-5 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-rose-50/30 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Habilidades em Alerta
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-serif text-rose-700">{alertSkillsCount}</span>
              <span className="text-xs text-rose-600 font-medium">com domínio &lt; 50%</span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-2">
              Pontos de estrangulamento que exigem retomada e reforço coletivo.
            </p>
          </div>
        </div>

        {/* Card 3: Estudantes que Requerem Apoio */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-5 shadow-2xs flex flex-col justify-between bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Apoio Individual
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-serif text-amber-800">{studentsInAttention}</span>
              <span className="text-xs text-amber-700 font-medium">de {totalStudentsCount} estudantes</span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-2">
              Alunos com menos de 50% das habilidades consolidadas nesta etapa.
            </p>
          </div>
        </div>

        {/* Card 4: Pareceres Concluídos */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Pareceres da Etapa
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-escola-azul flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-serif text-stone-900">{completedReportsCount}</span>
              <span className="text-xs text-stone-500 font-medium">de {totalStudentsCount} prontos</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-escola-azul h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalStudentsCount > 0 ? (completedReportsCount / totalStudentsCount) * 100 : 0}%` }} 
              />
            </div>
            <p className="text-[10px] text-stone-400 font-medium mt-2">
              {totalStudentsCount - completedReportsCount} pareceres ainda pendentes
            </p>
          </div>
        </div>

      </div>

      {/* 3. Desempenho Rápido por Disciplina */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-4 px-6 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <span className="text-xs font-bold font-serif text-stone-800 uppercase tracking-tight shrink-0 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-escola-azul" />
          Média por Componente:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {subjectBreakdown.map(sub => (
            <div key={sub.id} className="bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: subjectPalettes[sub.id]?.[0] || '#94a3b8' }} 
                />
                <span className="text-[11px] font-bold text-stone-700">{sub.label}</span>
              </div>
              <span className="text-xs font-black font-serif text-stone-900">{sub.avgRate}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Duplas Produtivas Sugeridas (Monitoria & Cooperação entre Pares) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-stone-900 tracking-tight flex items-center gap-2">
                <span>Agrupamentos Produtivos Sugeridos (Monitoria entre Pares)</span>
                <span className="text-[10px] font-sans font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">
                  {peerMentoringDuos.length} Duplas Sugeridas
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Sugestão pedagógica para sentar lado a lado: um estudante tutor que já domina a competência com um colega em desenvolvimento
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPeerMentoring(!showPeerMentoring)}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1"
          >
            {showPeerMentoring ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showPeerMentoring ? 'Recolher' : 'Exibir'}</span>
          </button>
        </div>

        {showPeerMentoring && (
          peerMentoringDuos.length === 0 ? (
            <div className="p-4 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 italic">
              Não há divergência de aprendizagens no momento que justifique monitoria imediata para este bimestre.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {peerMentoringDuos.map((duo, idx) => (
                <div 
                  key={`${duo.skillId}-${idx}`} 
                  className="p-3.5 bg-gradient-to-br from-stone-50 via-white to-purple-50/20 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                      {duo.skillId}
                    </span>
                    <span className="font-bold text-purple-700 uppercase">
                      Meta da Unidade
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-700 line-clamp-2 font-medium leading-tight">
                    {duo.skillReport}
                  </p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    {/* Mentor */}
                    <div className="flex-1">
                      <span className="text-[9px] font-bold uppercase text-emerald-700 block">🧑‍🏫 Parceiro(a) Tutor:</span>
                      <button 
                        onClick={() => onSelectStudent && onSelectStudent(duo.mentor)}
                        className="font-bold text-stone-900 truncate max-w-[120px] text-left hover:text-escola-azul"
                      >
                        {duo.mentor}
                      </button>
                    </div>

                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 mx-1" />

                    {/* Peer */}
                    <div className="flex-1 text-right">
                      <span className="text-[9px] font-bold uppercase text-amber-700 block">🤝 Em Aprendizagem:</span>
                      <button 
                        onClick={() => onSelectStudent && onSelectStudent(duo.peer)}
                        className="font-bold text-stone-900 truncate max-w-[120px] text-right hover:text-escola-azul"
                      >
                        {duo.peer}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 5. Duas Colunas Centrais de Alta Utilidade */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: Habilidades Críticas & Consolidadas (7 colunas) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold font-serif text-stone-900 tracking-tight">
                Habilidades & Aprendizagens
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Identifique exatamente onde a turma avançou e quais conteúdos precisam de reforço
              </p>
            </div>

            {/* Segmented Filter */}
            <div className="flex items-center bg-stone-100/90 p-1 rounded-2xl border border-stone-200/80 self-start sm:self-auto shrink-0">
              <button
                onClick={() => setSkillFilter('alert')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xl transition-all ${
                  skillFilter === 'alert'
                    ? 'bg-rose-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Em Alerta ({alertSkillsCount})
              </button>
              <button
                onClick={() => setSkillFilter('developing')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xl transition-all ${
                  skillFilter === 'developing'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Desenvolvimento ({developingSkillsCount})
              </button>
              <button
                onClick={() => setSkillFilter('mastered')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xl transition-all ${
                  skillFilter === 'mastered'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Consolidadas ({masteredSkillsCount})
              </button>
              <button
                onClick={() => setSkillFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-xl transition-all ${
                  skillFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Todas ({skillsAnalysis.length})
              </button>
            </div>
          </div>

          {/* Subject Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                selectedSubjectFilter === 'all'
                  ? 'bg-stone-800 text-white'
                  : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
              }`}
            >
              Todas matérias
            </button>
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  selectedSubjectFilter === s.id
                    ? 'bg-escola-azul text-white'
                    : 'text-stone-600 bg-stone-100 hover:bg-stone-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Lista de Habilidades */}
          {filteredSkills.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center">
              <span className="text-3xl mb-1">🎉</span>
              <p className="text-xs font-bold text-stone-700">Nenhuma habilidade nesta categoria</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Selecione outro filtro para visualizar outras competências da turma.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSkills.map(skill => {
                const isExpanded = expandedSkillId === skill.id;
                const isAlert = skill.status === 'alert';
                const isDeveloping = skill.status === 'developing';

                return (
                  <div
                    key={skill.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isAlert
                        ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                        : isDeveloping
                        ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
                        : 'bg-stone-50/40 border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: skill.color || '#0ea5e9' }} 
                          />
                          <span className="text-xs font-black font-mono text-stone-900">
                            {skill.id}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                            {subjects.find(s => s.id === skill.subject)?.label || skill.subject}
                          </span>
                          {skill.category && (
                            <span className="text-[9px] font-medium text-stone-400 truncate max-w-[200px]">
                              {skill.category}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-stone-700 leading-relaxed">
                          {skill.report}
                        </p>
                      </div>

                      {/* Domínio em % */}
                      <div className="text-right shrink-0">
                        <span className={`text-base font-black font-serif ${
                          isAlert ? 'text-rose-700' : isDeveloping ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {skill.rate}%
                        </span>
                        <p className="text-[9px] text-stone-400 font-bold uppercase">
                          {skill.masteredCount} de {skill.totalStudents} alunos
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso da Habilidade */}
                    <div className="w-full bg-stone-200/70 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isAlert ? 'bg-rose-500' : isDeveloping ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${skill.rate}%` }}
                      />
                    </div>

                    {/* Botão Interativo: Ver Alunos com Dificuldade / Pendentes */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100">
                      <button
                        onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                        className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>
                          {skill.pendingStudents.length > 0 
                            ? `Ver ${skill.pendingStudents.length} alunos com dificuldade` 
                            : 'Todos os alunos consolidaram'}
                        </span>
                      </button>

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isAlert ? 'bg-rose-100 text-rose-800' : isDeveloping ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isAlert ? 'Atenção Prioritária' : isDeveloping ? 'Em Desenvolvimento' : 'Consolidada'}
                      </span>
                    </div>

                    {/* Lista Expansível de Alunos que Precisam de Apoio Nesta Habilidade */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2.5 overflow-hidden"
                        >
                          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                              Estudantes com esta habilidade pendente na {selectedUnit}:
                            </p>
                            {skill.pendingStudents.length === 0 ? (
                              <p className="text-xs text-emerald-700 font-bold">✓ Parabéns! Toda a turma atingiu este objetivo.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {skill.pendingStudents.map(studentName => (
                                  <button
                                    key={studentName}
                                    onClick={() => onSelectStudent && onSelectStudent(studentName)}
                                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                    title="Clique para abrir e avaliar este estudante"
                                  >
                                    <span>{studentName}</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-stone-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* COLUNA DIREITA: Situação Individual dos Estudantes (5 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          
          <div>
            <h3 className="text-base font-bold font-serif text-stone-900 tracking-tight">
              Acompanhamento por Estudante
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Visão individual de domínio e status do parecer pedagógico
            </p>
          </div>

          {/* Busca e Filtros Rápidos de Estudante */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Buscar estudante..."
                className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-stone-400 placeholder:text-stone-400"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setStudentStatusFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  studentStatusFilter === 'all'
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos ({studentsAnalysis.length})
              </button>
              <button
                onClick={() => setStudentStatusFilter('attention')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  studentStatusFilter === 'attention'
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Atenção ({studentsInAttention})
              </button>
              <button
                onClick={() => setStudentStatusFilter('pending_report')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  studentStatusFilter === 'pending_report'
                    ? 'bg-escola-azul text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Sem Parecer ({totalStudentsCount - completedReportsCount})
              </button>
              <button
                onClick={() => setStudentStatusFilter('aee')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                  studentStatusFilter === 'aee'
                    ? 'bg-purple-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                AEE ({studentsAnalysis.filter(s => s.isAee).length})
              </button>
            </div>
          </div>

          {/* Lista de Estudantes */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredStudents.map(student => {
              const isAttention = student.status === 'attention';
              const isAdvanced = student.status === 'advanced';

              return (
                <div
                  key={student.name}
                  onClick={() => onSelectStudent && onSelectStudent(student.name)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-xs group flex flex-col justify-between gap-2.5 ${
                    isAttention
                      ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
                      : 'bg-stone-50/30 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-stone-900 group-hover:text-escola-azul transition-colors">
                        {student.name}
                      </span>
                      {student.isAee && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                          AEE
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-black font-serif ${
                      isAttention ? 'text-amber-700' : isAdvanced ? 'text-emerald-700' : 'text-stone-700'
                    }`}>
                      {student.rate}%
                    </span>
                  </div>

                  {/* Barra de Progresso do Aluno */}
                  <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAttention ? 'bg-amber-500' : isAdvanced ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${student.rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-stone-100">
                    <span className="text-stone-400 font-medium">
                      {student.masteredCount} de {student.totalSkills} habilidades
                    </span>

                    {/* Status do Parecer */}
                    {student.hasObservation ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Parecer feito
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> Parecer pendente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Modal do Organizador de Habilidades da Unidade */}
      {appData && onUpdateAppData && (
        <UnitSkillsOrganizerModal
          isOpen={isOrganizerOpen}
          onClose={() => setIsOrganizerOpen(false)}
          currentGrade={currentGrade}
          currentLetter={currentLetter}
          initialUnit={selectedUnit}
          classData={classData}
          appData={appData}
          globalSkills={globalSkills}
          onUpdateAppData={onUpdateAppData}
          onSelectUnit={onSelectUnit}
        />
      )}

      {/* Modal Oficial do Conselho de Classe (Barema Imprimível em Paisagem) */}
      <ClassCouncilModal
        isOpen={isCouncilOpen}
        onClose={() => setIsCouncilOpen(false)}
        currentGrade={currentGrade}
        currentLetter={currentLetter}
        selectedUnit={selectedUnit}
        classData={classData}
        globalSkills={globalSkills}
      />

    </div>
  );
}
