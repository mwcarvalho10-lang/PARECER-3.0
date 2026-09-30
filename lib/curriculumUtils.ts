import { Skill, ClassData, AppData } from './types';
import { units, lettersArr } from './constants';

export const CURRICULUM_STORAGE_KEY_PREFIX = 'edu_unit_curriculum_v1';

/**
 * Intelligent default distribution of skills across the academic units/bimestres.
 * Distributes skills by subject and progression:
 * - Diagnóstica: Foundational initial skills (approx 20%)
 * - I Unid: 1st Quarter core skills (approx 25-30%)
 * - II Unid: 2nd Quarter core skills (approx 25-30%)
 * - III Unid: 3rd Quarter core skills (approx 25-30%)
 * - Final: Synthesis & mastery consolidation skills
 */
export function getDefaultPlannedSkills(
  currentGrade: string, 
  allSkills: Skill[]
): Record<string, string[]> {
  const gradeSkills = allSkills.filter(s => String(s.grade) === String(currentGrade));
  
  // Group skills by subject
  const subjectsMap: Record<string, Skill[]> = {};
  gradeSkills.forEach(skill => {
    if (!subjectsMap[skill.subject]) {
      subjectsMap[skill.subject] = [];
    }
    subjectsMap[skill.subject].push(skill);
  });

  const result: Record<string, string[]> = {
    'Diagnóstica': [],
    'I Unid': [],
    'II Unid': [],
    'III Unid': [],
    'Final': []
  };

  // For each subject, distribute skills evenly/pedagogically
  Object.keys(subjectsMap).forEach(subject => {
    const list = subjectsMap[subject];
    const total = list.length;
    if (total === 0) return;

    // Diagnóstica gets first 25% of skills (diagnostic baseline)
    const diagCount = Math.max(1, Math.min(3, Math.ceil(total * 0.25)));
    for (let i = 0; i < diagCount; i++) {
      result['Diagnóstica'].push(list[i].id);
    }

    // Units 1, 2, 3 distribute all skills progressively
    const chunk = Math.max(1, Math.ceil(total / 3));
    
    // I Unid
    const u1 = list.slice(0, chunk);
    u1.forEach(s => result['I Unid'].push(s.id));

    // II Unid
    const u2 = list.slice(Math.floor(chunk * 0.7), Math.min(total, chunk * 2));
    u2.forEach(s => result['II Unid'].push(s.id));

    // III Unid
    const u3 = list.slice(Math.floor(chunk * 1.5), total);
    u3.forEach(s => result['III Unid'].push(s.id));

    // Final includes key essential skills from all units for comprehensive closure
    const finalSelection = list.filter((_, idx) => idx % 2 === 0);
    finalSelection.forEach(s => result['Final'].push(s.id));
  });

  return result;
}

/**
 * Gets the planned skills for a specific unit/bimestre.
 * Looks in classData.plannedSkills first, then localStorage, then default distribution.
 */
export function getPlannedSkillsForUnit(
  classData: ClassData | undefined,
  currentGrade: string,
  unit: string,
  allSkills: Skill[]
): string[] {
  // 1. Check if classData already has plannedSkills defined for this unit
  if (classData?.plannedSkills && Array.isArray(classData.plannedSkills[unit])) {
    return classData.plannedSkills[unit];
  }

  // 2. Check localStorage for grade-level curriculum plan
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${CURRICULUM_STORAGE_KEY_PREFIX}_${currentGrade}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed[unit])) {
          return parsed[unit];
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. Generate default distribution
  const defaults = getDefaultPlannedSkills(currentGrade, allSkills);
  return defaults[unit] || [];
}

/**
 * Returns all units in which a specific skill is planned.
 */
export function getAllUnitsForSkill(
  classData: ClassData | undefined,
  currentGrade: string,
  skillId: string,
  allSkills: Skill[]
): string[] {
  const unitsPlanned: string[] = [];

  units.forEach(u => {
    const list = getPlannedSkillsForUnit(classData, currentGrade, u, allSkills);
    if (list.includes(skillId)) {
      unitsPlanned.push(u);
    }
  });

  return unitsPlanned;
}

/**
 * Updates planned skills for a unit and returns the new AppData.
 * Can optionally sync across all class sections of the same grade (e.g. 1A, 1B, 1C, 1D).
 */
export function savePlannedSkillsInAppData(
  appData: AppData,
  currentGrade: string,
  currentLetter: string,
  unit: string,
  newSkillIds: string[],
  applyToAllLetters: boolean = false
): AppData {
  const newAppData = { ...appData };
  const targetLetters = applyToAllLetters ? lettersArr : [currentLetter];

  targetLetters.forEach(letter => {
    const key = `${currentGrade}${letter}`;
    const existingClass = newAppData[key] || { students: [] };
    const existingPlanned = existingClass.plannedSkills || {};

    newAppData[key] = {
      ...existingClass,
      plannedSkills: {
        ...existingPlanned,
        [unit]: newSkillIds
      }
    };
  });

  // Also save to grade-level localStorage for backup/defaults
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `${CURRICULUM_STORAGE_KEY_PREFIX}_${currentGrade}`;
      const existingGradeStorage = JSON.parse(localStorage.getItem(storageKey) || '{}');
      existingGradeStorage[unit] = newSkillIds;
      localStorage.setItem(storageKey, JSON.stringify(existingGradeStorage));
    } catch {
      // Ignore localStorage errors
    }
  }

  return newAppData;
}
