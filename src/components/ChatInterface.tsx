"use client";

import { useChat } from "@ai-sdk/react";
import Image from "next/image";
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
      
      {recommendations && (
        <div className="mb-4">
          <CardRecommendations
            recommendations={recommendations.recommendations}
            reason={recommendations.reason}
            strategy={recommendations.strategy}
            onAddCard={handleAddRecommendedCard}
            onRemoveRecommendation={handleRemoveRecommendation}
            onClose={() => setRecommendations(null)}
          />
        </div>
      )}

      <div className="flex flex-col w-full h-96">
        
        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <div className="mb-4">
                <Image 
                  src="/oak-sprite.png" 
                  alt="Professor Oak" 
                  width={64}
                  height={64}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Welcome to OakDex!</h3>
              <p className="text-sm mb-4 max-w-md">
                I'm Professor Oak, your Pokémon TCG Pocket deck strategist. 
                Build your deck above, then ask me anything!
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>💡 Try asking: "How can I improve this deck?"</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="whitespace-pre-wrap mb-4 p-3 rounded-lg shadow-lg bg-white">
                <div className="flex items-center gap-3 mb-1">
                  {message.role === "user" ? (
                    <>
                      <Image 
                        src="/pokeball-sprite.png" 
                        alt="You" 
                        width={32}
                        height={32}
                      />
                      <div className="font-semibold">You</div>
                    </>
                  ) : (
                    <>
                      <Image 
                        src="/oak-sprite.png" 
                        alt="Professor Oak" 
                        width={32}
                        height={32}
                      />
                      <div className="font-semibold">Professor Oak</div>
                    </>
                  )}
                </div>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return <div key={`${message.id}-${i}`}>{part.text}</div>;
                  }
                })}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              className="flex-1 p-3 rounded-lg shadow-md bg-white focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-shadow"
              value={input}
              placeholder="Ask Professor Oak about your deck..."
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-gray-700 rounded-full hover:bg-blue-400 hover:text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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