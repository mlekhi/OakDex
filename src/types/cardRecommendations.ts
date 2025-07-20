export interface CardRecommendation {
  cardId: string;
  cardName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
} 