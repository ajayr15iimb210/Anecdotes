import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Anecdote } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const anecdoteSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy, intriguing title for the anecdote.",
    },
    story: {
      type: Type.STRING,
      description: "The main anecdote or real-life story. It should be engaging, approximately 150-200 words, and written in a storytelling tone.",
    },
    takeaway: {
      type: Type.STRING,
      description: "A brief academic lesson or moral derived from the story. What is the educational value?",
    },
    funFact: {
      type: Type.STRING,
      description: "A quick, surprising one-sentence fact related to the topic.",
    },
    emoji: {
      type: Type.STRING,
      description: "A single emoji that best represents the story.",
    },
    topic: {
      type: Type.STRING,
      description: "The standardized academic topic name (e.g., 'Physics', 'World History').",
    },
    ncertTopic: {
      type: Type.STRING,
      description: "The specific Chapter/Topic from the Indian NCERT Syllabus closest to this story (e.g. 'Class 10 Science: Light - Reflection and Refraction').",
    },
    relatedTopics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List exactly 3 related academic topics, historical figures, or concepts that would be interesting to learn about next. They should be short strings suitable for button labels.",
    },
    toughWords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The difficult word found in the story." },
          definition: { type: Type.STRING, description: "A very short definition (3-5 words) of the word in context." }
        },
        required: ["word", "definition"]
      },
      description: "Identify 3-5 difficult or academic words used in the story and provide their simplified meanings.",
    }
  },
  required: ["title", "story", "takeaway", "funFact", "emoji", "topic", "ncertTopic", "relatedTopics", "toughWords"],
};

export const generateAnecdote = async (topic: string, language: string = "English"): Promise<Anecdote> => {
  let anecdote: Anecdote;

  try {
    // 1. Generate Text content
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate an educational and entertaining anecdote about this academic topic: "${topic}". 
      Target Language: ${language}.
      
      Focus on a real-life event, a historical figure's quirk, or an accidental discovery that explains the concept.
      Make it fun for students.
      
      IMPORTANT: ensure all content fields (title, story, takeaway, funFact, relatedTopics, toughWords, ncertTopic) are written in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: anecdoteSchema,
        systemInstruction: `You are a master storyteller and educator. Your goal is to make dry academic subjects fascinating by revealing the human stories behind them. Always write the content in the requested language: ${language}.`,
        temperature: 0.7, 
      },
    });

    const text = textResponse.text;
    if (!text) {
      throw new Error("No response generated.");
    }

    anecdote = JSON.parse(text) as Anecdote;
  } catch (error) {
    console.error("Gemini Text API Error:", error);
    throw new Error("Failed to unearth a story. Please try again.");
  }

  // 2. Generate Image (Fail-safe: if image fails, return text)
  try {
    const imagePrompt = `A high quality, educational illustration for a story titled "${anecdote.title}". Topic: ${anecdote.topic}. Style: Educational textbook illustration, detailed, vibrant, suitable for students.`;
    
    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: imagePrompt }]
      }
    });

    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        anecdote.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (imageError) {
    console.warn("Gemini Image API Error:", imageError);
    // We swallow the image error to at least return the text content
  }

  return anecdote;
};