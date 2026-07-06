import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, testQuestions } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        },
        {
          text: `A imagem anexada é uma foto do gabarito ou da prova preenchida por um aluno.
A prova tem ${testQuestions.length} questões.
Abaixo estão as informações das questões e qual é o índice da resposta correta (0 = A, 1 = B, 2 = C, 3 = D).

${JSON.stringify(testQuestions, null, 2)}

Analise a imagem, identifique a resposta marcada pelo aluno para cada questão (1, 2, 3...) e diga se ele acertou ou não.
Retorne a lista de resultados.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionNumber: { type: Type.INTEGER },
              isCorrect: { type: Type.BOOLEAN }
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
