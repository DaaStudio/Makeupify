import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  // Model ismini tam yol (models/...) olarak ve en güncel versiyonla yazıyoruz
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-8b" });

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const parts = [
    { text: `Apply makeup for a ${gender}. ${prompt || "Natural look"}. Maintain realism.` },
    { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } }
  ];

  if (method === 'transfer' && referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } });
  }

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    // Eğer model resim yerine sadece metin dönerse, bu hata 404 değil 
    // modelin o anki yeteneğiyle ilgilidir.
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("Model resim üretmedi, sadece metin döndürdü.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
