"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { MainApp } from '@/components/MainApp';
import { AppData, Skill, SchoolYearArchive, YearTransitionOptions } from '@/lib/types';
import { defaultSkills } from '@/lib/defaultSkills';
import { gradesArr, lettersArr, units } from '@/lib/constants';

export default function Page() {
  const [globalSkills, setGlobalSkills] = useState<Skill[]>([]);
  const [appData, setAppData] = useState<AppData>({});
  const [activeYear, setActiveYear] = useState<string>('2026');
  const [viewingYear, setViewingYear] = useState<string>('2026');
  const [archivedYears, setArchivedYears] = useState<SchoolYearArchive[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'app'>('dashboard');
  const [currentGrade, setCurrentGrade] = useState<string>("");
  const [currentLetter, setCurrentLetter] = useState<string>("");

  useEffect(() => {
    // 1. Initialize skills
    let skills: Skill[] = [];
    try {
      skills = JSON.parse(localStorage.getItem('edu_skills_v13') || '[]');
    } catch {
      skills = [];
    }
    if (skills.length === 0) {
      skills = defaultSkills;
    } else {
      const existingIds = new Set(skills.map(s => s.id));
      const newSkills = defaultSkills.filter(s => !existingIds.has(s.id));
      if (newSkills.length > 0) {
        skills = [...skills, ...newSkills];
      }
    }
    localStorage.setItem('edu_skills_v13', JSON.stringify(skills));
    setGlobalSkills(skills);

    // 2. Initialize School Year and Archives
    const savedActiveYear = localStorage.getItem('edu_active_year_v13') || '2026';
    setActiveYear(savedActiveYear);
    setViewingYear(savedActiveYear);

    let savedArchives: SchoolYearArchive[] = [];
    try {
      savedArchives = JSON.parse(localStorage.getItem('edu_academic_archive_v13') || '[]');
    } catch {
      savedArchives = [];
    }
    setArchivedYears(savedArchives);

    // 3. Initialize AppData
    let data: AppData = {};
    try {
      data = JSON.parse(localStorage.getItem('edu_data_v13') || '{}');
    } catch {
      data = {};
    }

    // Ensure all grade letters exist
    let hasModifications = false;
    gradesArr.forEach(g => {
      lettersArr.forEach(l => {
        const key = `${g}${l}`;
        if (!data[key]) {
          data[key] = { students: [] };
          hasModifications = true;
        }
      });
    });

    if (hasModifications) {
      localStorage.setItem('edu_data_v13', JSON.stringify(data));
    }

    setAppData(data);
    setIsLoaded(true);
  }, []);

  const handleUpdateAppData = (newData: AppData) => {
    setAppData(newData);
    if (viewingYear === activeYear) {
      localStorage.setItem('edu_data_v13', JSON.stringify(newData));
    } else {
      // If updating an archived year, save to that archive
      const updatedArchives = archivedYears.map(arc => {
        if (arc.year === viewingYear) {
          return { ...arc, data: newData };
        }
        return arc;
      });
      setArchivedYears(updatedArchives);
      localStorage.setItem('edu_academic_archive_v13', JSON.stringify(updatedArchives));
      localStorage.setItem(`edu_archive_data_${viewingYear}`, JSON.stringify(newData));
    }
  };

  const handleUpdateGlobalSkills = (newSkills: Skill[]) => {
    setGlobalSkills(newSkills);
    localStorage.setItem('edu_skills_v13', JSON.stringify(newSkills));
  };

  const handleSelectClass = (grade: string, letter: string) => {
    setCurrentGrade(grade);
    setCurrentLetter(letter);
    
    const key = `${grade}${letter}`;
    if (!appData[key]) {
      const updated = {
        ...appData,
        [key]: { students: [] }
      };
      handleUpdateAppData(updated);
    }
    
    setCurrentScreen('app');
  };

  // Download JSON backup
  const handleDownloadYearBackup = useCallback((year: string) => {
    let dataToExport: AppData = {};
    if (year === activeYear) {
      dataToExport = appData;
    } else {
      const found = archivedYears.find(a => a.year === year);
      if (found) {
        dataToExport = found.data;
      } else {
        try {
          dataToExport = JSON.parse(localStorage.getItem(`edu_archive_data_${year}`) || '{}');
        } catch {
          dataToExport = {};
        }
      }
    }

    const exportPayload = {
      escola: "Escola Municipal Raymundo Lemos Santana",
      anoLetivo: year,
      exportedAt: new Date().toISOString(),
      turmas: dataToExport
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Escola_Raymundo_Lemos_Santana_AnoLetivo_${year}_Backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeYear, appData, archivedYears]);

  // Close active year and start new academic cycle
  const handleCloseAcademicYear = (options: YearTransitionOptions) => {
    // 1. Calculate active year totals
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

    // 2. Build archive of current active year
    const archiveItem: SchoolYearArchive = {
      year: activeYear,
      closedAt: new Date().toISOString(),
      closedBy: 'Coordenação Pedagógica',
      notes: options.notes || `Ano letivo ${activeYear} encerrado e arquivado com sucesso.`,
      data: JSON.parse(JSON.stringify(appData)),
      totalStudents: studentsCount,
      totalClasses: classesCount,
      totalEvaluations: evalsCount
    };

    // Save archive list
    const updatedArchives = [
      archiveItem,
      ...archivedYears.filter(a => a.year !== activeYear)
    ];
    setArchivedYears(updatedArchives);
    localStorage.setItem('edu_academic_archive_v13', JSON.stringify(updatedArchives));
    localStorage.setItem(`edu_archive_data_${activeYear}`, JSON.stringify(appData));

    // 3. Build new year data according to transition mode
    const newAppData: AppData = {};
    gradesArr.forEach(g => {
      lettersArr.forEach(l => {
        newAppData[`${g}${l}`] = { students: [] };
      });
    });

    if (options.mode === 'promotion') {
      // Promote students from grade G to G+1
      gradesArr.forEach(g => {
        lettersArr.forEach(l => {
          const currentKey = `${g}${l}`;
          const sourceClass = appData[currentKey];
          if (sourceClass && Array.isArray(sourceClass.students) && sourceClass.students.length > 0) {
            const nextGrade = g + 1;
            if (nextGrade <= 5) {
              const targetKey = `${nextGrade}${l}`;
              if (!newAppData[targetKey]) {
                newAppData[targetKey] = { students: [] };
              }
              sourceClass.students.forEach(studentName => {
                newAppData[targetKey].students.push(studentName);
                const oldStudentData = sourceClass[studentName] || {};
                const newStudentObj: any = {
                  active: oldStudentData.active !== false,
                  gender: oldStudentData.gender || '',
                  isAee: Boolean(oldStudentData.isAee),
                  aeeType: oldStudentData.aeeType || '',
                  aeeNotes: oldStudentData.aeeNotes || ''
                };
                units.forEach(u => {
                  newStudentObj[u] = { skills: [], observation: '' };
                });
                newAppData[targetKey][studentName] = newStudentObj;
              });
            }
            // 5th graders graduate: preserved intact in the archive
          }
        });
      });
    } else if (options.mode === 'keep_students') {
      // Keep students in the same classes, clean evaluations
      Object.keys(appData).forEach(classKey => {
        const sourceClass = appData[classKey];
        if (sourceClass && Array.isArray(sourceClass.students)) {
          newAppData[classKey] = { students: [...sourceClass.students] };
          sourceClass.students.forEach(studentName => {
            const oldStudentData = sourceClass[studentName] || {};
            const newStudentObj: any = {
              active: oldStudentData.active !== false,
              gender: oldStudentData.gender || '',
              isAee: Boolean(oldStudentData.isAee),
              aeeType: oldStudentData.aeeType || '',
              aeeNotes: oldStudentData.aeeNotes || ''
            };
            units.forEach(u => {
              newStudentObj[u] = { skills: [], observation: '' };
            });
            newAppData[classKey][studentName] = newStudentObj;
          });
        }
      });
    }

    // 4. Update state and localStorage
    const newYearStr = options.newYear;
    setActiveYear(newYearStr);
    setViewingYear(newYearStr);
    setAppData(newAppData);

    localStorage.setItem('edu_active_year_v13', newYearStr);
    localStorage.setItem('edu_data_v13', JSON.stringify(newAppData));
  };

  // View historical archive
  const handleViewArchivedYear = (year: string) => {
    if (year === activeYear) {
      handleReturnToActiveYear();
      return;
    }
    const found = archivedYears.find(a => a.year === year);
    if (found) {
      setViewingYear(year);
      setAppData(found.data);
    } else {
      try {
        const backupData = JSON.parse(localStorage.getItem(`edu_archive_data_${year}`) || '{}');
        setViewingYear(year);
        setAppData(backupData);
      } catch {
        alert("Não foi possível carregar os dados deste ano arquivado.");
      }
    }
  };

  // Return to currently active year
  const handleReturnToActiveYear = () => {
    try {
      const activeData = JSON.parse(localStorage.getItem('edu_data_v13') || '{}');
      setViewingYear(activeYear);
      setAppData(activeData);
    } catch {
      setViewingYear(activeYear);
    }
  };

  // Restore archived year as the active year
  const handleRestoreArchivedYear = (year: string) => {
    if (confirm(`Atenção: Deseja reabrir e definir o Ano Letivo ${year} como o ciclo ativo vigente?`)) {
      const found = archivedYears.find(a => a.year === year);
      if (found) {
        // Backup current active year first
        const currentBackup: SchoolYearArchive = {
          year: activeYear,
          closedAt: new Date().toISOString(),
          closedBy: 'Coordenação Pedagógica',
          notes: `Backup automático antes de restaurar o ano ${year}.`,
          data: JSON.parse(JSON.stringify(appData)),
          totalStudents: 0,
          totalClasses: 0,
          totalEvaluations: 0
        };
        const updatedArchives = [
          currentBackup,
          ...archivedYears.filter(a => a.year !== activeYear)
        ];
        setArchivedYears(updatedArchives);
        localStorage.setItem('edu_academic_archive_v13', JSON.stringify(updatedArchives));

        // Restore
        setActiveYear(year);
        setViewingYear(year);
        setAppData(found.data);
        localStorage.setItem('edu_active_year_v13', year);
        localStorage.setItem('edu_data_v13', JSON.stringify(found.data));
      }
    }
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-[#f8fafc]">Carregando...</div>;

  const isViewingArchive = viewingYear !== activeYear;

  return (
    <div className="h-screen overflow-hidden">
      {currentScreen === 'dashboard' ? (
        <Dashboard 
          appData={appData} 
          activeYear={activeYear}
          viewingYear={viewingYear}
          isViewingArchive={isViewingArchive}
          archivedYears={archivedYears}
          onSelectClass={handleSelectClass}
          onCloseAcademicYear={handleCloseAcademicYear}
          onViewArchivedYear={handleViewArchivedYear}
          onReturnToActiveYear={handleReturnToActiveYear}
          onRestoreArchivedYear={handleRestoreArchivedYear}
          onDownloadYearBackup={handleDownloadYearBackup}
        />
      ) : (
        <MainApp 
          currentGrade={currentGrade}
          currentLetter={currentLetter}
          appData={appData}
          globalSkills={globalSkills}
          viewingYear={viewingYear}
          isViewingArchive={isViewingArchive}
          onGoBack={() => setCurrentScreen('dashboard')}
          onUpdateAppData={handleUpdateAppData}
          onUpdateGlobalSkills={handleUpdateGlobalSkills}
        />
      )}
    </div>
  );
}
