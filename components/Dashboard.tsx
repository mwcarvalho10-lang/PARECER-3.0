import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, ChevronDown, ChevronUp, Settings, Lock, Edit2, Check, UserPlus, Trash2, Users } from 'lucide-react';
import { gradesArr, lettersArr, PIN_CONFIG } from '@/lib/constants';
import { PinModal } from './PinModal';
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
  
  const [classPins, setClassPins] = useState<Record<string, string>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const savedPins = localStorage.getItem('edu_pins_v13');
    if (savedPins) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClassPins(JSON.parse(savedPins));
    } else {
      const initialPins: Record<string, string> = {};
      gradesArr.forEach(g => {
        lettersArr.forEach(l => {
          initialPins[`${g}${l}`] = PIN_CONFIG[g.toString()];
        });
      });
      setClassPins(initialPins);
      localStorage.setItem('edu_pins_v13', JSON.stringify(initialPins));
    }

    const savedTeachers = localStorage.getItem('edu_teachers_v13');
    if (savedTeachers) {
      setTeachers(JSON.parse(savedTeachers));
    }
  }, []);

  const handlePinChange = (pin: string) => {
    if (isError) return;
    setCurrentPin(pin);
    
    // Admin password length is 7 ('adm2026') but pin modal only handles numbers if we click, 
    // however keyboard allows any string. Wait, if it's admin, they might type letters. 
    // PinModal will need to support arbitrary length for admin. Let's just check dynamically.
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

  const getGradeColor = (g: number) => {
    switch(g) {
      case 1: return '#0ea5e9';
      case 2: return '#7fb432';
      case 3: return '#f59e0b';
      case 4: return '#8b5cf6';
      case 5: return '#005bb7';
      default: return '#0ea5e9';
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
    <div className="nordeste-bg h-full overflow-y-auto relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={isAdminAuth ? () => setIsAdminAuth(false) : openAdminModal} 
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md text-slate-700 rounded-full shadow-sm border border-slate-200 hover:bg-white text-xs font-bold uppercase transition-all"
        >
          {isAdminAuth ? <Lock className="w-4 h-4 text-red-500" /> : <Settings className="w-4 h-4 text-slate-400" />}
          {isAdminAuth ? "Sair do Adm" : "Admin"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <header className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-escola-azul to-blue-600 shadow-[0_8px_30px_rgb(0,91,183,0.2)] flex items-center justify-center text-white">
              <GraduationCap className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight font-serif">Gestão Pedagógica</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">E. M. Raymundo Lemos Santana</p>
        </header>
        
        {isAdminAuth ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Users className="text-slate-500" /> Cadastro de Professores
              </h2>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                <h3 className="text-sm font-black text-slate-600 uppercase mb-4">Novo Professor</h3>
                <div className="flex flex-col gap-5">
                  <input 
                    type="text" 
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="Nome do Professor"
                    className="w-full bg-white px-4 py-3 rounded-xl text-sm font-bold outline-none border border-slate-200 focus:border-escola-azul uppercase transition-colors shadow-sm"
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${isSelected ? 'bg-escola-azul text-white border-escola-azul border shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
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
                    className="self-end bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-slate-700 flex items-center gap-2 shadow-sm transition-colors"
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
                  <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="block text-sm font-black text-slate-800 uppercase">{t.name}</span>
                      <div className="flex gap-1 mt-1.5">
                        {t.classes.map(c => (
                          <span key={c} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border border-slate-200">{c}</span>
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

            <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200">
              <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
                <Settings className="text-slate-500" /> Administração de Senhas
              </h2>
              <div className="space-y-6">
              {gradesArr.map(g => (
                <div key={g} className="border border-slate-100 rounded-2xl p-5 bg-slate-50 shadow-inner">
                  <h3 className="text-sm font-black text-slate-500 uppercase mb-4">{g}º Ano</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {lettersArr.map(l => {
                      const classKey = `${g}${l}`;
                      const isEditing = editingPin === classKey;
                      const currentClassPin = classPins[classKey] || PIN_CONFIG[g.toString()];
                      
                      return (
                        <div key={l} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                          <div>
                            <span className="block text-lg font-black text-slate-800 uppercase">{l}</span>
                            {isEditing ? (
                              <input 
                                type="text" 
                                maxLength={5}
                                value={newPinValue}
                                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                                className="w-16 bg-slate-100 px-2 py-1.5 rounded-lg text-xs font-bold outline-none border border-slate-300 focus:border-escola-azul mt-1 transition-colors"
                                placeholder="5 dígitos"
                                autoFocus
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">Senha: {currentClassPin}</span>
                            )}
                          </div>
                          {isEditing ? (
                            <button onClick={() => handleSaveNewPin(classKey)} className="w-9 h-9 flex items-center justify-center bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors">
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
          <div className="space-y-8">
            {teachers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Acesso Rápido - Professores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {teachers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(selectedTeacherId === t.id ? null : t.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedTeacherId === t.id ? 'bg-slate-50 border-slate-300 shadow-md ring-1 ring-slate-200' : 'bg-white/95 backdrop-blur-sm border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
                    >
                      <span className="block text-sm font-black text-slate-800 uppercase mb-1">{t.name}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{t.classes.length} Turmas</span>
                    </button>
                  ))}
                </div>
                
                {selectedTeacherId && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 mt-4">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Selecione sua turma</h3>
                    <div className="flex flex-wrap gap-2">
                      {teachers.find(t => t.id === selectedTeacherId)?.classes.map(c => {
                        const g = parseInt(c[0]);
                        const l = c.substring(1);
                        return (
                          <button
                            key={c}
                            onClick={() => openPinModal(g, l)}
                            className="bg-slate-50 hover:bg-escola-azul hover:text-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-black text-lg transition-colors"
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Todas as Turmas</h2>
              {gradesArr.map(g => {
                const isActive = openYear === g;
              const gradeColor = getGradeColor(g);
              return (
                <div key={g} style={{ '--grade-color': gradeColor } as React.CSSProperties}>
                  <button 
                    onClick={() => setOpenYear(isActive ? null : g)} 
                    className={`w-full flex items-center justify-between p-6 rounded-2xl bg-white/95 backdrop-blur-sm border transition-all duration-300 ${isActive ? 'shadow-md border-slate-300 ring-1 ring-slate-200/50' : 'border-slate-100 hover:shadow-sm hover:border-slate-200'}`}
                    style={{ borderLeftColor: isActive ? gradeColor : 'transparent', borderLeftWidth: isActive ? '4px' : '4px' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 relative flex items-center justify-center rounded-xl transition-all duration-300 ${isActive ? 'text-white shadow-inner' : 'bg-slate-50 text-slate-500'}`} style={{ backgroundColor: isActive ? gradeColor : undefined }}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black uppercase text-slate-800">{g}º ANO</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ensino Fundamental</p>
                      </div>
                    </div>
                    {isActive ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  
                  {isActive && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 px-2 animate-in slide-in-from-top-2 duration-300">
                      {lettersArr.map(l => {
                        const classData = appData[`${g}${l}`];
                        const count = classData?.students?.filter(s => classData[s]?.active !== false).length || 0;
                        return (
                          <div 
                            key={l} 
                            onClick={() => openPinModal(g, l)} 
                            className="bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 cursor-pointer hover:border-escola-azul/30 hover:shadow-md hover:-translate-y-1 text-center group transition-all"
                          >
                            <span className="block text-2xl font-black text-slate-800 uppercase group-hover:text-escola-azul transition-colors">{l}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{count} Alunos</span>
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
