'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  FileSpreadsheet, 
  TrendingUp, 
  Compass, 
  Sparkles,
  HeartHandshake,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Target
} from 'lucide-react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units } from '@/lib/constants';
import { SchoolLogo } from './SchoolLogo';
import { UnitSkillsOrganizerModal } from './UnitSkillsOrganizerModal';
import { getPlannedSkillsForUnit } from '@/lib/curriculumUtils';

import { DiagnosisSubTab, SkillMasteryAnalysis, StudentSummaryItem } from './diagnosis/types';
import { ExecutiveOverview } from './diagnosis/ExecutiveOverview';
import { HeatmapView } from './diagnosis/HeatmapView';
import { StudentsTriageView } from './diagnosis/StudentsTriageView';
import { InterventionPlanView } from './diagnosis/InterventionPlanView';
import { ClassCouncilView } from './diagnosis/ClassCouncilView';
import { TimelineView } from './diagnosis/TimelineView';

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
  // Current active subtab
  const [activeTab, setActiveTab] = useState<DiagnosisSubTab>('overview');

  // Organizer Modal State
  const [isOrganizerOpen, setIsOrganizerOpen] = useState(false);

  // Selected student for timeline
  const [timelineStudent, setTimelineStudent] = useState<string>('');

  // Selected intervention skills
  const [selectedInterventionSkills, setSelectedInterventionSkills] = useState<string[]>([]);

  // Active students
  const activeStudents = useMemo(() => {
    return (classData.students || []).filter(s => classData[s]?.active !== false).sort();
  }, [classData]);

  // Set default student for timeline
  React.useEffect(() => {
    if (!timelineStudent && activeStudents.length > 0) {
      setTimelineStudent(activeStudents[0]);
    }
  }, [activeStudents, timelineStudent]);

  // Skills filtered by grade
  const gradeSkills = useMemo(() => {
    return globalSkills.filter(s => String(s.grade) === String(currentGrade));
  }, [globalSkills, currentGrade]);

  // Planned skills for selected unit
  const plannedSkillIds = useMemo(() => {
    return getPlannedSkillsForUnit(classData, currentGrade, selectedUnit, globalSkills);
  }, [classData, currentGrade, selectedUnit, globalSkills]);

  // Heatmap analytics calculation
  const skillsAnalysis = useMemo<SkillMasteryAnalysis[]>(() => {
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

  // Student summary metrics for "Quadro Geral dos Alunos"
  const studentsSummaryList = useMemo<StudentSummaryItem[]>(() => {
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
        totalSkills: totalGrade,
        pendingCount: Math.max(0, totalGrade - masteredCount),
        rate,
        level,
        isAee,
        aeeType,
        hasObservation
      };
    });
  }, [activeStudents, classData, selectedUnit, gradeSkills]);

  // Initialize Intervention skills with alert ones
  React.useEffect(() => {
    const alertIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
    if (alertIds.length > 0 && selectedInterventionSkills.length === 0) {
      setSelectedInterventionSkills(alertIds);
    }
  }, [skillsAnalysis, selectedInterventionSkills.length]);

  const handleResetToAlertSkills = () => {
    const alertIds = skillsAnalysis.filter(s => s.status === 'reforco').map(s => s.id);
    setSelectedInterventionSkills(alertIds);
  };

  const handleToggleInterventionSkill = (skillId: string) => {
    setSelectedInterventionSkills(prev => 
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleAddToIntervention = (skillId: string) => {
    if (!selectedInterventionSkills.includes(skillId)) {
      setSelectedInterventionSkills(prev => [...prev, skillId]);
    }
    setActiveTab('intervention');
  };

  const handleViewStudentTimeline = (studentName: string) => {
    setTimelineStudent(studentName);
    setActiveTab('timeline');
  };

  // Summary Metrics for Badges
  const totalAlerts = skillsAnalysis.filter(s => s.status === 'reforco').length;
  const avgRate = skillsAnalysis.length > 0 
    ? Math.round(skillsAnalysis.reduce((acc, c) => acc + c.rate, 0) / skillsAnalysis.length) 
    : 0;

  // View Navigation Tabs
  const navTabs = [
    {
      id: 'overview' as DiagnosisSubTab,
      label: 'Raio-X Executivo',
      badge: `${avgRate}% Domínio`,
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      color: 'border-amber-500 text-amber-800 bg-amber-50/70',
      description: 'Visão executiva em 1 minuto e termômetro'
    },
    {
      id: 'heatmap' as DiagnosisSubTab,
      label: 'Mapa de Calor BNCC',
      badge: `${skillsAnalysis.filter(s => s.status === 'consolidada').length} consolidadas`,
      icon: <BarChart3 className="w-4 h-4 text-sky-600" />,
      color: 'border-sky-500 text-sky-800 bg-sky-50/70',
      description: 'Filtro por categorias, matérias e níveis'
    },
    {
      id: 'students' as DiagnosisSubTab,
      label: 'Quadro & Triagem',
      badge: `${activeStudents.length} alunos`,
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      color: 'border-emerald-500 text-emerald-800 bg-emerald-50/70',
      description: 'Tabela 360° e agrupamentos produtivos'
    },
    {
      id: 'intervention' as DiagnosisSubTab,
      label: 'Plano PIP',
      badge: `${totalAlerts} em alerta`,
      badgeAlert: totalAlerts > 0,
      icon: <Compass className="w-4 h-4 text-rose-600" />,
      color: 'border-rose-500 text-rose-800 bg-rose-50/70',
      description: 'Metodologias ativas e recuperação'
    },
    {
      id: 'council' as DiagnosisSubTab,
      label: 'Conselho & Barema',
      badge: 'Oficial',
      icon: <Award className="w-4 h-4 text-indigo-600" />,
      color: 'border-indigo-500 text-indigo-800 bg-indigo-50/70',
      description: 'Dossiê do conselho e matriz para sala'
    },
    {
      id: 'timeline' as DiagnosisSubTab,
      label: 'Evolução Longitudinal',
      badge: timelineStudent ? timelineStudent.split(' ')[0] : 'Individual',
      icon: <TrendingUp className="w-4 h-4 text-teal-600" />,
      color: 'border-teal-500 text-teal-800 bg-teal-50/70',
      description: 'Salto pedagógico nas 4 unidades'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/70">
      {/* Top Identity Header */}
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
              Escola Municipal Raymundo Lemos Santana • Gestão Pedagógica das Aprendizagens
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

          <button
            onClick={() => setIsOrganizerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase shadow-xs transition-all hover:scale-105 active:scale-95"
            title="Definir e organizar quais habilidades serão trabalhadas nesta unidade"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Organizar Bimestre ({plannedSkillIds.length})</span>
          </button>

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

      {/* Robust & Clean SubTab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
          {navTabs.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
                      {item.label}
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

      {/* Active Tab View Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <ExecutiveOverview
            currentGrade={currentGrade}
            currentLetter={currentLetter}
            selectedUnit={selectedUnit}
            activeStudents={activeStudents}
            skillsAnalysis={skillsAnalysis}
            studentsSummary={studentsSummaryList}
            plannedSkillIds={plannedSkillIds}
            onOpenOrganizer={() => setIsOrganizerOpen(true)}
            onNavigateTab={setActiveTab}
            onSelectInterventionSkill={handleAddToIntervention}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView
            skillsAnalysis={skillsAnalysis}
            currentGrade={currentGrade}
            selectedUnit={selectedUnit}
            classData={classData}
            plannedSkillIds={plannedSkillIds}
            onOpenOrganizer={() => setIsOrganizerOpen(true)}
            onSelectStudent={onSelectStudent}
            onAddToIntervention={handleAddToIntervention}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTriageView
            studentsSummary={studentsSummaryList}
            gradeSkills={gradeSkills}
            classData={classData}
            selectedUnit={selectedUnit}
            onSelectStudent={onSelectStudent}
            onViewStudentTimeline={handleViewStudentTimeline}
          />
        )}

        {activeTab === 'intervention' && (
          <InterventionPlanView
            currentGrade={currentGrade}
            currentLetter={currentLetter}
            selectedUnit={selectedUnit}
            classData={classData}
            globalSkills={globalSkills}
            skillsAnalysis={skillsAnalysis}
            selectedInterventionSkills={selectedInterventionSkills}
            onToggleInterventionSkill={handleToggleInterventionSkill}
            onResetToAlertSkills={handleResetToAlertSkills}
          />
        )}

        {activeTab === 'council' && (
          <ClassCouncilView
            currentGrade={currentGrade}
            currentLetter={currentLetter}
            selectedUnit={selectedUnit}
            activeStudents={activeStudents}
            classData={classData}
            gradeSkills={gradeSkills}
            skillsAnalysis={skillsAnalysis}
            studentsSummary={studentsSummaryList}
            plannedSkillIds={plannedSkillIds}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            currentGrade={currentGrade}
            currentLetter={currentLetter}
            activeStudents={activeStudents}
            classData={classData}
            gradeSkills={gradeSkills}
            initialStudent={timelineStudent}
          />
        )}
      </div>

      {/* Unit Skills Organizer Modal */}
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
    </div>
  );
}
