import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 mt-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-xl font-bold">OakDex</span>
        </div>
        <div className="flex justify-center space-x-6 text-sm">
          <span>© 2025 OakDex</span>
          <span>•</span>
          <a 
            href="https://github.com/mlekhi/OakDex" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
} 