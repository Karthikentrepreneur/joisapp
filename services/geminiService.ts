import { GoogleGenAI } from "@google/genai";

const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSchoolInsight = async (prompt: string, contextData: string): Promise<string> => {
  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
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
    return "AI Service is currently unavailable. Please check your API key.";
  }
};

export const generateLessonPlan = async (topic: string, grade: string): Promise<string> => {
  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a brief, engaging lesson plan for Grade ${grade} students on the topic: "${topic}". Include 3 key learning objectives and one activity.`,
    });
    return response.text || "Could not generate lesson plan.";
  } catch (error) {
    return "AI Service unavailable.";
  }
};