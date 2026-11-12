import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { Skill, ClassData } from './types';

export interface FamilyReportDocxOptions {
  studentName: string;
  currentGrade: string;
  currentLetter: string;
  selectedUnit: string;
  classData: ClassData;
  globalSkills: Skill[];
  year?: string;
}

/**
 * Gera sugestões pedagógicas automáticas para apoiar o avanço na aprendizagem
 * baseando-se nas habilidades em desenvolvimento do estudante na etapa.
 */
export function generateLearningSuggestions(
  masteredSkillIds: string[],
  allGradeSkills: Skill[],
  isAee?: boolean
): { category: string; tip: string }[] {
  const pendingSkills = allGradeSkills.filter(s => !masteredSkillIds.includes(s.id));
  const hasPendingPortuguese = pendingSkills.some(s => s.subject === 'portugues');
  const hasPendingMath = pendingSkills.some(s => s.subject === 'matematica');
  const hasPendingScienceHistory = pendingSkills.some(s => s.subject === 'ciencias' || s.subject === 'historia');

  const suggestions: { category: string; tip: string }[] = [];

  // Leitura e Linguagem
  if (hasPendingPortuguese || pendingSkills.length === 0) {
    suggestions.push({
      category: 'Leitura e Compreensão Oral',
      tip: 'Reserve de 15 a 20 minutos diários para leitura compartilhada de livros infantis, gibis ou parlendas. Peça que a criança reconte a história com suas próprias palavras e compartilhe sua opinião.'
    });
    suggestions.push({
      category: 'Produção Textual e Escrita',
      tip: 'Incentive a escrita funcional no dia a dia familiar: convide a criança a escrever a lista de compras da semana, bilhetes afetuosos para parentes e pequenas legendas para seus desenhos.'
    });
  }

  // Matemática e Raciocínio Lógico
  if (hasPendingMath || pendingSkills.length === 0) {
    suggestions.push({
      category: 'Raciocínio Lógico e Matemática Prática',
      tip: 'Explore a matemática nas situações cotidianas: identificar preços e conferir trocos no mercado, ler horas no relógio, separar medidas em receitas culinárias simples e brincar com jogos de tabuleiro e cartas.'
    });
  }

  // Ciências, Sociedade e Meio Ambiente
  if (hasPendingScienceHistory) {
    suggestions.push({
      category: 'Investigação e Convivência Cidadã',
      tip: 'Estimule a curiosidade investigativa conversando sobre acontecimentos do dia a dia, a história da família e a preservação do meio ambiente, valorizando o respeito às diferenças.'
    });
  }

  // Rotina e Autonomia (Sempre essencial)
  suggestions.push({
    category: 'Rotina de Estudos e Autonomia',
    tip: 'Estabeleça um horário fixo e um local silencioso e bem iluminado para as atividades escolares. Estimule a criança a conferir o material didático e organizar sua própria mochila todos os dias.'
  });

  // AEE / Apoio Inclusivo
  if (isAee) {
    suggestions.push({
      category: 'Mediação Acolhedora e Flexibilização',
      tip: 'Fracione as tarefas em pequenas etapas com pausas programadas. Utilize recursos visuais concretos (desenhos, esquemas, objetos manipuláveis) e celebre efusivamente cada conquista alcançada.'
    });
  } else {
    suggestions.push({
      category: 'Afeto e Fortalecimento da Autoestima',
      tip: 'Reconheça e elogie o esforço dedicado, não apenas o resultado final. O acolhimento seguro da família é o maior estímulo para a persistência e a confiança nos estudos.'
    });
  }

  return suggestions.slice(0, 5);
}

/**
 * Cria e descarrega o arquivo DOCX formatado da Devolutiva para a Família
 */
export async function exportFamilyReportDocx({
  studentName,
  currentGrade,
  currentLetter,
  selectedUnit,
  classData,
  globalSkills,
  year = '2026'
}: FamilyReportDocxOptions) {
  if (!studentName) return;

  const studentData = classData[studentName] || {};
  const unitData = studentData[selectedUnit] || { skills: [], observation: '' };
  const masteredSkillIds: string[] = (unitData.skills as string[]) || [];

  // Habilidades dominadas no ano letivo
  const masteredSkills = globalSkills
    .filter(s => s.grade === currentGrade && masteredSkillIds.includes(s.id));

  // Habilidades de referência do ano
  const allGradeSkills = globalSkills.filter(s => s.grade === currentGrade);

  const observationText = unitData.observation?.trim() ||
    `Estudante com presença ativa no ambiente escolar, demonstrando desenvolvimento contínuo nas atividades propostas para a ${selectedUnit}.`;

  const suggestions = generateLearningSuggestions(
    masteredSkillIds,
    allGradeSkills,
    studentData.isAee
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000
            }
          }
        },
        children: [
          // Cabeçalho Institucional
          new Paragraph({
            children: [
              new TextRun({
                text: "PREFEITURA MUNICIPAL DE SALVADOR • SECRETARIA MUNICIPAL DE EDUCAÇÃO",
                bold: true,
                size: 18,
                color: "57534E"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "ESCOLA MUNICIPAL RAYMUNDO LEMOS SANTANA",
                bold: true,
                size: 26,
                color: "1C1917"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "FICHA DE DEVOLUTIVA PEDAGÓGICA E ACOMPANHAMENTO À FAMÍLIA",
                bold: true,
                size: 22,
                color: "1D4ED8"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `ETAPA: ${selectedUnit.toUpperCase()} • ANO LETIVO: ${year}`,
                bold: true,
                size: 18,
                color: "44403C"
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 260 }
          }),

          // Tabela de Identificação do Estudante
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "ESTUDANTE: ", bold: true, size: 20 }),
                          new TextRun({ text: studentName.toUpperCase(), bold: true, size: 20, color: "0F172A" }),
                          ...(studentData.isAee ? [new TextRun({ text: "  [ATENDIMENTO ESPECIALIZADO - AEE / PEI]", bold: true, size: 16, color: "7E22CE" })] : [])
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "TURMA: ", bold: true, size: 20 }),
                          new TextRun({ text: `${currentGrade}º ANO "${currentLetter}"`, bold: true, size: 20 })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "APRENDIZAGENS ALCANÇADAS NESTA UNIDADE: ", bold: true, size: 18 }),
                          new TextRun({ text: `${masteredSkills.length} habilidades consolidadas`, size: 18, bold: true, color: "047857" })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "TURNO: ", bold: true, size: 18 }),
                          new TextRun({ text: "DIURNO", size: 18 })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // Mensagem de Acolhimento à Família
          new Paragraph({
            children: [
              new TextRun({
                text: "“Querida família, a parceria contínua entre a escola e o lar é o alicerce fundamental para que cada estudante floresça com segurança, afeto e sucesso. Apresentamos a seguir os principais avanços consolidados nesta etapa letiva e sugestões pedagógicas para fortalecermos juntos essa trajetória.”",
                italics: true,
                size: 18,
                color: "44403C"
              })
            ],
            spacing: { before: 200, after: 240 }
          }),

          // 1. Conquistas e Aprendizagens Consolidadas
          new Paragraph({
            text: "1. CONQUISTAS E APRENDIZAGENS CONSOLIDADAS NESTA ETAPA",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 }
          }),
          ...(masteredSkills.length === 0
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "As habilidades previstas para a etapa encontram-se em processo contínuo de mediação pedagógica e desenvolvimento em sala de aula.",
                      italics: true,
                      size: 19
                    })
                  ],
                  spacing: { after: 180 }
                })
              ]
            : masteredSkills.map(sk =>
                new Paragraph({
                  children: [
                    new TextRun({ text: "✔  ", bold: true, color: "047857", size: 20 }),
                    new TextRun({ text: sk.report, size: 19 })
                  ],
                  spacing: { after: 80 }
                })
              )),

          // 2. Parecer Descritivo do Professor
          new Paragraph({
            text: "2. PARECER DESCRITIVO DO PROFESSOR REGENTE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: observationText.toUpperCase(),
                size: 19
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 260 }
          }),

          // 3. Sugestões para Melhorar a Aprendizagem
          new Paragraph({
            text: "3. SUGESTÕES E ORIENTAÇÕES PARA APOIAR A APRENDIZAGEM EM CASA",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 140 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Com base nas habilidades em processo de consolidação pelo estudante, recomendamos à família as seguintes ações cotidianas de incentivo:",
                size: 18,
                italics: true,
                color: "44403C"
              })
            ],
            spacing: { after: 120 }
          }),
          ...suggestions.map(sug =>
            new Paragraph({
              children: [
                new TextRun({ text: `• ${sug.category.toUpperCase()}: `, bold: true, size: 19, color: "0F172A" }),
                new TextRun({ text: sug.tip, size: 19, color: "334155" })
              ],
              spacing: { after: 100 }
            })
          ),

          // 4. Assinaturas
          new Paragraph({
            text: "CIÊNCIA E ASSINATURAS",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 360, after: 300 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        text: "____________________________________________",
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "PROFESSOR(A) REGENTE", bold: true, size: 18 })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        text: "____________________________________________",
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "ASSINATURA DOS RESPONSÁVEIS", bold: true, size: 18 })
                        ],
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Data: _____ / _____ / 2026", size: 16, color: "78716C" })
                        ],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanStudentName = studentName.replace(/\s+/g, '_').toUpperCase();
  const cleanUnit = selectedUnit.replace(/\s+/g, '_').toUpperCase();
  saveAs(blob, `DEVOLUTIVA_FAMILIA_${cleanStudentName}_${cleanUnit}.docx`);
}
