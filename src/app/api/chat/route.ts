import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getCardContext } from '@/utils/vectorStore';
import { NextResponse } from "next/server";
import { ChatRequestSchema, CardData } from '@/utils/validation';
import { createChatTools } from '@/utils/chatTools';
import { createSystemPrompt } from '@/utils/prompts';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // validate request structure
    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    const { messages, selectedCards } = validationResult.data;

    // Track recommended cards to prevent duplicates across tool calls
    const recommendedCardIds = new Set<string>();

    // Create deck context using selected cards and vector database
    let deckContext = "";
    if (selectedCards && selectedCards.length > 0) {
      const cardList = selectedCards.map((card: CardData) => 
        `${card.name} (ID: ${card.id}, Quantity: ${card.quantity})`
      ).join('\n');
      
      const totalCards = selectedCards.reduce((sum: number, card: CardData) => sum + card.quantity, 0);
      
      // Get card information from vector database
      const cardNames = selectedCards.map((card: CardData) => card.name);
      let cardDetails = "";
      
      try {
        cardDetails = await getCardContext(cardNames);
      } catch (error) {
        console.warn('Failed to get card context from vector database:', error);
        cardDetails = "Vector database not available - using basic card information.";
      }
      
      deckContext = `\n\nCURRENT DECK INFORMATION:\nThe user's current deck contains ${totalCards}/20 cards:\n\n${cardList}\n\nDETAILED CARD INFORMATION:\n${cardDetails}\n\nUse this detailed card information to provide specific advice about synergies, strategies, and recommendations.`;
    }

    const systemPrompt = createSystemPrompt(deckContext);
    const tools = createChatTools(recommendedCardIds);
    
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      maxSteps: 6,
      tools
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific AI-related errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'AI service is busy. Please try again in a moment.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('token') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'Request too long. Please shorten your message.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'AI service is temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
