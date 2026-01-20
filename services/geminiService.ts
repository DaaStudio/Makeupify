import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // GÖRSEL ÜRETEBİLEN TEK MODEL BU. 
  // 1.5 Flash sadece metin üretir, o yüzden 404 veriyordu.
  const model = genAI.getGenerativeModel(
    { model: "models/gemini-2.0-flash-exp" }, 
    { apiVersion: 'v1beta' }
  );

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const systemText = `You are a professional makeup artist. Apply makeup to the person in the first image. User gender: ${gender}. ${prompt || "Natural makeup"}. Return ONLY the edited image.`;

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
    
    throw new Error("Model resim oluşturamadı.");
  } catch (error: any) {
    // 429 HATASI YÖNETİMİ (KOTA DOLARSA)
    if (error.message?.includes("429") || error.status === 429) {
      console.error("Kota Doldu:", error);
      throw new Error("Çok fazla istek yapıldı. Lütfen 30 saniye bekleyip tekrar deneyin (Ücretsiz Sürüm Limiti).");
    }
    console.error("Gemini API Error:", error);
    throw error;
  }
};
