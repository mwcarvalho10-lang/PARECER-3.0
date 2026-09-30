'use client';

import React from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  HelpCircle, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Target,
  HeartHandshake
} from 'lucide-react';
import { subjects } from '@/lib/constants';
import { SkillMasteryAnalysis, StudentSummaryItem, DiagnosisSubTab } from './types';

interface ExecutiveOverviewProps {
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  activeStudents: string[];
  skillsAnalysis: SkillMasteryAnalysis[];
  studentsSummary: StudentSummaryItem[];
  plannedSkillIds?: string[];
  onOpenOrganizer?: () => void;
  onNavigateTab: (tab: DiagnosisSubTab) => void;
  onSelectInterventionSkill?: (skillId: string) => void;
}

export function ExecutiveOverview({
  currentGrade,
  currentLetter,
  selectedUnit,
  activeStudents,
  skillsAnalysis,
  studentsSummary,
  plannedSkillIds = [],
  onOpenOrganizer,
  onNavigateTab,
  onSelectInterventionSkill
}: ExecutiveOverviewProps) {
  // Metrics calculation
  const totalSkills = skillsAnalysis.length;
  const totalStudents = activeStudents.length;

  // Planned skills analysis for active unit
  const plannedSkills = skillsAnalysis.filter(s => plannedSkillIds.includes(s.id));
  const plannedTotal = plannedSkills.length;
  const plannedRatesSum = plannedSkills.reduce((acc, curr) => acc + curr.rate, 0);
  const avgPlannedMastery = plannedTotal > 0 ? Math.round(plannedRatesSum / plannedTotal) : 0;
  const plannedConsolidadas = plannedSkills.filter(s => s.status === 'consolidada').length;
  const plannedReforco = plannedSkills.filter(s => s.status === 'reforco').length;

  const consolidadas = skillsAnalysis.filter(s => s.status === 'consolidada').length;
  const emDesenvolvimento = skillsAnalysis.filter(s => s.status === 'desenvolvimento').length;
  const reforcoColetivo = skillsAnalysis.filter(s => s.status === 'reforco').length;

  const totalRates = skillsAnalysis.reduce((acc, curr) => acc + curr.rate, 0);
  const avgMastery = totalSkills > 0 ? Math.round(totalRates / totalSkills) : 0;

  // Student level breakdown
  const advancedStudents = studentsSummary.filter(s => s.rate >= 70);
  const adequateStudents = studentsSummary.filter(s => s.rate >= 50 && s.rate < 70);
  const basicStudents = studentsSummary.filter(s => s.rate >= 30 && s.rate < 50);
  const criticalStudents = studentsSummary.filter(s => s.rate < 30);
  const aeeStudents = studentsSummary.filter(s => s.isAee);

  // Subject breakdown
  const subjectBreakdown = subjects.map(sub => {
    const subSkills = skillsAnalysis.filter(s => s.subject === sub.id);
    const subTotal = subSkills.length;
    const subRatesSum = subSkills.reduce((acc, curr) => acc + curr.rate, 0);
    const subAvgRate = subTotal > 0 ? Math.round(subRatesSum / subTotal) : 0;
    const subAlerts = subSkills.filter(s => s.status === 'reforco').length;

    return {
      id: sub.id,
      label: sub.label,
      totalSkills: subTotal,
      avgRate: subAvgRate,
      alertsCount: subAlerts
    };
  });

  // Top critical skills (< 50% mastery, ordered from lowest)
  const criticalSkills = [...skillsAnalysis]
    .filter(s => s.rate < 50)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  // Thermometer evaluation
  let statusText = 'Em Desenvolvimento Adequado';
  let statusBadge = 'bg-amber-100 text-amber-900 border-amber-300';
  let thermometerBg = 'from-amber-500 to-amber-600';

  if (avgMastery >= 75) {
    statusText = 'Desempenho Geral Consolidado (Excelente)';
    statusBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    thermometerBg = 'from-emerald-500 to-emerald-600';
  } else if (avgMastery >= 60) {
    statusText = 'Bom Aproveitamento';
    statusBadge = 'bg-sky-100 text-sky-900 border-sky-300';
    thermometerBg = 'from-sky-500 to-sky-600';
  } else if (avgMastery < 40) {
    statusText = 'Atenção Prioritária Necessária';
    statusBadge = 'bg-rose-100 text-rose-900 border-rose-300';
    thermometerBg = 'from-rose-500 to-rose-600';
  }

  return (
    <div className="space-y-6">
      {/* Hero: Raio-X Executivo em 1 Minuto */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Raio-X em 1 Minuto
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                {statusText}
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-serif text-white">
              Diagnóstico Geral da Turma • {currentGrade}º {currentLetter}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Análise executiva de consolidação de aprendizagens na <strong>{selectedUnit}</strong>. 
              {reforcoColetivo > 0 ? (
                <> A turma apresenta <span className="text-rose-300 font-bold">{reforcoColetivo} habilidades em defasagem coletiva</span> que exigem intervenção focal.</>
              ) : (
                <> Todas as habilidades avaliadas apresentam índice de consolidação satisfatório.</>
              )}
            </p>
          </div>

          {/* Thermometer / Mastery Big Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex items-center gap-5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
                Índice Global de Domínio
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white">{avgMastery}%</span>
                <span className="text-[11px] text-slate-300 font-bold">médio</span>
              </div>
              <div className="w-40 bg-white/20 h-2.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${thermometerBg} transition-all duration-700`}
                  style={{ width: `${avgMastery}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('heatmap')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 self-center shrink-0"
            >
              <span>Ver Mapa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Unit Planned Curriculum Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Planejamento da {selectedUnit}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {plannedTotal} de {totalSkills} habilidades trabalhadas nesta etapa
              </span>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">
              Domínio médio nas habilidades da unidade: <span className="text-emerald-700 font-black">{avgPlannedMastery}%</span> ({plannedConsolidadas} consolidadas, {plannedReforco} em defasagem)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {onOpenOrganizer && (
            <button
              onClick={onOpenOrganizer}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95"
            >
              <span>Organizar Habilidades do Bimestre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Cards de Indicadores Chave (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Estudantes Matriculados
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800">{totalStudents}</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-500">
              <span>{aeeStudents.length} com AEE / PEI</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              Consolidadas (≥ 70%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">{consolidadas}</div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              {totalSkills > 0 ? Math.round((consolidadas / totalSkills) * 100) : 0}% da matriz da série
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
              Em Desenvolvimento (50-69%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">{emDesenvolvimento}</div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Ritmo de fixação progressiva
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/90 bg-rose-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
              Reforço Coletivo (&lt; 50%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-black text-rose-700">{reforcoColetivo}</span>
              {reforcoColetivo > 0 && (
                <button
                  onClick={() => onNavigateTab('intervention')}
                  className="text-[9px] bg-rose-600 hover:bg-rose-700 text-white font-black uppercase px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                >
                  Plano PIP ➔
                </button>
              )}
            </div>
            <p className="text-[11px] font-bold text-rose-600 mt-1">
              Exigem intervenção imediata
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Níveis dos Alunos + Desempenho por Matéria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distribuição dos Alunos por Nível de Domínio */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Distribuição dos Estudantes por Nível
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Classificação baseada nas habilidades consolidadas na {selectedUnit}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-[10px] font-black uppercase text-escola-azul hover:underline"
            >
              Ver Quadro Completo ➔
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Avançado / Pleno (≥ 70%)
                </span>
                <span className="tabular-nums font-black text-slate-700">
                  {advancedStudents.length} alunos ({totalStudents > 0 ? Math.round((advancedStudents.length / totalStudents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStudents > 0 ? (advancedStudents.length / totalStudents) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-sky-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Adequado (50% a 69%)
                </span>
                <span className="tabular-nums font-black text-slate-700">
                  {adequateStudents.length} alunos ({totalStudents > 0 ? Math.round((adequateStudents.length / totalStudents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStudents > 0 ? (adequateStudents.length / totalStudents) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Básico (30% a 49%)
                </span>
                <span className="tabular-nums font-black text-slate-700">
                  {basicStudents.length} alunos ({totalStudents > 0 ? Math.round((basicStudents.length / totalStudents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStudents > 0 ? (basicStudents.length / totalStudents) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Abaixo do Básico / Crítico (&lt; 30%)
                </span>
                <span className="tabular-nums font-black text-rose-700">
                  {criticalStudents.length} alunos ({totalStudents > 0 ? Math.round((criticalStudents.length / totalStudents) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalStudents > 0 ? (criticalStudents.length / totalStudents) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Destaque AEE */}
          {aeeStudents.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0" />
                <span className="text-[11px] font-bold text-purple-900">
                  <strong>{aeeStudents.length} estudante(s) AEE / PEI</strong> com adaptações curriculares ativas.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('students')}
                className="text-[10px] font-black uppercase text-purple-800 hover:underline shrink-0 ml-2"
              >
                Filtrar AEE
              </button>
            </div>
          )}
        </div>

        {/* Desempenho por Componente Curricular */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-escola-azul" />
                Desempenho por Disciplina
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Média de fixação das habilidades em cada componente curricular
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('heatmap')}
              className="text-[10px] font-black uppercase text-escola-azul hover:underline"
            >
              Ver Habilidades ➔
            </button>
          </div>

          <div className="space-y-3.5">
            {subjectBreakdown.map(sub => {
              let barColor = 'bg-emerald-500';
              if (sub.avgRate < 50) barColor = 'bg-rose-500';
              else if (sub.avgRate < 70) barColor = 'bg-amber-500';

              return (
                <div key={sub.id} className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-800 uppercase font-black">
                      {sub.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {sub.alertsCount > 0 && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          {sub.alertsCount} em alerta
                        </span>
                      )}
                      <span className="font-mono text-sm font-black text-slate-800">
                        {sub.avgRate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${sub.avgRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Habilidades Críticas / Defasagens que Exigem Ação Imediata */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase text-rose-700 tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Prioridades Pedagógicas Urgentes (Taxa &lt; 50%)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Habilidades com menor taxa de consolidação que necessitam de intervenção paralela
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('intervention')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Gerar Ficha de Intervenção</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {criticalSkills.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/40 rounded-2xl border border-emerald-200/80">
            <span className="text-3xl mb-1 block">🎉</span>
            <p className="text-xs font-black uppercase text-emerald-800">
              Excelente! Nenhuma habilidade em alerta crítico nesta unidade.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Todas as habilidades avaliadas alcançaram taxa de domínio superior a 50%.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalSkills.map(skill => (
              <div 
                key={skill.id}
                className="p-4 rounded-2xl border border-rose-200 bg-rose-50/20 hover:bg-rose-50/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-xs font-black text-rose-900 uppercase">
                      {skill.id}
                    </span>
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      {skill.rate}% domínio
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-3 leading-relaxed">
                    {skill.report}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-500">
                    {skill.pendingStudents.length} alunos precisam de apoio
                  </span>
                  <button
                    onClick={() => {
                      if (onSelectInterventionSkill) {
                        onSelectInterventionSkill(skill.id);
                      }
                      onNavigateTab('intervention');
                    }}
                    className="font-black text-rose-700 hover:text-rose-900 uppercase flex items-center gap-1"
                  >
                    <span>Intervir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
