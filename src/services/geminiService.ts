import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function refineMessage(originalMessage: string, tone: string = "professional") {
  if (!apiKey) return originalMessage;

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine the following message for WhatsApp. 
      Tone: ${tone}
      Original Message: "${originalMessage}"
      
      Requirements:
      - Keep it concise (WhatsApp style).
      - Use appropriate emojis if the tone allows.
      - Maintain placeholders like {name} if they exist.
      - Return ONLY the refined message text.`,
    });

    return response.text?.trim() || originalMessage;
  } catch (error) {
    console.error("Gemini Error:", error);
    return originalMessage;
  }
}
