'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Layers,
  HeartHandshake,
  SlidersHorizontal,
  Target,
  Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subjects } from '@/lib/constants';
import { SkillMasteryAnalysis } from './types';
import { ClassData } from '@/lib/types';

interface HeatmapViewProps {
  skillsAnalysis: SkillMasteryAnalysis[];
  currentGrade: string;
  selectedUnit: string;
  classData: ClassData;
  plannedSkillIds?: string[];
  onOpenOrganizer?: () => void;
  onTogglePlannedSkill?: (skillId: string) => void;
  onSelectStudent?: (studentName: string) => void;
  onAddToIntervention?: (skillId: string) => void;
}

export function HeatmapView({
  skillsAnalysis,
  currentGrade,
  selectedUnit,
  classData,
  plannedSkillIds = [],
  onOpenOrganizer,
  onTogglePlannedSkill,
  onSelectStudent,
  onAddToIntervention
}: HeatmapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'reforco' | 'desenvolvimento' | 'consolidada'>('all');
  const [scopeFilter, setScopeFilter] = useState<'planned' | 'all'>('planned');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  // Available categories depending on selected subject and grade
  const availableCategories = useMemo(() => {
    if (subjectFilter === 'portugues') {
      if (currentGrade === '1' || currentGrade === '2') {
        return [
          { id: 'all', label: 'Todas as Categorias' },
          { id: 'leitura', label: 'Leitura & Compreensão', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 6; } },
          { id: 'producao', label: 'Produção & Revisão', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 7 && n <= 8; } },
          { id: 'oralidade', label: 'Comunicação Oral', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 9 && n <= 10; } },
          { id: 'escrita_orto', label: 'Escrita & Ortografia', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 11; } },
        ];
      } else {
        return [
          { id: 'all', label: 'Todas as Categorias' },
          { id: 'leitura', label: 'Leitura & Fluência', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 5; } },
          { id: 'producao', label: 'Produção Textual', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 6 && n <= 12; } },
          { id: 'oralidade', label: 'Comunicação Oral', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 13 && n <= 14; } },
          { id: 'analise', label: 'Gramática & Análise', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 15; } },
        ];
      }
    }

    if (subjectFilter === 'matematica') {
      return [
        { id: 'all', label: 'Todas as Categorias' },
        { id: 'aprendizagens', label: 'Conceitos Gerais', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n <= 2; } },
        { id: 'numeros', label: 'Números e Operações', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 3 && n <= 7; } },
        { id: 'geometria', label: 'Espaço e Forma', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 8 && n <= 9; } },
        { id: 'grandezas', label: 'Grandezas e Medidas', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 10 && n <= 12; } },
        { id: 'estatistica', label: 'Tratamento da Informação', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 13; } },
      ];
    }

    if (subjectFilter === 'historia') {
      return [
        { id: 'all', label: 'Todas as Categorias' },
        { id: 'historia', label: 'História (HI)', match: (id: string) => id.includes('HI') },
        { id: 'geografia', label: 'Geografia (GE)', match: (id: string) => id.includes('GE') },
      ];
    }

    return [];
  }, [subjectFilter, currentGrade]);

  // Reset category filter when subject changes
  const handleSubjectChange = (newSubject: string) => {
    setSubjectFilter(newSubject);
    setCategoryFilter('all');
  };

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skillsAnalysis.filter(skill => {
      // Unit scope filter (Trabalhadas na Unidade vs Todas)
      if (scopeFilter === 'planned' && plannedSkillIds.length > 0) {
        if (!plannedSkillIds.includes(skill.id)) {
          return false;
        }
      }

      // Subject filter
      if (subjectFilter !== 'all' && skill.subject !== subjectFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && availableCategories.length > 0) {
        const cat = availableCategories.find(c => c.id === categoryFilter);
        if (cat && cat.match && !cat.match(skill.id)) {
          return false;
        }
      }

      // Mastery status filter
      if (masteryFilter !== 'all' && skill.status !== masteryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = skill.id.toLowerCase().includes(query);
        const matchReport = skill.report.toLowerCase().includes(query);
        if (!matchId && !matchReport) {
          return false;
        }
      }

      return true;
    });
  }, [skillsAnalysis, subjectFilter, categoryFilter, availableCategories, masteryFilter, searchQuery, scopeFilter, plannedSkillIds]);

  // Counts for pills
  const counts = useMemo(() => {
    const total = skillsAnalysis.length;
    const consolidadas = skillsAnalysis.filter(s => s.status === 'consolidada').length;
    const emDesenvolvimento = skillsAnalysis.filter(s => s.status === 'desenvolvimento').length;
    const reforco = skillsAnalysis.filter(s => s.status === 'reforco').length;
    return { total, consolidadas, emDesenvolvimento, reforco };
  }, [skillsAnalysis]);

  return (
    <div className="space-y-6">
      {/* Bimestre Curriculum Organizer Filter Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Organizador Curricular • {selectedUnit}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                {plannedSkillIds.length} planejadas
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black uppercase font-serif tracking-tight text-white mt-0.5">
              Habilidades Trabalhadas na Unidade
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Segmented Filter Mode */}
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setScopeFilter('planned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                scopeFilter === 'planned'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Apenas da Unidade ({plannedSkillIds.length})</span>
            </button>
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Todas ({skillsAnalysis.length})</span>
            </button>
          </div>

          {onOpenOrganizer && (
            <button
              onClick={onOpenOrganizer}
              className="px-3.5 py-1.5 bg-escola-azul hover:bg-blue-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
              title="Abrir organizador bimestral para escolher habilidades"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Organizar Habilidades</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Subject Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar código da habilidade (ex: EF01LP02) ou palavra-chave..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-escola-azul focus:bg-white transition-all uppercase placeholder:normal-case"
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

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleSubjectChange('all')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                subjectFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas as Matérias
            </button>
            {subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSubjectChange(sub.id)}
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

        {/* Dynamic Category Filter Pills */}
        {availableCategories.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-1">
              <Layers className="w-3 h-3 text-escola-azul" /> Categoria:
            </span>
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Status Mastery Filter Pills */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Nível de Domínio:
          </span>
          <button
            onClick={() => setMasteryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              masteryFilter === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({counts.total})
          </button>
          <button
            onClick={() => setMasteryFilter('reforco')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              masteryFilter === 'reforco'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            🔴 Reforço Coletivo ({counts.reforco})
          </button>
          <button
            onClick={() => setMasteryFilter('desenvolvimento')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              masteryFilter === 'desenvolvimento'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            🟡 Em Desenvolvimento ({counts.emDesenvolvimento})
          </button>
          <button
            onClick={() => setMasteryFilter('consolidada')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              masteryFilter === 'consolidada'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🟢 Consolidada ({counts.consolidadas})
          </button>
        </div>
      </div>

      {/* Skills Heatmap List */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">🔍</span>
            <h4 className="text-sm font-black uppercase text-slate-700">
              Nenhuma habilidade encontrada
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Tente redefinir os filtros de disciplina, categoria ou ajustar o termo de pesquisa.
            </p>
          </div>
        ) : (
          filteredSkills.map(item => {
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                  item.status === 'reforco' ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div 
                  onClick={() => setExpandedSkillId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color || '#0ea5e9' }}
                      />
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-900">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {subjects.find(s => s.id === item.subject)?.label || item.subject}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${heatBadge}`}>
                        {labelText}
                      </span>
                      {plannedSkillIds.includes(item.id) ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          🎯 {selectedUnit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 border border-slate-200 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium">
                          Outra Etapa
                        </span>
                      )}
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

                  {/* Heat progress bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${heatBg}`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {item.report}
                  </p>
                </div>

                {/* Expanded Details: Consolidated vs Pending Students */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Students needing support */}
                        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-black text-rose-700 uppercase flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Necessitam de Reforço ({item.pendingStudents.length})
                            </span>
                          </div>
                          {item.pendingStudents.length === 0 ? (
                            <p className="text-slate-400 italic text-[11px]">
                              🎉 Todos os estudantes da turma consolidaram esta aprendizagem!
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                              {item.pendingStudents.map(studentName => {
                                const isAee = classData[studentName]?.isAee;
                                return (
                                  <button
                                    key={studentName}
                                    onClick={() => onSelectStudent && onSelectStudent(studentName)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                                    title="Clique para ir ao parecer deste aluno"
                                  >
                                    <span>•</span> {studentName}
                                    {isAee && (
                                      <span className="text-[8px] bg-purple-200 text-purple-900 px-1 rounded font-black">
                                        AEE
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Students who mastered */}
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-black text-emerald-700 uppercase flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Habilidade Consolidada ({item.masteredStudents.length})
                            </span>
                          </div>
                          {item.masteredStudents.length === 0 ? (
                            <p className="text-slate-400 italic text-[11px]">
                              Nenhum estudante atingiu esta habilidade ainda nesta unidade.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                              {item.masteredStudents.map(studentName => (
                                <span
                                  key={studentName}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase"
                                >
                                  ✓ {studentName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action to add to intervention plan */}
                      {item.status === 'reforco' && onAddToIntervention && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-[11px]">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Atenção Pedagógica:</strong> Esta habilidade está com taxa de domínio inferior a 50%. Deseja priorizá-la no Plano de Intervenção Pedagógica?
                            </span>
                          </div>
                          <button
                            onClick={() => onAddToIntervention(item.id)}
                            className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] shadow-2xs transition-colors"
                          >
                            Adicionar ao PIP ➔
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
  );
}
