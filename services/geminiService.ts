import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender } from "../types"; 

const getSystemInstruction = (gender: Gender) => {
  return `You are a professional makeup artist and image editor. Your task is to modify the provided user photo by applying specific makeup techniques. 
  The user identifies as ${gender}. Adjust the makeup application to be appropriate and flattering for this gender.
  Ensure the skin texture remains realistic. Do not cartoonize the image. Maintain the original identity of the person.
  Output ONLY the modified image.`;
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
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found.");

  // Yeni kütüphane yapılandırması
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
  });
  
  const parts: any[] = [];

  // Orijinal Görüntü
  parts.push({
    inlineData: {
      data: cleanBase64(originalImage),
      mimeType: "image/jpeg" 
    }
  });

  // Metot Mantığı
  let userPrompt = prompt || "Apply a natural makeup look.";
  if (method === 'transfer' && referenceImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(referenceImage),
        mimeType: "image/jpeg"
      }
    });
    userPrompt = "Apply the makeup style seen in the second image onto the person in the first image.";
  }

  try {
    // Yeni kütüphanede generateContent kullanımı
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [...parts, { text: userPrompt }] }],
      systemInstruction: getSystemInstruction(gender)
    });

    const response = await result.response;
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (part?.inlineData?.data) {
      return `data:image/jpeg;base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image generated.");

  } catch (error: any) {
    console.error("Gemini Error:", error);
    let msg = "Something went wrong. Please try again.";
    if (error.message?.includes("429")) msg = "Our servers are busy. Please wait a minute.";
    throw new Error(msg);
  }
};
