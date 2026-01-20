import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);

  // v1 Sürümünde systemInstruction bu şekilde model tanımı içinde olmalı
  const model = genAI.getGenerativeModel(
    { 
      model: "gemini-1.5-flash",
      systemInstruction: `You are a professional makeup artist. Apply makeup to the person in the first photo. User gender: ${gender}. Match styles if a second photo is provided. Output ONLY the modified image.`
    },
    { apiVersion: 'v1' }
  );

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  // İstek içeriği
  const contents = [
    {
      role: "user",
      parts: [
        { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } },
        ...(method === 'transfer' && referenceImage ? [{ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } }] : []),
        { text: prompt || "Apply a natural makeup look." }
      ]
    }
  ];

  try {
    const result = await model.generateContent({ contents });
    const response = await result.response;
    
    // Modelden gelen görseli al
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("Model resim döndürmedi.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
