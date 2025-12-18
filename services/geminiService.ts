import { GoogleGenAI } from "@google/genai";

export const generateSchoolInsight = async (prompt: string, contextData: string): Promise<string> => {
  try {
    // Initialize inside the function to prevent white-screen crashes on module load
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an intelligent assistant for a School Management System called EduNexus.
        Your goal is to provide helpful, professional, and concise insights to school staff or parents.
        
        Context Data: ${contextData}
        
        User Query: ${prompt}
      `,
    });
    return response.text || "I couldn't generate an insight at this moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Service is currently unavailable. Please check your configuration.";
  }
};

export const generateLessonPlan = async (topic: string, grade: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a brief, engaging lesson plan for Grade ${grade} students on the topic: "${topic}". Include 3 key learning objectives and one activity.`,
    });
    return response.text || "Could not generate lesson plan.";
  } catch (error) {
    return "AI Service unavailable.";
  }
};