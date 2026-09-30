'use client';

import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Settings, 
  Edit2, 
  Check, 
  UserPlus, 
  Trash2, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Sprout, 
  Sparkles,
  TreeDeciduous,
  Leaf,
  GraduationCap,
  Archive,
  Download,
  RotateCcw,
  Eye,
  Calendar,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { gradesArr, lettersArr, PIN_CONFIG, units } from '@/lib/constants';
import { PinModal } from './PinModal';
import { SchoolLogo } from './SchoolLogo';
import { CloseSchoolYearModal } from './CloseSchoolYearModal';
import { AppData, Teacher, SchoolYearArchive, YearTransitionOptions } from '@/lib/types';

interface DashboardProps {
  appData: AppData;
  activeYear: string;
  viewingYear: string;
  isViewingArchive: boolean;
  archivedYears: SchoolYearArchive[];
  onSelectClass: (grade: string, letter: string) => void;
  onCloseAcademicYear: (options: YearTransitionOptions) => void;
  onViewArchivedYear: (year: string) => void;
  onReturnToActiveYear: () => void;
  onRestoreArchivedYear: (year: string) => void;
  onDownloadYearBackup: (year: string) => void;
}

export function Dashboard({ 
  appData, 
  activeYear,
  viewingYear,
  isViewingArchive,
  archivedYears,
  onSelectClass,
  onCloseAcademicYear,
  onViewArchivedYear,
  onReturnToActiveYear,
  onRestoreArchivedYear,
  onDownloadYearBackup
}: DashboardProps) {
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ g: number | null; l: string | null; isAdmin?: boolean }>({ g: null, l: null });
  const [currentPin, setCurrentPin] = useState("");
  const [isError, setIsError] = useState(false);
  
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminTab, setAdminTab] = useState<'year' | 'teachers' | 'pins'>('year');
  const [closeYearModalOpen, setCloseYearModalOpen] = useState(false);
  const [closureSuccessMessage, setClosureSuccessMessage] = useState<string | null>(null);

  const [classPins, setClassPins] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    const savedPins = localStorage.getItem('edu_pins_v13');
    if (savedPins) {
      try {
        return JSON.parse(savedPins);
      } catch {
        // ignore parse error
      }
    }
    const initialPins: Record<string, string> = {};
    gradesArr.forEach(g => {
      lettersArr.forEach(l => {
        initialPins[`${g}${l}`] = PIN_CONFIG[g.toString()];
      });
    });
    return initialPins;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    if (typeof window === 'undefined') return [];
    const savedTeachers = localStorage.getItem('edu_teachers_v13');
    if (savedTeachers) {
      try {
        return JSON.parse(savedTeachers);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  // Calculate live statistics for current appData
  const { totalStudents, totalClassesWithStudents, totalEvaluations } = useMemo(() => {
    let studentsCount = 0;
    let classesCount = 0;
    let evalsCount = 0;
    
    Object.keys(appData).forEach(key => {
      const cls = appData[key];
      if (cls && Array.isArray(cls.students)) {
        if (cls.students.length > 0) {
          classesCount++;
          studentsCount += cls.students.length;
          cls.students.forEach(stName => {
            const stData = cls[stName];
            if (stData) {
              units.forEach(u => {
                const uData = stData[u];
                if (uData && ((uData.skills && uData.skills.length > 0) || (uData.observation && uData.observation.trim()))) {
                  evalsCount++;
                }
              });
            }
          });
        }
      }
    });

    return {
      totalStudents: studentsCount,
      totalClassesWithStudents: classesCount,
      totalEvaluations: evalsCount
    };
  }, [appData]);

  const handlePinChange = (pin: string) => {
    if (isError) return;
    setCurrentPin(pin);
    
    if (pendingSelection.isAdmin) {
      if (pin.length >= 7) {
        if (pin.toLowerCase() === 'adm2026') {
          setIsAdminAuth(true);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    } else {
      if (pin.length === 5) {
        const classKey = `${pendingSelection.g}${pendingSelection.l}`;
        const correctPin = classPins[classKey] || PIN_CONFIG[pendingSelection.g!.toString()];
        
        if (pendingSelection.g && pin === correctPin) {
          onSelectClass(pendingSelection.g.toString(), pendingSelection.l!);
          setPinModalOpen(false);
        } else {
          setIsError(true);
          setTimeout(() => { setCurrentPin(""); setIsError(false); }, 500);
        }
      }
    }
  };

  const openPinModal = (g: number, l: string) => {
    setPendingSelection({ g, l });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  const openAdminModal = () => {
    setPendingSelection({ g: null, l: null, isAdmin: true });
    setCurrentPin("");
    setPinModalOpen(true);
  };

  // Tree growth stage metadata for each grade level
  const getGradeTreeStage = (g: number) => {
    switch(g) {
      case 1:
        return {
          icon: '🌱',
          stage: 'Sementes & Primeiros Brotos',
          title: '1º ANO',
          subtitle: 'Alfabetização, Descoberta do Mundo & Primeiras Raízes',
          color: '#15803d',
          bgColor: '#f0fdf4',
          borderColor: '#86efac',
          accent: 'Crescimento Inicial'
        };
      case 2:
        return {
          icon: '🌿',
          stage: 'Raízes Firmes & Caule',
          title: '2º ANO',
          subtitle: 'Consolidação da Leitura, Escrita & Criatividade em Flor',
          color: '#0284c7',
          bgColor: '#f0f9ff',
          borderColor: '#7dd3fc',
          accent: 'Fortalecimento'
        };
      case 3:
        return {
          icon: '🍃',
          stage: 'Ramificações do Conhecimento',
          title: '3º ANO',
          subtitle: 'Autonomia Textual, Raciocínio Lógico & Expressão Plena',
          color: '#d97706',
          bgColor: '#fffbeb',
          borderColor: '#fcd34d',
          accent: 'Expansão de Ramos'
        };
      case 4:
        return {
          icon: '🌳',
          stage: 'Copa em Florescimento',
          title: '4º ANO',
          subtitle: 'Investigação Científica, Fluência Crítica & Autonomia',
          color: '#7c3aed',
          bgColor: '#faf5ff',
          borderColor: '#d8b4fe',
          accent: 'Copa Verdejante'
        };
      case 5:
        return {
          icon: '🍎',
          stage: 'Frutos do Saber & Novas Sementes',
          title: '5º ANO',
          subtitle: 'Conquistas Acadêmicas, Maturidade & Transição Fundamental',
          color: '#0f766e',
          bgColor: '#f0fdfa',
          borderColor: '#5eead4',
          accent: 'Frutos Maduros'
        };
      default:
        return {
          icon: '🌳',
          stage: 'Árvore do Saber',
          title: `${g}º ANO`,
          subtitle: 'Ensino Fundamental I',
          color: '#15803d',
          bgColor: '#f0fdf4',
          borderColor: '#86efac',
          accent: 'Desenvolvimento'
        };
    }
  };

  const handleSaveNewPin = (classKey: string) => {
    if (newPinValue.length !== 5) {
      alert("A senha deve ter exatamente 5 dígitos numéricos.");
      return;
    }
    const updatedPins = { ...classPins, [classKey]: newPinValue };
    setClassPins(updatedPins);
    localStorage.setItem('edu_pins_v13', JSON.stringify(updatedPins));
    setEditingPin(null);
    setNewPinValue("");
  };

  const handleSaveTeacher = () => {
    if (!newTeacherName) return;
    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: newTeacherName,
      classes: newTeacherClasses
    };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    setNewTeacherName("");
    setNewTeacherClasses([]);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("Remover este professor?")) {
      const updated = teachers.filter(t => t.id !== id);
      setTeachers(updated);
      localStorage.setItem('edu_teachers_v13', JSON.stringify(updated));
    }
  };

  const toggleTeacherClass = (classKey: string) => {
    setNewTeacherClasses(prev => 
      prev.includes(classKey) ? prev.filter(k => k !== classKey) : [...prev, classKey]
    );
  };

  const handleConfirmCloseSchoolYear = (options: YearTransitionOptions) => {
    onCloseAcademicYear(options);
    setClosureSuccessMessage(`Ano letivo ${activeYear} encerrado com sucesso! O novo ciclo letivo ${options.newYear} foi iniciado e todas as informações anteriores foram arquivadas com segurança no histórico.`);
    setTimeout(() => {
      setClosureSuccessMessage(null);
    }, 8000);
  };

  return (
    <div className="h-full overflow-y-auto relative selection:bg-emerald-200 bg-[#f7faf5]">
      {/* Nature / Tree Ambient Foliage Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-100/70 via-green-50/50 to-transparent" />
        <svg 
          className="absolute -top-12 -left-12 w-80 h-80 text-emerald-600/10" 
          viewBox="0 0 200 200" 
          fill="currentColor"
        >
          <path d="M40 0C60 20 80 15 100 0C120 20 140 10 160 30C180 50 170 80 190 100C160 120 170 150 140 160C110 170 90 150 70 170C40 160 30 130 10 110C-10 90 10 60 0 30C20 10 20 10 40 0Z" />
        </svg>

        <svg 
          className="absolute -top-16 -right-16 w-96 h-96 text-lime-500/10" 
          viewBox="0 0 200 200" 
          fill="currentColor"
        >
          <path d="M100 0C130 30 170 20 190 50C210 80 180 120 190 150C160 180 130 170 100 190C70 170 40 180 20 150C-10 120 20 80 10 50C30 20 70 30 100 0Z" />
        </svg>

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-emerald-900/5 via-emerald-800/2 to-transparent" />
      </div>

      {/* Floating Botanical Leaves Accents */}
      <div className="absolute top-8 left-8 hidden xl:flex items-center gap-2 pointer-events-none select-none text-emerald-600/60 z-0">
        <span className="text-3xl animate-pulse">🌿</span>
        <span className="text-xs font-serif font-black tracking-widest text-emerald-800 uppercase bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
          Raízes do Saber
        </span>
      </div>

      <div className="absolute top-8 right-36 hidden xl:flex items-center gap-2 pointer-events-none select-none text-emerald-600/60 z-0">
        <span className="text-xs font-serif font-black tracking-widest text-emerald-800 uppercase bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
          Copa em Fruto
        </span>
        <span className="text-3xl">🌳</span>
      </div>

      {/* Top Right Admin Access */}
      <div className="absolute top-5 right-6 z-20">
        <button 
          onClick={isAdminAuth ? () => setIsAdminAuth(false) : openAdminModal} 
          className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md text-emerald-900 rounded-full shadow-xs border border-emerald-200/90 hover:bg-emerald-50 text-xs font-black uppercase transition-all hover:scale-105"
        >
          {isAdminAuth ? <Lock className="w-4 h-4 text-red-500" /> : <Settings className="w-4 h-4 text-emerald-600" />}
          <span>{isAdminAuth ? "Sair do Adm" : "Painel da Gestão"}</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-10 px-6 relative z-10">
        {/* Historical viewing alert banner */}
        {isViewingArchive && (
          <div className="mb-6 p-4 rounded-3xl bg-amber-50/95 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-lg shrink-0">
                📁
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                  Modo de Consulta Histórica: Ano Letivo {viewingYear}
                </h4>
                <p className="text-[11px] text-amber-900 font-medium">
                  Você está visualizando o acervo arquivado. O Ano Letivo ativo vigente da escola é <strong>{activeYear}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={onReturnToActiveYear}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar ao Ano Vigente ({activeYear})</span>
            </button>
          </div>
        )}

        {/* Success toast after school year transition */}
        {closureSuccessMessage && (
          <div className="mb-6 p-4 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-900 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-black uppercase tracking-wide">Novo Ciclo Letivo Iniciado com Sucesso!</p>
              <p className="mt-0.5 font-medium leading-relaxed">{closureSuccessMessage}</p>
            </div>
            <button 
              onClick={() => setClosureSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section: School Tree Identity */}
        <header className="mb-10 text-center flex flex-col items-center">
          {/* Nature Ribbon Badge with dynamic Year */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-black uppercase tracking-wider mb-5 shadow-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              Ano Letivo {viewingYear} {isViewingArchive ? '(Acervo Histórico)' : ''} • Caderno Pedagógico Sob a Árvore do Saber
            </span>
          </div>

          {/* School Emblem Centerpiece with Leaf Aura */}
          <div className="relative mb-5 group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-300/40 via-lime-200/50 to-teal-300/40 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-80" />
            
            <div className="relative bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-[0_12px_36px_rgba(20,83,45,0.12)] border border-emerald-100 ring-4 ring-emerald-500/10 flex items-center justify-center">
              <SchoolLogo size="xl" showText={false} />
            </div>

            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-2xl shadow-md border-2 border-white flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight font-serif">
            Escola Municipal Raymundo Lemos Santana
          </h1>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-px w-8 bg-emerald-300" />
            <p className="text-emerald-800 font-bold uppercase tracking-[0.2em] text-xs">
              Ensino Fundamental I • EJA
            </p>
            <span className="h-px w-8 bg-emerald-300" />
          </div>

          <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1.5 max-w-lg leading-relaxed">
            <em>&quot;Onde o conhecimento cria raízes profundas e cada estudante floresce em seu próprio ritmo.&quot;</em>
          </p>

          <div className="flex justify-center items-center gap-2 mt-5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" title="1º Ano" />
            <span className="w-2 h-2 rounded-full bg-sky-500" title="2º Ano" />
            <span className="w-2 h-2 rounded-full bg-amber-500" title="3º Ano" />
            <span className="w-2 h-2 rounded-full bg-purple-600" title="4º Ano" />
            <span className="w-2 h-2 rounded-full bg-teal-600" title="5º Ano" />
          </div>
        </header>

        {isAdminAuth ? (
          /* ================= ADMIN AUTH PANEL ================= */
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Top Navigation Tabs for Admin */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-emerald-100/70 rounded-2xl border border-emerald-200/90 shadow-2xs">
              <button
                onClick={() => setAdminTab('year')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  adminTab === 'year' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-emerald-900 hover:bg-white/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Ano Letivo & Transição</span>
              </button>

              <button
                onClick={() => setAdminTab('teachers')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  adminTab === 'teachers' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-emerald-900 hover:bg-white/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Professores & Turmas</span>
              </button>

              <button
                onClick={() => setAdminTab('pins')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                  adminTab === 'pins' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-emerald-900 hover:bg-white/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Senhas das Turmas</span>
              </button>
            </div>

            {/* TAB 1: SCHOOL YEAR MANAGEMENT & CLOSURE (Requested Feature) */}
            {adminTab === 'year' && (
              <div className="space-y-6">
                {/* Active Year Operations Card */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-emerald-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-slate-800 uppercase font-serif">
                            Ano Letivo {activeYear}
                          </h2>
                          <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                            Ciclo Ativo
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Gestão de encerramento do ano letivo com arquivamento integral e início de novo ciclo escolar.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onDownloadYearBackup(activeYear)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-black uppercase flex items-center gap-2 transition-all shadow-2xs"
                        title="Baixar cópia de segurança em formato JSON"
                      >
                        <Download className="w-4 h-4 text-emerald-700" />
                        <span>Backup (.JSON)</span>
                      </button>

                      <button
                        onClick={() => setCloseYearModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white text-xs font-black uppercase flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Encerrar Ano Letivo {activeYear}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary KPI Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                      <span className="text-2xl font-black text-emerald-950 block tabular-nums">
                        {totalStudents}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">
                        Estudantes Matriculados
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">Distribuídos do 1º ao 5º ano</p>
                    </div>

                    <div className="bg-sky-50/60 border border-sky-100 p-4 rounded-2xl">
                      <span className="text-2xl font-black text-sky-950 block tabular-nums">
                        {totalClassesWithStudents} / 20
                      </span>
                      <span className="text-xs font-bold text-sky-800 uppercase tracking-tight">
                        Turmas com Estudantes
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">Salas com alunos em atividade</p>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl">
                      <span className="text-2xl font-black text-amber-950 block tabular-nums">
                        {totalEvaluations}
                      </span>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-tight">
                        Pareceres / Fichas Registradas
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">Observações e habilidades marcadas</p>
                    </div>
                  </div>

                  {/* Assurance card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700">
                      <p className="font-bold text-slate-900 uppercase">
                        Preservação Total de Registros Escolares
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Ao encerrar o ano letivo, todo o histórico do ciclo <strong>{activeYear}</strong> é gravado no acervo histórico permanente. Você poderá consultar todos os pareceres, notas e alunos de anos anteriores a qualquer momento, sem que nenhuma informação seja perdida.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historical Archive Card */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-emerald-100">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Archive className="w-5 h-5 text-emerald-700" />
                      <h3 className="text-base font-black text-slate-800 uppercase font-serif">
                        Acervo de Anos Letivos Anteriores
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">
                      {archivedYears.length} {archivedYears.length === 1 ? 'Ciclo Arquivado' : 'Ciclos Arquivados'}
                    </span>
                  </div>

                  {archivedYears.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                      <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-xs font-black uppercase text-slate-700">Nenhum ano anterior arquivado ainda</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                        Quando você encerrar o Ano Letivo <strong>{activeYear}</strong>, todos os pareceres, diagnósticos e fichas ficarão armazenados nesta seção para consulta permanente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archivedYears.map(archive => {
                        const isCurrentlyViewingThis = viewingYear === archive.year;
                        const formattedDate = archive.closedAt ? new Date(archive.closedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'Data arquivada';

                        return (
                          <div 
                            key={archive.year} 
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isCurrentlyViewingThis 
                                ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
                                : 'bg-white border-slate-200 hover:border-emerald-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black font-serif text-lg text-slate-800 shrink-0">
                                {archive.year}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900 uppercase">
                                    Ano Letivo {archive.year}
                                  </span>
                                  {isCurrentlyViewingThis ? (
                                    <span className="text-[9px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                                      Em Consulta
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                      Arquivado em {formattedDate}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {archive.totalStudents || 0} estudantes • {archive.totalEvaluations || 0} registros pedagógicos
                                  {archive.notes && ` • "${archive.notes}"`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                              {isCurrentlyViewingThis ? (
                                <button
                                  onClick={onReturnToActiveYear}
                                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Sair da Consulta</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onViewArchivedYear(archive.year)}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors border border-slate-200"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Consultar Turmas</span>
                                </button>
                              )}

                              <button
                                onClick={() => onDownloadYearBackup(archive.year)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors border border-slate-200"
                                title="Baixar arquivo JSON deste ano"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Backup</span>
                              </button>

                              <button
                                onClick={() => onRestoreArchivedYear(archive.year)}
                                className="px-3 py-2 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-colors border border-slate-200"
                                title="Definir este ano novamente como ano ativo"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restaurar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TEACHERS MANAGEMENT */}
            {adminTab === 'teachers' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
                <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                  <Users className="text-emerald-700" /> Cadastro de Professores &amp; Vinculação
                </h2>
                
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 mb-6">
                  <h3 className="text-sm font-black text-emerald-900 uppercase mb-4">Novo Professor</h3>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="Nome do Professor"
                      className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none border border-slate-200 focus:border-emerald-600 uppercase transition-colors shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase mb-3 block">Turmas Vinculadas:</span>
                      <div className="flex flex-wrap gap-2">
                        {gradesArr.map(g => 
                          lettersArr.map(l => {
                            const key = `${g}${l}`;
                            const isSelected = newTeacherClasses.includes(key);
                            return (
                              <button
                                key={key}
                                onClick={() => toggleTeacherClass(key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                  isSelected 
                                    ? 'bg-emerald-700 text-white border-emerald-700 border shadow-2xs' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                              >
                                {key}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveTeacher}
                      className="self-end bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-emerald-900 flex items-center gap-2 shadow-2xs transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Salvar Professor
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {teachers.length === 0 && (
                    <p className="text-xs text-slate-400 font-bold uppercase text-center py-4">Nenhum professor cadastrado.</p>
                  )}
                  {teachers.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="block text-sm font-black text-slate-800 uppercase">{t.name}</span>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {t.classes.map(c => (
                            <span key={c} className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">{c}</span>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteTeacher(t.id)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PINS MANAGEMENT */}
            {adminTab === 'pins' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
                <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                  <Settings className="text-emerald-700" /> Administração de Senhas das Turmas
                </h2>
                <div className="space-y-6">
                {gradesArr.map(g => (
                  <div key={g} className="border border-slate-100 rounded-2xl p-5 bg-slate-50 shadow-inner">
                    <h3 className="text-sm font-black text-slate-600 uppercase mb-4">{g}º Ano</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {lettersArr.map(l => {
                        const classKey = `${g}${l}`;
                        const isEditing = editingPin === classKey;
                        const currentClassPin = classPins[classKey] || PIN_CONFIG[g.toString()];
                        
                        return (
                          <div key={l} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                            <div>
                              <span className="block text-lg font-black text-slate-800 uppercase">{l}</span>
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  maxLength={5}
                                  value={newPinValue}
                                  onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                  className="w-16 bg-slate-100 px-2 py-1.5 rounded-lg text-xs font-bold outline-none border border-slate-300 focus:border-emerald-600 mt-1 transition-colors"
                                  placeholder="5 dígitos"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400">Senha: {currentClassPin}</span>
                              )}
                            </div>
                            {isEditing ? (
                              <button onClick={() => handleSaveNewPin(classKey)} className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => { setEditingPin(classKey); setNewPinValue(currentClassPin); }} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= TEACHER & CLASSES DASHBOARD ================= */
          <div className="space-y-8">
            {/* Quick Access for Teachers */}
            {teachers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <TreeDeciduous className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">
                    Acesso Rápido • Professores &amp; Educadores
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {teachers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(selectedTeacherId === t.id ? null : t.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedTeacherId === t.id 
                          ? 'bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-200' 
                          : 'bg-white/95 backdrop-blur-sm border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="block text-sm font-black text-slate-800 uppercase">{t.name}</span>
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md uppercase">
                        {t.classes.length} {t.classes.length === 1 ? 'Turma Vinculada' : 'Turmas Vinculadas'}
                      </span>
                    </button>
                  ))}
                </div>
                
                {selectedTeacherId && (
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2 mt-4">
                    <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Selecione a sua turma para entrar
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {teachers.find(t => t.id === selectedTeacherId)?.classes.map(c => {
                        const g = parseInt(c[0]);
                        const l = c.substring(1);
                        return (
                          <button
                            key={c}
                            onClick={() => openPinModal(g, l)}
                            className="bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-900 border border-emerald-200 px-5 py-2.5 rounded-xl font-black text-lg transition-all shadow-2xs hover:scale-105 active:scale-95"
                          >
                            Turma {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tree Journey: All Grades Accordion */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-[11px] font-black text-emerald-900 uppercase tracking-widest">
                    Ciclos de Aprendizagem &amp; Turmas
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                  1º ao 5º Ano do Ensino Fundamental
                </span>
              </div>

              {gradesArr.map(g => {
                const isActive = openYear === g;
                const stage = getGradeTreeStage(g);
                return (
                  <div key={g}>
                    <button 
                      onClick={() => setOpenYear(isActive ? null : g)} 
                      className={`w-full flex items-center justify-between p-5 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-sm border transition-all duration-300 text-left ${
                        isActive 
                          ? 'shadow-md border-emerald-300 ring-2 ring-emerald-100' 
                          : 'border-slate-200 hover:shadow-xs hover:border-emerald-200'
                      }`}
                      style={{ 
                        borderLeftColor: stage.color, 
                        borderLeftWidth: '6px' 
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-13 h-13 relative flex items-center justify-center rounded-2xl text-2xl shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: stage.bgColor, border: `1px solid ${stage.borderColor}` }}
                        >
                          <span>{stage.icon}</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black uppercase text-slate-800 tracking-tight">
                              {stage.title}
                            </h3>
                            <span 
                              className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ backgroundColor: stage.bgColor, color: stage.color, border: `1px solid ${stage.borderColor}` }}
                            >
                              {stage.stage}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 leading-snug">
                            {stage.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
                          {isActive ? 'Ocultar Turmas' : 'Ver Turmas'}
                        </span>
                        {isActive ? (
                          <ChevronUp className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>
                    
                    {/* Class Letters (A, B, C, D) Grid */}
                    {isActive && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-3 px-2 animate-in slide-in-from-top-2 duration-300">
                        {lettersArr.map(l => {
                          const classData = appData[`${g}${l}`];
                          const activeCount = classData?.students?.filter(s => classData[s]?.active !== false).length || 0;
                          const aeeCount = classData?.students?.filter(s => classData[s]?.isAee).length || 0;

                          return (
                            <div 
                              key={l} 
                              onClick={() => openPinModal(g, l)} 
                              className="bg-white p-5 rounded-3xl border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 text-center group transition-all relative overflow-hidden"
                              style={{ borderColor: stage.borderColor }}
                            >
                              <div 
                                className="absolute top-0 left-0 right-0 h-1.5 transition-colors"
                                style={{ backgroundColor: stage.color }}
                              />
                              
                              <div className="text-2xl mb-1">{stage.icon}</div>
                              <span 
                                className="block text-2xl font-black uppercase transition-colors"
                                style={{ color: stage.color }}
                              >
                                Turma {l}
                              </span>
                              
                              <div className="mt-2 flex flex-col items-center gap-1">
                                <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {activeCount} {activeCount === 1 ? 'Estudante' : 'Estudantes'}
                                </span>
                                {aeeCount > 0 && (
                                  <span className="text-[9px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full uppercase">
                                    {aeeCount} AEE
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer with Tree Philosophy Quote */}
        <footer className="mt-14 text-center border-t border-emerald-100 pt-6 pb-4">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Escola Municipal Raymundo Lemos Santana • Gestão Pedagógica Integrada
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Plataforma Segura com Autenticação de Turmas &amp; Pareceres Descritivos Alinhados à BNCC
          </p>
        </footer>
      </div>

      <PinModal 
        isOpen={pinModalOpen}
        targetGrade={pendingSelection.g}
        targetLetter={pendingSelection.l}
        isAdmin={pendingSelection.isAdmin}
        currentPin={currentPin}
        isError={isError}
        onPinChange={handlePinChange}
        onCancel={() => setPinModalOpen(false)}
      />

      <CloseSchoolYearModal
        isOpen={closeYearModalOpen}
        onClose={() => setCloseYearModalOpen(false)}
        currentYear={activeYear}
        totalStudents={totalStudents}
        totalClasses={totalClassesWithStudents}
        totalEvaluations={totalEvaluations}
        onDownloadBackup={() => onDownloadYearBackup(activeYear)}
        onConfirmCloseYear={handleConfirmCloseSchoolYear}
      />
    </div>
  );
}
