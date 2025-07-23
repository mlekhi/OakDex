import { tool } from "ai";
import { z } from "zod";
import { searchCards, getSimilarCards } from '@/utils/vectorStore';
import { CardRecommendation } from '@/types/cardRecommendations';
import { sanitizeSearchQuery, validateSearchQuery } from './validation';

// parse JSON metadata
const safeJsonParse = (value: unknown) => {
  if (typeof value !== 'string' || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// util to map vector search results to consistent card format
interface CardSearchResult {
  cardId: string;
  cardName: string;
  cardType: string | null;
  hp: number | null;
  stage: string | null;
  setName: string | null;
  description: string | null;
  attacks: unknown[] | null;
  abilities: unknown[] | null;
  weaknesses: unknown[] | null;
  evolveFrom: string | null;
  retreat: number | null;
  content: string;
  score: number | undefined;
}

const mapCardResult = (result: { metadata?: Record<string, unknown>; content: string; score?: number }): CardSearchResult => ({
  cardId: (result.metadata?.cardId as string) || 'Unknown',
  cardName: (result.metadata?.cardName as string) || 'Unknown',
  cardType: (result.metadata?.cardType as string) || null,
  hp: (result.metadata?.hp as number) || null,
  stage: (result.metadata?.stage as string) || null,
  setName: (result.metadata?.setName as string) || null,
  description: (result.metadata?.description as string) || null,
  attacks: safeJsonParse(result.metadata?.attacks),
  abilities: safeJsonParse(result.metadata?.abilities),
  weaknesses: safeJsonParse(result.metadata?.weaknesses),
  evolveFrom: (result.metadata?.evolveFrom as string) || null,
  retreat: (result.metadata?.retreat as number) || null,
  content: result.content,
  score: result.score
});

export const createChatTools = (recommendedCardIds: Set<string>) => ({
  recommend_cards: tool({
    description: "Provide structured card recommendations for deck building. Use this when the user asks for card suggestions, deck improvements, or specific card recommendations. These are SUGGESTIONS that the user can choose to add to their deck - cards are NOT automatically added. Always check the current deck context first to avoid recommending cards already in the deck.",
    parameters: z.object({
      reason: z.string().describe("Why you're recommending these cards (e.g., 'synergy with Charizard', 'energy acceleration', 'draw power')"),
      recommendations: z.array(z.object({
        cardId: z.string().describe("The unique card ID from the database"),
        cardName: z.string().describe("The name of the card"),
        reason: z.string().describe("Why this specific card is recommended"),
        priority: z.enum(['high', 'medium', 'low']).describe("How important this recommendation is"),
        quantity: z.number().describe("How many copies of this card to add to the deck (1-2)")
      })).describe("Array of card recommendations with IDs"),
      strategy: z.string().optional().describe("Brief strategy advice about how to use these cards")
    }),
    execute: async ({ reason, recommendations, strategy }) => {
      try {
        // check that the recommended cards exist in our database
        const validatedRecommendations: CardRecommendation[] = [];
        
        for (const rec of recommendations) {
          try {
            // Try multiple search strategies to find the exact card
            const searchStrategies = [
              rec.cardName, // Exact name
              rec.cardName.toLowerCase(), // Lowercase
              rec.cardName.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special characters
              rec.cardName.split(' ')[0], // First word only
              rec.cardName.split(' ').slice(-1)[0], // Last word only
            ];
            
            let foundCard = null;
            let bestScore = 0;
            
            for (const searchTerm of searchStrategies) {
              const searchResults = await searchCards(searchTerm, 3); // Get top 3 results
              
              for (const result of searchResults) {
                const resultCardName = result.metadata?.cardName as string;
                if (resultCardName && result.score && result.score > bestScore) {
                  // Check if this result matches the intended card name
                  const isExactMatch = resultCardName.toLowerCase() === rec.cardName.toLowerCase();
                  const isPartialMatch = resultCardName.toLowerCase().includes(rec.cardName.toLowerCase()) || 
                                       rec.cardName.toLowerCase().includes(resultCardName.toLowerCase());
                  
                  // STRICT VALIDATION: Only accept exact matches or very high confidence partial matches
                  if (isExactMatch || (isPartialMatch && result.score > 0.85)) {
                    foundCard = result;
                    bestScore = result.score;
                  }
                }
              }
            }
            
            if (foundCard && foundCard.metadata?.cardId) {
              const cardId = foundCard.metadata.cardId as string;
              
              // Check if this card has already been recommended
              if (recommendedCardIds.has(cardId)) {
                console.log(`Skipping duplicate card recommendation: ${rec.cardName} (${cardId})`);
                continue; // Skip this card
              }
              
              // Add to tracking set
              recommendedCardIds.add(cardId);
              
              validatedRecommendations.push({
                cardId: cardId,
                cardName: foundCard.metadata.cardName as string,
                image: foundCard.metadata.image as string,
                reason: rec.reason,
                priority: rec.priority,
                quantity: Math.min(rec.quantity, 2)
              });
            } else {
              console.warn(`Card not found in database: ${rec.cardName} - rejecting recommendation`);
              // Don't add fallback recommendations - only show cards that actually exist
            }
          } catch (error) {
            console.error(`Error validating card ${rec.cardName}:`, error);
            // Don't add fallback recommendations - only show cards that actually exist
          }
        }
        
        return {
          success: true,
          reason,
          recommendations: validatedRecommendations,
          strategy: strategy || "These cards work well together in your deck strategy.",
          totalRecommended: validatedRecommendations.length,
          warnings: validatedRecommendations.length < recommendations.length ? 
            `Note: ${recommendations.length - validatedRecommendations.length} cards were not found in the database and may not be available.` : undefined
        };
      } catch (error) {
        console.error('Tool execution failed:', error);
        return {
          success: false,
          error: `Failed to validate card recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendations: [],
          fallback: "I apologize, but I'm having trouble accessing the card database right now. Please try again in a moment."
        };
      }
    }
  }),

  search_cards: tool({
    description: "Search for cards in the vector database. Use this to find cards with specific attributes, types, attacks, or other characteristics. This provides detailed card information for recommendations. IMPORTANT: Only search for cards you know exist in the mobile game - do not make up card names.",
    parameters: z.object({
      query: z.string()
        .min(1, 'Search query cannot be empty')
        .max(200, 'Search query too long')
        .describe("The search query (e.g., 'Fire type cards', 'cards with high HP', 'cards that deal 100 damage', 'evolution cards')"),
      limit: z.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(10, 'Limit cannot exceed 10')
        .optional()
        .describe("Maximum number of results to return (default: 5)")
    }),
    execute: async ({ query, limit = 5 }) => {
      try {
        // Sanitize and validate search query
        const sanitizedQuery = sanitizeSearchQuery(query);
        if (!validateSearchQuery(sanitizedQuery)) {
          return {
            success: false,
            error: 'Invalid search query format',
            fallback: "Please provide a valid search term."
          };
        }

        const results = await searchCards(sanitizedQuery, limit);
        return {
          success: true,
          query: sanitizedQuery,
          results: results.map(mapCardResult)
        };
      } catch (error) {
        console.error('Search cards tool failed:', error);
        return {
          success: false,
          error: `Failed to search cards in vector database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          fallback: "I'm having trouble searching the card database. Please try a different search term or try again later."
        };
      }
    }
  }),

  get_similar_cards: tool({
    description: "Find cards similar to a specific card. Use this to recommend alternatives or complementary cards for deck building.",
    parameters: z.object({
      cardName: z.string()
        .min(1, 'Card name cannot be empty')
        .max(200, 'Card name too long')
        .describe("The name of the card to find similar cards for"),
      limit: z.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(10, 'Limit cannot exceed 10')
        .optional()
        .describe("Maximum number of similar cards to return (default: 5)")
    }),
    execute: async ({ cardName, limit = 5 }) => {
      try {
        // Sanitize and validate card name
        const sanitizedCardName = sanitizeSearchQuery(cardName);
        if (!validateSearchQuery(sanitizedCardName)) {
          return {
            success: false,
            error: 'Invalid card name format',
            fallback: "Please provide a valid card name."
          };
        }

        const results = await getSimilarCards(sanitizedCardName, limit);
        return {
          success: true,
          cardName: sanitizedCardName,
          similarCards: results.map(mapCardResult)
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to find similar cards: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  })
}); 