"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function LandingPage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Image 
              src="/oak-sprite.png" 
              alt="Professor Oak" 
              width={64}
              height={64}
              className="w-16 h-16 rounded-full mr-4"
            />
            <h1 className="text-5xl md:text-7xl font-bold">
              OakDex
            </h1>
          </div>
          <p className="text-xl md:text-2xl mb-12 text-gray-600">
            Your Pokémon TCG Pocket Mentor
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/chat"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="bg-white text-gray-800 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102 flex items-center space-x-2"
            >
              <span>Build Your Deck</span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
