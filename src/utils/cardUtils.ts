// Helper function to construct proper TCGdex image URLs
export const getCardImageUrl = (baseUrl: string, quality: 'high' | 'low' = 'low', extension: 'webp' | 'png' | 'jpg' = 'webp') => {
  return `${baseUrl}/${quality}.${extension}`;
}; 