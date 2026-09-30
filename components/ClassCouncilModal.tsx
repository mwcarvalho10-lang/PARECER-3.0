'use client';

import React from 'react';
import { Printer, X, Award, FileText, CheckCircle2 } from 'lucide-react';
import { Skill, ClassData } from '@/lib/types';
import { SchoolLogo } from './SchoolLogo';

interface ClassCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  classData: ClassData;
  globalSkills: Skill[];
}

export function ClassCouncilModal({
  isOpen,
  onClose,
  currentGrade,
  currentLetter,
  selectedUnit,
  classData,
  globalSkills
}: ClassCouncilModalProps) {
  if (!isOpen) return null;

  // Grade skills
  const gradeSkills = globalSkills
    .filter(s => String(s.grade) === String(currentGrade))
    .sort((a, b) => a.id.localeCompare(b.id));

  // Planned skills for this unit
  const plannedIds = classData.plannedSkills?.[selectedUnit] || [];
  const unitSkills = plannedIds.length > 0 
    ? gradeSkills.filter(s => plannedIds.includes(s.id))
    : gradeSkills;

  // Students list (including transferred/inactive for audit trail)
  const allStudents = (classData.students || []).slice().sort();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Controls Bar (no-print) */}
        <div className="p-4 px-6 bg-stone-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider font-serif block">
                Ficha Oficial do Conselho de Classe (Barema Imprimível)
              </span>
              <span className="text-[10px] text-stone-400">
                Formato Paisagem Oficial • Matriz completa de competências e pareceres
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-escola-azul hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Ata / Barema
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area with the exact #printable-barema ID */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-stone-100/60 print:bg-white print:p-0 print:m-0 print:overflow-visible">
          
          <div id="printable-barema" className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm print:border-none print:shadow-none print:p-0">
            
            {/* Header Oficial do Conselho */}
            <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <SchoolLogo size="sm" showText={false} />
                <div>
                  <h1 className="text-base font-bold font-serif uppercase tracking-tight text-stone-900">
                    Escola Municipal Raymundo Lemos Santana
                  </h1>
                  <p className="text-[11px] font-semibold text-stone-600">
                    Ata e Barema de Acompanhamento das Aprendizagens • Conselho de Classe
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold font-serif text-stone-900 uppercase">
                  {currentGrade}º ANO &quot;{currentLetter}&quot; • {selectedUnit.toUpperCase()}
                </p>
                <p className="text-[10px] text-stone-500 font-medium">
                  {allStudents.length} estudantes matriculados
                </p>
              </div>
            </div>

            {/* Barema Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse border border-stone-300">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold uppercase">
                    <th className="border border-stone-300 p-1 w-7 text-center">Nº</th>
                    <th className="border border-stone-300 p-1 text-left min-w-[180px]">Nome do Estudante</th>
                    <th className="border border-stone-300 p-1 text-center w-16">Situação</th>
                    {unitSkills.map(sk => (
                      <th 
                        key={sk.id} 
                        className="border border-stone-300 p-1 text-center min-w-[28px] max-w-[34px] font-mono text-[9px]"
                        title={`${sk.id}: ${sk.report}`}
                      >
                        {sk.id}
                      </th>
                    ))}
                    <th className="border border-stone-300 p-1 text-center w-12 bg-stone-200/70">Total</th>
                    <th className="border border-stone-300 p-1 text-center w-12 bg-stone-200/70">%</th>
                    <th className="border border-stone-300 p-1 text-center w-24">Nível</th>
                    <th className="border border-stone-300 p-1 text-center w-14">Parecer</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((studentName, idx) => {
                    const stData = classData[studentName] || {};
                    const unitData = stData[selectedUnit] || { skills: [], observation: '' };
                    const masteredList: string[] = unitData.skills || [];
                    const masteredCount = unitSkills.filter(s => masteredList.includes(s.id)).length;
                    const totalCount = unitSkills.length || 1;
                    const rate = Math.round((masteredCount / totalCount) * 100);
                    
                    const isInactive = stData.active === false;
                    const statusReason = stData.statusReason || (isInactive ? 'transferido' : 'ativo');
                    const hasObservation = Boolean(unitData.observation?.trim() && unitData.observation.length > 10);

                    let levelText = 'Atenção';
                    let levelClass = 'text-rose-700 font-bold';
                    if (rate >= 70) {
                      levelText = 'Avançado';
                      levelClass = 'text-emerald-700 font-bold';
                    } else if (rate >= 50) {
                      levelText = 'Em Desenv.';
                      levelClass = 'text-amber-700 font-bold';
                    }

                    return (
                      <tr 
                        key={studentName} 
                        className={`hover:bg-stone-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'} ${isInactive ? 'opacity-60 bg-stone-100/50' : ''}`}
                      >
                        <td className="border border-stone-300 p-1 text-center font-mono font-medium text-stone-500">
                          {idx + 1}
                        </td>
                        <td className="border border-stone-300 p-1 font-bold text-stone-900 truncate">
                          <span className={isInactive ? 'line-through' : ''}>{studentName}</span>
                          {stData.isAee && (
                            <span className="ml-1 text-[8px] bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-black">
                              AEE
                            </span>
                          )}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-medium text-[9px] uppercase">
                          {statusReason === 'ativo' ? (
                            <span className="text-emerald-700 font-bold">Frequente</span>
                          ) : statusReason === 'transferido' ? (
                            <span className="text-amber-700 font-bold">Transferido</span>
                          ) : statusReason === 'remanejado' ? (
                            <span className="text-sky-700 font-bold">Remanejado</span>
                          ) : (
                            <span className="text-rose-700 font-bold">Abandono</span>
                          )}
                        </td>

                        {/* Colunas de cada habilidade */}
                        {unitSkills.map(sk => {
                          const isMastered = masteredList.includes(sk.id);
                          return (
                            <td 
                              key={sk.id} 
                              className={`border border-stone-300 p-1 text-center font-bold ${
                                isMastered ? 'text-emerald-700 bg-emerald-50/50' : 'text-stone-300'
                              }`}
                            >
                              {isMastered ? '✓' : '-'}
                            </td>
                          );
                        })}

                        <td className="border border-stone-300 p-1 text-center font-bold text-stone-900 bg-stone-50">
                          {masteredCount}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-black text-stone-900 bg-stone-50 font-serif">
                          {rate}%
                        </td>
                        <td className={`border border-stone-300 p-1 text-center ${levelClass}`}>
                          {levelText}
                        </td>
                        <td className="border border-stone-300 p-1 text-center font-bold text-[9px]">
                          {hasObservation ? (
                            <span className="text-emerald-700 font-bold">✓ Feito</span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Pendente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Deliberações do Conselho */}
            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10px] text-stone-700">
              <span className="font-bold uppercase tracking-wider block mb-1">Deliberações e Encaminhamentos Coletivos:</span>
              <p className="italic leading-relaxed">
                A turma demonstrou progressão contínua nas competências essenciais. Alunos sinalizados com necessidade de atenção serão contemplados com intervenção pedagógica diferenciada e reagrupamentos de apoio.
              </p>
            </div>

            {/* Assinaturas Oficiais */}
            <div className="mt-8 grid grid-cols-3 gap-6 text-center text-[10px] text-stone-800">
              <div>
                <div className="border-b border-stone-400 mb-1 w-4/5 mx-auto" />
                <span className="font-bold uppercase">Professor(a) Regente</span>
              </div>
              <div>
                <div className="border-b border-stone-400 mb-1 w-4/5 mx-auto" />
                <span className="font-bold uppercase">Coordenação Pedagógica</span>
              </div>
              <div>
                <div className="border-b border-stone-400 mb-1 w-4/5 mx-auto" />
                <span className="font-bold uppercase">Direção Escolar</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
