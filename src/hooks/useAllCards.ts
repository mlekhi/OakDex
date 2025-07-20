"use client";

import { useState, useEffect } from "react";
import { Card } from "@/types/cards";

interface ApiCard {
  id: string;
  name: string;
  image: string;
  category?: string;
  types?: string[];
  hp?: number;
  trainerType?: string;
  effect?: string;
}

export function useAllCards() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllCards = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // all pocket sets
        const setIds = ['A1', 'A2', 'A3', 'A1a', 'A2a', 'A2b', 'A3a', 'A3b'];
        const allCardsData: Card[] = [];
        
        for (const setId of setIds) {
          try {
            const response = await fetch(`/api/tcgdex?setId=${setId}&lang=en`);
            if (response.ok) {
              const data = await response.json();
              const cards: Card[] = data.cards?.map((card: ApiCard) => ({
                id: card.id,
                name: card.name,
                image: card.image,
                category: card.category,
                type: card.types?.[0],
                hp: card.hp,
                trainerType: card.trainerType,
                effect: card.effect
              })) || [];
              
              allCardsData.push(...cards);
            } else {
              console.warn(`Failed to load set ${setId}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Error loading set ${setId}:`, error);
          }
          
          // small delay to not overwhelm the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setAllCards(allCardsData);
        
      } catch (error) {
        console.error('Error loading all cards:', error);
        setError('Failed to load cards');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllCards();
  }, []);

  const findCardById = (cardId: string): Card | undefined => {
    return allCards.find(card => card.id === cardId);
  };

  const findCardsByName = (cardName: string): Card[] => {
    return allCards.filter(card => 
      card.name.toLowerCase().includes(cardName.toLowerCase())
    );
  };

  return {
    allCards,
    isLoading,
    error,
    findCardById,
    findCardsByName
  };
} 