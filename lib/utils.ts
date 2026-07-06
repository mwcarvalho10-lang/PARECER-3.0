import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateReportText(studentName: string, gender: 'M' | 'F' | '' | undefined, unit: string, skillTexts: string[]): string {
  if (!skillTexts || skillTexts.length === 0) return "";
  
  const introMap = {
    'M': `O ESTUDANTE ${studentName}, NA ETAPA ${unit}, DEMONSTROU QUE`,
    'F': `A ESTUDANTE ${studentName}, NA ETAPA ${unit}, DEMONSTROU QUE`,
    '': `O(A) ESTUDANTE ${studentName}, NA ETAPA ${unit}, DEMONSTROU QUE`
  };
  const intro = introMap[gender || ''] || introMap[''];

  if (skillTexts.length === 1) {
    return `${intro} ${skillTexts[0]}.`.toUpperCase();
  }

  const connectives = [
    "ALÉM DISSO, NOTOU-SE QUE ",
    "TAMBÉM FOI POSSÍVEL OBSERVAR QUE ",
    "VALE DESTACAR AINDA QUE ",
    "EVIDENCIOU TAMBÉM QUE "
  ];

  let result = `${intro} ${skillTexts[0]}`;
  
  for (let i = 1; i < skillTexts.length; i++) {
    const isLast = i === skillTexts.length - 1;
    if (isLast) {
      if (skillTexts.length > 2) {
        result += `. POR FIM, ${skillTexts[i]}`;
      } else {
        result += ` E ${skillTexts[i]}`;
      }
    } else {
      const connective = connectives[(i - 1) % connectives.length];
      result += `. ${connective}${skillTexts[i]}`;
    }
  }

  return `${result}.`.toUpperCase();
}
