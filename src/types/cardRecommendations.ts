export interface CardRecommendation {
  cardId: string;
  cardName: string;
  image: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  quantity: number;
} 