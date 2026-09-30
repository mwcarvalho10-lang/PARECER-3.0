export interface Skill {
  id: string;
  grade: string;
  subject: string;
  report: string;
  color: string;
  category?: string;
}

export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface TestData {
  id: string;
  name: string;
  unit: string;
  grade: string;
  questions: {
    number: number;
    skillId: string;
    generatedData?: GeneratedQuestion;
  }[];
}

export interface UnitData {
  skills: string[];
  observation: string;
}

export interface StudentData {
  gender?: 'M' | 'F';
  active?: boolean;
  isAee?: boolean; // Estudante da Educação Especial (AEE / PEI)
  aeeType?: string; // e.g. TEA, TDAH, Deficiência Intelectual, Baixa Visão, Altas Habilidades, etc.
  aeeNotes?: string; // Orientações de mediação pedagógica e adaptação curricular
  aeeSkills?: string[]; // Habilidades específicas adaptadas
  [unit: string]: any; // UnitData
}

export interface ClassData {
  students: string[];
  plannedSkills?: Record<string, string[]>; // { [unit: string]: string[] } - Habilidades planejadas por bimestre/unidade
  [studentName: string]: any; // StudentData | string[]
}

export interface Teacher {
  id: string;
  name: string;
  classes: string[];
}

export interface AppData {
  [classKey: string]: ClassData;
}

export interface SchoolYearArchive {
  year: string; // e.g. "2025", "2026"
  closedAt: string; // ISO date timestamp
  closedBy?: string;
  notes?: string;
  data: AppData;
  totalStudents: number;
  totalClasses: number;
  totalEvaluations: number;
}

export type TransitionMode = 'promotion' | 'keep_students' | 'clean_slate';

export interface YearTransitionOptions {
  newYear: string;
  mode: TransitionMode;
  notes?: string;
}
