import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

// keep file in utils -- only used for vector store functionality
export interface CardData {
  id: string;
  name: string;
  image?: string;
  category?: string; // "Pokemon" or "Trainer"
  types?: string[];
  hp?: number;
  description?: string;
  stage?: string;
  setName?: string;
  attacks?: Array<{
    name: string;
    damage?: string;
    description?: string;
    cost?: string[];
  }>;
  abilities?: Array<{
    name: string;
    description: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  evolveFrom?: string;
  retreat?: number;
  trainerType?: string;
  effect?: string; // Trainer card effect text
  variants?: {
    holo?: boolean;
    normal?: boolean;
    reverse?: boolean;
    firstEdition?: boolean;
  };
}

// Initialize Pinecone
export const initializePinecone = () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

// Create embeddings
export const createEmbeddings = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
};

// Process card data into searchable text
export const processCardToText = (card: CardData): string => {
  const parts: string[] = [];
  
  if (card.category === 'Trainer') {
    // Handle trainer cards
    parts.push(`${card.name} is a ${card.trainerType || 'Trainer'} card`);
    
    if (card.effect) {
      parts.push(`Effect: ${card.effect}`);
    }
    
    if (card.description) {
      parts.push(`Description: ${card.description}`);
    }
  } else {
    // Handle Pokémon cards
    parts.push(`${card.name} is a ${card.types?.join('/') || 'Pokémon'} card`);
    
    if (card.stage) {
      parts.push(`(${card.stage} stage)`);
    }
    
    if (card.hp) {
      parts.push(`with ${card.hp} HP`);
    }
    
    if (card.description) {
      parts.push(`. ${card.description}`);
    }
    
    if (card.evolveFrom) {
      parts.push(`It evolves from ${card.evolveFrom}`);
    }
    
    if (card.attacks && card.attacks.length > 0) {
      const attackDescriptions = card.attacks.map(attack => {
        let desc = `${attack.name}`;
        if (attack.cost && attack.cost.length > 0) {
          desc += ` (costs ${attack.cost.join(', ')})`;
        }
        if (attack.damage) {
          desc += ` deals ${attack.damage} damage`;
        }
        if (attack.description) {
          desc += ` - ${attack.description}`;
        }
        return desc;
      });
      parts.push(`Its attacks include ${attackDescriptions.join(' and ')}`);
    }
    
    if (card.abilities && card.abilities.length > 0) {
      const abilityDescriptions = card.abilities.map(ability => 
        `${ability.name}: ${ability.description}`
      );
      parts.push(`It has the abilities ${abilityDescriptions.join(' and ')}`);
    }
    
    if (card.weaknesses && card.weaknesses.length > 0) {
      const weaknessText = card.weaknesses.map(w => `${w.type} +${w.value}`).join(', ');
      parts.push(`It is weak to ${weaknessText}`);
    }
    
    if (card.retreat) {
      parts.push(`It has a retreat cost of ${card.retreat}`);
    }
  }
  
  if (card.setName) {
    parts.push(`This card is from the ${card.setName} set`);
  }
  
  if (card.variants) {
    const variantTypes = [];
    if (card.variants.holo) variantTypes.push('holo');
    if (card.variants.normal) variantTypes.push('normal');
    if (card.variants.reverse) variantTypes.push('reverse holo');
    if (card.variants.firstEdition) variantTypes.push('first edition');
    
    if (variantTypes.length > 0) {
      parts.push(`Available in ${variantTypes.join(', ')} variants`);
    }
  }
  
  return parts.join('. ');
};

// Add cards to vector store
export const addCardsToVectorStore = async (
  cards: CardData[], 
  indexName: string = 'pokemon-cards'
) => {
  if (!cards.length) return 0;
  
  try {
    const pinecone = initializePinecone();
    const embeddings = createEmbeddings();
    const index = pinecone.index(indexName);
    
    // Create embeddings for all cards
    const texts = cards.map(card => processCardToText(card));
    const vectors = await embeddings.embedDocuments(texts);

    // Prepare vectors for Pinecone
    const vectorsToUpsert = vectors.map((vector, i) => ({
      id: cards[i].id,
      values: vector,
      metadata: {
        cardId: cards[i].id,
        cardName: cards[i].name,
        image: cards[i].image || '',
        category: cards[i].category || '',
        cardType: cards[i].types?.[0] || '', // mobile uses single typings
        hp: cards[i].hp || 0,
        stage: cards[i].stage || '',
        setName: cards[i].setName || '',
        description: cards[i].description || '',
        attacks: cards[i].attacks ? JSON.stringify(cards[i].attacks) : '',
        abilities: cards[i].abilities ? JSON.stringify(cards[i].abilities) : '',
        weaknesses: cards[i].weaknesses ? JSON.stringify(cards[i].weaknesses) : '',
        evolveFrom: cards[i].evolveFrom || '',
        retreat: cards[i].retreat || 0,
        trainerType: cards[i].trainerType || '',
        effect: cards[i].effect || '',
        text: texts[i],
      }
    }));

    // Upsert vectors in batches
    const batchSize = 100;
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    return cards.length;
  } catch (error) {
    console.error('Failed to add cards to vector store:', error);
    throw error;
  }
};

// Search cards in vector store
export const searchCards = async (
  query: string,
  k: number = 10,
  indexName: string = 'pokemon-cards'
) => {
  const pinecone = initializePinecone();
  const embeddings = createEmbeddings();
  const index = pinecone.index(indexName);
  
  // Create embedding for query
  const queryEmbedding = await embeddings.embedQuery(query);
  
  // Search
  const results = await index.query({
    vector: queryEmbedding,
    topK: k,
    includeMetadata: true,
  });
  
  return results.matches?.map(match => ({
    score: match.score,
    content: match.metadata?.text as string,
    metadata: match.metadata,
  })) || [];
};

// Get card context for AI
export const getCardContext = async (
  cardNames: string[],
  indexName: string = 'pokemon-cards'
) => {
  const contexts = await Promise.all(
    cardNames.map(async (cardName) => {
      // Try different search strategies for better results
      const searchQueries = [
        cardName, // Exact name
        `${cardName} card`, // With "card" suffix
        `${cardName} Pokémon`, // With "Pokémon" suffix
      ];
      
      let bestResult: { score: number | undefined; content: string; metadata?: Record<string, unknown> } | null = null;
      let bestScore = 0;
      
      for (const query of searchQueries) {
        const results = await searchCards(query, 1, indexName);
        if (results[0] && results[0].score && results[0].score > bestScore) {
          bestResult = results[0];
          bestScore = results[0].score;
        }
      }
      
      return bestResult?.content || `No detailed information found for ${cardName}`;
    })
  );
  
  return contexts.join('\n\n');
};

// Search for cards by type, attack, or other attributes
export const searchCardsByAttribute = async (
  attribute: string,
  value: string,
  k: number = 10,
  indexName: string = 'pokemon-cards'
) => {
  const query = `${attribute} ${value}`;
  return await searchCards(query, k, indexName);
};

// Get similar cards based on a card's characteristics
export const getSimilarCards = async (
  cardName: string,
  k: number = 5,
  indexName: string = 'pokemon-cards'
) => {
  const cardResults = await searchCards(cardName, 1, indexName);
  if (!cardResults[0]) {
    return [];
  }
  
  // search for similar cards using the card's content
  return await searchCards(cardResults[0].content, k, indexName);
}; 