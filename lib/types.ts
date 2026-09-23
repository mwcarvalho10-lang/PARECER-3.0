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
