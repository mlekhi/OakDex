# OakDex

A Pokémon TCG deck strategist specific to the mobile game.

## Tech Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Next.js API routes
- **AI**: OpenAI GPT-4o via AI SDK
- **Data**: TCGdex API for Pokémon card data
- **Deployment**: Vercel

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features

- **Chat Interface**: AI deck strategy advice
- **Card Data**: Updated Pokémon TCG card information via TCGdex API
- **Mobile Optimized**: Responsive design for mobile devices
- **Deck Strategy**: Focus on balance and competitive strategies for TCG Mobile

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
```
