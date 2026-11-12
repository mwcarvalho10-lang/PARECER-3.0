import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Home, Download, Edit3, Trash2, CheckCircle2, Menu, Clock, Bell, Book, CheckSquare, Square, Layers, Sparkles, Check, BarChart3, Search, BookOpen, HeartHandshake, SlidersHorizontal, Target, Pin, Heart, ArrowUpDown, FileSpreadsheet, Award, ChevronDown, ChevronLeft, Copy, FileText, History, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData, Skill, ClassData } from '@/lib/types';
import { units, subjects } from '@/lib/constants';
import { generateReportText } from '@/lib/utils';
import { StudentModal } from './StudentModal';
import { SkillsModal } from './SkillsModal';
import { ClassDiagnosis } from './ClassDiagnosis';
import { SchoolLogo } from './SchoolLogo';
import { PhraseBankModal } from './PhraseBankModal';
import { UnitSkillsOrganizerModal } from './UnitSkillsOrganizerModal';
import { BatchStudentImportModal } from './BatchStudentImportModal';
import { FamilyReportModal } from './FamilyReportModal';
import { ClassCouncilModal } from './ClassCouncilModal';
import { getPlannedSkillsForUnit, getAllUnitsForSkill, savePlannedSkillsInAppData } from '@/lib/curriculumUtils';
import { exportFamilyReportDocx } from '@/lib/docxGenerator';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MainAppProps {
  currentGrade: string;
  currentLetter: string;
  appData: AppData;
  globalSkills: Skill[];
  viewingYear?: string;
  isViewingArchive?: boolean;
  onGoBack: () => void;
  onUpdateAppData: (newData: AppData) => void;
  onUpdateGlobalSkills: (newSkills: Skill[]) => void;
}

export function MainApp({ 
  currentGrade, 
  currentLetter, 
  appData, 
  globalSkills, 
  viewingYear = '2026',
  isViewingArchive = false,
  onGoBack, 
  onUpdateAppData, 
  onUpdateGlobalSkills 
}: MainAppProps) {
  const classKey = `${currentGrade}${currentLetter}`;
  const classData: ClassData = useMemo(() => appData[classKey] || { students: [] }, [appData, classKey]);

  const [selectedStudent, setSelectedStudent] = useState<string>(classData.students[0] || "");
  const [selectedUnit, setSelectedUnit] = useState<string>("Diagnóstica");
  const [activeTab, setActiveTab] = useState<string>("portugues");
  const [activeSubFilter, setActiveSubFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive' | 'aee'>('active');
  const [studentSortOrder, setStudentSortOrder] = useState<'alpha' | 'pending_report' | 'attention'>('alpha');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState("");
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [familyReportOpen, setFamilyReportOpen] = useState(false);
  const [classCouncilOpen, setClassCouncilOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [unitOrganizerOpen, setUnitOrganizerOpen] = useState(false);
  const [unitScopeFilter, setUnitScopeFilter] = useState<'unit_only' | 'all'>('unit_only');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  const [isPhraseBankOpen, setIsPhraseBankOpen] = useState(false);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedStudentsBulk, setSelectedStudentsBulk] = useState<string[]>([]);

  const [isReportOpen, setIsReportOpen] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'current' | 'history' | 'aee'>('current');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  const [templates, setTemplates] = useState<{name: string, text: string}[]>([]);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const focusReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setExportMenuOpen(false);
      setToolsMenuOpen(false);
    };
    if (exportMenuOpen || toolsMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [exportMenuOpen, toolsMenuOpen]);

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

  const handleAddStudent = (
    name: string, 
    active: boolean, 
    gender: 'M' | 'F' | '', 
    isAee: boolean, 
    aeeType: string, 
    aeeNotes: string,
    statusReason: 'ativo' | 'transferido' | 'abandono' | 'remanejado' = 'ativo',
    transferNotes: string = ''
  ) => {
    if (!name) return;
    if (classData.students.includes(name)) {
      alert("ESTUDANTE JÁ CADASTRADO.");
      return;
    }
    const newStudents = [...classData.students, name].sort();
    const newStudentData: any = { 
      active: statusReason === 'ativo' ? active : false, 
      statusReason,
      transferNotes,
      gender, 
      isAee, 
      aeeType, 
      aeeNotes 
    };
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
    aeeNotes: string,
    statusReason: 'ativo' | 'transferido' | 'abandono' | 'remanejado' = 'ativo',
    transferNotes: string = ''
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
      active: statusReason === 'ativo' ? active : false, 
      statusReason,
      transferNotes,
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

  const handleBatchImportStudents = (newStudentsList: string[]) => {
    if (newStudentsList.length === 0) return;
    const newStudents = [...classData.students, ...newStudentsList].sort();
    const updatedClassData: ClassData = { ...classData, students: newStudents };
    
    newStudentsList.forEach(name => {
      const studentData: any = { 
        active: true, 
        statusReason: 'ativo', 
        transferNotes: '', 
        gender: '', 
        isAee: false, 
        aeeType: '', 
        aeeNotes: '' 
      };
      units.forEach(u => studentData[u] = { skills: [], observation: "" });
      updatedClassData[name] = studentData;
    });

    onUpdateAppData({
      ...appData,
      [classKey]: updatedClassData
    });

    if (!selectedStudent && newStudentsList.length > 0) {
      setSelectedStudent(newStudentsList[0]);
    }
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

  const handleManualEdit = (customTextOrEvent?: string | React.SyntheticEvent) => {
    if (!selectedStudent) return;
    const customText = typeof customTextOrEvent === 'string' ? customTextOrEvent : undefined;
    const activeText = customText !== undefined 
      ? customText 
      : (document.activeElement === focusReportRef.current ? focusReportRef.current?.innerText : reportRef.current?.innerText) || '';
    const text = activeText.toUpperCase();
    const clean = text.trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    setWordCount({ words, chars: clean.length });

    if (reportRef.current && reportRef.current.innerText !== text && document.activeElement !== reportRef.current) {
      reportRef.current.innerText = text;
    }
    if (focusReportRef.current && focusReportRef.current.innerText !== text && document.activeElement !== focusReportRef.current) {
      focusReportRef.current.innerText = text;
    }
    
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

  const pendingCount = useMemo(() => {
    return classData.students.filter(s => {
      const isActive = classData[s]?.active !== false;
      const obs = classData[s]?.[selectedUnit]?.observation?.trim();
      const skillsCount = classData[s]?.[selectedUnit]?.skills?.length || 0;
      return isActive && !obs && skillsCount === 0;
    }).length;
  }, [classData, selectedUnit]);

  const filteredStudents = useMemo(() => {
    const list = classData.students.filter(s => {
      const matchesSearch = s.toLowerCase().includes(searchStudent.toLowerCase());
      const isActive = classData[s]?.active !== false; // default to true if undefined
      const isAee = Boolean(classData[s]?.isAee);
      const hasReport = Boolean(classData[s]?.[selectedUnit]?.observation?.trim() || (classData[s]?.[selectedUnit]?.skills?.length || 0) > 0);
      
      if (statusFilter === 'active') return matchesSearch && isActive;
      if (statusFilter === 'pending') return matchesSearch && isActive && !hasReport;
      if (statusFilter === 'inactive') return matchesSearch && !isActive;
      if (statusFilter === 'aee') return matchesSearch && isAee;
      return matchesSearch;
    });

    return list.sort((a, b) => {
      if (studentSortOrder === 'alpha') {
        return a.localeCompare(b);
      }

      if (studentSortOrder === 'pending_report') {
        const obsA = Boolean(classData[a]?.[selectedUnit]?.observation?.trim() && classData[a][selectedUnit].observation.length > 10);
        const obsB = Boolean(classData[b]?.[selectedUnit]?.observation?.trim() && classData[b][selectedUnit].observation.length > 10);
        if (obsA !== obsB) return obsA ? 1 : -1; // Pending reports first
        return a.localeCompare(b);
      }

      if (studentSortOrder === 'attention') {
        const countA = classData[a]?.[selectedUnit]?.skills?.length || 0;
        const countB = classData[b]?.[selectedUnit]?.skills?.length || 0;
        if (countA !== countB) return countA - countB; // Lowest skills first
        return a.localeCompare(b);
      }

      return a.localeCompare(b);
    });
  }, [classData, searchStudent, statusFilter, studentSortOrder, selectedUnit]);

  const activeStudentList = useMemo(() => {
    return filteredStudents.length > 0 ? filteredStudents : classData.students.filter(s => classData[s]?.active !== false);
  }, [filteredStudents, classData.students, classData]);

  const currentStudentIndex = activeStudentList.indexOf(selectedStudent);

  const handlePrevStudent = () => {
    if (activeStudentList.length === 0) return;
    const idx = activeStudentList.indexOf(selectedStudent);
    if (idx > 0) {
      setSelectedStudent(activeStudentList[idx - 1]);
    } else {
      setSelectedStudent(activeStudentList[activeStudentList.length - 1]);
    }
  };

  const handleNextStudent = () => {
    if (activeStudentList.length === 0) return;
    const idx = activeStudentList.indexOf(selectedStudent);
    if (idx >= 0 && idx < activeStudentList.length - 1) {
      setSelectedStudent(activeStudentList[idx + 1]);
    } else {
      setSelectedStudent(activeStudentList[0]);
    }
  };

  const handleNextPendingStudent = () => {
    const pendingList = classData.students.filter(s => {
      const isActive = classData[s]?.active !== false;
      const obs = classData[s]?.[selectedUnit]?.observation?.trim();
      const skillsCount = classData[s]?.[selectedUnit]?.skills?.length || 0;
      return isActive && !obs && skillsCount === 0;
    });

    if (pendingList.length === 0) {
      alert("Excelente! Todos os estudantes ativos já possuem parecer ou habilidades nesta unidade! 🎉");
      return;
    }

    const currentIdx = pendingList.indexOf(selectedStudent);
    if (currentIdx >= 0 && currentIdx < pendingList.length - 1) {
      setSelectedStudent(pendingList[currentIdx + 1]);
    } else {
      setSelectedStudent(pendingList[0]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStudent();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStudentList, selectedStudent]);

  const quickConnectives = [
    "Demonstrou autonomia ao",
    "Apresentou facilidade em",
    "Evidenciou progresso na",
    "Participou ativamente de",
    "Necessita de mediação para",
    "Em fase de consolidação da",
    "Recomenda-se acompanhamento em",
    "Apresenta boa convivência e respeito",
    "Interage positivamente com a turma"
  ];

  const handleInsertConnective = (phrase: string) => {
    if (!selectedStudent) return;
    const target = isFocusMode ? focusReportRef.current : reportRef.current;
    if (!target) return;
    const currentText = target.innerText.trim();
    let newText = "";
    if (!currentText || currentText === "SELECIONE UM ESTUDANTE..." || currentText.startsWith("AGUARDANDO SELEÇÃO")) {
      newText = phrase.toUpperCase() + " ";
    } else {
      const endsWithPeriod = currentText.endsWith(".");
      newText = currentText + (endsWithPeriod ? " " : ". ") + phrase.toUpperCase() + " ";
    }
    target.innerText = newText;
    handleManualEdit(newText);
    target.focus();
  };

  const handleApplyPlannedSkillsToStudent = () => {
    if (!selectedStudent) return;
    const plannedIds = plannedInThisSubject.map(s => s.id);
    if (plannedIds.length === 0) {
      alert(`Não há habilidades cadastradas como planejadas para esta matéria na ${selectedUnit}.`);
      return;
    }
    const currentStudentUnitData = classData[selectedStudent]?.[selectedUnit] || { skills: [], observation: "" };
    const currentSkills: string[] = (currentStudentUnitData.skills as string[]) || [];
    
    // Check if all planned are already selected
    const allAlready = plannedIds.every((id: string) => currentSkills.includes(id));
    let nextSkills: string[] = [];
    if (allAlready) {
      // Toggle off: remove planned skills
      nextSkills = currentSkills.filter((id: string) => !plannedIds.includes(id));
    } else {
      // Add all planned skills
      nextSkills = Array.from(new Set([...currentSkills, ...plannedIds]));
    }

    const selectedSkills = globalSkills
      .filter(sk => nextSkills.includes(sk.id) && sk.grade === currentGrade)
      .sort((a, b) => {
        const orderA = subjectOrder.indexOf(a.subject);
        const orderB = subjectOrder.indexOf(b.subject);
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });

    const gender = classData[selectedStudent]?.gender;
    const newText = formatReportText(selectedStudent, selectedUnit, selectedSkills, gender);

    onUpdateAppData({
      ...appData,
      [classKey]: {
        ...classData,
        [selectedStudent]: {
          ...classData[selectedStudent],
          [selectedUnit]: {
            ...currentStudentUnitData,
            skills: nextSkills,
            observation: newText
          }
        }
      }
    });
  };

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
  
  const getSubFilters = (): { id: string; label: string; match: (id: string, s?: Skill) => boolean }[] => {
    const relevantSkills = globalSkills.filter(s => s.subject === activeTab && s.grade === currentGrade);
    const customCategories = Array.from(new Set(relevantSkills.map(s => s.category).filter(Boolean))) as string[];
    
    if (customCategories.length > 0) {
      return [
        { id: 'all', label: 'Todas', match: () => true },
        ...customCategories.map(cat => ({
          id: cat,
          label: cat,
          match: (_id: string, s?: Skill) => s?.category === cat
        }))
      ];
    }

    if (activeTab === 'portugues') {
      if (currentGrade === '1') {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'leitura', label: 'Leitura (1-3)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 3; } },
          { id: 'producao', label: 'Produção de Texto (4-9)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 4 && n <= 9; } },
          { id: 'oralidade', label: 'Comunicação Oral (10)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n === 10; } },
          { id: 'analise', label: 'Análise e Reflexão (11-17)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 11 && n <= 17; } },
        ];
      } else if (currentGrade === '2') {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'leitura', label: 'Leitura & Compreensão (1-6)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 6; } },
          { id: 'producao', label: 'Produção & Revisão (7-8)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 7 && n <= 8; } },
          { id: 'oralidade', label: 'Comunicação Oral (9-10)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 9 && n <= 10; } },
          { id: 'escrita_orto', label: 'Escrita & Ortografia (11-20)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 11 && n <= 20; } },
        ];
      } else if (currentGrade === '3') {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'leitura', label: 'Leitura & Compreensão (1-5)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 5; } },
          { id: 'producao', label: 'Produção & Reescrita (6-13)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 6 && n <= 13; } },
          { id: 'oralidade', label: 'Comunicação Oral (14-15)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 14 && n <= 15; } },
          { id: 'analise', label: 'Análise Linguística (16-22)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 16 && n <= 22; } },
        ];
      } else {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'leitura', label: 'Leitura e Fluência (1-5)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 5; } },
          { id: 'producao', label: 'Produção Textual (6-12)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 6 && n <= 12; } },
          { id: 'oralidade', label: 'Comunicação Oral (13-14)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 13 && n <= 14; } },
          { id: 'analise', label: 'Gramática & Ortografia (15+)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 15; } },
        ];
      }
    }

    if (activeTab === 'matematica') {
      if (currentGrade === '1') {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'aprendizagens', label: 'Aprendizagens Gerais (1)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n === 1; } },
          { id: 'numeros', label: 'Números e Operações (2-7)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 2 && n <= 7; } },
          { id: 'espaco', label: 'Espaço e Forma (8-9)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 8 && n <= 9; } },
          { id: 'grandezas', label: 'Grandezas e Medidas (10-12)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 10 && n <= 12; } },
          { id: 'tratamento', label: 'Tratamento da Informação (13-14)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 13 && n <= 14; } },
        ];
      } else {
        return [
          { id: 'all', label: 'Todas', match: () => true },
          { id: 'gerais', label: 'Resolução & Conceitos (1-2)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 1 && n <= 2; } },
          { id: 'numeros', label: 'Números & Operações (3-7)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 3 && n <= 7; } },
          { id: 'geometria', label: 'Geometria & Espaço (8-9)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 8 && n <= 9; } },
          { id: 'grandezas', label: 'Grandezas & Medidas (10-12)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 10 && n <= 12; } },
          { id: 'estatistica', label: 'Estatística & Gráficos (13+)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 13; } },
        ];
      }
    }

    if (activeTab === 'historia') {
      return [
        { id: 'all', label: 'Todas', match: () => true },
        { id: 'historia', label: 'História (HI)', match: (id: string) => id.includes('HI') },
        { id: 'geografia', label: 'Geografia (GE)', match: (id: string) => id.includes('GE') },
      ];
    }

    if (activeTab === 'ciencias') {
      return [
        { id: 'all', label: 'Todas', match: () => true },
        { id: 'materia', label: 'Matéria & Energia (1)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n === 1; } },
        { id: 'vida', label: 'Vida & Meio Ambiente (2)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n === 2; } },
        { id: 'terra', label: 'Terra, Universo & Ciência (3+)', match: (id: string) => { const n = parseInt(id.match(/\d+$/)?.[0] || '0', 10); return n >= 3; } },
      ];
    }

    return [];
  };

  const currentSubFilters = getSubFilters();

  const plannedSkillIdsForUnit = useMemo(() => {
    return getPlannedSkillsForUnit(classData, currentGrade, selectedUnit, globalSkills);
  }, [classData, currentGrade, selectedUnit, globalSkills]);

  const allSubjectSkills = useMemo(() => {
    return globalSkills
      .filter(s => s.subject === activeTab && s.grade === currentGrade)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [globalSkills, activeTab, currentGrade]);

  const plannedInThisSubject = useMemo(() => {
    return allSubjectSkills.filter(s => plannedSkillIdsForUnit.includes(s.id));
  }, [allSubjectSkills, plannedSkillIdsForUnit]);

  let currentSkills = allSubjectSkills;

  if (unitScopeFilter === 'unit_only') {
    currentSkills = plannedInThisSubject;
  }

  if (currentSubFilters.length > 0) {
    const activeFilterObj = currentSubFilters.find(f => f.id === activeSubFilter);
    if (activeFilterObj && activeFilterObj.id !== 'all') {
      currentSkills = currentSkills.filter(s => activeFilterObj.match(s.id, s));
    }
  }

  const handleToggleSkillPlannedInUnit = (skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = plannedSkillIdsForUnit.includes(skillId)
      ? plannedSkillIdsForUnit.filter(id => id !== skillId)
      : [...plannedSkillIdsForUnit, skillId];
    
    const updated = savePlannedSkillsInAppData(
      appData,
      currentGrade,
      currentLetter,
      selectedUnit,
      next,
      false
    );
    onUpdateAppData(updated);
  };

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
    if (focusReportRef.current && document.activeElement !== focusReportRef.current) {
      focusReportRef.current.innerText = reportText;
    }
    const clean = (reportRef.current?.innerText || focusReportRef.current?.innerText || reportText || "").trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    setWordCount({ words, chars: clean.length });
  }, [reportText, selectedStudent, selectedUnit, isFocusMode]);

  const unitIndex = units.indexOf(selectedUnit);
  const prevUnit = unitIndex > 0 ? units[unitIndex - 1] : "";
  const prevUnitText = prevUnit && selectedStudent && classData[selectedStudent] 
    ? classData[selectedStudent][prevUnit]?.observation 
    : "";

  useEffect(() => {
    if (activeReportTab === 'history' && !prevUnitText) {
      setActiveReportTab('current');
    }
  }, [selectedUnit, selectedStudent, prevUnitText, activeReportTab]);

  const handleCopyReport = () => {
    const text = reportRef.current?.innerText || reportText || '';
    if (!text || text === 'SELECIONE UM ESTUDANTE...' || text.startsWith('AGUARDANDO SELEÇÃO')) return;
    navigator.clipboard.writeText(text);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

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
      <header className="h-16 bg-[#fdfbf7]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 shrink-0 border-b border-stone-200/80 shadow-2xs z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onGoBack} className="w-9 h-9 hover:bg-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors" title="Voltar para Turmas">
            <Home className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-9 h-9 hover:bg-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors" 
            title="Menu Lateral de Estudantes"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 border-l border-stone-200 pl-2 sm:pl-3">
            <SchoolLogo size="sm" showText={false} />
            <div>
              <h1 className="text-xs sm:text-base font-bold font-serif tracking-tight text-stone-900 leading-tight flex items-center gap-1.5 sm:gap-2">
                <span>{currentGrade}º ANO &quot;{currentLetter}&quot;</span>
                <span className={`text-[9px] sm:text-[10px] font-sans font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${
                  isViewingArchive ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isViewingArchive ? `Arquivo ${viewingYear}` : viewingYear}
                </span>
              </h1>
              <p className="text-[9px] sm:text-[10px] font-serif italic text-stone-500 font-medium leading-none mt-0.5 truncate max-w-[140px] sm:max-w-none">
                Escola Municipal Raymundo Lemos Santana
              </p>
            </div>
          </div>
        </div>

        {/* Unit Selector */}
        <div className="flex bg-stone-100/90 p-1 rounded-2xl gap-1 border border-stone-200/60 shadow-inner">
          {units.map(u => (
            <button 
              key={u} 
              onClick={() => setSelectedUnit(u)} 
              className={`px-3 sm:px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${selectedUnit === u ? 'bg-white text-escola-azul shadow-sm -translate-y-[1px]' : 'text-stone-500 hover:text-stone-800'}`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setClassCouncilOpen(true)} 
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-xs hover:scale-105 active:scale-95"
            title="Ficha Oficial do Conselho de Classe (Barema Imprimível)"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ata do Conselho</span>
          </button>
          <button 
            onClick={() => setIsPhraseBankOpen(true)} 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-xl text-[10px] font-bold uppercase transition-all shadow-2xs hover:scale-105 active:scale-95" 
            title="Banco de Frases Pedagógicas & Conectivos (Inserir no Parecer)"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Banco de Frases</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsProgressOpen(!isProgressOpen)} 
              className="w-10 h-10 hover:bg-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 relative transition-all"
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
              <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-stone-200 p-4 z-50 animate-in fade-in zoom-in-95">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Progresso ({selectedUnit})</h3>
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
                          <span className="text-[10px] font-black text-stone-700">{stats.percent}%</span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-stone-500 font-bold uppercase">Concluídos</span>
                          <span className="font-black text-escola-verde">{stats.done}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-stone-500 font-bold uppercase">Pendentes</span>
                          <span className="font-black text-stone-400">{stats.pending}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button onClick={exportBatchDocx} className="hidden sm:flex bg-escola-azul hover:bg-blue-700 text-white px-3.5 sm:px-5 py-2 rounded-xl text-[10px] font-bold uppercase shadow-sm items-center gap-2 transition-all hover:scale-105 active:scale-95">
            <Download className="w-3.5 h-3.5" /> <span className="hidden md:inline">Exportar Turma</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden escolar-bg p-2 sm:p-4 gap-2 sm:gap-4 relative">
        <aside className={`flex bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/80 flex-col shrink-0 transition-all duration-300 shadow-[0_8px_30px_rgba(40,30,20,0.04)] ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none opacity-0'}`}>
          <div className="w-72 flex flex-col h-full">
            <div className="p-6 pb-2">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[10px] font-bold font-serif uppercase tracking-widest text-stone-500">Estudantes</h2>
                <button 
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-colors flex items-center gap-1 ${isBulkMode ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  {isBulkMode ? <CheckSquare className="w-3 h-3" /> : <Layers className="w-3 h-3" />} Lote
                </button>
              </div>
              <input 
                type="text" 
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                placeholder="Buscar estudante..." 
                className="w-full bg-stone-50 border border-stone-200/70 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-800 outline-none focus:bg-white focus:border-stone-400 placeholder:text-stone-400 mb-3 transition-colors"
              />
              <div className="flex gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/60 mb-2.5">
                <button 
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white text-stone-800 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  Ativos
                </button>
                <button 
                  onClick={() => setStatusFilter('pending')}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs font-black' : 'text-amber-700 hover:bg-amber-50'}`}
                  title="Alunos com parecer pendente nesta unidade"
                >
                  Pend. ({pendingCount})
                </button>
                <button 
                  onClick={() => setStatusFilter('aee')}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${statusFilter === 'aee' ? 'bg-purple-600 text-white shadow-2xs font-black' : 'text-purple-700 hover:bg-purple-50'}`}
                >
                  AEE
                </button>
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-stone-800 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  Todos
                </button>
              </div>

              {/* Ordenação Inteligente da Lista */}
              <div className="flex items-center justify-between text-[10px] text-stone-500 px-1">
                <span className="font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider text-stone-400">
                  <ArrowUpDown className="w-3 h-3 text-stone-400" /> Ordem:
                </span>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/70">
                  <button
                    onClick={() => setStudentSortOrder('alpha')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                      studentSortOrder === 'alpha' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title="Ordem Alfabética"
                  >
                    A-Z
                  </button>
                  <button
                    onClick={() => setStudentSortOrder('pending_report')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                      studentSortOrder === 'pending_report' ? 'bg-amber-500 text-white shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title="Alunos com parecer pendente no topo"
                  >
                    Pendente
                  </button>
                  <button
                    onClick={() => setStudentSortOrder('attention')}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                      studentSortOrder === 'attention' ? 'bg-rose-600 text-white shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title="Alunos com menor domínio no topo"
                  >
                    Atenção
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-6 mt-1">
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
                const statusReason = classData[s]?.statusReason || (isActive ? 'ativo' : 'transferido');
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
                    
                    {/* Status badges */}
                    <div className="ml-auto shrink-0 flex items-center gap-1">
                      {statusReason === 'transferido' && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200" title={`Transferido: ${classData[s]?.transferNotes || ''}`}>
                          TR
                        </span>
                      )}
                      {statusReason === 'remanejado' && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200" title={`Remanejado: ${classData[s]?.transferNotes || ''}`}>
                          RM
                        </span>
                      )}
                      {statusReason === 'abandono' && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200" title={`Abandono: ${classData[s]?.transferNotes || ''}`}>
                          AB
                        </span>
                      )}
                      {isAee && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          selectedStudent === s ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                        }`}>
                          AEE
                        </span>
                      )}
                    </div>
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
            <div className="p-3 border-t border-stone-100 grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setStudentToEdit(""); setStudentModalOpen(true); }} 
                className="py-2.5 rounded-xl border border-dashed border-stone-300 text-stone-600 text-[10px] font-bold uppercase hover:text-escola-azul hover:border-escola-azul/40 hover:bg-stone-50 transition-colors flex items-center justify-center gap-1"
              >
                + Estudante
              </button>
              <button 
                onClick={() => setBatchImportOpen(true)} 
                className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 shadow-2xs"
                title="Colar lista de nomes do Excel/Planilha"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Planilha</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white/98 rounded-3xl border border-stone-200/90 shadow-[0_8px_30px_rgba(40,30,20,0.03)]">
          <nav className="h-14 bg-white/95 border-b border-stone-100 flex items-center px-6 gap-6 shrink-0 overflow-x-auto justify-between">
            <div className="flex items-center gap-6">
              {subjects.map(sub => (
                <button 
                  key={sub.id} 
                  onClick={() => setActiveTab(sub.id)} 
                  className={`relative py-4 text-[11px] font-bold uppercase whitespace-nowrap transition-all ${activeTab === sub.id ? 'text-escola-azul' : 'text-stone-400 hover:text-stone-700'}`}
                >
                  {sub.label}
                  {activeTab === sub.id && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-escola-verde rounded-t-lg" />}
                </button>
              ))}

              <button 
                onClick={() => setActiveTab('diagnostico')} 
                className={`relative py-4 text-[11px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'diagnostico' ? 'text-indigo-600' : 'text-stone-400 hover:text-stone-700'}`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <span>Diagnóstico da Turma</span>
                {activeTab === 'diagnostico' && <div className="absolute bottom-[-4px] left-0 w-full h-[4px] bg-indigo-500 rounded-t-lg" />}
              </button>
            </div>

            {activeTab !== 'diagnostico' && (
              <button 
                onClick={() => setIsReportOpen(!isReportOpen)} 
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all shrink-0 ${
                  isReportOpen 
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs hover:bg-emerald-100'
                }`}
                title={isReportOpen ? "Ocultar painel lateral do parecer" : "Exibir painel lateral do parecer"}
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isReportOpen ? "Ocultar Parecer" : "Ver Parecer"}</span>
              </button>
            )}
          </nav>

          {activeTab === 'diagnostico' ? (
            <ClassDiagnosis
              currentGrade={currentGrade}
              currentLetter={currentLetter}
              classData={classData}
              appData={appData}
              globalSkills={globalSkills}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
              onUpdateAppData={onUpdateAppData}
              onSelectStudent={(studentName) => {
                setSelectedStudent(studentName);
                setActiveTab('portugues');
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Left/Center: Skills & Curriculum (scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-7 pb-24 lg:pb-7 space-y-4 sm:space-y-5 min-w-0">
                <section>
                {/* Bimestre Curriculum Filter & Organizer Bar - Luminous Glassmorphic Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-white/90 via-sky-50/65 to-emerald-50/70 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-[0_10px_30px_rgba(0,91,183,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
                  {/* Subtle Aurora Ambient Glass Glows */}
                  <div className="absolute -top-12 -right-12 w-52 h-52 bg-gradient-to-br from-blue-400/18 via-sky-300/12 to-transparent rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-emerald-400/18 via-teal-300/12 to-transparent rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-escola-azul via-blue-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-escola-azul flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-escola-azul animate-pulse" />
                          {selectedUnit} • Planejamento Curricular
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-stone-700 border border-stone-200/80 shadow-2xs">
                          {plannedInThisSubject.length} de {allSubjectSkills.length} nesta matéria
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold font-serif tracking-tight text-stone-900 mt-0.5">
                        Habilidades da Unidade
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {isBulkMode 
                          ? `Modo em lote ativo (${selectedStudentsBulk.length} selecionados)` 
                          : `Estudante: ${selectedStudent || 'Nenhum selecionado'}`}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                    {/* Segmented Filter Mode */}
                    <div className="flex items-center bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-stone-200/80 shadow-inner">
                      <button
                        onClick={() => setUnitScopeFilter('unit_only')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                          unitScopeFilter === 'unit_only'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                        title="Ver apenas as habilidades escolhidas para esta unidade"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Trabalhadas na Unidade ({plannedInThisSubject.length})</span>
                      </button>
                      <button
                        onClick={() => setUnitScopeFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                          unitScopeFilter === 'all'
                            ? 'bg-stone-900 text-white shadow-sm'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                        }`}
                        title="Ver todas as habilidades cadastradas para o ano"
                      >
                        <span>Todas ({allSubjectSkills.length})</span>
                      </button>
                    </div>

                    {plannedInThisSubject.length > 0 && selectedStudent && !isBulkMode && (
                      <button 
                        onClick={handleApplyPlannedSkillsToStudent}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
                        title={`Marcar todas as ${plannedInThisSubject.length} habilidades planejadas para esta matéria no estudante atual`}
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Marcar Planejadas ({plannedInThisSubject.length})</span>
                      </button>
                    )}

                    <button 
                      onClick={() => setUnitOrganizerOpen(true)} 
                      className="px-4 py-2 bg-gradient-to-r from-escola-azul to-blue-600 hover:from-blue-700 hover:to-indigo-600 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
                      title="Escolher e planejar as habilidades que serão trabalhadas nesta unidade"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Organizar Bimestre ({plannedSkillIdsForUnit.length})</span>
                    </button>

                    <button 
                      onClick={() => setSkillsModalOpen(true)} 
                      className="text-[10px] font-bold text-stone-700 hover:text-stone-900 bg-white/90 hover:bg-white border border-stone-200/90 px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 shadow-2xs hover:shadow-xs"
                      title="Cadastrar novas habilidades na BNCC"
                    >
                      <Sparkles className="w-3 h-3 text-sky-500" /> BNCC
                    </button>
                  </div>
                </div>

                {currentSubFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentSubFilters.map(filter => {
                      const isSelected = activeSubFilter === filter.id;
                      return (
                        <motion.button
                          key={filter.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveSubFilter(filter.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                            isSelected 
                              ? 'bg-stone-900 text-white shadow-xs' 
                              : 'bg-white/80 backdrop-blur-xs border border-stone-200/90 text-stone-600 hover:bg-white hover:text-stone-900 shadow-2xs'
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
                    <span className="text-4xl mb-3">🎯</span>
                    <h4 className="text-sm font-black uppercase text-slate-800">
                      Nenhuma habilidade {unitScopeFilter === 'unit_only' ? `planejada para a ${selectedUnit}` : 'encontrada'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      {unitScopeFilter === 'unit_only' 
                        ? `Você pode usar o organizador para escolher as habilidades desta unidade ou alternar para exibir todas as habilidades cadastradas.` 
                        : `Não há habilidades cadastradas para este filtro ou matéria.`}
                    </p>
                    <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                      <button
                        onClick={() => setUnitOrganizerOpen(true)}
                        className="px-4 py-2 bg-escola-azul text-white text-xs font-black uppercase rounded-xl hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Organizar Habilidades da Unidade
                      </button>
                      {unitScopeFilter === 'unit_only' && (
                        <button
                          onClick={() => setUnitScopeFilter('all')}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
                        >
                          Ver Todas do Ano
                        </button>
                      )}
                    </div>
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
                                : 'bg-white/95 backdrop-blur-xs border-stone-200/90 hover:border-stone-300 hover:shadow-md hover:shadow-stone-200/60'
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
                                <span className={`text-[11px] font-bold uppercase tracking-wider font-mono ${isSet ? 'text-emerald-700' : 'text-stone-700'}`}>
                                  {s.id}
                                </span>
                                {plannedSkillIdsForUnit.includes(s.id) ? (
                                  <button
                                    onClick={(e) => handleToggleSkillPlannedInUnit(s.id, e)}
                                    className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold transition-colors"
                                    title="Habilidade planejada nesta unidade. Clique para remover do planejamento."
                                  >
                                    <Target className="w-2.5 h-2.5" /> {selectedUnit}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => handleToggleSkillPlannedInUnit(s.id, e)}
                                    className="inline-flex items-center gap-1 bg-stone-100 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 border border-stone-200 hover:border-emerald-300 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold transition-colors"
                                    title="Clique para incluir no planejamento desta unidade."
                                  >
                                    <Pin className="w-2.5 h-2.5" /> + {selectedUnit}
                                  </button>
                                )}
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
                                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 group-hover:border-stone-400 group-hover:bg-stone-50 transition-colors flex items-center justify-center" />
                                )}
                              </div>
                            </div>

                            <p className={`text-[12px] leading-relaxed transition-colors ${isSet ? 'text-stone-900 font-semibold' : 'text-stone-700 font-normal'}`}>
                              {s.report}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px]">
                              <span className="text-stone-400 font-medium truncate max-w-[160px]">
                                {s.category || `${s.grade}º Ano • BNCC`}
                              </span>
                              <span className={`font-bold transition-colors ${isSet ? 'text-emerald-700' : 'text-stone-400 group-hover:text-stone-700'}`}>
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

            {/* Right: Integrated Split-Screen Report Panel (No overlapping!) */}
            {isReportOpen && (
              <aside className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] border-t lg:border-t-0 lg:border-l border-stone-200/80 bg-stone-50/70 flex flex-col shrink-0 overflow-hidden h-[450px] lg:h-full z-10 transition-all duration-300">
                {/* Header of Report Panel */}
                <div className="bg-stone-900 px-4 py-3 flex items-center justify-between text-white shrink-0 border-b border-stone-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={handlePrevStudent}
                        className="w-6 h-6 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-md flex items-center justify-center transition-colors shadow-2xs"
                        title="Aluno Anterior (Atalho: Alt + ←)"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleNextStudent}
                        className="w-6 h-6 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-md flex items-center justify-center transition-colors shadow-2xs"
                        title="Próximo Aluno (Atalho: Alt + →)"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-serif font-bold tracking-wide text-stone-100 truncate" title={selectedStudent || "Sem aluno"}>
                        {selectedStudent || "Selecione um Estudante"}
                      </span>
                      {classData[selectedStudent]?.isAee && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500 text-white shrink-0">
                          AEE
                        </span>
                      )}
                      {currentStudentIndex >= 0 && (
                        <span className="text-[9px] font-mono text-stone-400 hidden xl:inline shrink-0">
                          ({currentStudentIndex + 1}/{activeStudentList.length})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Menu Exportar */}
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExportMenuOpen(!exportMenuOpen); setToolsMenuOpen(false); }}
                        className="text-[9px] bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-2.5 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1 transition-colors"
                        title="Opções de Exportação"
                      >
                        <Download className="w-3 h-3 text-sky-400" />
                        <span>Exportar</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>

                      {exportMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
                        >
                          <div className="px-3 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">Documentos DOCX</div>
                          <button
                            onClick={() => { setExportMenuOpen(false); exportIndividualDocx('unit'); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-stone-400" />
                            <span>Parecer da Unidade ({selectedUnit})</span>
                          </button>
                          <button
                            onClick={() => { setExportMenuOpen(false); exportIndividualDocx('history'); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-stone-400" />
                            <span>Histórico Anual Completo</span>
                          </button>
                          <div className="border-t border-stone-100 my-1"></div>
                          <div className="px-3 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">Devolutiva Familiar</div>
                          <button
                            onClick={() => {
                              setExportMenuOpen(false);
                              exportFamilyReportDocx({
                                studentName: selectedStudent,
                                currentGrade,
                                currentLetter,
                                selectedUnit,
                                classData,
                                globalSkills,
                                year: viewingYear
                              });
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 transition-colors font-bold"
                            title="Baixar arquivo DOCX formatado para entrega à família com sugestões de aprendizagem"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Devolutiva Familiar (DOCX)</span>
                          </button>
                          <button
                            onClick={() => { setExportMenuOpen(false); setFamilyReportOpen(true); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5 text-amber-600" />
                            <span>Visualizar Ficha A4</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Menu Ações & Ferramentas */}
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setToolsMenuOpen(!toolsMenuOpen); setExportMenuOpen(false); }}
                        className="text-[9px] bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-2.5 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1 transition-colors"
                        title="Ferramentas e Modelos"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                        <span>Ações</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>

                      {toolsMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
                        >
                          <button
                            onClick={() => { setToolsMenuOpen(false); setIsPhraseBankOpen(true); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Banco de Frases & Conectivos</span>
                          </button>
                          <button
                            onClick={() => { setToolsMenuOpen(false); setIsReadMode(!isReadMode); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <Book className="w-3.5 h-3.5 text-amber-600" />
                            <span>Modo {isReadMode ? 'Edição' : 'Leitura'}</span>
                          </button>
                          <button
                            onClick={() => { setToolsMenuOpen(false); saveTemplate(); }}
                            className="w-full px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-2 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            <span>Salvar como Modelo</span>
                          </button>

                          {templates.length > 0 && (
                            <>
                              <div className="border-t border-stone-100 my-1"></div>
                              <div className="px-3 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">Modelos Salvos</div>
                              {templates.map(t => (
                                <button
                                  key={t.name}
                                  onClick={() => { setToolsMenuOpen(false); loadTemplate(t.text); }}
                                  className="w-full px-3 py-1.5 text-left text-xs text-stone-600 hover:bg-stone-100 truncate block transition-colors"
                                  title={t.name}
                                >
                                  📄 {t.name}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {pendingCount > 0 && (
                      <button 
                        onClick={handleNextPendingStudent}
                        className="hidden sm:flex items-center gap-1 text-[9px] font-bold uppercase bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2 py-1.5 rounded-lg transition-colors"
                        title="Avançar diretamente para o próximo aluno com parecer pendente"
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="hidden xl:inline">Pendente</span>
                      </button>
                    )}

                    {/* Botão Copiar */}
                    <button 
                      onClick={handleCopyReport} 
                      className={`text-[9px] px-2 py-1.5 rounded-lg font-bold uppercase flex items-center gap-1 transition-colors ${
                        copiedFeedback 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white'
                      }`}
                      title="Copiar Parecer Completo"
                    >
                      {copiedFeedback ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-stone-300" />}
                      <span className="hidden xl:inline">{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    {/* Botão Modo Foco em Tela Cheia */}
                    <button 
                      onClick={() => setIsFocusMode(true)}
                      className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors ml-0.5"
                      title="Expandir para Modo Foco em Tela Cheia"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    {/* Botão Recolher */}
                    <button 
                      onClick={() => setIsReportOpen(false)}
                      className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors ml-0.5"
                      title="Ocultar Painel do Parecer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Abas Internas: Parecer Atual | Histórico | AEE */}
                <div className="flex items-center bg-stone-100/90 border-b border-stone-200/80 px-3 py-1.5 gap-1 shrink-0 overflow-x-auto">
                  <button
                    onClick={() => setActiveReportTab('current')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeReportTab === 'current'
                        ? 'bg-white text-stone-900 shadow-2xs font-black'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-escola-azul" />
                    <span>Parecer ({selectedUnit})</span>
                  </button>

                  {prevUnitText && (
                    <button
                      onClick={() => setActiveReportTab('history')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeReportTab === 'history'
                          ? 'bg-white text-stone-900 shadow-2xs font-black'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      <History className="w-3 h-3 text-amber-500" />
                      <span>Histórico ({prevUnit})</span>
                    </button>
                  )}

                  {classData[selectedStudent]?.isAee && (
                    <button
                      onClick={() => setActiveReportTab('aee')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeReportTab === 'aee'
                          ? 'bg-purple-100 text-purple-900 shadow-2xs font-black'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      <HeartHandshake className="w-3 h-3 text-purple-600" />
                      <span>AEE / PEI</span>
                    </button>
                  )}
                </div>

                {/* Conteúdo da Aba Selecionada */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {activeReportTab === 'current' && (
                    <div className={`p-4 flex-1 flex flex-col overflow-y-auto ${isReadMode ? 'bg-[#fdf9ee]' : 'bg-white'}`}>
                      <div 
                        ref={reportRef}
                        spellCheck={true}
                        contentEditable={!isBulkMode && !!selectedStudent} 
                        onInput={handleManualEdit}
                        onBlur={handleManualEdit}
                        className={`font-serif leading-[1.8] text-[13px] outline-none p-4 rounded-2xl uppercase text-justify flex-1 transition-all border ${
                          isReadMode 
                            ? 'bg-[#fffdf8] border-amber-200 text-stone-900' 
                            : 'bg-stone-50/60 border-stone-200/80 focus:bg-white focus:border-stone-400 text-stone-900'
                        }`}
                      />

                      {/* Conectivos Rápidos em Linha (1-Toque) */}
                      <div className="mt-3 pt-2.5 border-t border-stone-200/70 shrink-0">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                            <span>⚡</span> Conectivos Rápidos (1-Toque):
                          </span>
                          <button
                            onClick={() => setIsPhraseBankOpen(true)}
                            className="text-[9px] font-bold text-escola-azul hover:underline uppercase"
                          >
                            + Banco Completo
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {quickConnectives.map(phrase => (
                            <button
                              key={phrase}
                              onClick={() => handleInsertConnective(phrase)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors border border-stone-200/80 shadow-2xs hover:scale-[1.02] active:scale-95"
                              title={`Inserir "${phrase}" no parecer`}
                            >
                              + {phrase}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeReportTab === 'history' && (
                    <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-stone-50/50">
                      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-amber-500" />
                            Parecer Registrado em {prevUnit}
                          </span>
                          <button
                            onClick={() => {
                              if (reportRef.current && prevUnitText) {
                                const current = reportRef.current.innerText;
                                reportRef.current.innerText = current ? `${current}\n\n[CONTINUIDADE DE ${prevUnit}]: ${prevUnitText}` : prevUnitText;
                                handleManualEdit();
                                setActiveReportTab('current');
                              }
                            }}
                            className="text-[9px] font-bold uppercase bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                            title="Inserir texto do histórico no parecer atual"
                          >
                            <Pin className="w-3 h-3" />
                            <span>Inserir no Parecer</span>
                          </button>
                        </div>
                        <p className="font-serif text-[12px] uppercase leading-relaxed text-stone-700 text-justify bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                          {prevUnitText}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeReportTab === 'aee' && (
                    <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-purple-50/20">
                      <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                            <HeartHandshake className="w-4 h-4 text-purple-600" />
                            Atendimento Especializado (AEE / PEI)
                          </span>
                          <button
                            onClick={() => {
                              setStudentToEdit(selectedStudent);
                              setStudentModalOpen(true);
                            }}
                            className="text-[9px] font-bold uppercase bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar PEI</span>
                          </button>
                        </div>
                        <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/60">
                          <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wider">Tipo de Diagnóstico / Adaptação:</p>
                          <p className="text-xs font-bold text-purple-950 mt-0.5">
                            {classData[selectedStudent]?.aeeType || "Adaptação Curricular Regular"}
                          </p>
                        </div>
                        {classData[selectedStudent]?.aeeNotes ? (
                          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                            <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">Diretrizes Pedagógicas Registradas:</p>
                            <p className="text-[12px] leading-relaxed text-stone-800 italic">
                              &quot;{classData[selectedStudent]?.aeeNotes}&quot;
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-stone-500 italic">
                            Nenhuma observação complementar registrada no PEI do estudante.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé Ergonômico com Contagem de Palavras e Salvamento */}
                <div className="bg-stone-100/90 border-t border-stone-200/80 px-4 py-2 flex items-center justify-between text-[10px] text-stone-500 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-stone-700">{wordCount.words} palavras</span>
                    <span>•</span>
                    <span className="font-mono text-stone-500">{wordCount.chars} caracteres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Salvo aut.
                    </span>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Botão de Reabrir o Parecer se estiver recolhido */}
      {!isReportOpen && activeTab !== 'diagnostico' && (
        <button 
          onClick={() => setIsReportOpen(true)}
          className="fixed bottom-6 right-6 bg-stone-900 hover:bg-stone-800 text-white px-5 py-3.5 rounded-full shadow-2xl font-bold uppercase text-xs flex items-center gap-2.5 transition-all z-40 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-4 border border-stone-700"
          title="Abrir painel lateral do parecer"
        >
          <Edit3 className="w-4 h-4 text-emerald-400" />
          <span>Ver Parecer ({selectedStudent || 'Estudante'})</span>
        </button>
      )}
    </div>

      {/* Fullscreen Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#fdfbf7] flex flex-col"
          >
            <div className="h-14 sm:h-16 bg-stone-900 text-white px-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-stone-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-xs sm:text-sm font-serif font-bold text-stone-100 truncate block">
                    {selectedStudent || "Estudante"} • Modo Foco
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans uppercase">
                    {currentGrade}º {currentLetter} • {selectedUnit}
                  </span>
                </div>
                {classData[selectedStudent]?.isAee && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500 text-white shrink-0">
                    AEE
                  </span>
                )}

                {/* Navegador de Estudantes no Modo Foco */}
                <div className="flex items-center gap-1 bg-stone-800/90 border border-stone-700/80 px-2 py-0.5 rounded-xl ml-2 shrink-0">
                  <button
                    onClick={handlePrevStudent}
                    disabled={activeStudentList.length <= 1}
                    className="p-1 text-stone-300 hover:text-white disabled:opacity-30 hover:bg-stone-700/60 rounded-md transition-colors"
                    title="Estudante anterior (Alt + ←)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-stone-300 px-1">
                    {currentStudentIndex >= 0 ? `${currentStudentIndex + 1}/${activeStudentList.length}` : '—'}
                  </span>
                  <button
                    onClick={handleNextStudent}
                    disabled={activeStudentList.length <= 1}
                    className="p-1 text-stone-300 hover:text-white disabled:opacity-30 hover:bg-stone-700/60 rounded-md transition-colors"
                    title="Próximo estudante (Alt + →)"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {pendingCount > 0 && (
                    <button
                      onClick={handleNextPendingStudent}
                      className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded transition-colors hidden sm:inline-block"
                      title="Pular para próximo parecer pendente"
                    >
                      Pend ({pendingCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleCopyReport}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase flex items-center gap-1.5 transition-colors ${
                    copiedFeedback 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white'
                  }`}
                >
                  {copiedFeedback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={() => setIsPhraseBankOpen(true)}
                  className="hidden sm:flex text-xs bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-3 py-1.5 rounded-xl font-bold uppercase items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Frases</span>
                </button>
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-xl font-bold uppercase flex items-center gap-1.5 transition-colors"
                  title="Sair do Modo Foco"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Minimizar</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
              {prevUnitText && (
                <div className="mb-4 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">
                    Memória do Bimestre Anterior ({prevUnit}):
                  </span>
                  <p className="font-serif text-xs uppercase leading-relaxed text-stone-700">
                    {prevUnitText}
                  </p>
                </div>
              )}

              <div 
                ref={focusReportRef}
                spellCheck={true}
                contentEditable={!isBulkMode && !!selectedStudent} 
                onInput={() => handleManualEdit(focusReportRef.current?.innerText)}
                onBlur={() => handleManualEdit(focusReportRef.current?.innerText)}
                className="font-serif leading-[1.9] text-sm sm:text-base outline-none p-6 sm:p-8 rounded-3xl uppercase text-justify min-h-[300px] flex-1 bg-white border border-stone-200/90 shadow-sm focus:border-stone-400 text-stone-900 font-normal"
              />

              {/* Conectivos Rápidos em Linha (1-Toque) no Modo Foco */}
              <div className="mt-3 pt-3 border-t border-stone-200/80 shrink-0">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <span>⚡</span> Conectivos Rápidos (1-Toque):
                  </span>
                  <button
                    onClick={() => setIsPhraseBankOpen(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline uppercase"
                  >
                    + Banco Completo
                  </button>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {quickConnectives.map(phrase => (
                    <button
                      key={phrase}
                      onClick={() => handleInsertConnective(phrase)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border border-stone-200 shadow-2xs hover:scale-[1.02] active:scale-95"
                      title={`Inserir "${phrase}" no parecer`}
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-12 bg-stone-100/95 border-t border-stone-200 px-6 flex items-center justify-between text-xs text-stone-500 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-stone-800">{wordCount.words} palavras</span>
                <span>•</span>
                <span className="font-mono">{wordCount.chars} caracteres</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Salvo automaticamente
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StudentModal 
        isOpen={studentModalOpen} 
        initialName={studentToEdit} 
        initialActive={studentToEdit ? classData[studentToEdit]?.active !== false : true}
        initialStatusReason={studentToEdit ? classData[studentToEdit]?.statusReason || (classData[studentToEdit]?.active !== false ? 'ativo' : 'transferido') : 'ativo'}
        initialTransferNotes={studentToEdit ? classData[studentToEdit]?.transferNotes || '' : ''}
        initialGender={studentToEdit ? classData[studentToEdit]?.gender : ''}
        initialIsAee={studentToEdit ? Boolean(classData[studentToEdit]?.isAee) : false}
        initialAeeType={studentToEdit ? classData[studentToEdit]?.aeeType || '' : ''}
        initialAeeNotes={studentToEdit ? classData[studentToEdit]?.aeeNotes || '' : ''}
        onClose={() => setStudentModalOpen(false)} 
        onConfirm={studentToEdit ? handleEditStudent : handleAddStudent} 
      />

      <BatchStudentImportModal
        isOpen={batchImportOpen}
        onClose={() => setBatchImportOpen(false)}
        existingStudents={classData.students || []}
        onImport={handleBatchImportStudents}
      />

      <FamilyReportModal
        isOpen={familyReportOpen}
        onClose={() => setFamilyReportOpen(false)}
        studentName={selectedStudent}
        currentGrade={currentGrade}
        currentLetter={currentLetter}
        selectedUnit={selectedUnit}
        classData={classData}
        globalSkills={globalSkills}
        viewingYear={viewingYear}
      />

      <ClassCouncilModal
        isOpen={classCouncilOpen}
        onClose={() => setClassCouncilOpen(false)}
        currentGrade={currentGrade}
        currentLetter={currentLetter}
        selectedUnit={selectedUnit}
        classData={classData}
        globalSkills={globalSkills}
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

      <UnitSkillsOrganizerModal
        isOpen={unitOrganizerOpen}
        onClose={() => setUnitOrganizerOpen(false)}
        currentGrade={currentGrade}
        currentLetter={currentLetter}
        initialUnit={selectedUnit}
        classData={classData}
        appData={appData}
        globalSkills={globalSkills}
        onUpdateAppData={onUpdateAppData}
        onSelectUnit={setSelectedUnit}
      />
    </div>
  );
}
