'use client';

import React, { useState, useMemo } from 'react';
import { Users, FileSpreadsheet, Check, AlertCircle, X, ArrowRight, UserPlus } from 'lucide-react';

interface BatchStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: string[];
  onImport: (newStudentsList: string[]) => void;
}

export function BatchStudentImportModal({
  isOpen,
  onClose,
  existingStudents,
  onImport
}: BatchStudentImportModalProps) {
  const [inputText, setInputText] = useState('');

  // Parse lines into clean student names
  const parsedNames = useMemo(() => {
    if (!inputText.trim()) return [];
    
    const lines = inputText.split(/\r?\n/);
    const namesSet = new Set<string>();

    lines.forEach(line => {
      // Remove leading numbers, tabs, quotes, or trailing commas
      let cleaned = line
        .replace(/^[\d\s\.\-\)\:]+/, '') // e.g. "1. " or "01 - "
        .replace(/[\t,;].*$/, '') // if tab-separated with other columns like gender/matricula
        .trim();

      // Basic cleanup
      cleaned = cleaned.replace(/\s+/g, ' ').toUpperCase();

      if (cleaned.length >= 2 && !cleaned.toLowerCase().includes('nome do aluno') && !cleaned.toLowerCase().includes('estudante')) {
        namesSet.add(cleaned);
      }
    });

    return Array.from(namesSet);
  }, [inputText]);

  const existingSet = useMemo(() => new Set(existingStudents.map(s => s.toUpperCase())), [existingStudents]);

  const newNames = useMemo(() => {
    return parsedNames.filter(name => !existingSet.has(name));
  }, [parsedNames, existingSet]);

  const duplicateNames = useMemo(() => {
    return parsedNames.filter(name => existingSet.has(name));
  }, [parsedNames, existingSet]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (newNames.length === 0) return;
    onImport(newNames);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif text-stone-900">
                Importação Rápida de Estudantes
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Cole a lista de nomes copiada do Excel, Google Planilhas ou diário
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1.5">
              Cole a lista de nomes aqui (um por linha):
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Exemplo:&#10;1. ALICE COSTA SILVA&#10;2. BERNARDO LIMA SANTOS&#10;3. CARLOS EDUARDO PEREIRA&#10;..."
              className="w-full p-3.5 bg-stone-50 rounded-2xl text-xs font-mono font-medium text-stone-800 outline-none border border-stone-200 focus:bg-white focus:border-stone-400 resize-none transition-colors"
            />
          </div>

          {/* Resumo da Análise */}
          {parsedNames.length > 0 && (
            <div className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-600">Total identificados:</span>
                <span className="font-bold text-stone-900">{parsedNames.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Novos a cadastrar:
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  +{newNames.length}
                </span>
              </div>
              {duplicateNames.length > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Já cadastrados nesta turma (ignorados):
                  </span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    {duplicateNames.length}
                  </span>
                </div>
              )}

              {/* Preview Chips */}
              <div className="pt-2 max-h-36 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Pré-visualização dos novos alunos:</p>
                <div className="flex flex-wrap gap-1">
                  {newNames.slice(0, 15).map(n => (
                    <span key={n} className="text-[10px] font-bold bg-white text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md">
                      {n}
                    </span>
                  ))}
                  {newNames.length > 15 && (
                    <span className="text-[10px] font-bold text-stone-400 px-1 py-0.5">
                      +{newNames.length - 15} outros...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-stone-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-stone-600 hover:bg-stone-100 uppercase text-xs transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={newNames.length === 0}
            onClick={handleConfirm}
            className="flex-1 bg-escola-azul hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white py-2.5 px-4 rounded-xl font-bold uppercase text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar {newNames.length} Alunos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
