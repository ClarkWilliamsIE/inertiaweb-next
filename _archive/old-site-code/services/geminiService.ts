import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let aiClient: GoogleGenAI | null = null;

export async function chatWithAssistant(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    // Lazy initialization: Only connect when the user actually types a message
    if (!aiClient) {
      // NOTE: In Next.js, client-side variables MUST start with NEXT_PUBLIC_
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY is missing in Vercel settings.");
        return "I'm currently offline (Configuration Error). Please tell the developer to check the API Key.";
      }
      
      aiClient = new GoogleGenAI({ apiKey });
    }

    const chat = aiClient.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const result = await chat.sendMessage({ message });
    return result.text;

  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having a bit of trouble connecting right now. Please try again later.";
  }
}
