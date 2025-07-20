import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface CardData {
  id: string;
  name: string;
  quantity: number;
}

interface MetaDeck {
  count: number;
  share: number;
  score: string;
  winPercentage: number | null;
  cards: Record<string, unknown>;
}

interface MetaDecks {
  [deckName: string]: MetaDeck;
}

// Function to load metadecks data
function loadMetaDecks(): MetaDecks {
  try {
    const filePath = path.join(process.cwd(), 'data', 'metadecks.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return {};
  }
}

// Function to search for decks in metadecks
function searchMetaDecks(deckName: string): MetaDeck | null {
  const metadecks = loadMetaDecks();
  
  // Exact match first
  if (metadecks[deckName]) {
    return metadecks[deckName];
  }
  
  // Case-insensitive search
  const lowerDeckName = deckName.toLowerCase().trim();
  for (const [name, deck] of Object.entries(metadecks)) {
    const lowerName = name.toLowerCase();
    
    if (lowerName === lowerDeckName) {
      return deck;
    }
    
    if (lowerName.includes(lowerDeckName) || lowerDeckName.includes(lowerName)) {
      return deck;
    }
    
    // Handle common variations
    if (lowerDeckName.includes('ex') && lowerName.includes('ex')) {
      const baseName = lowerDeckName.replace(' ex', '').replace('ex ', '');
      const baseDeckName = lowerName.replace(' ex', '').replace('ex ', '');
      if (baseName === baseDeckName) {
        return deck;
      }
    }
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const { messages, selectedCards } = await req.json();

    // Create deck context using selected cards
    let deckContext = "";
    if (selectedCards && selectedCards.length > 0) {
      const cardList = selectedCards.map((card: CardData) => 
        `${card.name} (ID: ${card.id}, Quantity: ${card.quantity})`
      ).join('\n');
      
      const totalCards = selectedCards.reduce((sum: number, card: CardData) => sum + card.quantity, 0);
      
      deckContext = `\n\nCURRENT DECK INFORMATION:\nThe user's current deck contains ${totalCards}/20 cards:\n\n${cardList}\n\nIMPORTANT: When analyzing this deck or making recommendations, you should consult the TCGdex API (https://api.tcgdex.net/v2/en/cards/{card_id}) to get detailed information about each card including its type, HP, abilities, attacks, and other properties. Use the card IDs provided above to fetch complete card data.`;
    }

    const systemPrompt = `You are Professor Oak, the renowned Pokémon researcher and TCG Mobile deck strategist. You speak in your characteristic warm, enthusiastic, and slightly eccentric style from the Pokémon games and anime.

Your personality traits:
- Warm and encouraging, like a wise grandfather
- Enthusiastic about Pokémon and strategy
- Sometimes rambles but always means well
- Occasionally uses phrases like "Excellent!" or "Fascinating!" but not excessively
- Shows genuine excitement about deck building and Pokémon battles
- Occasionally references your research and Pokémon knowledge

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

META DECK INFORMATION:
You have access to current meta deck statistics through the get_meta_decks tool. ALWAYS use this tool when users ask about:
- Specific deck performance (e.g., "How is Sylveon ex doing?", "What's the win rate of Charizard ex?")
- Meta analysis (e.g., "What's popular right now?", "Which decks are strong?")
- Deck popularity or usage statistics
- Win rates of specific decks
- Deck comparisons (e.g., "How does my deck compare to Sylveon ex?", "Is my deck better than Charizard ex?")

This tool provides real, up-to-date data about deck usage, win rates, and meta share. Use it to give accurate, data-driven advice instead of making assumptions.

IMPORTANT: When explaining meta information to users, use simple language:
- "Meta share" means "how many players are using this deck compared to everyone else"
- "Win rate" means "how often this deck wins games"
- Avoid using technical terms like "meta" without explanation - instead say "popular decks"

When users mention decks or ask for comparisons, extract the deck name and use the tool to get current meta data for that deck.

When giving advice, always consider these mobile-specific rules and mechanics. Keep responses brief and actionable, but maintain your characteristic Professor Oak personality and speaking style.${deckContext}`;
    
    // Consider using a different model
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      maxSteps: 3, // Allow up to 3 steps for tool calls and responses
      tools: {
        get_meta_decks: tool({
          description: "Get real-time meta statistics for any deck. Use this whenever someone asks about deck performance, popularity, win rates, meta analysis, or deck comparisons. This provides accurate data instead of assumptions.",
          parameters: z.object({
            deckName: z.string().describe("The exact name of the deck to look up (e.g., 'Sylveon ex', 'Charizard ex', 'Silvally', 'Giratina ex').")
          }),
          execute: async ({ deckName }) => {
            const deckInfo = searchMetaDecks(deckName);
            
            if (deckInfo) {
              return {
                found: true,
                deckName: deckName,
                count: deckInfo.count,
                share: deckInfo.share,
                score: deckInfo.score,
                winPercentage: deckInfo.winPercentage,
                metaRank: "This is a set deck in the game",
                analysis: `This deck has ${deckInfo.count} players using it (${deckInfo.share}% of the meta) with a ${deckInfo.winPercentage}% win rate.`,
                comparison: `Compared to your current deck, ${deckName} is ${deckInfo.share > 5 ? 'very popular' : deckInfo.share > 2 ? 'moderately popular' : 'less common'} in the meta with a ${deckInfo.winPercentage}% win rate.`
              };
            } else {
              return {
                found: false,
                deckName: deckName,
                message: "This deck is not currently in the meta or not found in the database."
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
