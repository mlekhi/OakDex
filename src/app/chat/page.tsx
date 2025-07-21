"use client";

import { motion } from "framer-motion";
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

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <Header />

      {/* TODO: Add loading signal here when cards are being preloaded */}
      
      <div className="flex flex-col w-full max-w-6xl py-8 mx-auto px-6">
        {/* Deck builder section */}
        <motion.div 
          className="flex-1 flex flex-col mb-8"
          variants={sectionVariants}
        >
          <motion.h2 
            className="text-2xl font-bold mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Deck Builder
          </motion.h2>
          <motion.div 
            className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={sectionVariants}
          >
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
          </motion.div>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ChatInterface 
            selectedCards={selectedCards} 
            onAddCard={handleAddRecommendedCard}
          />
        </motion.div>
      </div>

      <Footer />
    </motion.div>
  );
}
