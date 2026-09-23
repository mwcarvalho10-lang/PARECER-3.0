'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Copy, Check, Plus, Sparkles, X, Heart, ShieldCheck, TrendingUp, Cpu, Puzzle } from 'lucide-react';

interface PhraseCategory {
  id: string;
  title: string;
  icon: any;
  description: string;
  phrases: string[];
}

interface PhraseBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  onInsertPhrase: (phrase: string) => void;
}

const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: 'convivencia',
    title: 'Participação & Convivência',
    icon: Heart,
    description: 'Relações interpessoais, respeito às regras e colaboração em sala.',
    phrases: [
      "[Nome] demonstra excelente relacionamento interpessoal, colaborando ativamente com os colegas e mediando conflitos de forma empática.",
      "Apresenta postura participativa e respeitosa, ouvindo atentamente as opiniões dos colegas e expressando suas ideias com clareza.",
      "Interage harmoniosamente com a turma, demonstrando acolhimento, espírito de cooperação e respeito aos combinados de sala de aula.",
      "Mostra-se receptivo(a) às orientações dos professores e valoriza os momentos de trabalho coletivo e rodas de conversa.",
      "Em situações de trabalho em grupo, assume papel colaborativo, partilhando materiais e incentivando os colegas."
    ]
  },
  {
    id: 'autonomia',
    title: 'Autonomia & Rotina Escolar',
    icon: ShieldCheck,
    description: 'Organização com materiais, foco nas tarefas e cumprimento de prazos.',
    phrases: [
      "[Nome] desenvolveu notável autonomia na realização de suas tarefas diárias, cuidando com zelo de seus materiais escolares.",
      "Demonstra compromisso e responsabilidade na execução das atividades propostas, cumprindo os combinados dentro do tempo estabelecido.",
      "Apresenta foco e concentração durante as explicações, buscando esclarecer dúvidas prontamente com o(a) professor(a).",
      "Consegue organizar sua rotina de estudos com independência, demonstrando iniciativa e segurança ao iniciar novos desafios.",
      "Tem aprimorado sua atenção sustentada em sala de aula, realizando suas produções com dedicação e capricho crescente."
    ]
  },
  {
    id: 'superacao',
    title: 'Superação & Evolução',
    icon: TrendingUp,
    description: 'Resiliência, esforço contínuo e celebração de conquistas ao longo da unidade.',
    phrases: [
      "[Nome] apresentou um salto significativo em seu processo de aprendizagem neste bimestre, fruto de sua dedicação e persistência.",
      "Diante dos desafios pedagógicos propostos, não desiste e busca ativamente alternativas criativas para solucioná-los.",
      "É perceptível sua evolução na autoestima e segurança para expressar suas hipóteses e participar oralmente das aulas.",
      "A evolução demonstrada reflete seu empenho diário e o apoio constante nas atividades de reforço e recuperação paralela.",
      "Superou dificuldades iniciais com muita perseverança, demonstrando entusiasmo ao perceber suas próprias conquistas."
    ]
  },
  {
    id: 'alfabetizacao',
    title: 'Alfabetização & Letramento',
    icon: BookOpen,
    description: 'Avanço na leitura, escrita, consciência fonológica e produção de textos.',
    phrases: [
      "[Nome] avançou consideravelmente na consolidação das hipóteses de escrita, produzindo textos com clareza e criatividade.",
      "Demonstra grande interesse pelo mundo letrado, realizando leituras autônomas de pequenos textos e enunciados com fluência crescente.",
      "Compreende a correspondência grafofonêmica e aplica adequadamente a segmentação de palavras e noções básicas de pontuação.",
      "Apresenta excelente interpretação oral e escrita de histórias, identificando personagens centrais, conflitos e desfechos.",
      "Enriqueceu expressivamente seu repertório vocabular, demonstrando curiosidade em relação a novos significados e ortografia."
    ]
  },
  {
    id: 'matematica',
    title: 'Raciocínio Lógico-Matemático',
    icon: Cpu,
    description: 'Cálculo mental, resolução de problemas cotidianos e raciocínio investigativo.',
    phrases: [
      "[Nome] demonstra raciocínio lógico aguçado na resolução de situações-problema do cotidiano, utilizando estratégias pessoais eficazes.",
      "Compreende os conceitos de adição e subtração, aplicando o cálculo mental com agilidade e segurança.",
      "Identifica regularidades em sequências numéricas e relaciona quantidades e algarismos com precisão.",
      "Demonstra facilidade no reconhecimento de figuras geométricas espaciais e planas, bem como na leitura de tabelas simples.",
      "Explora materiais manipuláveis com curiosidade investigativa, associando-os com facilidade aos conteúdos matemáticos."
    ]
  },
  {
    id: 'aee',
    title: 'Educação Especial (AEE / PEI)',
    icon: Puzzle,
    description: 'Mediação pedagógica, recursos adaptados, avanços no PEI e flexibilização curricular.',
    phrases: [
      "Em consonância com as metas do Plano de Ensino Individualizado (PEI), [Nome] demonstrou avanços significativos com o apoio de recursos multissensoriais.",
      "Responde muito bem à mediação pedagógica individualizada e ao tempo estendido para conclusão das propostas pedagógicas.",
      "Com as adaptações curriculares e o suporte do AEE, tem ampliado seu tempo de permanência nas tarefas e a interação com a turma.",
      "Celebramos cada conquista no desenvolvimento de sua autonomia, comunicação funcional e engajamento nas rotinas escolares.",
      "A utilização de pistas visuais, rotina estruturada e material concreto tem favorecido seu pleno protagonismo e bem-estar em sala."
    ]
  },
  {
    id: 'conectivos',
    title: 'Conectivos & Transições Elegantes',
    icon: Sparkles,
    description: 'Expressões conectoras para dar fluidez e elegância à escrita pedagógica.',
    phrases: [
      "Além disso, cabe destacar que ",
      "No que tange ao convívio coletivo e socialização, ",
      "Durante as propostas pedagógicas deste bimestre, observou-se que ",
      "Com relação ao raciocínio lógico e resolução de problemas, ",
      "Vale ressaltar também que, ao longo das intervenções, ",
      "É gratificante acompanhar seu entusiasmo constante, pois ",
      "Recomenda-se a continuidade do incentivo à leitura familiar para que "
    ]
  }
];

export function PhraseBankModal({
  isOpen,
  onClose,
  studentName,
  onInsertPhrase
}: PhraseBankModalProps) {
  const [activeCat, setActiveCat] = useState<string>('convivencia');
  const [search, setSearch] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const firstName = studentName ? studentName.split(' ')[0] : 'O(A) estudante';

  const currentCategory = PHRASE_CATEGORIES.find(c => c.id === activeCat) || PHRASE_CATEGORIES[0];

  // Filtering phrases
  const filteredPhrases = search.trim()
    ? PHRASE_CATEGORIES.flatMap(cat => 
        cat.phrases
          .filter(p => p.toLowerCase().includes(search.toLowerCase()))
          .map(p => ({ phrase: p, catTitle: cat.title }))
      )
    : currentCategory.phrases.map(p => ({ phrase: p, catTitle: currentCategory.title }));

  const handleInsert = (phraseTemplate: string, index: number) => {
    const formatted = phraseTemplate.replaceAll('[Nome]', firstName);
    onInsertPhrase(formatted);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-escola-azul to-emerald-600 p-5 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight font-serif flex items-center gap-2">
                Banco de Frases & Conectivos Pedagógicos
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                Inserção com 1 clique personalizada para <strong>{firstName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar expressões (ex: autonomia, leitura, mediação, regras, problemas)..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-escola-azul transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs & Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Categories Sidebar */}
          {!search && (
            <div className="w-full md:w-64 bg-slate-50/80 border-r border-slate-200 p-3 space-y-1.5 overflow-y-auto shrink-0">
              {PHRASE_CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const isSelected = activeCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-escola-azul text-white shadow-xs font-black'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Phrases List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {search ? `Resultados da busca (${filteredPhrases.length})` : currentCategory.description}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Substitui por &quot;{firstName}&quot;
              </span>
            </div>

            {filteredPhrases.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-xs font-bold uppercase">Nenhuma frase encontrada para este termo.</p>
              </div>
            ) : (
              filteredPhrases.map((item, idx) => {
                const phraseWithStudent = item.phrase.replaceAll('[Nome]', firstName);
                const isCopied = copiedIndex === idx;

                return (
                  <div
                    key={idx}
                    className="group p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      {search && (
                        <span className="text-[9px] font-black uppercase text-escola-azul block">
                          {item.catTitle}
                        </span>
                      )}
                      <p className="text-slate-700 leading-relaxed font-medium">
                        {phraseWithStudent}
                      </p>
                    </div>

                    <button
                      onClick={() => handleInsert(item.phrase, idx)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-1 shadow-xs ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 hover:bg-escola-azul hover:text-white text-slate-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Inserido!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Inserir</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Dica: O texto inserido é adicionado diretamente ao parecer do estudante.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase text-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
