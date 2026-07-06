import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function POST(req: NextRequest) {
  try {
    const { skills, grade } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere 4 questões de múltipla escolha para cada uma das seguintes habilidades da série/ano escolar ${grade}. 
As habilidades são:
${skills.map((s: any) => `- [${s.id}] ${s.report}`).join("\n")}

Para cada habilidade, crie 4 questões de múltipla escolha (com 4 opções cada).
Retorne a resposta usando o schema JSON definido.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skillId: { type: Type.STRING, description: "O ID da habilidade (ex: EF01LP01)" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "O enunciado da questão" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "As 4 alternativas da questão (ex: 'a) ...', 'b) ...')"
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "O índice da resposta correta (0 a 3)" }
                  }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
