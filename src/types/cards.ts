export interface Card {
  id: string;
  name: string;
  image: string;
  type?: string;
  hp?: number;
}

export interface DeckCard extends Card {
  quantity: number;
} 