import { GoogleGenAI, Type } from '@google/genai';
import { AiOptimizeResult } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Optimizes news article draft for SEO, headlines, and categorization using Google Gen AI SDK.
 * Returns 3 suggested SEO headlines, a 2-sentence meta description, and an array of relevant tags.
 */
export async function optimizeArticleWithGemini(articleText: string, titleHint?: string): Promise<AiOptimizeResult> {
  try {
    const ai = getGeminiClient();

    const prompt = `Review the following news article draft and produce SEO optimization metadata.

${titleHint ? `Proposed Working Title: "${titleHint}"\n` : ''}
Article Draft:
"""
${articleText}
"""

Instructions:
1. Provide EXACTLY 3 compelling, punchy SEO headlines that capture different angles (e.g., action-oriented, civic impact, concise summary).
2. Write a clear, factual 2-sentence meta description suitable for Google Search snippets.
3. Provide an array of 5 to 7 relevant topic tags (e.g. "City Hall", "Transit", "Infrastructure", "Public Safety", "Local Business").`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        systemInstruction: 'You are an award-winning managing editor and SEO strategist for a digital metropolitan news platform.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoHeadlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of exactly 3 suggested SEO headlines',
            },
            metaDescription: {
              type: Type.STRING,
              description: 'A concise 2-sentence meta description',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of relevant topic tags',
            },
          },
          required: ['seoHeadlines', 'metaDescription', 'tags'],
        },
      },
    });

    if (!response.text) {
      throw new Error('No text returned from Gemini API');
    }

    const parsed: AiOptimizeResult = JSON.parse(response.text.trim());
    return parsed;
  } catch (error) {
    console.warn('Gemini API call failed or missing key, falling back to smart heuristic optimizer:', error);
    
    // Fallback heuristic optimizer in case API key is missing during local preview
    const words = articleText.split(/\s+/).slice(0, 30).join(' ');
    const title = titleHint || 'Local News Update';
    return {
      seoHeadlines: [
        `${title}: Key Developments & Civic Impact`,
        `New Details Emerge: ${title}`,
        `Local Report: What You Need to Know About ${title}`
      ],
      metaDescription: `Read the latest report on ${title}. LocalGrid brings you independent, in-depth coverage of municipal updates and community stories.`,
      tags: ['Local News', 'City Hall', 'Community', 'Public Governance', 'LocalGrid']
    };
  }
}
