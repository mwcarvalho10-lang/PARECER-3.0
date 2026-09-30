'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Calendar,
  Sparkles,
  Users,
  Archive,
  RefreshCw
} from 'lucide-react';
import { TransitionMode, YearTransitionOptions } from '@/lib/types';

interface CloseSchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: string;
  totalStudents: number;
  totalClasses: number;
  totalEvaluations: number;
  onDownloadBackup: () => void;
  onConfirmCloseYear: (options: YearTransitionOptions) => void;
}

export function CloseSchoolYearModal({
  isOpen,
  onClose,
  currentYear,
  totalStudents,
  totalClasses,
  totalEvaluations,
  onDownloadBackup,
  onConfirmCloseYear
}: CloseSchoolYearModalProps) {
  const currentNum = parseInt(currentYear, 10);
  const suggestedNextYear = !isNaN(currentNum) ? (currentNum + 1).toString() : '2027';

  const [step, setStep] = useState<1 | 2>(1);
  const [newYear, setNewYear] = useState(suggestedNextYear);
  const [transitionMode, setTransitionMode] = useState<TransitionMode>('promotion');
  const [closureNotes, setClosureNotes] = useState('');
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleBackupClick = () => {
    onDownloadBackup();
    setHasBackedUp(true);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim()) {
      alert("Por favor, informe o ano do novo ciclo letivo.");
      return;
    }
    if (newYear.trim() === currentYear.trim()) {
      alert(`O novo ano letivo deve ser diferente do ano atual (${currentYear}).`);
      return;
    }
    if (!confirmedCheck) {
      alert("Por favor, marque a caixa de confirmação para prosseguir.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onConfirmCloseYear({
        newYear: newYear.trim(),
        mode: transitionMode,
        notes: closureNotes.trim()
      });
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-emerald-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                Painel da Gestão Pedagógica
              </span>
              <h2 className="text-xl font-black uppercase font-serif tracking-tight text-white">
                Encerrar Ano Letivo & Iniciar Novo Ciclo
              </h2>
            </div>
          </div>
          
          <p className="text-emerald-100/90 text-xs mt-1 leading-relaxed">
            Transição oficial de ciclo letivo: todas as avaliações, pareceres e diagnósticos de <strong>{currentYear}</strong> serão 100% arquivados e preservados no acervo histórico da escola.
          </p>

          {/* Stepper pills */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                step === 1 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-white/15 text-emerald-100 hover:bg-white/25'
              }`}
            >
              <span>1. Segurança & Acervo</span>
              <ShieldCheck className="w-3 h-3" />
            </button>
            <span className="text-emerald-300 text-xs">→</span>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                step === 2 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-white/15 text-emerald-100 hover:bg-white/25'
              }`}
            >
              <span>2. Configuração do Novo Ano</span>
              <Sparkles className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 ? (
            /* STEP 1: Overview & Backup */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Highlight summary card */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      Ano Letivo Vigente a ser Concluído:
                    </h3>
                  </div>
                  <span className="text-sm font-black bg-emerald-800 text-white px-3 py-0.5 rounded-full font-serif">
                    {currentYear}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-xl font-black text-slate-800 block tabular-nums">{totalStudents}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Estudantes</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-xl font-black text-slate-800 block tabular-nums">{totalClasses}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Turmas Ativas</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-xl font-black text-emerald-700 block tabular-nums">{totalEvaluations}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Pareceres / Reg.</span>
                  </div>
                </div>
              </div>

              {/* Zero data loss guarantee banner */}
              <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900">
                  <p className="font-black uppercase tracking-wide">
                    Garantia de Preservação Integral de Informações
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sky-800">
                    O encerramento <strong>não apaga</strong> nenhum registro. Todo o acervo do ano letivo <strong>{currentYear}</strong> ficará disponível na aba Gestão para consultas históricas, reemissão de relatórios e comprovação pedagógica a qualquer tempo.
                  </p>
                </div>
              </div>

              {/* Backup download action */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800">
                    Cópia de Segurança do Ano Letivo {currentYear}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Baixe um arquivo seguro (.JSON) contendo todos os dados, pareceres e diagnósticos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBackupClick}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shrink-0 shadow-xs ${
                    hasBackedUp 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {hasBackedUp ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Backup Salvo!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Baixar Backup (.JSON)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Avançar para Configuração do Novo Ano</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Configure new year and transition */
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-in fade-in duration-200">
              {/* New year input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Ano do Novo Ciclo Letivo:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="Ex: 2027"
                    className="w-44 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white px-4 py-2.5 rounded-xl text-lg font-black text-slate-800 outline-none uppercase font-mono shadow-2xs transition-colors"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    (Ciclo letivo imediatamente seguinte a {currentYear})
                  </span>
                </div>
              </div>

              {/* Transition mode selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  Como deseja organizar as turmas e estudantes para o novo ano?
                </label>

                <div className="space-y-3">
                  {/* Option 1: Promotion */}
                  <label 
                    onClick={() => setTransitionMode('promotion')}
                    className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                      transitionMode === 'promotion'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="transitionMode"
                        value="promotion"
                        checked={transitionMode === 'promotion'}
                        onChange={() => setTransitionMode('promotion')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-slate-900">
                            1. Progressão Automática de Ano (Recomendado)
                          </span>
                          <span className="text-[9px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                            Fluxo Escolar
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Os estudantes avançam para a série seguinte (1º→2º, 2º→3º, 3º→4º, 4º→5º ano). Os alunos concluintes do 5º ano são arquivados como formandos. As turmas do 1º ano começam zeradas para novos ingressantes. As fichas de pareceres iniciam limpas prontas para o novo ciclo!
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Keep current roster */}
                  <label 
                    onClick={() => setTransitionMode('keep_students')}
                    className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                      transitionMode === 'keep_students'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="transitionMode"
                        value="keep_students"
                        checked={transitionMode === 'keep_students'}
                        onChange={() => setTransitionMode('keep_students')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-black uppercase text-slate-900 block">
                          2. Manter Enturmação Atual (Zerar Pareceres)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Mantém a relação atual de estudantes em cada turma, zerando apenas as avaliações, observações e habilidades para o novo ano letivo.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Clean slate */}
                  <label 
                    onClick={() => setTransitionMode('clean_slate')}
                    className={`block p-4 rounded-2xl border cursor-pointer transition-all ${
                      transitionMode === 'clean_slate'
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="transitionMode"
                        value="clean_slate"
                        checked={transitionMode === 'clean_slate'}
                        onChange={() => setTransitionMode('clean_slate')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-black uppercase text-slate-900 block">
                          3. Iniciar com Turmas Zeradas (Nova Matrícula)
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Mantém a estrutura das turmas (1º A ao 5º E), porém inicia as listas de chamada em branco para cadastramento de novas matrículas no ano letivo.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Closure notes */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Anotações da Coordenação / Conselho de Classe (Opcional):
                </label>
                <textarea
                  rows={2}
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder={`Ex: Ciclo letivo ${currentYear} encerrado com sucesso após conselho pedagógico final.`}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-none transition-colors"
                />
              </div>

              {/* Safety check confirmation */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="confirmSchoolYearClosure"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="confirmSchoolYearClosure" className="text-[11px] text-amber-900 font-bold leading-tight cursor-pointer">
                  Confirmo o encerramento do Ano Letivo {currentYear}. Estou ciente de que as informações do ano atual serão arquivadas com segurança no histórico escolar e o novo ciclo {newYear} será iniciado.
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase px-3 py-2"
                >
                  ← Voltar
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-600 hover:bg-slate-50 uppercase"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!confirmedCheck || isProcessing}
                    className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Arquivando e Iniciando...</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        <span>Concluir {currentYear} & Iniciar {newYear}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
