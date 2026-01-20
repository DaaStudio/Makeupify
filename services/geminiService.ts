import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Model ismini tam yol olarak veriyoruz ve v1beta'yı zorunlu kılıyoruz
  const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" }, 
      { apiVersion: 'v1' }
  );

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  // Tüm talimatları tek bir metin parçasına topluyoruz
  const systemText = `You are a professional makeup artist. Apply makeup to the person in the first image. User is ${gender}. ${prompt || "Natural makeup"}. Match the second image style if provided. Return ONLY the edited image.`;

  const parts = [
    { text: systemText },
    { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } }
  ];

  if (method === 'transfer' && referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } });
  }

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    // Yanıtın içinde resim verisi var mı kontrol et
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("Model resim üretmedi, muhtemelen metin cevabı verdi.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
