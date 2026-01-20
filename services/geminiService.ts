import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // ÖNEMLİ: Başına 'models/' ekleyerek ve v1beta kullanarak yolu kesinleştiriyoruz
  const model = genAI.getGenerativeModel(
    { model: "models/gemini-1.5-flash" }, 
    { apiVersion: 'v1beta' }
  );

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const systemText = `You are a professional makeup artist. Apply makeup to the person in the first image. User gender: ${gender}. ${prompt || "Natural makeup"}. Return ONLY the edited image as data.`;

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
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("Model resim üretmedi. Lütfen tekrar deneyin.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
