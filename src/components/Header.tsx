"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isOnChatPage = pathname === "/chat";

  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold">OakDex</span>
        </Link>
        {isOnChatPage ? (
          <Link 
            href="https://github.com/mlekhi/oakdex"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-gray-800 p-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Github className="w-5 h-5 fill-current" />
          </Link>
        ) : (
          <Link 
            href="/chat"
            className="bg-white text-gray-800 p-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>
    </nav>
  );
} 