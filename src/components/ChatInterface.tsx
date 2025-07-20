"use client";

import { useChat } from "@ai-sdk/react";
import { DeckCard } from "@/types/cards";
import { getCardImageUrl } from "@/utils/cardUtils";

interface ChatInterfaceProps {
  selectedCards: DeckCard[];
}

export default function ChatInterface({ selectedCards }: ChatInterfaceProps) {
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
  });

  const getDeckRecommendations = () => {
    const cardNames = selectedCards.map(c => `${c.name} (${c.quantity})`).join(', ');
    const recommendationPrompt = `I have these cards in my deck: ${cardNames}. What other cards would you recommend to complete this deck for Pokémon TCG Mobile?`;
    
    handleInputChange({ target: { value: recommendationPrompt } } as React.ChangeEvent<HTMLInputElement>);
    
    const formEvent = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(formEvent);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Chat with Professor Oak</h2>
      <div className="flex flex-col w-full">
        <div className="mb-4 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Current Deck:</h3>
          {selectedCards.length === 0 ? (
            <p className="text-muted-foreground">No cards selected in Deck Builder</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCards.map(card => (
                <div key={card.id} className="relative">
                  <img 
                    src={getCardImageUrl(card.image, 'low', 'webp')} 
                    alt={card.name}
                    className="w-12 h-16 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/48x64/4F46E5/FFFFFF?text=${encodeURIComponent(card.name.substring(0, 8))}`;
                    }}
                  />
                  {card.quantity > 1 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {card.quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap mb-4 p-3 border rounded-lg">
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
          <input
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={input}
            placeholder="Ask Professor Oak about your deck..."
            onChange={handleInputChange}
          />
        </form>

        {selectedCards.length > 0 && (
          <button
            onClick={getDeckRecommendations}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Get AI Recommendations
          </button>
        )}
      </div>
    </div>
  );
} 