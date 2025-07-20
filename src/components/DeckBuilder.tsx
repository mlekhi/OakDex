"use client";

import { DeckCard } from "@/types/cards";
import { getCardImageUrl } from "@/utils/cardUtils";

interface DeckBuilderProps {
  selectedCards: DeckCard[];
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function DeckBuilder({
  selectedCards,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop
}: DeckBuilderProps) {
  const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className="lg:col-span-1">
      <h3 className="text-lg font-semibold mb-4">Your Deck</h3>
      
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`min-h-64 p-4 border-2 border-dashed rounded-lg transition-colors ${
          dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300'
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
                <div key={`${card.id}-${index}`} className="relative">
                  <img 
                    src={getCardImageUrl(card.image, 'low', 'webp')} 
                    alt={card.name}
                    className="w-12 h-16 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/48x64/4F46E5/FFFFFF?text=${encodeURIComponent(card.name.substring(0, 8))}`;
                    }}
                  />
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
        </div>
      )}
    </div>
  );
} 