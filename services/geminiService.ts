import { GoogleGenAI } from "@google/genai";
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
  if (!apiKey) throw new Error("API Key not found. Please check your settings.");

  const ai = new GoogleGenAI({ apiKey });

  // Switched to 1.5-flash for better stability and higher quota limits
  const model = 'gemini-1.5-flash'; 
  
  let userPrompt = "";
  const parts: any[] = [];

  parts.push({
    inlineData: {
      data: cleanBase64(originalImage),
      mimeType: "image/jpeg" 
    }
  });

  if (method === 'transfer' && referenceImage) {
    parts.push({
      inlineData: {
        data: cleanBase64(referenceImage),
        mimeType: "image/jpeg"
      }
    });
    userPrompt = "Apply the makeup style seen in the second image onto the person in the first image. Match the lipstick color, eye makeup style, and blush intensity.";
  } else {
    userPrompt = prompt || "Apply a natural makeup look.";
  }

  parts.push({ text: userPrompt });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: getSystemInstruction(gender),
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const content = candidates[0].content;
      if (content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/jpeg;base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    throw new Error("The model could not generate an image.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // USER-FRIENDLY ENGLISH ERROR MESSAGES
    let userFriendlyMessage = "Something went wrong. Please try again.";

    const errorMessage = error.message?.toLowerCase() || "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted")) {
      userFriendlyMessage = "Our servers are currently busy. Please wait about a minute and try again.";
    } else if (errorMessage.includes("api key not found")) {
      userFriendlyMessage = "System configuration error (Missing API Key).";
    } else if (errorMessage.includes("online") || errorMessage.includes("network")) {
      userFriendlyMessage = "Please check your internet connection and try again.";
    }

    throw new Error(userFriendlyMessage);
  }
};
