import React, { useState, useEffect, useRef } from 'react';
import { Home, Download, Edit3, Trash2, CheckCircle2, Menu, Clock, Bell, Book, CheckSquare, Square, Layers, Sparkles, Check, BarChart3, Search, BookOpen, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';
import { generateReportText } from '@/lib/utils';
import { StudentModal } from './StudentModal';
import { SkillsModal } from './SkillsModal';
import { ClassDiagnosis } from './ClassDiagnosis';
import { SchoolLogo } from './SchoolLogo';
import { PhraseBankModal } from './PhraseBankModal';
import { QuickSkillSearchModal } from './QuickSkillSearchModal';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'aee'>('active');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState("");
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isPhraseBankOpen, setIsPhraseBankOpen] = useState(false);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentsBulk, setSelectedStudentsBulk] = useState<string[]>([]);

  const [isReportOpen, setIsReportOpen] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);
  const [templates, setTemplates] = useState<{name: string, text: string}[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSubFilter("all");
  }, [activeTab, currentGrade]);

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem('edu_templates_v13') || '[]');
    setTemplates(t);
  }, []);

  useEffect(() => {
    if (!classData.students.includes(selectedStudent)) {
      setSelectedStudent(classData.students[0] || "");
    }
  }, [classData.students, selectedStudent]);

  // Global keyboard shortcut for Quick Skills Search: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddStudent = (
    name: string, 
    active: boolean, 
    gender: 'M' | 'F' | '', 
    isAee: boolean, 
    aeeType: string, 
    aeeNotes: string
  ) => {
    if (!name) return;
    if (classData.students.includes(name)) {
      alert("ESTUDANTE JÁ CADASTRADO.");
      return;
    }
    const newStudents = [...classData.students, name].sort();
    const newStudentData: any = { active, gender, isAee, aeeType, aeeNotes };
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

  const handleEditStudent = (
    newName: string, 
    active: boolean, 
    gender: 'M' | 'F' | '',
    isAee: boolean,
    aeeType: string,
    aeeNotes: string
  ) => {
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
    const studentData = { 
      ...classData[studentToEdit], 
      active, 
      gender,
      isAee,
      aeeType,
      aeeNotes
    };
    
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

  const handleInsertPhrase = (phrase: string) => {
    if (!selectedStudent || isBulkMode) return;
    const currentObs = classData[selectedStudent]?.[selectedUnit]?.observation || "";
    const separator = currentObs.trim() ? " " : "";
    const updatedObs = currentObs + separator + phrase;
    
    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        [selectedStudent]: {
          ...(classData[selectedStudent]?.[selectedUnit] ? classData[selectedStudent] : {}),
          ...classData[selectedStudent],
          [selectedUnit]: {
            ...(classData[selectedStudent]?.[selectedUnit] || {}),
            observation: updatedObs
          }
        }
      }
    });

    if (reportRef.current) {
      reportRef.current.innerText = updatedObs;
    }
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
    const isAee = Boolean(classData[s]?.isAee);
    
    if (statusFilter === 'active') return matchesSearch && isActive;
    if (statusFilter === 'inactive') return matchesSearch && !isActive;
    if (statusFilter === 'aee') return matchesSearch && isAee;
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
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="w-9 h-9 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400" title="Voltar para Turmas">
            <Home className="w-4 h-4" />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-9 h-9 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400" title="Menu Lateral">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
            <SchoolLogo size="sm" showText={false} />
            <div>
              <h1 className="text-sm font-black uppercase font-serif tracking-tight text-slate-900 leading-tight">
                {currentGrade}º ANO &quot;{currentLetter}&quot;
              </h1>
              <p className="text-[9px] text-escola-azul font-bold uppercase tracking-wider">
                E. M. Raymundo Lemos Santana
              </p>
            </div>
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
          <button 
            onClick={() => setIsPhraseBankOpen(true)} 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-[10px] font-black uppercase transition-all shadow-xs hover:scale-105 active:scale-95" 
            title="Banco de Frases Pedagógicas & Conectivos (Inserir no Parecer)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Banco de Frases</span>
          </button>
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

      <div className="flex flex-1 overflow-hidden escolar-bg p-4 gap-4">
        <aside className={`bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 flex flex-col shrink-0 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.05)] ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none opacity-0'}`}>
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
                  Inat.
                </button>
                <button 
                  onClick={() => setStatusFilter('aee')}
                  className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${statusFilter === 'aee' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 hover:bg-purple-50'}`}
                >
                  AEE
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
                const isAee = Boolean(classData[s]?.isAee);
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
                    className={`flex-1 flex items-center gap-2 text-left px-3.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
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
                    <span className={`truncate uppercase block ${!isActive ? 'line-through opacity-60' : ''}`}>{s}</span>
                    {isAee && (
                      <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        selectedStudent === s ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                      }`}>
                        AEE
                      </span>
                    )}
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
          <nav className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-6 shrink-0 overflow-x-auto">
            {subjects.map(sub => (
              <button 
                key={sub.id} 
                onClick={() => setActiveTab(sub.id)} 
                className={`relative py-4 text-[11px] font-black uppercase whitespace-nowrap transition-all ${activeTab === sub.id ? 'text-escola-azul' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {sub.label}
                {activeTab === sub.id && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-escola-verde rounded-t-lg" />}
              </button>
            ))}

            <button 
              onClick={() => setActiveTab('diagnostico')} 
              className={`relative py-4 text-[11px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'diagnostico' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Diagnóstico da Turma</span>
              {activeTab === 'diagnostico' && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-indigo-500 rounded-t-lg" />}
            </button>
          </nav>

          {activeTab === 'diagnostico' ? (
            <ClassDiagnosis
              currentGrade={currentGrade}
              currentLetter={currentLetter}
              classData={classData}
              globalSkills={globalSkills}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
              onSelectStudent={(studentName) => {
                setSelectedStudent(studentName);
                setActiveTab('portugues');
              }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-sm shadow-xs">
                      ✏️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Habilidades do Bimestre</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full tabular-nums">
                          {currentSkills.length} {currentSkills.length === 1 ? 'disponível' : 'disponíveis'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {isBulkMode 
                          ? `Modo em lote ativo (${selectedStudentsBulk.length} selecionados)` 
                          : `Estudante: ${selectedStudent || 'Nenhum selecionado'} • ${selectedUnit}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button 
                      onClick={() => setIsQuickSearchOpen(true)} 
                      className="text-[10px] font-black text-slate-700 hover:text-escola-azul bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 transition-all flex items-center gap-2 shadow-xs group"
                      title="Atalho: Ctrl + K ou Cmd + K"
                    >
                      <Search className="w-3.5 h-3.5 text-escola-azul group-hover:scale-110 transition-transform" />
                      <span>BUSCA RÁPIDA</span>
                      <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 bg-slate-100 rounded border border-slate-200">
                        Ctrl+K
                      </kbd>
                    </button>
                    <button 
                      onClick={() => setSkillsModalOpen(true)} 
                      className="text-[10px] font-black text-escola-azul hover:text-blue-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl border border-sky-200/80 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" /> GERENCIAR HABILIDADES
                    </button>
                  </div>
                </div>

                {subjectSubFilters[activeTab] && subjectSubFilters[activeTab].length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {subjectSubFilters[activeTab].map(filter => {
                      const isSelected = activeSubFilter === filter.id;
                      return (
                        <motion.button
                          key={filter.id}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setActiveSubFilter(filter.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                            isSelected 
                              ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-800/20' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          {filter.label}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {currentSkills.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/80 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3">🎨</span>
                    <h4 className="text-sm font-black uppercase text-slate-700">Nenhuma habilidade encontrada</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Não há habilidades cadastradas para este filtro ou matéria. Clique abaixo para cadastrar ou gerenciar.
                    </p>
                    <button
                      onClick={() => setSkillsModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-escola-azul text-white text-xs font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-sm"
                    >
                      Adicionar Habilidades
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    <AnimatePresence mode="popLayout">
                      {currentSkills.map((s, idx) => {
                        let isSet = false;
                        
                        if (isBulkMode) {
                          if (selectedStudentsBulk.length > 0) {
                            isSet = classData[selectedStudentsBulk[0]]?.[selectedUnit]?.skills?.includes(s.id);
                          }
                        } else {
                          isSet = currentStudentData?.skills?.includes(s.id) || false;
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
                          <motion.div 
                            key={s.id} 
                            layout
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ 
                              duration: 0.22, 
                              ease: [0.16, 1, 0.3, 1], 
                              delay: Math.min(idx * 0.012, 0.15) 
                            }}
                            whileHover={{ 
                              scale: 1.025, 
                              y: -3,
                              transition: { duration: 0.16, ease: "easeOut" } 
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleSkill(s.id)} 
                            className={`group relative p-4 rounded-2xl cursor-pointer transition-colors duration-200 flex flex-col justify-between gap-3 border select-none ${
                              isSet 
                                ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10' 
                                : 'bg-white/95 backdrop-blur-xs border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60'
                            }`}
                            style={{
                              borderLeftColor: s.color || (isSet ? '#10b981' : '#0ea5e9'),
                              borderLeftWidth: '5px'
                            }}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                                  style={{ backgroundColor: s.color || '#0ea5e9' }} 
                                />
                                <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${isSet ? 'text-emerald-700' : 'text-slate-700'}`}>
                                  {s.id}
                                </span>
                                {usedInOtherUnit && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/80 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                    <span>📌</span> {usedInOtherUnit}
                                  </span>
                                )}
                              </div>
                              
                              <div className="shrink-0 flex items-center justify-center">
                                {isSet ? (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -25 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                                    className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </motion.div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-slate-400 group-hover:bg-slate-50 transition-colors flex items-center justify-center" />
                                )}
                              </div>
                            </div>

                            <p className={`text-[12px] leading-relaxed font-medium transition-colors ${isSet ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                              {s.report}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                              <span className="text-slate-400 font-semibold truncate max-w-[160px]">
                                {s.category || `${s.grade}º Ano • BNCC`}
                              </span>
                              <span className={`font-bold transition-colors ${isSet ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {isSet ? '✓ Marcada' : '+ Marcar'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
        
        {/* Floating Report Panel */}
        <div className={`fixed bottom-6 right-6 w-[450px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-50 flex flex-col transition-all duration-500 transform ${isReportOpen && activeTab !== 'diagnostico' ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white rounded-t-3xl cursor-pointer" onClick={() => setIsReportOpen(false)}>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-escola-verde" />
              <span className="text-xs font-black uppercase tracking-wider">{selectedStudent || "--"}</span>
              {classData[selectedStudent]?.isAee && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500 text-white">
                  AEE
                </span>
              )}
            </div>
            <div className="flex gap-1.5 items-center">
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
            {classData[selectedStudent]?.isAee && (
              <div className="mb-3 p-2.5 bg-purple-50/90 border border-purple-200 rounded-xl text-[10px] text-purple-900 flex items-start gap-2 shadow-2xs">
                <HeartHandshake className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-[9px] text-purple-800">Estudante AEE / PEI</span>
                    <span className="text-[9px] font-bold bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded-md">
                      {classData[selectedStudent]?.aeeType || 'Adaptação Curricular'}
                    </span>
                  </div>
                  {classData[selectedStudent]?.aeeNotes && (
                    <p className="text-[10px] text-purple-800 mt-1 leading-relaxed italic">
                      {classData[selectedStudent]?.aeeNotes}
                    </p>
                  )}
                </div>
              </div>
            )}
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
        initialIsAee={studentToEdit ? Boolean(classData[studentToEdit]?.isAee) : false}
        initialAeeType={studentToEdit ? classData[studentToEdit]?.aeeType || '' : ''}
        initialAeeNotes={studentToEdit ? classData[studentToEdit]?.aeeNotes || '' : ''}
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

      <PhraseBankModal
        isOpen={isPhraseBankOpen}
        onClose={() => setIsPhraseBankOpen(false)}
        studentName={selectedStudent}
        onInsertPhrase={handleInsertPhrase}
      />

      <QuickSkillSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        globalSkills={globalSkills}
        currentGrade={currentGrade}
        selectedStudent={selectedStudent}
        selectedUnit={selectedUnit}
        currentStudentData={classData[selectedStudent]?.[selectedUnit]}
        onToggleSkill={toggleSkill}
      />
    </div>
  );
}
