#!/usr/bin/env tsx

import { addCardsToVectorStore, CardData } from '@/utils/vectorStore';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TCGDEX_BASE_URL = 'https://api.tcgdex.net/v2';
const PINECONE_INDEX_NAME = 'pokemon-cards';
const VECTOR_DIM = 1536;

// interface for card set data
interface SetData {
  id: string;
  name: string;
  cardCount: {
    total: number;
    official: number;
  };
}

// reusable headers for api calls (tcgdex)
function getHeaders() {
  return {
    'Accept': 'application/json',
    'User-Agent': 'prof-oak-app/1.0'
  };
}

// Pinecone client instance
function getPineconeClient() {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
}

// checking for new sets starting with "A"
async function checkForNewSets(): Promise<{ hasNewSets: boolean; newSets: string[]; allASets: string[] }> {
  try {    
    // fetch all set names from tcgdex
    const response = await fetch(`${TCGDEX_BASE_URL}/en/sets`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sets: ${response.status}`);
    }

    const sets: SetData[] = await response.json();
    
    // filter for "A" sets
    const aSets = sets
      .filter(set => set.id.startsWith('A'))
      .map(set => set.id)
      .sort();
    
    console.log(`Found ${aSets.length} A sets total`);
    
    // get already synced sets from Pinecone
    const index = getPineconeClient().index(PINECONE_INDEX_NAME);
    const syncedSets = await getSyncedSetsFromPinecone(index);
    
    // find new sets
    const newSets = aSets.filter(setId => !syncedSets.includes(setId));
    
    if (newSets.length > 0) {
      console.log(`found ${newSets.length} new sets to sync: ${newSets.join(', ')}`);
    } else {
      console.log('all A sets already synced');
    }
    
    return {
      hasNewSets: newSets.length > 0,
      newSets,
      allASets: aSets
    };
    
  } catch (error) {
    console.error('error checking for new sets:', error);
    throw error;
  }
}

// getting synced sets from Pinecone (marker vectors)
async function getSyncedSetsFromPinecone(index: any): Promise<string[]> {
  try {
    // query for all marker vectors
    const queryResponse = await index.query({
      vector: new Array(VECTOR_DIM).fill(0.1), // non-zero values as marker vectors
      filter: {
        type: { $eq: 'marker' }
      },
      topK: 15, // sub-10 sets currently, should be alright for safety
      includeMetadata: true
    });
    
    // extract set IDs from marker vectors
    const syncedSets = queryResponse.matches
      ?.map((match: any) => match.metadata?.setId)
      .filter(Boolean) || [];
    
    return syncedSets;
  } catch (error) {
    console.error('Error getting synced sets from Pinecone:', error);
    return [];
  }
}

// Save set markers to Pinecone after successful sync
async function saveSetMarkers(setIds: string[]): Promise<void> {
  try {
    const index = getPineconeClient().index(PINECONE_INDEX_NAME);
    
    // create marker vectors for each synced set
    const markerVectors = setIds.map(setId => ({
      id: `set_${setId}`,
      values: new Array(VECTOR_DIM).fill(0.1),
      metadata: {
        type: 'marker',
        setId: setId,
        syncedAt: new Date().toISOString()
      }
    }));
    
    // adding marker vectors to Pinecone
    await index.upsert(markerVectors);
    console.log(`Saved markers for ${setIds.length} sets`);
  } catch (error) {
    console.error('Error saving set markers to Pinecone:', error);
  }
}

// Setup Pinecone index
async function setupPineconeIndex() {  
  const pinecone = getPineconeClient();
  
  try {
    console.log(`checking if '${PINECONE_INDEX_NAME}' index exists in Pinecone`);
    const indexes = await pinecone.listIndexes();
    
    const indexExists = indexes.indexes?.some((index: any) => index.name === PINECONE_INDEX_NAME);
    
    if (indexExists) {
      console.log(`index already exists`);      
    } else {
      console.log(`creating index`);
      
      // Create the index
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: VECTOR_DIM,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      console.log('Waiting for index to be ready...');
      let isReady = false;
      while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const index = pinecone.index(PINECONE_INDEX_NAME);
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
    console.error('error setting up Pinecone index:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      console.error('API Key Issues!');
    }
    
    return false;
  }
}

// Get card data from tcgdex api
async function fetchCardDetails(cardId: string, lang: string = 'en'): Promise<CardData | null> {
  try {
    const response = await fetch(`${TCGDEX_BASE_URL}/${lang}/cards/${cardId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch card ${cardId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      image: data.image,
      category: data.category,
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
      trainerType: data.trainerType,
      effect: data.effect,
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
      headers: getHeaders(),
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

// populate function
async function populateVectorStore(setIds?: string[]): Promise<number> {
  console.log('starting vector store population...');
  
  // setup Pinecone index
  const setupSuccess = await setupPineconeIndex();
  if (!setupSuccess) {
    throw new Error('Failed to setup Pinecone index');
  }
  
  let setsToProcess: string[];
  
  if (setIds && setIds.length > 0) {
    // use provided set IDs
    setsToProcess = setIds;
    console.log(`processing provided sets: ${setsToProcess.join(', ')}`);
  } else {
    // auto-detect new sets
    const { hasNewSets, newSets } = await checkForNewSets();
    
    if (!hasNewSets) {
      console.log('no new sets found');
      return 0;
    }
    
    setsToProcess = newSets;
    console.log(`auto-detected new sets to process: ${setsToProcess.join(', ')}`);
  }
  
  let totalCardsAdded = 0;
  
  for (const setId of setsToProcess) {
    console.log(`Processing set ${setId}`);
    
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
  
  // save markers for auto-detected sets
  if (!setIds || setIds.length === 0) {
    await saveSetMarkers(setsToProcess);
  }
  
  console.log(`vector store population complete!`);
  return totalCardsAdded;
}

async function main() {
  const args = process.argv.slice(2);
  
  // check environment variables
  if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
    console.error('environment variables missing');
    process.exit(1);
  }
  
  try {
    let totalCardsAdded: number;
    
    if (args.length > 0) {
      totalCardsAdded = await populateVectorStore(args);
    } else {
      totalCardsAdded = await populateVectorStore();
    }
        
  } catch (error) {
    console.error('failed to populate vector store:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 