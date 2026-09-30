'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  Printer, 
  Lightbulb, 
  BookOpen, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Layers
} from 'lucide-react';
import { Skill, ClassData } from '@/lib/types';
import { subjects } from '@/lib/constants';
import { SkillMasteryAnalysis } from './types';
import { SchoolLogo } from '../SchoolLogo';

interface InterventionPlanViewProps {
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  classData: ClassData;
  globalSkills: Skill[];
  skillsAnalysis: SkillMasteryAnalysis[];
  selectedInterventionSkills: string[];
  onToggleInterventionSkill: (skillId: string) => void;
  onResetToAlertSkills: () => void;
}

export function InterventionPlanView({
  currentGrade,
  currentLetter,
  selectedUnit,
  classData,
  globalSkills,
  skillsAnalysis,
  selectedInterventionSkills,
  onToggleInterventionSkill,
  onResetToAlertSkills
}: InterventionPlanViewProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Intervention Items Builder
  const interventionItems = selectedInterventionSkills.map(id => {
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
    } else if (skill?.subject === 'historia') {
      methodology = 'História Oral e Memória: exploração da identidade individual e comunitária.';
      activity = 'Linha do tempo biográfica, árvore genealógica e entrevistas familiares.';
      resources = 'Fotografias antigas, relatos orais, mapas do bairro e cartazes.';
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

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
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
              Ações metodológicas ativas voltadas para habilidades em defasagem na <strong>{selectedUnit}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetToAlertSkills}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recarregar Alertas (&lt; 50%)</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={interventionItems.length === 0}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Plano PIP</span>
          </button>
        </div>
      </div>

      {/* List of Intervention Actions */}
      {interventionItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
          <span className="text-4xl mb-2">🎉</span>
          <h4 className="text-sm font-black uppercase text-slate-700">
            Nenhuma habilidade no Plano de Intervenção
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Nenhuma habilidade em alerta crítico foi selecionada para intervenção imediata nesta unidade.
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
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Domínio da Turma: {item.rate}%
                  </span>
                </div>

                <div className="text-xs font-bold text-rose-700">
                  {item.pending.length} estudantes no grupo de intervenção
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

                {/* Students participating in intervention */}
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">
                    Estudantes que participarão do grupo focal:
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
                            <span className="text-[8px] bg-purple-200 text-purple-900 px-1 rounded font-black">
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

      {/* PRINT MODAL: PLANO DE INTERVENÇÃO PEDAGÓGICA */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-700" />
                <h3 className="text-sm font-black text-slate-800 uppercase">
                  Impressão Oficial do Plano de Intervenção Pedagógica (PIP)
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
                  onClick={() => setIsPrintModalOpen(false)}
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
                    PLANO DE INTERVENÇÃO PEDAGÓGICA &amp; RECUPERAÇÃO PARALELA (PIP)
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
                      <span className="text-slate-500 block text-[9px] uppercase">Emissão:</span>
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
                        <strong>Habilidade:</strong> {item.skill?.report}
                      </p>
                      <p className="leading-tight">
                        <strong>Metodologia Ativa Proposta:</strong> {item.methodology}
                      </p>
                      <p className="leading-tight">
                        <strong>Atividade Prática em Sala:</strong> {item.activity}
                      </p>
                      <p className="leading-tight">
                        <strong>Recursos Didáticos:</strong> {item.resources}
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
