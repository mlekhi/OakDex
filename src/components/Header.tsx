import Link from "next/link";

export default function Header() {
  return (
    <nav className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold">OakDex</span>
        </Link>
        <Link 
          href="/chat"
          className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Start Building
        </Link>
      </div>
    </nav>
  );
} 