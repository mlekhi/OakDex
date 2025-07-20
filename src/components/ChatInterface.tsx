"use client";

import { useChat } from "@ai-sdk/react";
import { DeckCard } from "@/types/cards";
import { CardRecommendation } from "@/types/cardRecommendations";
import { Send } from "lucide-react";
import CardRecommendations from "./CardRecommendations";
import { useState } from "react";

interface ChatInterfaceProps {
  selectedCards: DeckCard[];
  onAddCard?: (cardId: string, cardName: string) => void;
}

export default function ChatInterface({ selectedCards, onAddCard }: ChatInterfaceProps) {
  const [recommendations, setRecommendations] = useState<{
    reason: string;
    recommendations: CardRecommendation[];
    strategy?: string;
  } | null>(null);

  const handleRemoveRecommendation = (cardId: string) => {
    if (recommendations) {
      const updatedRecommendations = recommendations.recommendations.filter(
        rec => rec.cardId !== cardId
      );
      
      if (updatedRecommendations.length === 0) {
        // clearing section if no recommendations left
        setRecommendations(null);
      } else {
        // update with remaining recommendations
        setRecommendations({
          ...recommendations,
          recommendations: updatedRecommendations
        });
      }
    }
  };

  // Send minimal card data for API
  const minimalCardData = selectedCards.map(card => ({
    id: card.id,
    name: card.name,
    quantity: card.quantity
  }));

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    body: {
      selectedCards: minimalCardData,
    },
    onFinish: (message) => {
      // check tool calls for card recommendations
      const toolCalls = message.toolInvocations || [];
      
      for (const toolCall of toolCalls) {
        if (toolCall.toolName === 'recommend_cards' && 'result' in toolCall && toolCall.result) {
          try {
            // see if result is already an object or needs parsing
            const result = typeof toolCall.result === 'string' 
              ? JSON.parse(toolCall.result) 
              : toolCall.result;
              
            if (result.success && result.recommendations) {
              setRecommendations({
                reason: result.reason,
                recommendations: result.recommendations,
                strategy: result.strategy
              });
              break;
            }
          } catch (error) {
            console.error('Failed to parse card recommendations:', error);
          }
        }
      }
    }
  });

  const handleAddRecommendedCard = (cardId: string, cardName: string) => {
    if (onAddCard) {
      onAddCard(cardId, cardName);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Chat with Professor Oak</h2>
      <div className="flex flex-col w-full">

        {recommendations && (
          <CardRecommendations
            recommendations={recommendations.recommendations}
            reason={recommendations.reason}
            strategy={recommendations.strategy}
            onAddCard={handleAddRecommendedCard}
            onRemoveRecommendation={handleRemoveRecommendation}
          />
        )}

        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap mb-4 p-3 rounded-lg shadow-lg bg-white">
            <div className="font-semibold mb-1">
              {message.role === "user" ? "You" : "Professor Oak"}
            </div>
            {message.parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return <div key={`${message.id}-${i}`}>{part.text}</div>;
              }
            })}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              className="flex-1 p-3 rounded-lg shadow-md bg-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-shadow"
              value={input}
              placeholder="Ask Professor Oak about your deck..."
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 