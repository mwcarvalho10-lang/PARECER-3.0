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
