'use client';

import React from 'react';
import { Printer, X, Heart, Star, Sparkles, BookOpen } from 'lucide-react';
import { Skill, ClassData } from '@/lib/types';
import { SchoolLogo } from './SchoolLogo';

interface FamilyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  classData: ClassData;
  globalSkills: Skill[];
}

export function FamilyReportModal({
  isOpen,
  onClose,
  studentName,
  currentGrade,
  currentLetter,
  selectedUnit,
  classData,
  globalSkills
}: FamilyReportModalProps) {
  if (!isOpen || !studentName) return null;

  const studentData = classData[studentName] || {};
  const unitData = studentData[selectedUnit] || { skills: [], observation: '' };
  const masteredSkillIds: string[] = unitData.skills || [];

  // Filter skills belonging to this grade
  const masteredSkills = globalSkills
    .filter(s => s.grade === currentGrade && masteredSkillIds.includes(s.id))
    .slice(0, 8); // Top 8 highlighted for 1-page aesthetic

  const observationText = unitData.observation?.trim() || "Estudante participativo(a), demonstrando dedicação e interesse contínuo nas atividades pedagógicas da etapa.";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Controls Bar (hidden during print) */}
        <div className="p-4 px-6 bg-stone-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider font-serif">
              Ficha Resumida para a Família (A4)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Ficha
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 1-page layout) */}
        <div className="p-8 sm:p-10 flex-1 overflow-y-auto bg-stone-50/50 print:bg-white print:p-6 print:m-0 print:overflow-visible">
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
            
            {/* Header Institucional */}
            <div className="flex items-center justify-between border-b-2 border-stone-800 pb-4">
              <div className="flex items-center gap-4">
                <SchoolLogo size="md" showText={false} />
                <div>
                  <h1 className="text-sm sm:text-base font-bold font-serif text-stone-900 uppercase tracking-tight">
                    Escola Municipal Raymundo Lemos Santana
                  </h1>
                  <p className="text-[11px] font-medium text-stone-500">
                    Acompanhamento das Aprendizagens • {selectedUnit.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-stone-100 text-stone-800 px-3 py-1 rounded-md uppercase border border-stone-300">
                  {currentGrade}º ANO &quot;{currentLetter}&quot;
                </span>
              </div>
            </div>

            {/* Identificação do Aluno */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Estudante:</span>
                <span className="text-base font-bold font-serif text-stone-900">{studentName}</span>
                {studentData.isAee && (
                  <span className="ml-2 text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md uppercase">
                    AEE / PEI
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-stone-700">
                <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Conquistas Consolidadas:</span>
                <span>{masteredSkillIds.length} objetivos alcançados</span>
              </div>
            </div>

            {/* Mensagem Acolhedora à Família */}
            <p className="text-xs text-stone-600 leading-relaxed italic border-l-2 border-emerald-500 pl-3">
              &quot;Querida família, a parceria entre a escola e o lar é a base de um aprendizado com afeto e sucesso. Este relatório apresenta os principais passos dados nesta etapa.&quot;
            </p>

            {/* Conquistas da Etapa */}
            <div>
              <h3 className="text-xs font-bold uppercase font-serif text-stone-900 flex items-center gap-1.5 mb-2.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Principais Aprendizagens Desta Unidade:
              </h3>
              {masteredSkills.length === 0 ? (
                <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-lg border border-stone-200">
                  Habilidades em processo inicial de construção e consolidação contínua em sala de aula.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {masteredSkills.map(sk => (
                    <div key={sk.id} className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span className="text-stone-700 leading-tight font-medium">{sk.report}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Síntese do Parecer Pedagógico */}
            <div>
              <h3 className="text-xs font-bold uppercase font-serif text-stone-900 flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-escola-azul" />
                Parecer do Professor Regente:
              </h3>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed text-justify uppercase font-serif">
                {observationText}
              </div>
            </div>

            {/* Como apoiar em casa */}
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Dicas para a Família Apoiar em Casa:
              </span>
              <p className="leading-relaxed">
                Incentive 15 minutos diários de leitura agradável, valorize cada avanço e mantenha uma rotina organizada para as tarefas escolares.
              </p>
            </div>

            {/* Assinaturas */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-stone-700 border-t border-stone-200">
              <div>
                <div className="border-b border-stone-400 mb-1 w-3/4 mx-auto" />
                <span className="font-bold uppercase text-[10px]">Professor(a) Regente</span>
              </div>
              <div>
                <div className="border-b border-stone-400 mb-1 w-3/4 mx-auto" />
                <span className="font-bold uppercase text-[10px]">Assinatura dos Responsáveis</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
