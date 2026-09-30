'use client';

import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  initialName: string;
  initialActive?: boolean;
  initialStatusReason?: 'ativo' | 'transferido' | 'abandono' | 'remanejado';
  initialTransferNotes?: string;
  initialGender?: 'M' | 'F' | '';
  initialIsAee?: boolean;
  initialAeeType?: string;
  initialAeeNotes?: string;
  onClose: () => void;
  onConfirm: (
    name: string, 
    active: boolean, 
    gender: 'M' | 'F' | '', 
    isAee: boolean, 
    aeeType: string, 
    aeeNotes: string,
    statusReason?: 'ativo' | 'transferido' | 'abandono' | 'remanejado',
    transferNotes?: string
  ) => void;
}

const AEE_TYPES = [
  'TEA (Transtorno do Espectro Autista)',
  'TDAH (Atenção / Hiperatividade)',
  'Deficiência Intelectual (DI)',
  'Baixa Visão / Cegueira',
  'Deficiência Auditiva / Surdez',
  'Deficiência Física / Mobilidade',
  'Altas Habilidades / Superdotação',
  'Dificuldade Acentuada de Aprendizagem',
  'Outra Especificidade'
];

function StudentModalForm({
  initialName,
  initialActive = true,
  initialStatusReason = 'ativo',
  initialTransferNotes = '',
  initialGender = '',
  initialIsAee = false,
  initialAeeType = '',
  initialAeeNotes = '',
  onClose,
  onConfirm
}: Omit<StudentModalProps, 'isOpen'>) {
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [statusReason, setStatusReason] = useState<'ativo' | 'transferido' | 'abandono' | 'remanejado'>(initialStatusReason || (initialActive ? 'ativo' : 'transferido'));
  const [transferNotes, setTransferNotes] = useState(initialTransferNotes || '');
  const [gender, setGender] = useState<'M' | 'F' | ''>(initialGender);
  const [isAee, setIsAee] = useState(Boolean(initialIsAee));
  const [aeeType, setAeeType] = useState(initialAeeType || '');
  const [aeeNotes, setAeeNotes] = useState(initialAeeNotes || '');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    const finalActive = active && statusReason === 'ativo';
    onConfirm(
      name.trim(), 
      finalActive, 
      gender, 
      isAee, 
      aeeType, 
      aeeNotes,
      finalActive ? 'ativo' : statusReason,
      transferNotes
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="text-center mb-5">
          <h3 className="font-black uppercase text-escola-azul tracking-wider text-sm font-serif">
            {initialName ? "Editar Estudante" : "Novo Estudante"}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            E. M. Raymundo Lemos Santana • Cadastro Escolar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Nome Completo do Estudante
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="EX: GABRIEL SILVA SANTOS" 
              required
              className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold uppercase outline-none border border-slate-200 focus:border-escola-azul focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Pronome no Parecer
            </label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setGender('M')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${gender === 'M' ? 'bg-escola-azul text-white border-escola-azul shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              >
                Masc (Ele / O aluno)
              </button>
              <button 
                type="button"
                onClick={() => setGender('F')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${gender === 'F' ? 'bg-escola-azul text-white border-escola-azul shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
              >
                Fem (Ela / A aluna)
              </button>
            </div>
          </div>

          {/* Active & Status Reason Section */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-stone-800 block">Situação da Matrícula</span>
                <span className="text-[10px] text-stone-500 font-medium">
                  {statusReason === 'ativo' ? 'Frequente na turma' : `Inativo: ${statusReason.toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setActive(true); setStatusReason('ativo'); }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    active && statusReason === 'ativo'
                      ? 'bg-emerald-600 text-white shadow-2xs font-black'
                      : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  Frequente
                </button>
                <button
                  type="button"
                  onClick={() => { setActive(false); if (statusReason === 'ativo') setStatusReason('transferido'); }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    !active || statusReason !== 'ativo'
                      ? 'bg-amber-600 text-white shadow-2xs font-black'
                      : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  Inativo
                </button>
              </div>
            </div>

            {(!active || statusReason !== 'ativo') && (
              <div className="pt-2 border-t border-stone-200/80 space-y-2 animate-in fade-in duration-150">
                <label className="block text-[9px] font-bold uppercase text-stone-500">
                  Motivo da Inativação:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setActive(false); setStatusReason('transferido'); }}
                    className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase transition-all border ${
                      statusReason === 'transferido'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Transferido
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActive(false); setStatusReason('remanejado'); }}
                    className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase transition-all border ${
                      statusReason === 'remanejado'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Remanejado
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActive(false); setStatusReason('abandono'); }}
                    className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase transition-all border ${
                      statusReason === 'abandono'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    Abandono
                  </button>
                </div>

                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Observação (ex: Transferido para Escola X em 15/04)"
                  className="w-full p-2 bg-white rounded-xl text-xs font-medium text-stone-700 border border-stone-200 outline-none focus:border-stone-400 placeholder:text-stone-400"
                />
              </div>
            )}
          </div>

          {/* AEE / PEI Education Section */}
          <div className={`p-3.5 rounded-2xl border transition-all ${isAee ? 'bg-purple-50/70 border-purple-200 ring-1 ring-purple-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className={`w-4 h-4 ${isAee ? 'text-purple-600' : 'text-slate-400'}`} />
                <div>
                  <span className={`text-[11px] font-black uppercase block ${isAee ? 'text-purple-900' : 'text-slate-700'}`}>
                    Atendimento Educacional Especializado (AEE / PEI)
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    Adaptações curriculares e mediação pedagógica individualizada
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAee(!isAee)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAee ? 'bg-purple-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAee ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {isAee && (
              <div className="mt-3 pt-3 border-t border-purple-200/80 space-y-2.5 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[9px] font-black uppercase text-purple-900 mb-1">
                    Especificidade / Diagnóstico / Foco do PEI:
                  </label>
                  <select
                    value={aeeType}
                    onChange={(e) => setAeeType(e.target.value)}
                    className="w-full p-2.5 bg-white rounded-xl text-xs font-bold text-slate-700 border border-purple-200 outline-none focus:border-purple-500"
                  >
                    <option value="">Selecione a especificidade...</option>
                    {AEE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-purple-900 mb-1">
                    Orientações de Mediação & Adaptação Curricular:
                  </label>
                  <textarea
                    value={aeeNotes}
                    onChange={(e) => setAeeNotes(e.target.value)}
                    placeholder="Ex: Utilizar pistas visuais, material dourado, tempo ampliado e mediação em pequenos grupos..."
                    rows={2}
                    className="w-full p-2.5 bg-white rounded-xl text-xs font-medium text-slate-700 border border-purple-200 outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 px-4 rounded-xl font-black text-slate-500 hover:bg-slate-100 uppercase text-xs transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-escola-azul hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-black uppercase text-xs shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StudentModal(props: StudentModalProps) {
  if (!props.isOpen) return null;
  return <StudentModalForm key={props.initialName || 'new'} {...props} />;
}
