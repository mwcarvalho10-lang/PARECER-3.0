'use client';

import React, { useState, useEffect } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { gradesArr, lettersArr, PIN_CONFIG } from '@/lib/constants';
import { PinModal } from './PinModal';
import { SchoolLogo } from './SchoolLogo';
import { AppData, Teacher } from '@/lib/types';

interface DashboardProps {
  appData: AppData;
  onSelectClass: (grade: string, letter: string) => void;
}

export function Dashboard({ appData, onSelectClass }: DashboardProps) {
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ g: number | null; l: string | null; isAdmin?: boolean }>({ g: null, l: null });
  const [currentPin, setCurrentPin] = useState("");
  const [isError, setIsError] = useState(false);
  
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

  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

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
          color: '#15803d', // Green 700
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
          color: '#0284c7', // Sky 600
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
          color: '#d97706', // Amber 600
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
          color: '#7c3aed', // Purple 600
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
          color: '#0f766e', // Teal 700
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

  return (
    <div className="h-full overflow-y-auto relative selection:bg-emerald-200 bg-[#f7faf5]">
      {/* Nature / Tree Ambient Foliage Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        {/* Soft Canopy Gradient Wash */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-100/70 via-green-50/50 to-transparent" />
        
        {/* Decorative Top Left Canopy Silhouette */}
        <svg 
          className="absolute -top-12 -left-12 w-80 h-80 text-emerald-600/10" 
          viewBox="0 0 200 200" 
          fill="currentColor"
        >
          <path d="M40 0C60 20 80 15 100 0C120 20 140 10 160 30C180 50 170 80 190 100C160 120 170 150 140 160C110 170 90 150 70 170C40 160 30 130 10 110C-10 90 10 60 0 30C20 10 20 10 40 0Z" />
        </svg>

        {/* Decorative Top Right Sunbeam and Leaves */}
        <svg 
          className="absolute -top-16 -right-16 w-96 h-96 text-lime-500/10" 
          viewBox="0 0 200 200" 
          fill="currentColor"
        >
          <path d="M100 0C130 30 170 20 190 50C210 80 180 120 190 150C160 180 130 170 100 190C70 170 40 180 20 150C-10 120 20 80 10 50C30 20 70 30 100 0Z" />
        </svg>

        {/* Bottom Forest Greenery Wash */}
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
        {/* Hero Section: School Tree Identity */}
        <header className="mb-10 text-center flex flex-col items-center">
          {/* Nature Ribbon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-black uppercase tracking-wider mb-5 shadow-xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ano Letivo 2026 • Caderno Pedagógico Sob a Árvore do Saber</span>
          </div>

          {/* School Emblem Centerpiece with Leaf Aura */}
          <div className="relative mb-5 group">
            {/* Glowing green halo behind logo */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-300/40 via-lime-200/50 to-teal-300/40 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-80" />
            
            {/* Tree Emblem Card */}
            <div className="relative bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-[0_12px_36px_rgba(20,83,45,0.12)] border border-emerald-100 ring-4 ring-emerald-500/10 flex items-center justify-center">
              <SchoolLogo size="xl" showText={false} />
            </div>

            {/* Sprouting leaf badge */}
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

          {/* Color palette dot indicators representing tree vitality */}
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
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Users className="text-emerald-700" /> Cadastro de Professores
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
                      <div className="flex gap-1 mt-1.5">
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

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Settings className="text-emerald-700" /> Administração de Senhas
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
                    Acesso Rápido • Professores & Educadores
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
                    Ciclos de Aprendizagem & Turmas
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
                        {/* Tree Stage Icon Badge */}
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
                              {/* Top accent line */}
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
    </div>
  );
}
