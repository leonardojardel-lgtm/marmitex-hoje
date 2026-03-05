import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const getAiInstance = () => {
  // @ts-ignore
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

export const checkAndSelectApiKey = async () => {
  // @ts-ignore
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
};

export const generateImage = async (prompt: string, aspectRatio: string) => {
  try {
    await checkAndSelectApiKey();
    const ai = getAiInstance();
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Erro ao gerar imagem (usando fallback):", error);
    // Fallback para imagem de placeholder se falhar (ex: sem chave API)
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/600`;
  }
  throw new Error("Imagem não gerada");
};

export const analyzeDishImage = async (base64Image: string, mimeType: string) => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType
          }
        },
        "Analise esta imagem de um prato de comida. Retorne um JSON com: 'nomePrato' (string), 'descricao' (string, ingredientes principais), 'alergenos' (string, ex: Glúten, Lactose. Vazio se não houver), 'tipo' ('REGULAR' ou 'VEGETARIANO')."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomePrato: { type: Type.STRING },
            descricao: { type: Type.STRING },
            alergenos: { type: Type.STRING },
            tipo: { type: Type.STRING }
          },
          required: ["nomePrato", "descricao", "alergenos", "tipo"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao analisar imagem (usando fallback):", error);
    return {
      nomePrato: "Prato Identificado (Demo)",
      descricao: "Descrição indisponível sem chave API. Prato identificado visualmente.",
      alergenos: "Possível Glúten",
      tipo: "REGULAR"
    };
  }
};

export const suggestMenu = async (preferences: string) => {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Sugira um cardápio para 1 dia para uma escola. Preferências: ${preferences}. Retorne um JSON com um array 'opcoes' (contendo 1 REGULAR e 1 VEGETARIANO). Cada opção deve ter 'tipo' ('REGULAR' ou 'VEGETARIANO'), 'nomePrato', 'descricao', 'alergenos'.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opcoes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tipo: { type: Type.STRING },
                  nomePrato: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  alergenos: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao sugerir cardápio (usando fallback):", error);
    return {
      opcoes: [
        {
          tipo: "REGULAR",
          nomePrato: "Frango Assado com Batatas (Demo)",
          descricao: "Frango assado dourado com batatas rústicas e alecrim.",
          alergenos: ""
        },
        {
          tipo: "VEGETARIANO",
          nomePrato: "Lasanha de Berinjela (Demo)",
          descricao: "Lasanha feita com fatias de berinjela, molho de tomate caseiro e queijo.",
          alergenos: "Lactose"
        }
      ]
    };
  }
};

export const searchRecipeInfo = async (dishName: string) => {
  const ai = getAiInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Busque informações sobre o prato "${dishName}". Retorne uma breve descrição e possíveis alérgenos comuns.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return response.text;
};

export const summarizeFeedbacks = async (feedbacks: any[]) => {
  const ai = getAiInstance();
  const text = feedbacks.map(f => `Prato: ${f.opcaoNome}, Nota: ${f.nota}, Comentário: ${f.comentario || 'Sem comentário'}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise os seguintes feedbacks de refeições escolares e forneça um resumo executivo destacando os pontos positivos, negativos e sugestões de melhoria:\n\n${text}`,
  });
  
  return response.text;
};
