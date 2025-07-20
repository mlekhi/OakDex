#!/usr/bin/env tsx

import { addCardsToVectorStore, CardData } from '../src/utils/vectorStore';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';

// Setup Pinecone index
async function setupPineconeIndex() {  
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const indexName = 'pokemon-cards';
  
  try {
    console.log(`checking if '${indexName}' index exists in Pinecone`);
    const indexes = await pinecone.listIndexes();
    
    const indexExists = indexes.indexes?.some((index: any) => index.name === indexName);
    
    if (indexExists) {
      console.log(`index already exists`);      
    } else {
      console.log(`creating index`);
      
      // Create the index
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // Check on dimension size 
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      let isReady = false;
      while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const index = pinecone.index(indexName);
        try {
          const stats = await index.describeIndexStats();
          isReady = true;
          console.log(`index is ready!`);
        } catch (error) {
          console.log(`still waiting for index to be ready`);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error(error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      console.log('API Key Issues!');
    }
    
    return false;
  }
}

// Get card data from tcgdex api
async function fetchCardDetails(cardId: string, lang: string = 'en'): Promise<CardData | null> {
  try {
    const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/cards/${cardId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'prof-oak-app/1.0'
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch card ${cardId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      types: data.types,
      hp: data.hp,
      description: data.description,
      stage: data.stage,
      setName: data.set?.name,
      attacks: data.attacks?.map((attack: any) => ({
        name: attack.name,
        damage: attack.damage,
        description: attack.description,
        cost: attack.cost,
      })),
      abilities: data.abilities?.map((ability: any) => ({
        name: ability.name,
        description: ability.description,
      })),
      weaknesses: data.weaknesses?.map((weakness: any) => ({
        type: weakness.type,
        value: weakness.value,
      })),
      evolveFrom: data.evolveFrom,
      retreat: data.retreat,
      variants: data.variants,
    };
  } catch (error) {
    console.error(`Error fetching card ${cardId}:`, error);
    return null;
  }
}

// get all cards from a set
async function fetchSetCards(setId: string, lang: string = 'en'): Promise<CardData[]> {
  try {
    const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/sets/${setId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'prof-oak-app/1.0'
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch set ${setId}: ${response.status}`);
    }

    const data = await response.json();
    const cards = data.cards || [];
    
    console.log(`${cards.length} cards in set ${setId}`);
    
    const detailedCards: CardData[] = [];
    for (const card of cards) {
      const detailedCard = await fetchCardDetails(card.id, lang);
      if (detailedCard) {
        detailedCards.push(detailedCard);
      }
      // add short delay to not overload api
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return detailedCards;
  } catch (error) {
    console.error(`Error fetching set ${setId}:`, error);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const setIds = args.length > 0 ? args : ['A1', 'A2', 'A3'];
  
  // check environment variables
  if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
    console.error('environment variables missing');
    process.exit(1);
  }
  
  try {
    console.log('starting vector store population...');
    
    // setup Pinecone index
    const setupSuccess = await setupPineconeIndex();
    if (!setupSuccess) {
      console.error('failed to setup Pinecone index');
      process.exit(1);
    }
    
    let totalCardsAdded = 0;
    
    for (const setId of setIds) {
      console.log(`processing set ${setId}`);
      
      try {
        // fetch cards from the set
        const cards = await fetchSetCards(setId);
        
        console.log(`adding ${cards.length} cards to vector store`);
        
        const addedCount = await addCardsToVectorStore(cards);
        totalCardsAdded += addedCount;
        
        console.log(`successfully added ${addedCount} cards from set ${setId}`);
        
      } catch (error) {
        console.error(`error processing set ${setId}:`, error);
      }
    }
    
    console.log(`vector store population complete!`);
    console.log(`total cards added: ${totalCardsAdded}`);
    
  } catch (error) {
    console.error('failed to populate vector store:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 