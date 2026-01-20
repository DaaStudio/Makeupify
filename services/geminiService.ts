import { GoogleGenerativeAI } from "@google/generative-ai";

const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

export const generateMakeup = async ({
  originalImage,
  method,
  prompt,
  referenceImage
}: any): Promise<string> => {
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // En sade model tanımlama (v1 kararlı sürümünde)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
  
  const parts: any[] = [];
  parts.push({
    inlineData: {
      data: cleanBase64(originalImage),
      mimeType: "image/jpeg" 
    }
  });

  let userPrompt = prompt || "Apply a natural makeup look.";
  if (method === 'transfer' && referenceImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(referenceImage),
        mimeType: "image/jpeg"
      }
    });
    userPrompt = "Apply the makeup style from the second image to the first image.";
  }
  
  parts.push({ text: userPrompt });

  try {
    // Sadece temel içeriği gönderiyoruz
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: parts }]
    });

    const response = await result.response;
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (part?.inlineData?.data) {
      return `data:image/jpeg;base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image data found in response.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
