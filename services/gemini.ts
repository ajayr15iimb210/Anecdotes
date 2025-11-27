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
      description: "A compelling narrative anecdote focused on a specific PERSON and a specific MOMENT in time. Do NOT write a general summary or encyclopedia entry. It must have a protagonist, action, and a conclusion. Example: Instead of describing the Cellular Jail generally, tell the specific story of how Veer Savarkar used thorns to write poetry on the walls while in solitary confinement.",
    },
    takeaway: {
      type: Type.STRING,
      description: "A brief academic lesson or moral derived from the story. What is the educational value?",
    },
    funFact: {
      type: Type.STRING,
      description: "A quick, surprising, and strictly fact-checked one-sentence fact related to the topic. Do not include myths, rumors, or unverified internet trivia.",
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
      
      STRICT REQUIREMENT: This must be a STORY, not a description.
      - It MUST have a specific main character (historical figure, scientist, or witness).
      - It MUST describe a specific scene or event (a moment of discovery, a specific conflict, a conversation).
      - Do NOT simply list facts or describe a place/concept generally.
      
      Example of bad output: "The Taj Mahal was built in 1632 by Shah Jahan to house the tomb of his favorite wife..." (This is a summary).
      Example of good output: "In 1631, Emperor Shah Jahan locked himself in his chambers for eight days, refusing food or water, after hearing the news that his beloved Mumtaz had died in childbirth..." (This is a story).
      
      CRITICAL: 
      1. Prioritize factual accuracy. Do not propagate common myths as absolute fact.
      2. If a popular story is a myth (e.g. Newton's apple hitting his head), clarify that it is a legend or "popularly believed".
      3. Verify the "Fun Fact" is scientifically or historically accurate.
      
      IMPORTANT: ensure all content fields (title, story, takeaway, funFact, relatedTopics, toughWords, ncertTopic) are written in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: anecdoteSchema,
        systemInstruction: `You are a master storyteller. Your goal is to bring history and science to life through specific, human-centric stories. 
        NEVER write generic summaries. 
        ALWAYS focus on a specific individual facing a specific challenge or moment of realization. 
        You are strictly factual but narrative-driven. 
        Always write the content in the requested language: ${language}.`,
        temperature: 0.3, 
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