import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const gemini = {
  suggestMedicine: async (symptoms: string) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest common medicines for the following symptoms: ${symptoms}. Provide a JSON array of objects with 'name', 'dosage', and 'reason' fields.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  },
  detectPatterns: async (patientHistory: any[]) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this patient history and detect any patterns or risks: ${JSON.stringify(patientHistory)}. Provide a concise summary.`,
    });
    return response.text;
  }
};
