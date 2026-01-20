import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateMakeup = async ({ originalImage, method, prompt, referenceImage, gender }: any): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // En basit model tanımlama
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const cleanBase64 = (b64: string) => b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  // System instruction'ı doğrudan ana komutun başına ekliyoruz
  const systemBase = `INSTRUCTION: You are a professional makeup artist. Apply makeup to the person in the first photo. User gender: ${gender}. Match styles if a second photo is provided. Output ONLY the modified image data as inlineData. Do not return text.`;
  
  const userRequest = `${systemBase} \n\n USER PROMPT: ${prompt || "Apply a natural makeup look."}`;

  const parts: any[] = [
    { text: userRequest },
    { inlineData: { data: cleanBase64(originalImage), mimeType: "image/jpeg" } }
  ];

  if (method === 'transfer' && referenceImage) {
    parts.push({ inlineData: { data: cleanBase64(referenceImage), mimeType: "image/jpeg" } });
  }

  try {
    // En sade gönderme biçimi
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    
    // Eğer resim gelmezse modelin ne dediğine bakalım
    const textResponse = response.text();
    console.warn("Model did not return image, returned text instead:", textResponse);
    throw new Error("Model resim üretmedi. Lütfen farklı bir komut deneyin.");
    
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
