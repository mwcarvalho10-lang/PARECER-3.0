'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  HeartHandshake, 
  TrendingUp, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Shuffle
} from 'lucide-react';
import { StudentSummaryItem, ProductivePair } from './types';
import { Skill, ClassData } from '@/lib/types';

interface StudentsTriageViewProps {
  studentsSummary: StudentSummaryItem[];
  gradeSkills: Skill[];
  classData: ClassData;
  selectedUnit: string;
  onSelectStudent?: (studentName: string) => void;
  onViewStudentTimeline?: (studentName: string) => void;
}

export function StudentsTriageView({
  studentsSummary,
  gradeSkills,
  classData,
  selectedUnit,
  onSelectStudent,
  onViewStudentTimeline
}: StudentsTriageViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low' | 'aee'>('all');
  const [activeTabMode, setActiveTabMode] = useState<'table' | 'groupings'>('table');

  // Filtered students
  const filteredStudents = useMemo(() => {
    return studentsSummary.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }
      if (filterLevel === 'high' && item.rate < 70) return false;
      if (filterLevel === 'medium' && (item.rate < 40 || item.rate >= 70)) return false;
      if (filterLevel === 'low' && item.rate >= 40) return false;
      if (filterLevel === 'aee' && !item.isAee) return false;
      return true;
    });
  }, [studentsSummary, searchQuery, filterLevel]);

  // Suggested Productive Groupings / Tutoria entre pares
  const productivePairs = useMemo<ProductivePair[]>(() => {
    const mentors = studentsSummary.filter(s => s.rate >= 65 && !s.isAee);
    const peersNeedingSupport = studentsSummary.filter(s => s.rate < 50);

    const pairs: ProductivePair[] = [];
    const minLen = Math.min(mentors.length, peersNeedingSupport.length);

    for (let i = 0; i < minLen; i++) {
      const mentor = mentors[i];
      const peer = peersNeedingSupport[i];

      // Skills mentor has that peer doesn't
      const mentorSkills = classData[mentor.name]?.[selectedUnit]?.skills || [];
      const peerSkills = classData[peer.name]?.[selectedUnit]?.skills || [];
      const skillsInCommonTarget = mentorSkills.filter((id: string) => !peerSkills.includes(id)).slice(0, 3);

      pairs.push({
        id: `pair-${i}`,
        mentor: mentor.name,
        peer: peer.name,
        subjectFocus: 'Língua Portuguesa & Matemática',
        skillsInCommonTarget
      });
    }

    return pairs;
  }, [studentsSummary, classData, selectedUnit]);

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Quadro de Acompanhamento Individual &amp; Triagem
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidação de habilidades de cada estudante na <strong>{selectedUnit}</strong> e estratégias de cooperação.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveTabMode('table')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase transition-all ${
                  activeTabMode === 'table'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Quadro Geral
              </button>
              <button
                onClick={() => setActiveTabMode('groupings')}
                className={`px-3 py-1.5 rounded-lg font-black uppercase transition-all flex items-center gap-1.5 ${
                  activeTabMode === 'groupings'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 text-escola-azul" />
                <span>Agrupamentos Produtivos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar aluno por nome..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Nível:
            </span>
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterLevel === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({studentsSummary.length})
            </button>
            <button
              onClick={() => setFilterLevel('high')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterLevel === 'high'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🟢 Alto (≥ 70%) ({studentsSummary.filter(s => s.rate >= 70).length})
            </button>
            <button
              onClick={() => setFilterLevel('medium')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterLevel === 'medium'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              🟡 Médio (40-69%) ({studentsSummary.filter(s => s.rate >= 40 && s.rate < 70).length})
            </button>
            <button
              onClick={() => setFilterLevel('low')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterLevel === 'low'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              🔴 Atenção (&lt; 40%) ({studentsSummary.filter(s => s.rate < 40).length})
            </button>
            <button
              onClick={() => setFilterLevel('aee')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                filterLevel === 'aee'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              AEE ({studentsSummary.filter(s => s.isAee).length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABELA GERAL */}
      {activeTabMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Estudante</th>
                  <th className="py-3.5 px-4 text-center">Status AEE / PEI</th>
                  <th className="py-3.5 px-4 text-center">Habilidades Consolidadas</th>
                  <th className="py-3.5 px-4 text-center">Índice de Domínio</th>
                  <th className="py-3.5 px-4 text-center">Parecer da Unidade</th>
                  <th className="py-3.5 px-4 text-right">Ações Pedagógicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum estudante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((item, idx) => (
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
                            item.rate >= 70 ? 'text-emerald-700' : item.rate >= 40 ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {item.rate}%
                          </span>
                          <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.rate >= 70 ? 'bg-emerald-500' : item.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.rate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.hasObservation ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                            ✓ Preenchido
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
                            onClick={() => onViewStudentTimeline && onViewStudentTimeline(item.name)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                            title="Ver trajetória e salto de aprendizagem"
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Evolução</span>
                          </button>
                          <button
                            onClick={() => onSelectStudent && onSelectStudent(item.name)}
                            className="px-2.5 py-1 rounded-lg bg-escola-azul text-white hover:bg-blue-600 text-[10px] font-black uppercase transition-colors shadow-2xs flex items-center gap-1"
                            title="Editar parecer descritivo do aluno"
                          >
                            <span>Parecer</span>
                            <ArrowRight className="w-3 h-3" />
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
      )}

      {/* VIEW MODE 2: AGRUPAMENTOS PRODUTIVOS (TUTORIA ENTRE PARES) */}
      {activeTabMode === 'groupings' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-3xl border border-blue-200/80">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-escola-azul shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Como Funcionam os Agrupamentos Produtivos
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  A tutoria entre pares combina estudantes com <strong>alto domínio (mentores)</strong> com estudantes em <strong>processo de consolidação</strong>. O aluno mentor consolida seu raciocínio ao verbalizar explicações, enquanto o aluno em reforço recebe apoio próximo e acolhedor na linguagem do próprio colega.
                </p>
              </div>
            </div>
          </div>

          {productivePairs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Não há dados suficientes para gerar agrupamentos produtivos automáticos nesta unidade.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productivePairs.map((pair, idx) => (
                <div 
                  key={pair.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Dupla Produtiva {idx + 1}
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Cooperação Ativa
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-emerald-800 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Estudante Monitor
                      </span>
                      <strong className="block text-xs uppercase text-slate-800 truncate">
                        {pair.mentor}
                      </strong>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-amber-800 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        Estudante em Apoio
                      </span>
                      <strong className="block text-xs uppercase text-slate-800 truncate">
                        {pair.peer}
                      </strong>
                    </div>
                  </div>

                  {pair.skillsInCommonTarget.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Habilidades foco para apoio mútuo:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pair.skillsInCommonTarget.map(skId => (
                          <span 
                            key={skId}
                            className="font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {skId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
