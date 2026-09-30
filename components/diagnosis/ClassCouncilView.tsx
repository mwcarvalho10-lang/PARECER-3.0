'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  CheckSquare, 
  Square, 
  Award, 
  AlertTriangle, 
  BookOpen, 
  Users, 
  Layers,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Skill, ClassData } from '@/lib/types';
import { subjects } from '@/lib/constants';
import { SkillMasteryAnalysis, StudentSummaryItem } from './types';
import { SchoolLogo } from '../SchoolLogo';

interface ClassCouncilViewProps {
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  activeStudents: string[];
  classData: ClassData;
  gradeSkills: Skill[];
  skillsAnalysis: SkillMasteryAnalysis[];
  studentsSummary: StudentSummaryItem[];
  plannedSkillIds?: string[];
}

export function ClassCouncilView({
  currentGrade,
  currentLetter,
  selectedUnit,
  activeStudents,
  classData,
  gradeSkills,
  skillsAnalysis,
  studentsSummary,
  plannedSkillIds = []
}: ClassCouncilViewProps) {
  const [subMode, setSubMode] = useState<'council' | 'barema'>('council');

  // Barema state
  const [baremaMode, setBaremaMode] = useState<'filled' | 'blank'>('filled');
  const [selectedBaremaSkills, setSelectedBaremaSkills] = useState<string[]>(() => {
    return gradeSkills.slice(0, 10).map(s => s.id);
  });
  const [baremaSubjectFilter, setBaremaSubjectFilter] = useState('all');
  const [isPrintBaremaOpen, setIsPrintBaremaOpen] = useState(false);
  const [isPrintCouncilOpen, setIsPrintCouncilOpen] = useState(false);

  // Selected skill objects
  const baremaSelectedObjects = useMemo(() => {
    return selectedBaremaSkills
      .map(id => gradeSkills.find(s => s.id === id))
      .filter((s): s is Skill => Boolean(s));
  }, [selectedBaremaSkills, gradeSkills]);

  // Council Highlights
  const councilSummary = useMemo(() => {
    const totalStudents = activeStudents.length;
    const highCount = studentsSummary.filter(s => s.rate >= 70).length;
    const mediumCount = studentsSummary.filter(s => s.rate >= 40 && s.rate < 70).length;
    const lowCount = studentsSummary.filter(s => s.rate < 40).length;
    const aeeCount = studentsSummary.filter(s => s.isAee).length;

    const consolidatedSkills = skillsAnalysis.filter(s => s.status === 'consolidada');
    const criticalSkills = skillsAnalysis.filter(s => s.status === 'reforco');

    return {
      totalStudents,
      highCount,
      mediumCount,
      lowCount,
      aeeCount,
      consolidatedSkills,
      criticalSkills
    };
  }, [activeStudents, studentsSummary, skillsAnalysis]);

  return (
    <div className="space-y-6">
      {/* Selector SubMode Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-escola-azul" />
            Conselho de Classe &amp; Barema Oficial
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Documentação pedagógica oficial para a <strong>{selectedUnit}</strong>.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setSubMode('council')}
            className={`px-4 py-2 rounded-xl font-black uppercase transition-all flex items-center gap-1.5 ${
              subMode === 'council'
                ? 'bg-escola-azul text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Dossiê do Conselho</span>
          </button>
          <button
            onClick={() => setSubMode('barema')}
            className={`px-4 py-2 rounded-xl font-black uppercase transition-all flex items-center gap-1.5 ${
              subMode === 'barema'
                ? 'bg-escola-azul text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Matriz &amp; Barema</span>
          </button>
        </div>
      </div>

      {/* ===================== SUBMODE 1: DOSSIÊ DO CONSELHO DE CLASSE ===================== */}
      {subMode === 'council' && (
        <div className="space-y-6">
          {/* Action Hero */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-escola-azul" />
                Síntese Deliberativa para o Conselho de Classe
              </h4>
              <p className="text-xs text-slate-500">
                Relatório executivo estruturado com aproveitamento global, pontos fortes, desafios e encaminhamentos oficiais.
              </p>
            </div>

            <button
              onClick={() => setIsPrintCouncilOpen(true)}
              className="px-5 py-2.5 bg-escola-azul hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Dossiê do Conselho</span>
            </button>
          </div>

          {/* Cards de Resumo para o Conselho */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Aproveitamento Pleno
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {councilSummary.highCount} alunos
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Domínio igual ou superior a 70%
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Em Desenvolvimento
              </span>
              <div className="text-2xl font-black text-amber-600">
                {councilSummary.mediumCount} alunos
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Domínio entre 40% e 69%
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Alerta Prioritário
              </span>
              <div className="text-2xl font-black text-rose-600">
                {councilSummary.lowCount} alunos
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Exigem intervenção e recuperação
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Estudantes AEE / PEI
              </span>
              <div className="text-2xl font-black text-purple-700">
                {councilSummary.aeeCount} alunos
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                Currículo adaptado
              </p>
            </div>
          </div>

          {/* Seção Pedagógica: Fortalezas e Fragilidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pontos Fortes Consolidados */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                  Pontos Fortes da Turma ({councilSummary.consolidatedSkills.length} habilidades)
                </h4>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {councilSummary.consolidatedSkills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma habilidade consolidada acima de 70%.</p>
                ) : (
                  councilSummary.consolidatedSkills.slice(0, 8).map(sk => (
                    <div key={sk.id} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                      <div className="flex items-center justify-between font-mono font-black text-[10px] text-emerald-800">
                        <span>{sk.id}</span>
                        <span>{sk.rate}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {sk.report}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fragilidades e Encaminhamentos */}
            <div className="bg-white p-5 rounded-3xl border border-rose-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black uppercase text-rose-900 tracking-wider">
                  Fragilidades Críticas ({councilSummary.criticalSkills.length} habilidades)
                </h4>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {councilSummary.criticalSkills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma defasagem abaixo de 50% na turma.</p>
                ) : (
                  councilSummary.criticalSkills.map(sk => (
                    <div key={sk.id} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                      <div className="flex items-center justify-between font-mono font-black text-[10px] text-rose-800">
                        <span>{sk.id}</span>
                        <span>{sk.rate}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {sk.report}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SUBMODE 2: MATRIZ & BAREMA AVALIATIVO ===================== */}
      {subMode === 'barema' && (
        <div className="space-y-6">
          {/* Barema Toolbar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
                    Em Branco (Sala)
                  </button>
                </div>

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
              </div>

              <div className="flex items-center gap-2">
                {plannedSkillIds.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedBaremaSkills(plannedSkillIds);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase transition-colors"
                    title={`Selecionar as ${plannedSkillIds.length} habilidades planejadas para esta unidade`}
                  >
                    🎯 Habilidades da {selectedUnit} ({plannedSkillIds.length})
                  </button>
                )}
                <button
                  onClick={() => {
                    const target = gradeSkills.filter(s => baremaSubjectFilter === 'all' || s.subject === baremaSubjectFilter);
                    setSelectedBaremaSkills(prev => Array.from(new Set([...prev, ...target.map(s => s.id)])));
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
                  onClick={() => setIsPrintBaremaOpen(true)}
                  disabled={selectedBaremaSkills.length === 0}
                  className="px-4 py-2 bg-escola-azul text-white text-xs font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Barema</span>
                </button>
              </div>
            </div>

            {/* Selection chips */}
            <div className="max-h-44 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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

          {/* Table Preview */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Matriz de Habilidades da Turma
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                {activeStudents.length} estudantes x {selectedBaremaSkills.length} habilidades
              </span>
            </div>

            {selectedBaremaSkills.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Selecione habilidades acima para visualizar o barema.
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

      {/* PRINT MODAL: BAREMA */}
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
                      <span className="text-slate-500 block text-[9px] uppercase">Habilidades:</span>
                      <span>{baremaSelectedObjects.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Estudantes:</span>
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

                {/* Table */}
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

      {/* PRINT MODAL: DOSSIÊ DO CONSELHO */}
      {isPrintCouncilOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-escola-azul" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão Oficial do Dossiê do Conselho de Classe
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
                  onClick={() => setIsPrintCouncilOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              <div id="printable-barema" className="bg-white p-8 max-w-3xl w-full shadow-lg border border-slate-200 rounded-lg text-slate-900 font-sans print:shadow-none print:border-none print:p-0">
                <div className="border-b-2 border-slate-800 pb-4 mb-5 text-center flex flex-col items-center">
                  <SchoolLogo size="lg" showText={false} className="mb-2" />
                  <h1 className="text-base font-black uppercase tracking-tight text-slate-900 font-serif">
                    ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    ATA EXECUTIVA &amp; DOSSIÊ DO CONSELHO DE CLASSE
                  </h2>
                  <h3 className="text-xs font-black uppercase tracking-widest text-escola-azul mt-1">
                    ANO LETIVO 2026 • {selectedUnit.toUpperCase()}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-[10px] font-bold text-left w-full">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Turma:</span>
                      <span>{currentGrade}º ANO &quot;{currentLetter}&quot;</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Total de Estudantes:</span>
                      <span>{activeStudents.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Estudantes AEE:</span>
                      <span>{councilSummary.aeeCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Data do Conselho:</span>
                      <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Quadro Estatístico */}
                <div className="grid grid-cols-3 gap-2 border border-slate-400 p-3 rounded text-[10px] mb-4 text-center">
                  <div>
                    <span className="block text-slate-500 uppercase">Aproveitamento Pleno</span>
                    <strong className="text-xs text-emerald-800">{councilSummary.highCount} ({Math.round((councilSummary.highCount / (activeStudents.length || 1)) * 100)}%)</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Em Desenvolvimento</span>
                    <strong className="text-xs text-amber-800">{councilSummary.mediumCount} ({Math.round((councilSummary.mediumCount / (activeStudents.length || 1)) * 100)}%)</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 uppercase">Atenção Prioritária</span>
                    <strong className="text-xs text-rose-800">{councilSummary.lowCount} ({Math.round((councilSummary.lowCount / (activeStudents.length || 1)) * 100)}%)</strong>
                  </div>
                </div>

                {/* Deliberações da Turma */}
                <div className="space-y-3 mb-6 text-[10px] leading-relaxed">
                  <div>
                    <strong className="block uppercase text-slate-800 mb-0.5">1. Síntese do Aproveitamento da Turma:</strong>
                    <p className="border border-slate-300 p-2.5 rounded bg-slate-50">
                      A turma do {currentGrade}º Ano &quot;{currentLetter}&quot; encerra a {selectedUnit} com índice global satisfatório de consolidação de aprendizagens. Foram identificados pontos de destaque no engajamento coletivo e consolidação das habilidades essenciais, com necessidade de acompanhamento específico para o grupo em atenção pedagógica.
                    </p>
                  </div>

                  <div>
                    <strong className="block uppercase text-slate-800 mb-0.5">2. Encaminhamentos Deliberados pelo Conselho:</strong>
                    <p className="border border-slate-300 p-2.5 rounded bg-slate-50">
                      • Aplicação do Plano de Intervenção Pedagógica (PIP) nas habilidades com taxa inferior a 50%.<br />
                      • Fortalecimento de metodologias ativas com tutoria entre pares e ateliês didáticos.<br />
                      • Atendimento contínuo aos estudantes da Educação Especial (AEE/PEI) com adaptações curriculares.<br />
                      • Convocação de responsáveis dos estudantes em atenção prioritária para alinhamento pedagógico.
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-12 text-center text-[10px]">
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Professor(a) Regente
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Coordenação Pedagógica
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    Direção Escolar
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
