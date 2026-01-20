import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender } from "../types";

const getSystemInstruction = (gender: Gender) => {
  return `You are a professional makeup artist. Apply makeup to the person in the photo. 
  User is ${gender}. Maintain realism. Output ONLY the modified image.`;
};

const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);

  // KRİTİK DEĞİŞİKLİK: v1 sürümünü zorla ve model ismini temizle
  const model = genAI.getGenerativeModel(
    { model: "gemini-1.5-flash" }, // 'models/' ön eki olmadan dene
    { apiVersion: 'v1' }           // v1beta yerine v1 kullan
  );

  const parts = [
    { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } },
    { text: prompt || "Apply a natural makeup look." }
  ];

  if (method === 'transfer' && referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } });
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      systemInstruction: getSystemInstruction(gender)
    });

    const response = await result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("Model image return etmedi.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
