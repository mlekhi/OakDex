import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getCardContext, searchCards, getSimilarCards } from '@/utils/vectorStore';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface CardData {
  id: string;
  name: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const { messages, selectedCards } = await req.json();

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

    const systemPrompt = `You are Professor Oak, the renowned Pokémon researcher and TCG Mobile deck strategist. You speak in your characteristic warm, enthusiastic, and slightly eccentric style from the Pokémon games and anime.

Your personality traits:
- Warm and encouraging, like a wise grandfather
- Enthusiastic about Pokémon and strategy
- Sometimes rambles but always means well
- Occasionally uses phrases like "Excellent!" or "Fascinating!" but not excessively
- Shows genuine excitement about deck building and Pokémon battles
- Occasionally references your research and Pokémon knowledge

You have access to detailed card information through the vector database tools. Use these tools to:
- Get detailed information about specific cards
- Find similar cards for recommendations
- Search for cards with specific attributes
- Provide accurate card synergies and strategies

When using the card search tools, you have access to complete card metadata including:
- cardId: The unique identifier for the card
- cardName: The name of the card
- cardType: The Pokémon type (Fire, Water, Grass, etc.)
- hp: The card's HP value
- stage: The evolution stage (Basic, Stage 1, Stage 2)
- setName: Which card set it belongs to
- description: The card's flavor text
- attacks: Detailed attack information including name, damage, cost, and description
- abilities: Card abilities with name and description
- weaknesses: Type weaknesses with damage multipliers
- evolveFrom: What card this evolves from
- retreat: Retreat cost
- content: Detailed description of the card's abilities and attacks
- score: How well the card matches the search query

You have knowledge about Pokémon TCG Pocket/Mobile (the mobile game) and can provide advice on:
- Deck building strategies
- Card synergies and combinations
- Meta analysis for the mobile game
- Tips for improving gameplay

Focus specifically on the mobile game experience, not the physical card game.

IMPORTANT: Keep your responses concise and to the point. Aim for 2-3 sentences maximum unless the user specifically asks for detailed explanations.

IMPORTANT: Pokémon TCG Pocket/Mobile has unique rules different from the physical TCG:

DECK AND CARD TYPES:
- You play with a 20-card deck instead of the regular 60-card deck
- Decks consist only of Pokémon and Trainer cards—there are no basic Energy cards in your deck

ENERGY SYSTEM:
- You gain one Energy per turn automatically from the Energy Zone (rather than playing Energy cards from your hand)
- The type of Energy provided is determined by your Pokémon's needs or is random, especially if running multiple Energy types
- By default, the Energy Zone generates one Energy per turn, chosen from the types needed for your Pokémon's attacks
- If your deck contains Pokémon needing multiple different types of Energy, the Energy Zone will generate one of those types at random each turn
- When building your deck, you can set which Energy types your deck will generate (up to three different types)
- Decks with one or two Energy types make Energy generation more reliable
- Decks with three or more Energy types struggle, as the Energy Zone provides random types each turn, making it difficult to meet specific attack requirements

SETUP AND GAMEPLAY FLOW:
- Coin toss decides who goes first
- First player does not draw a card on their first turn
- Turns consist of: Draw card, Attach Energy from Energy Zone, Evolve Pokémon, Play Basic Pokémon to Bench, Use Abilities, Play Trainer cards, Attach Pokémon Tool, Retreat, Attack

BATTLE MECHANICS:
- There is 1 Active Pokémon at a time, and up to 3 Pokémon on the Bench (as opposed to 5 in the regular TCG)
- Attacking ends your turn. You must have the required Energy to attack

HOW TO WIN:
- Knock Out opposing Pokémon to earn points: 1 point for regular Pokémon, 2 points for ex Pokémon
- First player to earn 3 points wins the match
- If a player deck outs (runs out of cards to draw at turn start), they lose
- There is a time limit (usually 5 minutes per match). If time runs out, the player with the most points wins; a tie means a draw

When giving advice, always consider these mobile-specific rules and mechanics. Keep responses brief and actionable, but maintain your characteristic Professor Oak personality and speaking style.${deckContext}`;
    
    // Consider using a different model
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      maxSteps: 4,
      tools: {
        search_cards: tool({
          description: "Search for cards in the vector database. Use this to find cards with specific attributes, types, attacks, or other characteristics. This provides detailed card information for recommendations.",
          parameters: z.object({
            query: z.string().describe("The search query (e.g., 'Fire type cards', 'cards with high HP', 'cards that deal 100 damage', 'evolution cards')"),
            limit: z.number().optional().describe("Maximum number of results to return (default: 5)")
          }),
          execute: async ({ query, limit = 5 }) => {
            try {
              const results = await searchCards(query, limit);
              return {
                success: true,
                query,
                results: results.map(result => ({
                  cardId: result.metadata?.cardId || 'Unknown',
                  cardName: result.metadata?.cardName || 'Unknown',
                  cardType: result.metadata?.cardType || null,
                  hp: result.metadata?.hp || null,
                  stage: result.metadata?.stage || null,
                  setName: result.metadata?.setName || null,
                  description: result.metadata?.description || null,
                  attacks: typeof result.metadata?.attacks === 'string' && result.metadata.attacks !== '' ? JSON.parse(result.metadata.attacks) : null,
                  abilities: typeof result.metadata?.abilities === 'string' && result.metadata.abilities !== '' ? JSON.parse(result.metadata.abilities) : null,
                  weaknesses: typeof result.metadata?.weaknesses === 'string' && result.metadata.weaknesses !== '' ? JSON.parse(result.metadata.weaknesses) : null,
                  evolveFrom: result.metadata?.evolveFrom || null,
                  retreat: result.metadata?.retreat || null,
                  content: result.content,
                  score: result.score
                }))
              };
            } catch (error) {
              return {
                success: false,
                error: `Failed to search cards in vector database: ${error instanceof Error ? error.message : 'Unknown error'}`
              };
            }
          }
        }),
        get_similar_cards: tool({
          description: "Find cards similar to a specific card. Use this to recommend alternatives or complementary cards for deck building.",
          parameters: z.object({
            cardName: z.string().describe("The name of the card to find similar cards for"),
            limit: z.number().optional().describe("Maximum number of similar cards to return (default: 5)")
          }),
          execute: async ({ cardName, limit = 5 }) => {
            try {
              const results = await getSimilarCards(cardName, limit);
              return {
                success: true,
                cardName,
                similarCards: results.map(result => ({
                  cardId: result.metadata?.cardId || 'Unknown',
                  cardName: result.metadata?.cardName || 'Unknown',
                  cardType: result.metadata?.cardType || null,
                  hp: result.metadata?.hp || null,
                  stage: result.metadata?.stage || null,
                  setName: result.metadata?.setName || null,
                  description: result.metadata?.description || null,
                  attacks: typeof result.metadata?.attacks === 'string' && result.metadata.attacks !== '' ? JSON.parse(result.metadata.attacks) : null,
                  abilities: typeof result.metadata?.abilities === 'string' && result.metadata.abilities !== '' ? JSON.parse(result.metadata.abilities) : null,
                  weaknesses: typeof result.metadata?.weaknesses === 'string' && result.metadata.weaknesses !== '' ? JSON.parse(result.metadata.weaknesses) : null,
                  evolveFrom: result.metadata?.evolveFrom || null,
                  retreat: result.metadata?.retreat || null,
                  content: result.content,
                  score: result.score
                }))
              };
            } catch (error) {
              return {
                success: false,
                error: `Failed to find similar cards: ${error instanceof Error ? error.message : 'Unknown error'}`
              };
            }
          }
        })
      }
    });

    return result.toDataStreamResponse({
      getErrorMessage: error => {
        if (error && typeof error === 'object' && 'name' in error) {
          if (error.name === 'NoSuchToolError') {
            return 'The model tried to call an unknown tool.';
          } else if (error.name === 'InvalidToolArgumentsError') {
            return 'The model called a tool with invalid arguments.';
          } else if (error.name === 'ToolExecutionError') {
            return 'An error occurred during tool execution.';
          }
        }
        return 'An unknown error occurred.';
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
