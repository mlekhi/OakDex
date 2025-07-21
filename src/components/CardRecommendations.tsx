"use client";

import React from "react";
import Image from "next/image";
import { CardRecommendation } from "@/types/cardRecommendations";
import { getCardImageUrl } from "@/utils/cardUtils";
import { X } from "lucide-react";

interface CardRecommendationsProps {
  recommendations: CardRecommendation[];
  reason: string;
  strategy?: string;
  onAddCard?: (cardId: string, cardName: string) => void;
  onRemoveRecommendation?: (cardId: string) => void;
  onClose?: () => void;
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
  onRemoveRecommendation,
  onClose
}: CardRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close recommendations"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="mb-2">
        <h3 className="text-base font-semibold text-blue-800 mb-1">
          Oak&apos;s Recommendations
        </h3>
        {strategy && (
          <p className="text-blue-600 text-xs italic">💡 {strategy}</p>
        )}
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {recommendations.map((rec, index) => (
          <div 
            key={`${rec.cardId}-${index}`} 
            className="bg-white border border-blue-200 rounded-lg p-2 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-1">
              <PriorityBadge priority={rec.priority} />
              <span className="text-xs text-gray-600 font-medium">
                {rec.quantity}x
              </span>
            </div>
            
            <div className="flex justify-center mb-2">
              <Image
                src={getCardImageUrl(rec.image, 'high', 'webp')}
                alt={rec.cardName}
                width={60}
                height={84}
                className="w-full h-auto object-contain rounded shadow-sm"
              />
            </div>
            
            <p className="text-xs text-gray-700 mb-2 line-clamp-2 text-center leading-tight">
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1 px-2 rounded transition-colors"
              >
                Add {rec.quantity}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 