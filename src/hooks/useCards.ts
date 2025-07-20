"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, DeckCard } from "@/types/cards";

interface ApiCard {
  id: string;
  name: string;
  image: string;
  types?: string[];
  hp?: number;
}

export function useCards() {
  const [selectedCards, setSelectedCards] = useState<DeckCard[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedSet, setSelectedSet] = useState('A1'); // Default to TCG Pocket Genetic Apex

  const loadCards = useCallback(async (setId: string = selectedSet) => {
    setIsLoadingCards(true);
    try {
      const response = await fetch(`/api/tcgdex?setId=${setId}&lang=en`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      
      const cards: Card[] = data.cards?.map((card: ApiCard) => ({
        id: card.id,
        name: card.name,
        image: card.image,
        type: card.types?.[0],
        hp: card.hp
      })) || [];
      
      setAvailableCards(cards);
      setSelectedSet(setId);
    } catch (error) {
      console.error('Error loading cards:', error);
      setAvailableCards([]);
    } finally {
      setIsLoadingCards(false);
    }
  }, [selectedSet]);

  const addCardToDeck = (card: Card) => {
    setSelectedCards(prev => {
      const existing = prev.find(c => c.id === card.id);
      if (existing) {
        return prev.map(c => 
          c.id === card.id 
            ? { ...c, quantity: Math.min(c.quantity + 1, 4) }
            : c
        );
      }
      return [...prev, { ...card, quantity: 1 }];
    });
  };

  const removeCardFromDeck = (cardId: string) => {
    setSelectedCards(prev => prev.filter(c => c.id !== cardId));
  };

  const reduceCardQuantity = (cardId: string) => {
    setSelectedCards(prev => {
      const existing = prev.find(c => c.id === cardId);
      if (!existing) return prev;
      
      if (existing.quantity <= 1) {
        // Remove card entirely
        return prev.filter(c => c.id !== cardId);
      }
      
      // Reduce quantity by 1
      return prev.map(c => 
        c.id === cardId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  const updateCardQuantity = (cardId: string, quantity: number) => {
    if (quantity === 0) {
      removeCardFromDeck(cardId);
      return;
    }
    setSelectedCards(prev => 
      prev.map(c => c.id === cardId ? { ...c, quantity: Math.min(quantity, 4) } : c)
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    const card = availableCards.find(c => c.id === cardId);
    if (card) {
      addCardToDeck(card);
    }
  };

  useEffect(() => {
    if (availableCards.length === 0) {
      loadCards();
    }
  }, [availableCards.length, loadCards]);

  return {
    selectedCards,
    availableCards,
    isLoadingCards,
    dragOver,
    selectedSet,
    loadCards,
    addCardToDeck,
    removeCardFromDeck,
    reduceCardQuantity,
    updateCardQuantity,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setSelectedSet
  };
} 