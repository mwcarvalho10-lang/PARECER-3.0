export interface TreeGrowthStage {
  grade: number;
  stageNumber: number;
  stageTitle: string;
  stageSubtitle: string;
  shortName: string;
  phaseLabel: string;
  pedagogicalFocus: string;
  symbolism: string;
  primaryColor: string;
  secondaryColor: string;
  lightBg: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  textColor: string;
}

export const treeGrowthStages: TreeGrowthStage[] = [
  {
    grade: 1,
    stageNumber: 1,
    stageTitle: '1º ANO · A SEMENTE & BROTO',
    stageSubtitle: 'Sementeira do Conhecimento & Primeiros Passos',
    shortName: 'Semente & Broto',
    phaseLabel: 'Fase 1 · Germinação',
    pedagogicalFocus: 'Alfabetização Inicial, Consciência Fonológica & Descobertas',
    symbolism: 'A semente rompendo o solo fértil: o despertar da curiosidade infantil e os primeiros laços com as letras e os números.',
    primaryColor: '#65a30d', // lime-600
    secondaryColor: '#84cc16',
    lightBg: 'bg-lime-50/70',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-800',
    borderColor: 'border-lime-300',
    textColor: 'text-lime-900',
  },
  {
    grade: 2,
    stageNumber: 2,
    stageTitle: '2º ANO · A MUDA EM ENRAIZAMENTO',
    stageSubtitle: 'Enraizamento, Primeiras Folhas & Fluência Leitora',
    shortName: 'Muda & Raízes',
    phaseLabel: 'Fase 2 · Enraizamento',
    pedagogicalFocus: 'Consolidação da Leitura, Escrita de Frases & Autonomia',
    symbolism: 'As raízes se aprofundam no saber: expansão do vocabulário, segurança na escrita e formação do leitor ativo.',
    primaryColor: '#16a34a', // green-600
    secondaryColor: '#22c55e',
    lightBg: 'bg-emerald-50/70',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
  },
  {
    grade: 3,
    stageNumber: 3,
    stageTitle: '3º ANO · O JOVEM CAULE & RAMIFICAÇÃO',
    stageSubtitle: 'Ramificação dos Saberes & Raciocínio Lógico',
    shortName: 'Arbusto & Ramos',
    phaseLabel: 'Fase 3 · Ramificação',
    pedagogicalFocus: 'Produção Textual, Resolução de Problemas & Trabalho Coletivo',
    symbolism: 'O caule ganha robustez e novos ramos se abrem para o mundo: capacidade crítica, investigativa e diálogo fraterno.',
    primaryColor: '#0284c7', // sky-600
    secondaryColor: '#0ea5e9',
    lightBg: 'bg-sky-50/70',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    borderColor: 'border-sky-300',
    textColor: 'text-sky-900',
  },
  {
    grade: 4,
    stageNumber: 4,
    stageTitle: '4º ANO · A ÁRVORE FRONDOSA',
    stageSubtitle: 'Copa Viva, Florescimento & Investigação',
    shortName: 'Copa Frondosa',
    phaseLabel: 'Fase 4 · Florescimento',
    pedagogicalFocus: 'Interpretação Aprofundada, Pensamento Científico & Cidadania',
    symbolism: 'A copa verdejante se expande em sombra e vigor: desenvolvimento da autonomia reflexiva e florescimento dos talentos individuais.',
    primaryColor: '#005bb7', // escola-azul institucional
    secondaryColor: '#004b93',
    lightBg: 'bg-blue-50/70',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-950',
  },
  {
    grade: 5,
    stageNumber: 5,
    stageTitle: '5º ANO · A ÁRVORE FRUTÍFERA',
    stageSubtitle: 'Maturidade dos Saberes, Colheita & Conquistas',
    shortName: 'Árvore Frutífera',
    phaseLabel: 'Fase 5 · Plena Maturidade',
    pedagogicalFocus: 'Consolidação das Competências do Fundamental I & Transição Segura',
    symbolism: 'A árvore majestosa de raízes profundas enraizadas no livro da vida, repleta de frutos do conhecimento e sementes para o amanhã.',
    primaryColor: '#b45309', // amber-700
    secondaryColor: '#d97706',
    lightBg: 'bg-amber-50/70',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-950',
  },
];

export function getTreeGrowthStage(grade: number | string): TreeGrowthStage {
  const g = typeof grade === 'string' ? parseInt(grade, 10) : grade;
  const match = treeGrowthStages.find(s => s.grade === g);
  return match || treeGrowthStages[0];
}
