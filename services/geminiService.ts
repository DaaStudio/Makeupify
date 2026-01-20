import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender } from "../types";

const getSystemInstruction = (gender: Gender) => {
  return `You are a professional makeup artist and image editor. Your task is to modify the provided user photo by applying specific makeup techniques. 
  The user identifies as ${gender}. Maintain realism. Output ONLY the modified image data.`;
};

const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

interface GenerateMakeupParams {
  originalImage: string;
  method: 'text' | 'transfer';
  prompt?: string;
  referenceImage?: string;
  gender: Gender;
}

export const generateMakeup = async ({ 
  originalImage, 
  method, 
  prompt, 
  referenceImage, 
  gender 
}: GenerateMakeupParams): Promise<string> => {
  
  // VERCEL VE VITE İÇİN DOĞRU KEY OKUMA
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // DOĞRU MODEL: gemini-1.5-flash (Görsel düzenleme için en stabildir)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: getSystemInstruction(gender)
  });

  const parts: any[] = [
    { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } }
  ];

  let userPrompt = prompt || "Apply a natural makeup look.";
  if (method === 'transfer' && referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } });
    userPrompt = "Apply the makeup style seen in the second image onto the person in the first image.";
  }

  try {
    const result = await model.generateContent([userPrompt, ...parts]);
    const response = await result.response;
    
    // Modelden gelen görseli kontrol et
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("Model resim üretmedi, sadece metin döndürdü.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
