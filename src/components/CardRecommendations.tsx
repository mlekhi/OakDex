"use client";

import React from "react";
import { CardRecommendation } from "../types/cardRecommendations";
import { getCardImageUrl } from "../utils/cardUtils";

interface CardRecommendationsProps {
  recommendations: CardRecommendation[];
  reason: string;
  strategy?: string;
  onAddCard?: (cardId: string, cardName: string) => void;
  onRemoveRecommendation?: (cardId: string) => void;
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority as keyof typeof colors]}`}>
      {priority}
    </span>
  );
};

export default function CardRecommendations({ 
  recommendations, 
  reason, 
  strategy, 
  onAddCard,
  onRemoveRecommendation
}: CardRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">
          Oak's Card Recommendations
        </h3>
        <p className="text-blue-700 text-sm mb-2">{reason}</p>
        {strategy && (
          <p className="text-blue-600 text-sm italic">💡 {strategy.replace(/'/g, '&apos;')}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((rec, index) => (
          <div 
            key={`${rec.cardId}-${index}`} 
            className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <PriorityBadge priority={rec.priority} />
              <span className="text-xs text-gray-600 font-medium">
                {rec.quantity}x
              </span>
            </div>
            
            <div className="flex justify-center mb-3">
              <img 
                src={getCardImageUrl(rec.image, 'high', 'webp')}
                alt={rec.cardName}
                className="w-full h-auto object-contain rounded shadow-sm"
                onError={(e) => {
                  console.log('Image failed to load:', rec.image);
                  e.currentTarget.src = `https://via.placeholder.com/80x112/4F46E5/FFFFFF?text=${encodeURIComponent(rec.cardName.substring(0, 8))}`;
                }}
              />
            </div>
            
            <p className="text-xs text-gray-700 mb-3 line-clamp-3 text-center">
              {rec.reason}
            </p>
            
            {onAddCard && (
              <button
                onClick={() => {
                  console.log('Add to Deck clicked for:', rec.cardName, rec.cardId, 'quantity:', rec.quantity);
                  // Add the recommended quantity of cards
                  for (let i = 0; i < rec.quantity; i++) {
                    onAddCard(rec.cardId, rec.cardName);
                  }
                  onRemoveRecommendation?.(rec.cardId);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
              >
                Add {rec.quantity} to Deck
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 