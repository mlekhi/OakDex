"use client";

import ChatInterface from "@/components/ChatInterface";
import AvailableCards from "@/components/AvailableCards";
import DeckBuilder from "@/components/DeckBuilder";
import { useCards } from "@/hooks/useCards";
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

  const handleSetChange = (setId: string) => {
    setSelectedSet(setId);
    loadCards(setId);
  };

  const handleRemoveCard = (cardId: string) => {
    reduceCardQuantity(cardId);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex flex-col w-full max-w-6xl py-8 mx-auto px-6">
        <ChatInterface selectedCards={selectedCards} />

      {/* Deck builder section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Deck Builder</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </div>

      <Footer />
    </div>
  );
}
