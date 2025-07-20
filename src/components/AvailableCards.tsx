"use client";

import { RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/types/cards";
import { getCardImageUrl } from "@/utils/cardUtils";

interface AvailableCardsProps {
  availableCards: Card[];
  isLoadingCards: boolean;
  selectedSet: string;
  onSetChange: (setId: string) => void;
  onLoadCards: () => void;
  onAddCard: (card: Card) => void;
}

export default function AvailableCards({
  availableCards,
  isLoadingCards,
  selectedSet,
  onSetChange,
  onLoadCards,
  onAddCard
}: AvailableCardsProps) {
  return (
    <div className="lg:col-span-2">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Available Cards</h3>
        <div className="flex gap-2 mb-2">
          <select
            value={selectedSet}
            onChange={(e) => onSetChange(e.target.value)}
            className="px-3 py-2 rounded-full shadow-md focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-shadow"
          >
            <option value="A1">Genetic Apex</option>
            <option value="A2">Space-Time Smackdown</option>
            <option value="A3">Celestial Guardians</option>
            <option value="A1a">Mythical Island</option>
            <option value="A2a">Triumphant Light</option>
            <option value="A2b">Shining Revelry</option>
          </select>
          <button
            onClick={onLoadCards}
            disabled={isLoadingCards}
            className="px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            {isLoadingCards ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        </div>
        {availableCards.length > 0 && !isLoadingCards && (
          <p className="text-sm text-muted-foreground">
            Loaded {availableCards.length} cards from {selectedSet}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
        {isLoadingCards ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-muted-foreground">Loading cards...</p>
            </div>
          </div>
        ) : availableCards.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No cards available. Try loading a different set.</p>
          </div>
        ) : (
          availableCards.map((card) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', card.id)}
              onClick={() => onAddCard(card)}
              className="cursor-pointer p-2"
            >
              <div className="relative w-full rounded overflow-hidden">
                <img 
                  src={getCardImageUrl(card.image, 'low', 'webp')} 
                  alt={card.name}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    console.log('Image failed to load:', card.image);
                    e.currentTarget.src = `https://via.placeholder.com/200x280/4F46E5/FFFFFF?text=${encodeURIComponent(card.name)}`;
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 