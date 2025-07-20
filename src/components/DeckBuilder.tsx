"use client";

import Image from "next/image";
import { DeckCard } from "@/types/cards";
import { getCardImageUrl } from "@/utils/cardUtils";

interface DeckBuilderProps {
  selectedCards: DeckCard[];
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveCard?: (cardId: string) => void;
}

export default function DeckBuilder({
  selectedCards,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveCard
}: DeckBuilderProps) {
  const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0);

  const handleCardClick = (cardId: string) => {
    if (onRemoveCard) {
      onRemoveCard(cardId);
    }
  };

  return (
    <div className="lg:col-span-1 flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4">Your Deck</h3>
      
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex-1 p-4 rounded-lg transition-all duration-300 shadow-lg ${
          dragOver 
            ? 'shadow-blue-200 bg-blue-50 dark:bg-blue-950' 
            : 'shadow-gray-200 bg-white'
        }`}
      >
        {selectedCards.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>Drag cards here to build your deck</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedCards.map((card) => (
              Array.from({ length: card.quantity }, (_, index) => (
                <div 
                  key={`${card.id}-${index}`} 
                  className="relative cursor-pointer group"
                  onClick={() => handleCardClick(card.id)}
                  title="Click to remove card"
                >
                  <Image 
                    src={getCardImageUrl(card.image, 'low', 'webp')} 
                    alt={card.name}
                    width={48}
                    height={64}
                    className="w-12 h-16 object-cover rounded shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-white text-xs font-bold">×</span>
                  </div>
                </div>
              ))
            )).flat()}
          </div>
        )}
      </div>

      {selectedCards.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm text-muted-foreground">
            Total cards: {totalCards}/20
          </div>
          <div className="text-xs text-muted-foreground">
            Click any card to remove it from your deck
          </div>
        </div>
      )}
    </div>
  );
} 