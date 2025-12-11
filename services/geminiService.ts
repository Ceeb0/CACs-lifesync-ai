import { GoogleGenAI, Type } from "@google/genai";
import { ReminderCategory, Priority, ParsedReminderData } from "../types";

// Initialize Gemini Client
// Note: In a real production app, these calls would likely go through a backend proxy.
// For this demo, we use the process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to parse natural language into structured reminder data.
 */
export const parseNaturalLanguageReminder = async (input: string): Promise<ParsedReminderData> => {
  if (!input.trim()) {
    throw new Error("Input is empty");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract structured reminder data from this user input: "${input}". 
      Infer the category (Food, Gym, Work, Health, Other) and Priority (Low, Medium, High) based on context.
      If a time/date is mentioned (e.g. "tomorrow at 5pm"), convert it to an approximate ISO string based on the current time: ${new Date().toISOString()}.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A concise title for the reminder" },
            category: { 
              type: Type.STRING, 
              enum: [
                ReminderCategory.FOOD,
                ReminderCategory.GYM,
                ReminderCategory.WORK,
                ReminderCategory.HEALTH,
                ReminderCategory.OTHER
              ]
            },
            priority: {
              type: Type.STRING,
              enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH]
            },
            description: { type: Type.STRING, description: "Any extra details mentioned" },
            suggestedTime: { type: Type.STRING, description: "ISO 8601 date string if a time is mentioned, otherwise null" }
          },
          required: ["title", "category", "priority"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ParsedReminderData;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    // Fallback if AI fails
    return {
      title: input,
      category: ReminderCategory.OTHER,
      priority: Priority.MEDIUM,
    };
  }
};

/**
 * Suggests a quick tip or motivation based on the category.
 */
export const getCategoryTip = async (category: ReminderCategory): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give me a very short (1 sentence), witty, and motivating tip for a task related to: ${category}.`,
        });
        return response.text || "Stay consistent!";
    } catch (e) {
        return "You got this!";
    }
}

/**
 * Transcribes audio to text using Gemini Multimodal capabilities.
 */
export const transcribeAudio = async (audioBase64: string, mimeType: string = "audio/webm"): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: audioBase64
                        }
                    },
                    { text: "Transcribe the spoken audio into clear, natural text." }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Transcription error:", error);
        return "";
    }
}