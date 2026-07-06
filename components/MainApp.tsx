import React, { useState, useEffect, useRef } from 'react';
import { Home, Download, Edit3, Trash2, CheckCircle2, Menu, Clock, Bell, Book, CheckSquare, Square, Layers, Sparkles, RefreshCw, UploadCloud, Camera } from 'lucide-react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';
import { generateReportText } from '@/lib/utils';
import { StudentModal } from './StudentModal';
import { SkillsModal } from './SkillsModal';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

interface MainAppProps {
  currentGrade: string;
  currentLetter: string;
  appData: AppData;
  globalSkills: Skill[];
  onGoBack: () => void;
  onUpdateAppData: (newData: AppData) => void;
  onUpdateGlobalSkills: (newSkills: Skill[]) => void;
}

export function MainApp({ currentGrade, currentLetter, appData, globalSkills, onGoBack, onUpdateAppData, onUpdateGlobalSkills }: MainAppProps) {
  const classKey = `${currentGrade}${currentLetter}`;
  const classData: ClassData = appData[classKey] || { students: [] };

  const [selectedStudent, setSelectedStudent] = useState<string>(classData.students[0] || "");
  const [selectedUnit, setSelectedUnit] = useState<string>("Diagnóstica");
  const [activeTab, setActiveTab] = useState<string>("portugues");
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState("");
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentsBulk, setSelectedStudentsBulk] = useState<string[]>([]);

  const [isReportOpen, setIsReportOpen] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);
  const [templates, setTemplates] = useState<{name: string, text: string}[]>([]);
  const [tests, setTests] = useState<import('@/lib/types').TestData[]>([]);

  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [correctingTestId, setCorrectingTestId] = useState<string | null>(null);
  const [testForm, setTestForm] = useState<{name: string, unit: string, skills: string[], questions: {number: number, skillId: string, generatedData?: any}[]}>({name: "", unit: "1º Bimestre", skills: [], questions: []});
  const [correctionForm, setCorrectionForm] = useState<Record<number, boolean>>({});
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isCorrectingImage, setIsCorrectingImage] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSubFilter("all");
  }, [activeTab, currentGrade]);

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem('edu_templates_v13') || '[]');
    setTemplates(t);
    const storedTests = JSON.parse(localStorage.getItem('edu_tests_v13') || '[]');
    setTests(storedTests);
  }, []);

  const saveTests = (newTests: import('@/lib/types').TestData[]) => {
    setTests(newTests);
    localStorage.setItem('edu_tests_v13', JSON.stringify(newTests));
  };

  const generatePDF = (testData: import('@/lib/types').TestData) => {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    doc.text(testData.name.toUpperCase(), margin, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Unidade: ${testData.unit} - Turma: ${currentGrade} ${currentLetter}`, margin, yPos);
    yPos += 15;

    testData.questions.forEach((q, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Questão ${q.number}`, margin, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      if (q.generatedData && q.generatedData.text) {
        const textLines = doc.splitTextToSize(q.generatedData.text, maxWidth);
        doc.text(textLines, margin, yPos);
        yPos += textLines.length * 7 + 5;
        
        if (q.generatedData.options) {
          q.generatedData.options.forEach((opt: string, optIdx: number) => {
            const letter = String.fromCharCode(65 + optIdx);
            const optLines = doc.splitTextToSize(`${letter}) ${opt}`, maxWidth - 10);
            if (yPos + optLines.length * 7 > 280) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(optLines, margin + 5, yPos);
            yPos += optLines.length * 7 + 2;
          });
        }
      } else {
        doc.text(`Sem dados da questão (Habilidade: ${q.skillId})`, margin, yPos);
        yPos += 10;
      }
      yPos += 10;
    });

    doc.save(`${testData.name}_${currentGrade}${currentLetter}.pdf`);
  };

  useEffect(() => {
    if (!classData.students.includes(selectedStudent)) {
      setSelectedStudent(classData.students[0] || "");
    }
  }, [classData.students, selectedStudent]);

  const handleAddStudent = (name: string, active: boolean, gender: 'M' | 'F' | '') => {
    if (!name) return;
    if (classData.students.includes(name)) {
      alert("ESTUDANTE JÁ CADASTRADO.");
      return;
    }
    const newStudents = [...classData.students, name].sort();
    const newStudentData: any = { active, gender };
    units.forEach(u => newStudentData[u] = { skills: [], observation: "" });
    
    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        students: newStudents,
        [name]: newStudentData
      }
    });
    setStudentModalOpen(false);
    setSelectedStudent(name);
  };

  const handleEditStudent = (newName: string, active: boolean, gender: 'M' | 'F' | '') => {
    if (!newName) {
      setStudentModalOpen(false);
      return;
    }
    
    // If name changed, check if new name already exists
    if (newName !== studentToEdit && classData.students.includes(newName)) {
      alert("JÁ EXISTE UM ALUNO COM ESTE NOME.");
      return;
    }

    const newStudents = classData.students.map(s => s === studentToEdit ? newName : s).sort();
    const studentData = { ...classData[studentToEdit], active, gender };
    
    const newClassData: ClassData = { ...classData, students: newStudents, [newName]: studentData };
    if (newName !== studentToEdit) {
      delete newClassData[studentToEdit];
    }

    onUpdateAppData({
      ...appData,
      [classKey]: newClassData
    });
    
    if (selectedStudent === studentToEdit) {
      setSelectedStudent(newName);
    }
    setStudentModalOpen(false);
  };

  const handleDeleteStudent = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`REMOVER DEFINITIVAMENTE O ALUNO ${name}?`)) {
      const newStudents = classData.students.filter(s => s !== name);
      const newClassData: ClassData = { ...classData, students: newStudents };
      delete newClassData[name];
      
      onUpdateAppData({
        ...appData,
        [classKey]: newClassData
      });
      
      if (selectedStudent === name) {
        setSelectedStudent(newStudents[0] || "");
      }
    }
  };

  const toggleSkill = (skillId: string) => {
    if (isBulkMode) {
      if (selectedStudentsBulk.length === 0) {
        alert("SELECIONE PELO MENOS UM ESTUDANTE NO MODO LOTE.");
        return;
      }
      const firstStudent = selectedStudentsBulk[0];
      const hasSkill = classData[firstStudent][selectedUnit].skills.includes(skillId);
      
      const newClassData = { ...classData };
      
      selectedStudentsBulk.forEach(student => {
        const studentUnitData = classData[student][selectedUnit];
        let newSkills = [...studentUnitData.skills];
        
        if (hasSkill) {
          newSkills = newSkills.filter(id => id !== skillId);
        } else {
          if (!newSkills.includes(skillId)) {
            newSkills.push(skillId);
          }
        }
        
        const subjectOrder = ['portugues', 'matematica', 'ciencias', 'historia'];
        const newSelectedSkills = globalSkills
          .filter(sk => newSkills.includes(sk.id) && sk.grade === currentGrade)
          .sort((a, b) => {
            const orderA = subjectOrder.indexOf(a.subject);
            const orderB = subjectOrder.indexOf(b.subject);
            if (orderA !== orderB) return orderA - orderB;
            return a.id.localeCompare(b.id);
          });
          
        let newText = "";
        if (newSelectedSkills.length > 0) {
          const gender = classData[student]?.gender;
          newText = formatReportText(student, selectedUnit, newSelectedSkills, gender);
        }
        
        newClassData[student] = {
          ...newClassData[student],
          [selectedUnit]: {
            ...studentUnitData,
            skills: newSkills,
            observation: newText
          }
        };
      });
      
      onUpdateAppData({
        ...appData,
        [classKey]: newClassData
      });

    } else {
      if (!selectedStudent) return;
      const studentUnitData = classData[selectedStudent][selectedUnit];
      let newSkills = [...studentUnitData.skills];
      
      if (newSkills.includes(skillId)) {
        newSkills = newSkills.filter(id => id !== skillId);
      } else {
        newSkills.push(skillId);
      }
      
      const subjectOrder = ['portugues', 'matematica', 'ciencias', 'historia'];
      const newSelectedSkills = globalSkills
        .filter(sk => newSkills.includes(sk.id) && sk.grade === currentGrade)
        .sort((a, b) => {
          const orderA = subjectOrder.indexOf(a.subject);
          const orderB = subjectOrder.indexOf(b.subject);
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
        
      let newText = "";
      if (newSelectedSkills.length > 0) {
        const gender = classData[selectedStudent]?.gender;
        newText = formatReportText(selectedStudent, selectedUnit, newSelectedSkills, gender);
      }
      
      onUpdateAppData({
        ...appData,
        [classKey]: {
          ...classData,
          [selectedStudent]: {
            ...classData[selectedStudent],
            [selectedUnit]: {
              ...studentUnitData,
              skills: newSkills,
              observation: newText
            }
          }
        }
      });
    }
  };

  const handleManualEdit = () => {
    if (!selectedStudent || !reportRef.current) return;
    const text = reportRef.current.innerText.toUpperCase();
    
    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        [selectedStudent]: {
          ...classData[selectedStudent],
          [selectedUnit]: {
            ...classData[selectedStudent][selectedUnit],
            observation: text
          }
        }
      }
    });
  };

  const filteredStudents = classData.students.filter(s => {
    const matchesSearch = s.toLowerCase().includes(searchStudent.toLowerCase());
    const isActive = classData[s]?.active !== false; // default to true if undefined
    
    if (statusFilter === 'active') return matchesSearch && isActive;
    if (statusFilter === 'inactive') return matchesSearch && !isActive;
    return matchesSearch;
  });

  const getStatsRaw = () => {
    const activeStudents = classData.students.filter(s => classData[s]?.active !== false);
    const total = activeStudents.length;
    let done = 0;
    activeStudents.forEach(s => {
      const studentUnitData = classData[s][selectedUnit];
      if (studentUnitData.observation) {
        done++;
        return;
      }
      const studentSkills = studentUnitData.skills;
      if (studentSkills.length > 0) {
        const skillsObjs = globalSkills.filter(sk => studentSkills.includes(sk.id) && sk.grade === currentGrade);
        const hasPort = skillsObjs.some(sk => sk.subject === 'portugues');
        const hasMat = skillsObjs.some(sk => sk.subject === 'matematica');
        const hasCien = skillsObjs.some(sk => sk.subject === 'ciencias');
        const hasHist = skillsObjs.some(sk => sk.subject === 'historia');
        if (hasPort && hasMat && hasCien && hasHist) {
          done++;
        }
      }
    });
    return { done, pending: total - done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  };

  const currentStudentData = selectedStudent ? classData[selectedStudent][selectedUnit] : null;
  
  const subjectSubFilters: Record<string, { id: string, label: string, match: (id: string) => boolean }[]> = {
    portugues: currentGrade === '1' ? [
      { id: 'all', label: 'Todas', match: () => true },
      { id: 'leitura', label: 'Leitura (1-3)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 1 && n <= 3; } },
      { id: 'producao', label: 'Produção de Texto (4-9)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 4 && n <= 9; } },
      { id: 'oralidade', label: 'Comunicação Oral (10)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n === 10; } },
      { id: 'analise', label: 'Análise e Reflexão (11-17)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 11 && n <= 17; } },
    ] : [],
    matematica: currentGrade === '1' ? [
      { id: 'all', label: 'Todas', match: () => true },
      { id: 'aprendizagens', label: 'Aprendizagens Gerais (1)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n === 1; } },
      { id: 'numeros', label: 'Números e Operações (2-7)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 2 && n <= 7; } },
      { id: 'espaco', label: 'Espaço e Forma (8-9)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 8 && n <= 9; } },
      { id: 'grandezas', label: 'Grandezas e Medidas (10-12)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 10 && n <= 12; } },
      { id: 'tratamento', label: 'Tratamento da Informação (13-14)', match: (id: string) => { const m = id.match(/\d+$/); if(!m) return false; const n = parseInt(m[0], 10); return n >= 13 && n <= 14; } },
    ] : [],
    historia: [
      { id: 'all', label: 'Todas', match: () => true },
      { id: 'historia', label: 'História', match: (id: string) => id.includes('HI') },
      { id: 'geografia', label: 'Geografia', match: (id: string) => id.includes('GE') },
    ]
  };

  let currentSkills = globalSkills
    .filter(s => s.subject === activeTab && s.grade === currentGrade)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (subjectSubFilters[activeTab] && subjectSubFilters[activeTab].length > 0) {
    const activeFilterObj = subjectSubFilters[activeTab].find(f => f.id === activeSubFilter);
    if (activeFilterObj && activeFilterObj.id !== 'all') {
      currentSkills = currentSkills.filter(s => activeFilterObj.match(s.id));
    }
  }

  const subjectOrder = ['portugues', 'matematica', 'ciencias', 'historia'];

  const formatReportText = (studentName: string, unit: string, skills: Skill[], gender?: 'M' | 'F' | '') => {
    if (skills.length === 0) return "";
    const skillTexts = skills.map(s => {
      let text = s.report.trim();
      if (text.endsWith('.')) text = text.slice(0, -1);
      return text;
    });
    return generateReportText(studentName, gender, unit, skillTexts);
  };

  let reportText = "SELECIONE UM ESTUDANTE...";
  if (isBulkMode) {
    if (selectedStudentsBulk.length > 0) {
      reportText = `MODO LOTE ATIVADO - ${selectedStudentsBulk.length} ESTUDANTE(S) SELECIONADO(S).\n\nAS HABILIDADES CLICADAS SERÃO ATRIBUÍDAS A TODOS OS ESTUDANTES DESTA SELEÇÃO.`;
    } else {
      reportText = "MODO LOTE ATIVADO - SELECIONE OS ESTUDANTES NA BARRA LATERAL PARA ATRIBUIÇÃO EM MASSA.";
    }
  } else if (selectedStudent && currentStudentData) {
    if (currentStudentData.observation) {
      reportText = currentStudentData.observation;
    } else {
      const selectedSkills = globalSkills
        .filter(s => currentStudentData.skills.includes(s.id) && s.grade === currentGrade)
        .sort((a, b) => {
          const orderA = subjectOrder.indexOf(a.subject);
          const orderB = subjectOrder.indexOf(b.subject);
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
      if (selectedSkills.length > 0) {
        reportText = formatReportText(selectedStudent, selectedUnit, selectedSkills, currentStudentData?.gender);
      } else {
        reportText = "AGUARDANDO SELEÇÃO DE HABILIDADES...".toUpperCase();
      }
    }
  }

  useEffect(() => {
    if (reportRef.current && document.activeElement !== reportRef.current) {
      reportRef.current.innerText = reportText;
    }
  }, [reportText, selectedStudent, selectedUnit]);

  const exportIndividualDocx = async (type: 'unit' | 'history') => {
    if (!selectedStudent) return;
    const children = [
      new Paragraph({ text: "E. M. RAYMUNDO LEMOS SANTANA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }), 
      new Paragraph({ text: `PARECER PEDAGÓGICO - ${selectedStudent}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 300 } })
    ];
    const unitsToExport = type === 'unit' ? [selectedUnit] : units;
    
    unitsToExport.forEach(u => {
      const data = classData[selectedStudent][u];
      const selected = globalSkills
        .filter(sk => data.skills.includes(sk.id) && sk.grade === currentGrade)
        .sort((a, b) => {
          const orderA = subjectOrder.indexOf(a.subject);
          const orderB = subjectOrder.indexOf(b.subject);
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
      const text = data.observation || (selected.length > 0 ? formatReportText(selectedStudent, u, selected, data.gender || classData[selectedStudent]?.gender) : "NÃO PREENCHIDO");
      children.push(new Paragraph({ text: u.toUpperCase(), heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
      children.push(new Paragraph({ text: text.toUpperCase(), alignment: AlignmentType.JUSTIFIED, spacing: { after: 200 } }));
    });
    
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `PARECER_${selectedStudent}.docx`);
  };

  const exportBatchDocx = async () => {
    const activeStudents = classData.students.filter(s => classData[s]?.active !== false);
    if (activeStudents.length === 0) return;
    const children = [
      new Paragraph({ text: `RELATÓRIO DE UNIDADE - ${currentGrade}º ${currentLetter} - ${selectedUnit}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } })
    ];
    
    activeStudents.forEach(s => {
      const data = classData[s][selectedUnit];
      const selected = globalSkills
        .filter(sk => data.skills.includes(sk.id) && sk.grade === currentGrade)
        .sort((a, b) => {
          const orderA = subjectOrder.indexOf(a.subject);
          const orderB = subjectOrder.indexOf(b.subject);
          if (orderA !== orderB) return orderA - orderB;
          return a.id.localeCompare(b.id);
        });
      const text = data.observation || (selected.length > 0 ? formatReportText(s, selectedUnit, selected, data.gender || classData[s]?.gender) : "NÃO PREENCHIDO");
      children.push(new Paragraph({ text: `ESTUDANTE: ${s}`, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: text.toUpperCase(), alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 } }));
    });
    
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `TURMA_${classKey}_${selectedUnit}.docx`);
  };

  const saveTemplate = () => {
    if (!reportRef.current?.innerText) {
      alert("O texto do parecer está vazio.");
      return;
    }
    const name = prompt("Nome para salvar este modelo de parecer:");
    if (name) {
      const newTemplates = [...templates, { name: name.toUpperCase(), text: reportRef.current.innerText.toUpperCase() }];
      setTemplates(newTemplates);
      localStorage.setItem('edu_templates_v13', JSON.stringify(newTemplates));
      alert("Modelo salvo com sucesso!");
    }
  };

  const loadTemplate = (text: string) => {
    if (reportRef.current && selectedStudent) {
      reportRef.current.innerText = text;
      handleManualEdit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 bg-white flex items-center justify-between px-6 shrink-0 border-b border-slate-200 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button onClick={onGoBack} className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Home className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black uppercase">Turma <span>{currentGrade}º {currentLetter}</span></h1>
            <p className="text-[9px] text-escola-verde font-bold uppercase tracking-widest">Gestão de Pareceres</p>
          </div>
        </div>
        <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl gap-1">
          {units.map(u => (
            <button 
              key={u} 
              onClick={() => setSelectedUnit(u)} 
              className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${selectedUnit === u ? 'bg-white text-escola-azul shadow-sm -translate-y-[1px]' : 'text-slate-400'}`}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsProgressOpen(!isProgressOpen)} 
              className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 relative transition-all"
            >
              <Bell className="w-5 h-5" />
              {(() => {
                const stats = getStatsRaw();
                if (stats.percent === 100) {
                  return (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-escola-verde rounded-full border-2 border-white"></span>
                  );
                } else if (stats.percent > 0) {
                  return (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
                  );
                }
                return null;
              })()}
            </button>
            {isProgressOpen && (
              <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Progresso ({selectedUnit})</h3>
                {(() => {
                  const stats = getStatsRaw();
                  const data = [
                    { name: 'Feito', value: stats.done },
                    { name: 'Pendente', value: stats.pending }
                  ];
                  return (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data}
                              innerRadius="75%"
                              outerRadius="100%"
                              paddingAngle={0}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                              stroke="none"
                            >
                              <Cell key="cell-0" fill="#7fb432" />
                              <Cell key="cell-1" fill="#e2e8f0" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black text-slate-700">{stats.percent}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-slate-500 font-bold uppercase">Concluídos</span>
                          <span className="font-black text-escola-verde">{stats.done}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-bold uppercase">Pendentes</span>
                          <span className="font-black text-slate-400">{stats.pending}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button onClick={exportBatchDocx} className="bg-escola-azul text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <Download className="w-4 h-4" /> Exportar Turma
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden bg-slate-50 p-4 gap-4">
        <aside className={`bg-white rounded-3xl border border-slate-200 flex flex-col shrink-0 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none opacity-0'}`}>
          <div className="w-72 flex flex-col h-full">
            <div className="p-6 pb-2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudantes</h2>
                <button 
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors flex items-center gap-1 ${isBulkMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {isBulkMode ? <CheckSquare className="w-3 h-3" /> : <Layers className="w-3 h-3" />} Lote
                </button>
              </div>
              <input 
                type="text" 
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder="BUSCAR..." 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none mb-3"
              />
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Ativos
                </button>
                <button 
                  onClick={() => setStatusFilter('inactive')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${statusFilter === 'inactive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Inativos
                </button>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-6 mt-2">
              {filteredStudents.map(s => {
                const numSkills = classData[s]?.[selectedUnit]?.skills?.length || 0;
                const obsLength = classData[s]?.[selectedUnit]?.observation?.trim()?.length || 0;
                
                let isDone = false;
                let isProgress = false;
                if (obsLength > 10 || (numSkills > 0 && obsLength > 0)) {
                  isDone = true;
                } else if (numSkills > 0 || obsLength > 0) {
                  isProgress = true;
                }
                
                const isActive = classData[s]?.active !== false;
                const isSelectedInBulk = selectedStudentsBulk.includes(s);

                return (
                <div key={s} className="group relative flex items-center">
                  <button 
                    onClick={() => {
                      if (isBulkMode) {
                        setSelectedStudentsBulk(prev => 
                          prev.includes(s) ? prev.filter(st => st !== s) : [...prev, s]
                        );
                      } else {
                        setSelectedStudent(s);
                      }
                    }} 
                    className={`flex-1 flex items-center gap-2 text-left px-4 py-3 rounded-xl text-[11px] font-bold transition-all ${
                      isBulkMode 
                        ? (isSelectedInBulk ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent')
                        : (selectedStudent === s ? 'bg-escola-azul text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 border border-transparent')
                    }`}
                  >
                    {isBulkMode ? (
                      isSelectedInBulk ? <CheckSquare className="w-4 h-4 shrink-0 text-amber-500" /> : <Square className="w-4 h-4 shrink-0 text-slate-300" />
                    ) : (
                      isDone ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${selectedStudent === s ? 'text-white' : 'text-escola-verde'}`} />
                      ) : isProgress ? (
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${selectedStudent === s ? 'text-white/80' : 'text-amber-400'}`} />
                      ) : (
                        <div className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 ${selectedStudent === s ? 'border-white/30' : 'border-red-400/50 bg-red-50'}`} />
                      )
                    )}
                    <span className={`truncate uppercase block pr-14 ${!isActive ? 'line-through opacity-60' : ''}`}>{s}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setStudentToEdit(s); setStudentModalOpen(true); }} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-slate-500 hover:text-escola-azul shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDeleteStudent(s, e)} className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 shadow-sm border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )})}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button onClick={() => { setStudentToEdit(""); setStudentModalOpen(true); }} className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-slate-500 text-[10px] font-black uppercase hover:text-escola-azul hover:border-escola-azul/40 hover:bg-slate-50 transition-colors">
                + Estudante
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <nav className="h-14 bg-white border-b border-slate-100 flex items-center px-8 gap-8 shrink-0">
            {subjects.map(sub => (
              <button 
                key={sub.id} 
                onClick={() => setActiveTab(sub.id)} 
                className={`relative py-4 text-[11px] font-black uppercase transition-all ${activeTab === sub.id ? 'text-escola-azul' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {sub.label}
                {activeTab === sub.id && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-escola-verde rounded-t-lg" />}
              </button>
            ))}
            <button 
              onClick={() => setActiveTab('assessments')} 
              className={`relative py-4 text-[11px] font-black uppercase transition-all ml-auto ${activeTab === 'assessments' ? 'text-escola-azul' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Avaliações
              {activeTab === 'assessments' && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-escola-verde rounded-t-lg" />}
            </button>
          </nav>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {activeTab === 'assessments' ? (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-[10px] font-black text-escola-azul uppercase tracking-widest">Avaliações</h3>
                  {!editingTestId && !correctingTestId && (
                    <button onClick={() => {
                      setEditingTestId('new');
                      setTestForm({ name: "", unit: selectedUnit, skills: [], questions: [] });
                    }} className="text-[9px] font-black text-escola-verde hover:underline">NOVA AVALIAÇÃO</button>
                  )}
                </div>

                {editingTestId ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-slate-700">{editingTestId === 'new' ? 'Criar Avaliação' : 'Editar Avaliação'}</h4>
                      <button onClick={() => setEditingTestId(null)} className="text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600">Cancelar</button>
                    </div>
                    
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={testForm.name} 
                        onChange={e => setTestForm({...testForm, name: e.target.value})} 
                        placeholder="NOME DA AVALIAÇÃO" 
                        className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-escola-azul text-xs font-bold uppercase"
                      />
                      <select 
                        value={testForm.unit} 
                        onChange={e => setTestForm({...testForm, unit: e.target.value})}
                        className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-escola-azul text-xs font-bold uppercase w-48"
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    <div className="space-y-4">
                      {testForm.questions.length === 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Habilidades da Avaliação</span>
                            <span className="text-[10px] font-bold text-slate-400">{testForm.skills.length} selecionadas</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                            {globalSkills.filter(s => s.grade === currentGrade).map(s => (
                              <label key={s.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-escola-azul">
                                <input 
                                  type="checkbox" 
                                  checked={testForm.skills.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (testForm.skills.length >= 5) {
                                        alert("Você pode selecionar no máximo 5 habilidades (20 questões).");
                                        return;
                                      }
                                      setTestForm({...testForm, skills: [...testForm.skills, s.id]});
                                    } else {
                                      setTestForm({...testForm, skills: testForm.skills.filter(id => id !== s.id)});
                                    }
                                  }}
                                  className="mt-1 accent-escola-azul"
                                />
                                <div className="flex-1">
                                  <div className="text-[10px] font-black uppercase text-slate-700">{s.id}</div>
                                  <div className="text-[9px] font-medium text-slate-500 leading-tight mt-1">{s.report}</div>
                                </div>
                              </label>
                            ))}
                            {globalSkills.filter(s => s.grade === currentGrade).length === 0 && (
                                <div className="col-span-full p-4 text-center text-[10px] text-slate-400 font-bold uppercase">Nenhuma habilidade cadastrada para este ano.</div>
                            )}
                          </div>
                          <div className="flex justify-end pt-2">
                            <button 
                              disabled={testForm.skills.length === 0 || isGeneratingTest}
                              onClick={async () => {
                                setIsGeneratingTest(true);
                                try {
                                  const selectedSkillObjects = testForm.skills.map(id => globalSkills.find(s => s.id === id)).filter(Boolean);
                                  const res = await fetch('/api/generate-test', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ skills: selectedSkillObjects, grade: currentGrade })
                                  });
                                  const data = await res.json();
                                  if (data.data) {
                                    // Flatten the result into a questions array
                                    let qNum = 1;
                                    const finalQuestions: any[] = [];
                                    data.data.forEach((skillBlock: any) => {
                                      if (skillBlock.questions) {
                                        skillBlock.questions.forEach((q: any) => {
                                          finalQuestions.push({
                                            number: qNum++,
                                            skillId: skillBlock.skillId,
                                            generatedData: q
                                          });
                                        });
                                      }
                                    });
                                    setTestForm({ ...testForm, questions: finalQuestions });
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert("Erro ao gerar avaliação.");
                                } finally {
                                  setIsGeneratingTest(false);
                                }
                              }}
                              className="bg-purple-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isGeneratingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              Gerar {testForm.skills.length * 4} Questões com IA
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Questões Geradas ({testForm.questions.length})</span>
                            <button 
                              onClick={() => setTestForm({...testForm, questions: []})}
                              className="text-[9px] font-bold uppercase text-red-500 hover:underline"
                            >
                              Descartar e Gerar Novamente
                            </button>
                          </div>
                          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                            {testForm.questions.map((q, idx) => (
                              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-700">Questão {q.number}</span>
                                  <span className="text-[9px] font-bold uppercase text-purple-600 bg-purple-100 px-2 py-1 rounded-md">{q.skillId}</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-800 whitespace-pre-wrap">{q.generatedData?.text}</p>
                                <div className="space-y-2 pl-2">
                                  {q.generatedData?.options?.map((opt: string, i: number) => (
                                    <div key={i} className={`text-[10px] p-2 rounded-lg ${i === q.generatedData.correctAnswerIndex ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'bg-white text-slate-600 border border-slate-100'}`}>
                                      {String.fromCharCode(65 + i)}) {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={() => {
                          if (!testForm.name || testForm.questions.length === 0) return alert("Preencha o nome e gere as questões com IA.");

                          const newTest = {
                            id: editingTestId === 'new' ? Date.now().toString() : editingTestId,
                            name: testForm.name,
                            unit: testForm.unit,
                            grade: currentGrade,
                            questions: testForm.questions
                          };
                          
                          if (editingTestId === 'new') {
                            saveTests([...tests, newTest]);
                          } else {
                            saveTests(tests.map(t => t.id === editingTestId ? newTest : t));
                          }
                          
                          generatePDF(newTest);
                          
                          setEditingTestId(null);
                        }}
                        className="bg-escola-azul text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-blue-600 transition-colors"
                      >
                        Salvar Avaliação e Baixar PDF
                      </button>
                    </div>
                  </div>
                ) : correctingTestId ? (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    {(() => {
                      const t = tests.find(test => test.id === correctingTestId);
                      if (!t) return null;
                      return (
                        <>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                              <h4 className="text-sm font-black uppercase text-slate-800">{t.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{t.unit} • Corrigindo: <span className="text-escola-azul">{selectedStudent || 'Nenhum estudante selecionado'}</span></p>
                            </div>
                            <button onClick={() => setCorrectingTestId(null)} className="text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600">Fechar Corretor</button>
                          </div>
                          
                          {!selectedStudent ? (
                            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-xs font-bold uppercase">
                              Selecione um estudante na barra lateral para começar a correção.
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Respostas (Correção Manual)</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {t.questions.map(q => {
                                      const isChecked = correctionForm[q.number] || false;
                                      const sInfo = globalSkills.find(s => s.id === q.skillId);
                                      return (
                                        <div 
                                          key={q.number}
                                          onClick={() => setCorrectionForm({...correctionForm, [q.number]: !isChecked})}
                                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${isChecked ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                          title={sInfo?.report}
                                        >
                                          <span className={`text-[10px] font-black uppercase ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>Q{q.number}</span>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}>
                                            <CheckCircle2 className="w-4 h-4" />
                                          </div>
                                          <span className="text-[8px] font-bold text-slate-500 truncate w-full text-center">{q.skillId || 'Sem Hab.'}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="w-full md:w-64 space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
                                  <Camera className="w-8 h-8 text-slate-300 mb-2" />
                                  <div>
                                    <h5 className="text-[10px] font-black uppercase text-slate-600">Correção Automática</h5>
                                    <p className="text-[9px] font-medium text-slate-400 mt-1">Envie a foto do gabarito preenchido pelo aluno para corrigir com IA.</p>
                                  </div>
                                  <label className="cursor-pointer bg-escola-azul text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-blue-600 transition-colors w-full flex items-center justify-center gap-2">
                                    {isCorrectingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    {isCorrectingImage ? 'Analisando...' : 'Enviar Foto'}
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      disabled={isCorrectingImage}
                                      onChange={async (e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          setIsCorrectingImage(true);
                                          const file = e.target.files[0];
                                          const reader = new FileReader();
                                          reader.onloadend = async () => {
                                            const base64Data = (reader.result as string).split(',')[1];
                                            const mimeType = file.type;
                                            try {
                                              const res = await fetch('/api/correct-test', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                  imageBase64: base64Data, 
                                                  mimeType, 
                                                  testQuestions: t.questions.map(q => ({ number: q.number, correctAnswerIndex: q.generatedData?.correctAnswerIndex }))
                                                })
                                              });
                                              const resData = await res.json();
                                              if (resData.data) {
                                                const newForm = { ...correctionForm };
                                                resData.data.forEach((item: any) => {
                                                  if (item.questionNumber) {
                                                    newForm[item.questionNumber] = !!item.isCorrect;
                                                  }
                                                });
                                                setCorrectionForm(newForm);
                                              }
                                            } catch (err) {
                                              console.error(err);
                                              alert("Erro ao analisar a imagem.");
                                            } finally {
                                              setIsCorrectingImage(false);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="pt-4 flex justify-end">
                                <button 
                                  onClick={() => {
                                    const studentData = { ...classData[selectedStudent] };
                                    if (!studentData[t.unit]) {
                                      studentData[t.unit] = { skills: [], observation: "" };
                                    }
                                    
                                    const currentSkillsOfUnit = [...(studentData[t.unit].skills || [])];
                                    
                                    // Add correctly answered skills
                                    t.questions.forEach(q => {
                                      if (correctionForm[q.number] && q.skillId) {
                                        if (!currentSkillsOfUnit.includes(q.skillId)) {
                                          currentSkillsOfUnit.push(q.skillId);
                                        }
                                      }
                                    });

                                    studentData[t.unit].skills = currentSkillsOfUnit;
                                    
                                    const updatedClassData = {
                                      ...classData,
                                      [selectedStudent]: studentData
                                    };
                                    
                                    onUpdateAppData({
                                      ...appData,
                                      [classKey]: updatedClassData
                                    });

                                    // Generate the report via utility directly if we had a dedicated generate just for this, but since the text updates based on skills automatically if they click 'Gerar Parecer' later, we can just optionally update text here or let them click the robot. We'll generate it now.
                                    
                                    const skillTexts = currentSkillsOfUnit.map(id => globalSkills.find(s => s.id === id)?.report || '').filter(Boolean);
                                    const newText = generateReportText(selectedStudent, studentData.gender || 'M', t.unit, skillTexts);
                                    
                                    // Also apply to observation so it's saved!
                                    updatedClassData[selectedStudent][t.unit].observation = newText;
                                    onUpdateAppData({
                                      ...appData,
                                      [classKey]: updatedClassData
                                    });
                                    
                                    setCorrectionForm({});
                                    setCorrectingTestId(null);
                                    setActiveTab('portugues'); // go back to main to see the updated text
                                  }}
                                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                  <CheckSquare className="w-4 h-4" /> Finalizar Correção e Gerar Parecer
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tests.filter(t => t.grade === currentGrade).length === 0 ? (
                      <div className="col-span-full p-8 text-center text-slate-400 font-bold text-xs uppercase bg-slate-50 rounded-2xl border border-slate-200">
                        Nenhuma avaliação cadastrada para este ano.
                      </div>
                    ) : (
                      tests.filter(t => t.grade === currentGrade).map(t => (
                        <div key={t.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                          <div className="mb-4">
                            <h4 className="text-sm font-black uppercase text-slate-800">{t.name}</h4>
                            <p className="text-[10px] font-bold text-escola-azul uppercase mt-1">{t.unit} • {t.questions.length} Questões</p>
                          </div>
                          
                          <div className="mt-auto flex gap-2">
                            <button 
                              onClick={() => {
                                setCorrectingTestId(t.id);
                                setCorrectionForm({});
                              }}
                              className="flex-1 bg-escola-verde/10 text-escola-verde hover:bg-escola-verde hover:text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-colors text-center"
                            >
                              Corrigir Turma
                            </button>
                            <button 
                              onClick={() => {
                                generatePDF(t);
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors"
                              title="Baixar PDF da Prova"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingTestId(t.id);
                                setTestForm({ name: t.name, unit: t.unit, skills: Array.from(new Set(t.questions.map((q: any) => q.skillId))), questions: t.questions });
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm("Excluir esta avaliação?")) {
                                  saveTests(tests.filter(test => test.id !== t.id));
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            ) : (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-[10px] font-black text-escola-azul uppercase tracking-widest">Habilidades</h3>
                  <button onClick={() => setSkillsModalOpen(true)} className="text-[9px] font-black text-escola-verde hover:underline">GERENCIAR HABILIDADES</button>
                </div>

              {subjectSubFilters[activeTab] && subjectSubFilters[activeTab].length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {subjectSubFilters[activeTab].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveSubFilter(filter.id)}
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${activeSubFilter === filter.id ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {currentSkills.map(s => {
                  let isSet = false;
                  
                  if (isBulkMode) {
                    if (selectedStudentsBulk.length > 0) {
                      // Check if the first selected student has this skill
                      isSet = classData[selectedStudentsBulk[0]]?.[selectedUnit]?.skills.includes(s.id);
                    }
                  } else {
                    isSet = currentStudentData?.skills.includes(s.id) || false;
                  }

                  let usedInOtherUnit = "";
                  if (!isBulkMode && !isSet && selectedStudent) {
                    for (const u of units) {
                      if (u !== selectedUnit && classData[selectedStudent]?.[u]?.skills?.includes(s.id)) {
                        usedInOtherUnit = u;
                        break;
                      }
                    }
                  }
                  
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => toggleSkill(s.id)} 
                      className={`group relative p-4 bg-white border cursor-pointer transition-all duration-300 ease-in-out flex flex-col gap-2 rounded-2xl ${isSet ? 'border-escola-verde ring-1 ring-escola-verde/20 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color || '#cbd5e1' }} />
                          <span className={`text-[10px] font-black uppercase ${isSet ? 'text-escola-verde' : 'text-slate-500'}`}>
                            {s.id}
                          </span>
                          {usedInOtherUnit && (
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                              {usedInOtherUnit}
                            </span>
                          )}
                        </div>
                        {isSet && (
                          <div className="animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 className="w-4 h-4 text-escola-verde shrink-0" />
                          </div>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed font-medium transition-colors duration-300 ${isSet ? 'text-slate-800' : 'text-slate-500'}`}>
                        {s.report}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
            )}
          </div>
        </main>
        
        {/* Floating Report Panel */}
        <div className={`fixed bottom-6 right-6 w-[450px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-50 flex flex-col transition-all duration-500 transform ${isReportOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white rounded-t-3xl cursor-pointer" onClick={() => setIsReportOpen(false)}>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-escola-verde" />
              <span className="text-xs font-black uppercase tracking-wider">{selectedStudent || "--"}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); saveTemplate(); }} className="text-[9px] bg-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-600 text-white font-bold uppercase flex items-center gap-1 transition-colors" title="Salvar como Modelo"><Layers className="w-3 h-3" /> Salvar</button>
              {templates.length > 0 && (
                <select onClick={(e) => e.stopPropagation()} onChange={(e) => { if(e.target.value) loadTemplate(e.target.value); e.target.value = ''; }} className="text-[9px] px-2 py-1.5 rounded-lg font-bold uppercase bg-slate-700 hover:bg-slate-600 text-white outline-none cursor-pointer max-w-[80px]">
                  <option value="">Modelos</option>
                  {templates.map(t => <option key={t.name} value={t.text}>{t.name}</option>)}
                </select>
              )}
              <button onClick={(e) => { e.stopPropagation(); setIsReadMode(!isReadMode); }} className={`text-[9px] px-2 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1 transition-colors ${isReadMode ? 'bg-amber-100 text-amber-900' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}><Book className="w-3 h-3" /> {isReadMode ? 'Normal' : 'Leitura'}</button>
              <button onClick={(e) => { e.stopPropagation(); exportIndividualDocx('unit'); }} className="text-[9px] bg-escola-azul px-2 py-1.5 rounded-lg hover:bg-blue-600 text-white font-bold uppercase flex items-center gap-1 transition-colors"><Download className="w-3 h-3" /> Unidade</button>
              <button onClick={(e) => { e.stopPropagation(); exportIndividualDocx('history'); }} className="text-[9px] bg-escola-azul px-2 py-1.5 rounded-lg hover:bg-blue-600 text-white font-bold uppercase flex items-center gap-1 transition-colors"><Download className="w-3 h-3" /> Histórico</button>
            </div>
          </div>
          <div className={`p-5 h-[320px] flex flex-col overflow-y-auto rounded-b-3xl transition-colors ${isReadMode ? 'bg-[#fdf6e3]' : 'bg-slate-50'}`}>
            {(() => {
              const unitIndex = units.indexOf(selectedUnit);
              if (unitIndex > 0 && selectedStudent && classData[selectedStudent]) {
                const prevUnit = units[unitIndex - 1];
                const prevUnitText = classData[selectedStudent][prevUnit]?.observation;
                if (prevUnitText) {
                  return (
                    <div className="mb-4 p-3 bg-slate-100/80 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Histórico ({prevUnit})</p>
                      <p className="text-[10px] text-slate-600 uppercase italic line-clamp-3 hover:line-clamp-none transition-all cursor-pointer leading-relaxed">{prevUnitText}</p>
                    </div>
                  );
                }
              }
              return null;
            })()}
            <div 
              ref={reportRef}
              spellCheck={true}
              contentEditable={!isBulkMode && !!selectedStudent} 
              onInput={handleManualEdit}
              onBlur={handleManualEdit}
              className={`font-['Plus_Jakarta_Sans'] leading-[1.8] text-[12px] outline-none p-5 rounded-2xl uppercase text-justify min-h-[150px] flex-1 transition-all shadow-sm border ${isReadMode ? 'bg-[#fffbf0] border-amber-200 text-slate-900 focus:border-amber-400 font-medium' : 'bg-white border-slate-200 focus:border-amber-400 text-slate-800'}`}
            />
          </div>
        </div>

        {/* Toggle Button if closed */}
        {!isReportOpen && (
          <button 
            onClick={() => setIsReportOpen(true)}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl font-black uppercase text-xs flex items-center gap-3 hover:bg-slate-800 transition-all z-50 hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
          >
            <Edit3 className="w-4 h-4 text-escola-verde" />
            Ver Parecer
          </button>
        )}
      </div>

      <StudentModal 
        isOpen={studentModalOpen} 
        initialName={studentToEdit} 
        initialActive={studentToEdit ? classData[studentToEdit]?.active !== false : true}
        initialGender={studentToEdit ? classData[studentToEdit]?.gender : ''}
        onClose={() => setStudentModalOpen(false)} 
        onConfirm={studentToEdit ? handleEditStudent : handleAddStudent} 
      />
      
      <SkillsModal 
        isOpen={skillsModalOpen} 
        onClose={() => setSkillsModalOpen(false)} 
        globalSkills={globalSkills}
        onSaveSkill={(skill) => onUpdateGlobalSkills([...globalSkills, skill])}
        onDeleteSkill={(idx) => {
          const newSkills = [...globalSkills];
          newSkills.splice(idx, 1);
          onUpdateGlobalSkills(newSkills);
        }}
      />
    </div>
  );
}
