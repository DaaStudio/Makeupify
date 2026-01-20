import { GoogleGenerativeAI } from "@google/generative-ai";

const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

export const generateMakeup = async ({
  originalImage,
  method,
  prompt,
  referenceImage,
  gender
}: any): Promise<string> => {
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // ÖNEMLİ: Model isminin başına 'models/' ekledik ve v1beta'ya geri döndük
  const model = genAI.getGenerativeModel(
    { model: "models/gemini-1.5-flash" }, 
    { apiVersion: 'v1beta' }
  );
  
  const parts: any[] = [];
  
  // 1. Orijinal Resim
  parts.push({
    inlineData: {
      data: cleanBase64(originalImage),
      mimeType: "image/jpeg"
    }
  });

  // 2. İstek Metni
  let userPrompt = prompt || "Apply a natural makeup look.";
  if (method === 'transfer' && referenceImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(referenceImage),
        mimeType: "image/jpeg"
      }
    });
    userPrompt = `Apply the makeup style from the second image to the person in the first image. The user is ${gender}. Keep it realistic.`;
  } else {
    userPrompt = `${userPrompt}. The user is ${gender}. Maintain realistic skin texture.`;
  }

  try {
    const result = await model.generateContent([userPrompt, ...parts]);
    const response = await result.response;
    
    // Yanıtın içinde resim var mı kontrol et
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("Model resim üretmedi, sadece metin döndürdü.");
  } catch (error: any) {
    console.error("Detaylı Gemini Hatası:", error);
    throw error;
  }
};
