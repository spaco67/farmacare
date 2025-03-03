import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { AnalysisResponse } from '@/lib/openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  analysis?: AnalysisResponse;
}

export async function POST(req: Request) {
  try {
    const { messages, analysis } = await req.json();

    // Format the conversation history and context
    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.analysis 
        ? `Initial plant analysis:\nHausa: ${msg.analysis.hausa.diagnosis}\nEnglish: ${msg.analysis.english.diagnosis}\n\nRecommendations:\nHausa: ${msg.analysis.hausa.recommendations.join(", ")}\nEnglish: ${msg.analysis.english.recommendations.join(", ")}`
        : msg.content
    }));

    // Add system message with context
    formattedMessages.unshift({
      role: "system",
      content: `You are a bilingual (Hausa and English) plant disease expert. You have analyzed a plant image and provided initial diagnosis and recommendations. Always provide responses in both Hausa and English, clearly separated. Format your responses as:

HAUSA:
[Your Hausa response here]

ENGLISH:
[Your English response here]

Use the initial analysis as context for answering follow-up questions.`
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 