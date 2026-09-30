'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Printer, 
  ArrowRight, 
  User, 
  HeartHandshake, 
  BookOpen, 
  CheckCircle2 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ClassData, Skill } from '@/lib/types';
import { units } from '@/lib/constants';
import { SchoolLogo } from '../SchoolLogo';

interface TimelineViewProps {
  currentGrade: string;
  currentLetter: string;
  activeStudents: string[];
  classData: ClassData;
  gradeSkills: Skill[];
  initialStudent?: string;
}

export function TimelineView({
  currentGrade,
  currentLetter,
  activeStudents,
  classData,
  gradeSkills,
  initialStudent
}: TimelineViewProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>(() => {
    return initialStudent || activeStudents[0] || '';
  });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  React.useEffect(() => {
    if (initialStudent && activeStudents.includes(initialStudent)) {
      setSelectedStudent(initialStudent);
    } else if (!selectedStudent && activeStudents.length > 0) {
      setSelectedStudent(activeStudents[0]);
    }
  }, [initialStudent, activeStudents, selectedStudent]);

  // Timeline progression calculation
  const studentTimelineData = useMemo(() => {
    if (!selectedStudent || !classData[selectedStudent]) return [];

    let accumulatedSkills = new Set<string>();

    return units.map((u) => {
      const unitData = classData[selectedStudent]?.[u];
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
  }, [selectedStudent, classData, gradeSkills]);

  // Salto de Aprendizagem Jump calculation
  const timelineJump = useMemo(() => {
    if (!studentTimelineData.length) return { initial: 0, current: 0, diff: 0, pctJump: 0 };
    const initial = studentTimelineData[0]?.count || 0;
    const current = studentTimelineData[studentTimelineData.length - 1]?.count || 0;
    const diff = current - initial;
    const total = gradeSkills.length || 1;
    const pctJump = Math.round((diff / total) * 100);
    return { initial, current, diff, pctJump };
  }, [studentTimelineData, gradeSkills]);

  const isAee = classData[selectedStudent]?.isAee;

  return (
    <div className="space-y-6">
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
              Acompanhamento contínuo da evolução da aprendizagem pelas 4 unidades letivas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase outline-none focus:border-teal-500 max-w-xs"
          >
            {activeStudents.map(studentName => (
              <option key={studentName} value={studentName}>
                {studentName} {classData[studentName]?.isAee ? '(AEE/PEI)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!selectedStudent}
            className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase transition-all shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Resumo do Aluno e Salto */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-teal-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase backdrop-blur-xs">
                Perfil Individual
              </span>
              {isAee && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-400 text-purple-950 text-[10px] font-black uppercase flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3" />
                  AEE / Adaptação Curricular
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-serif text-white">
              {selectedStudent || 'Nenhum Aluno Selecionado'}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1">
              {currentGrade}º Ano &quot;{currentLetter}&quot; • Escola Municipal Raymundo Lemos Santana
            </p>
          </div>

          {/* Salto Card */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
            <div>
              <span className="text-[10px] text-teal-200 uppercase font-black block">
                Partida (I Unidade)
              </span>
              <span className="text-2xl font-black">{timelineJump.initial}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-teal-300" />
            <div>
              <span className="text-[10px] text-teal-200 uppercase font-black block">
                Atual Consolidada
              </span>
              <span className="text-2xl font-black">{timelineJump.current}</span>
            </div>
            <div className="pl-4 border-l border-white/20">
              <span className="text-[10px] text-teal-200 uppercase font-black block">
                Salto Global
              </span>
              <span className="text-2xl font-black text-lime-300">
                +{timelineJump.diff} ({timelineJump.pctJump}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart: Progression Curve */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Curva de Aquisição Cumulativa por Unidade
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Evolução do número de habilidades adquiridas pelo estudante
            </p>
          </div>
          <span className="text-xs font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
            Meta Curricular: {gradeSkills.length} Habilidades
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

      {/* Stepper Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {studentTimelineData.map((step, idx) => (
          <div 
            key={step.unit}
            className={`p-4 rounded-2xl border transition-all ${
              step.count > 0 
                ? 'bg-white border-slate-200 shadow-2xs' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
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

      {/* PRINT MODAL: EVOLUÇÃO LONGITUDINAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão da Ficha de Evolução Longitudinal
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
                  onClick={() => setIsPrintModalOpen(false)}
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
                    ENSINO FUNDAMENTAL I - EJA
                  </h2>
                  <h3 className="text-xs font-black uppercase tracking-widest text-teal-800 mt-1">
                    RELATÓRIO DE EVOLUÇÃO LONGITUDINAL DA APRENDIZAGEM
                  </h3>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 text-[11px] font-bold text-left w-full">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Estudante:</span>
                      <span className="text-sm">{selectedStudent} {isAee ? '(AEE / PEI)' : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Turma / Ano Letivo:</span>
                      <span>{currentGrade}º ANO &quot;{currentLetter}&quot; • 2026</span>
                    </div>
                  </div>
                </div>

                <div className="border border-teal-300 bg-teal-50/40 p-4 rounded-xl mb-6 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-teal-900 block">
                      Partida (I Unidade)
                    </span>
                    <strong className="text-sm">{timelineJump.initial} habilidades</strong>
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-700" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-teal-900 block">
                      Total Consolidado
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
    </div>
  );
}
