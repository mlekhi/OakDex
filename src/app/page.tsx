"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <motion.div 
        className="flex-1 flex items-center justify-center"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div 
            className="flex items-center justify-center mb-6"
            variants={itemVariants}
          >
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Image 
                src="/oak-sprite.png" 
                alt="Professor Oak" 
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-7xl font-bold"
              variants={itemVariants}
            >
              OakDex
            </motion.h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl mb-12 text-gray-600"
            variants={itemVariants}
          >
            Your Pokémon TCG Pocket Mentor
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href="/chat"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="bg-white text-gray-800 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <span>Build Your Deck</span>
                <motion.svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
