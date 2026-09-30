import { Skill, ClassData } from '@/lib/types';

export type DiagnosisSubTab = 
  | 'overview'       // 1. Raio-X Executivo
  | 'heatmap'        // 2. Mapa de Calor & BNCC
  | 'students'       // 3. Quadro & Triagem de Alunos
  | 'intervention'   // 4. Plano de Intervenção (PIP)
  | 'council'        // 5. Dossiê do Conselho & Barema
  | 'timeline';      // 6. Evolução Longitudinal

export interface SkillMasteryAnalysis extends Skill {
  masteredCount: number;
  totalStudents: number;
  rate: number;
  status: 'consolidada' | 'desenvolvimento' | 'reforco';
  masteredStudents: string[];
  pendingStudents: string[];
}

export interface StudentSummaryItem {
  name: string;
  masteredCount: number;
  totalSkills: number;
  pendingCount: number;
  rate: number;
  level: 'high' | 'medium' | 'low';
  isAee: boolean;
  aeeType: string;
  hasObservation: boolean;
}

export interface ProductivePair {
  id: string;
  mentor: string;
  peer: string;
  subjectFocus: string;
  skillsInCommonTarget: string[];
}
