"use client";

import ChatInterface from "@/components/ChatInterface";
import AvailableCards from "@/components/AvailableCards";
import DeckBuilder from "@/components/DeckBuilder";
import { useCards } from "@/hooks/useCards";
import { useAllCards } from "@/hooks/useAllCards";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function Chat() {
  const {
    selectedCards,
    availableCards,
    isLoadingCards,
    dragOver,
    selectedSet,
    loadCards,
    addCardToDeck,
    reduceCardQuantity,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setSelectedSet
  } = useCards();

  const { findCardById } = useAllCards();

  const handleSetChange = (setId: string) => {
    setSelectedSet(setId);
    loadCards(setId);
  };

  const handleRemoveCard = (cardId: string) => {
    reduceCardQuantity(cardId);
  };

  // function to add recommended cards
  const handleAddRecommendedCard = (cardId: string, cardName: string) => {
    const card = findCardById(cardId);
    if (card) {
      console.log('Adding card to deck:', card.name);
      addCardToDeck(card);
    } else {
      console.warn(`Card not found: ${cardName} (${cardId})`);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* TODO: Add loading signal here when cards are being preloaded */}
      
      <div className="flex flex-col w-full max-w-6xl py-8 mx-auto px-6">
        {/* Deck builder section */}
        <div className="flex-1 flex flex-col mb-8">
          <h2 className="text-2xl font-bold mb-4">Deck Builder</h2>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AvailableCards
              availableCards={availableCards}
              isLoadingCards={isLoadingCards}
              selectedSet={selectedSet}
              onSetChange={handleSetChange}
              onLoadCards={() => loadCards()}
              onAddCard={addCardToDeck}
            />

            {/* Deck Building Area */}
            <DeckBuilder
              selectedCards={selectedCards}
              dragOver={dragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRemoveCard={handleRemoveCard}
            />
          </div>
        </div>

        <ChatInterface 
          selectedCards={selectedCards} 
          onAddCard={handleAddRecommendedCard}
        />
      </div>

      <Footer />
    </div>
  );
}
